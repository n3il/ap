import { createSupabaseServiceClient } from '../_shared/supabase.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { executeHyperliquidTrade, closePosition } from '../_shared/hyperliquid.ts'

console.log('Execute Hyperliquid Trade function started')

interface TradePayload {
  agent_id: string
  action: string
  hyperliquid_address: string
}

type TradingRecordType = 'paper' | 'real'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agent_id, action, hyperliquid_address }: TradePayload = await req.json()

    if (!agent_id || !action || !hyperliquid_address) {
      throw new Error('Missing required fields: agent_id, action, hyperliquid_address')
    }

    console.log('Executing trade:', { agent_id, action })

    const supabase = createSupabaseServiceClient()

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id, name')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      throw new Error(`Unable to load agent ${agent_id}`)
    }

    // Parse the action
    const actionResult = parseTradeAction(action)

    if (!actionResult) {
      console.log('No valid trade action found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No trade action to execute',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log('Parsed action:', actionResult)

    const ledgerAccount = await ensureTradingAccount({
      supabase,
      userId: agent.user_id,
      agentId: agent.id,
      agentName: agent.name,
      type: 'real',
    })

    // Handle different action types
    if (actionResult.type === 'OPEN') {
      // Execute trade using Hyperliquid SDK
      const tradeResult = await executeHyperliquidTrade(
        {
          action: action,
          asset: actionResult.asset,
          side: actionResult.side,
          size: actionResult.size || 0.01, // Default small size
        },
        hyperliquid_address
      )

      if (!tradeResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: tradeResult.error || 'Trade execution failed',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Insert trade into database
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert([
          {
            agent_id,
            asset: actionResult.asset,
            side: actionResult.side,
            status: 'OPEN',
            size: actionResult.size || 0.01,
            entry_price: tradeResult.price,
            entry_timestamp: new Date().toISOString(),
            leverage: actionResult.leverage || 1,
          },
        ])
        .select()
        .single()

      if (tradeError) {
        console.error('Error inserting trade:', tradeError)
        throw tradeError
      }

      const ledgerRecords = await recordLedgerExecution({
        supabase,
        accountId: ledgerAccount.id,
        agentId: agent.id,
        userId: agent.user_id,
        symbol: actionResult.asset,
        executionSide: actionResult.side === 'LONG' ? 'BUY' : 'SELL',
        quantity: actionResult.size || 0.01,
        price: tradeResult.price,
        fee: tradeResult.fee ?? 0,
        clientOrderId: tradeResult.orderId,
        realizedPnL: 0,
        metadata: {
          source: 'execute_hyperliquid_trade',
          action,
          hyperliquidOrderId: tradeResult.orderId,
          message: tradeResult.message,
          mode: 'real',
        },
        description: `Opened ${actionResult.side} ${actionResult.asset}`,
      })

      console.log('Trade opened:', trade.id, 'Order ID:', tradeResult.orderId)

      return new Response(
        JSON.stringify({
          success: true,
          trade,
          execution_data: {
            orderId: tradeResult.orderId,
            price: tradeResult.price,
            message: tradeResult.message,
          },
          ledger: ledgerRecords,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (actionResult.type === 'CLOSE') {
      // Close existing position
      const { data: existingTrade, error: findError } = await supabase
        .from('trades')
        .select('*')
        .eq('agent_id', agent_id)
        .eq('asset', actionResult.asset)
        .eq('status', 'OPEN')
        .single()

      if (findError || !existingTrade) {
        console.log('No open position found for', actionResult.asset)
        return new Response(
          JSON.stringify({
            success: false,
            message: `No open position found for ${actionResult.asset}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Close position using Hyperliquid SDK
      const closeResult = await closePosition(
        actionResult.asset,
        hyperliquid_address
      )

      if (!closeResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: closeResult.error || 'Position close failed',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      // Calculate P&L with leverage
      const tradeLeverage = parseFloat(existingTrade.leverage) || 1;
      const pnl = calculatePnL(
        existingTrade.entry_price,
        closeResult.price || 0,
        existingTrade.size,
        existingTrade.side,
        tradeLeverage
      )

      // Update trade in database
      const { data: updatedTrade, error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'CLOSED',
          exit_price: closeResult.price,
          exit_timestamp: new Date().toISOString(),
          realized_pnl: pnl,
        })
        .eq('id', existingTrade.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating trade:', updateError)
        throw updateError
      }

      const closeSide = existingTrade.side === 'LONG' ? 'SELL' : 'BUY'
      const ledgerRecords = await recordLedgerExecution({
        supabase,
        accountId: ledgerAccount.id,
        agentId: agent.id,
        userId: agent.user_id,
        symbol: actionResult.asset,
        executionSide: closeSide,
        quantity: existingTrade.size,
        price: closeResult.price || 0,
        fee: closeResult.fee ?? 0,
        clientOrderId: closeResult.orderId,
        realizedPnL: pnl,
        metadata: {
          source: 'execute_hyperliquid_trade',
          action,
          hyperliquidOrderId: closeResult.orderId,
          message: closeResult.message,
          mode: 'real',
          entry_price: existingTrade.entry_price,
          exit_price: closeResult.price,
        },
        description: `Closed ${existingTrade.side} ${actionResult.asset}`,
      })

      console.log('Trade closed:', updatedTrade.id, 'P&L:', pnl, 'Order ID:', closeResult.orderId)

      return new Response(
        JSON.stringify({
          success: true,
          trade: updatedTrade,
          execution_data: {
            orderId: closeResult.orderId,
            price: closeResult.price,
            message: closeResult.message,
          },
          pnl,
          ledger: ledgerRecords,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unknown action type',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  } catch (error) {
    console.error('Error in execute_hyperliquid_trade:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function parseTradeAction(action: string): {
  type: 'OPEN' | 'CLOSE'
  asset: string
  side?: 'LONG' | 'SHORT'
  size?: number
  leverage?: number
} | null {
  // Match patterns like "OPEN_LONG_BTC", "OPEN_SHORT_ETH", "CLOSE_BTC"
  // Also support leverage notation: "OPEN_LONG_BTC_10X", "OPEN_SHORT_ETH_5X"
  const openLongMatch = action.match(/OPEN_LONG_([A-Z]+)(?:_(\d+)X)?/)
  const openShortMatch = action.match(/OPEN_SHORT_([A-Z]+)(?:_(\d+)X)?/)
  const closeMatch = action.match(/CLOSE_([A-Z]+)/)

  if (openLongMatch) {
    const leverage = openLongMatch[2] ? parseInt(openLongMatch[2]) : 1
    return {
      type: 'OPEN',
      asset: `${openLongMatch[1]}-PERP`,
      side: 'LONG',
      size: 0.01, // Default size - adjust based on capital
      leverage,
    }
  }

  if (openShortMatch) {
    const leverage = openShortMatch[2] ? parseInt(openShortMatch[2]) : 1
    return {
      type: 'OPEN',
      asset: `${openShortMatch[1]}-PERP`,
      side: 'SHORT',
      size: 0.01,
      leverage,
    }
  }

  if (closeMatch) {
    return {
      type: 'CLOSE',
      asset: `${closeMatch[1]}-PERP`,
    }
  }

  return null
}

function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  size: number,
  side: 'LONG' | 'SHORT',
  leverage: number = 1
): number {
  // Calculate price change percentage
  const priceChange = exitPrice - entryPrice
  const priceChangePercent = priceChange / entryPrice

  // Position value at entry
  const positionValue = size * entryPrice

  // PnL = position value * price change % * leverage
  // For LONG: profit when price increases
  // For SHORT: profit when price decreases
  const pnl = side === 'LONG'
    ? positionValue * priceChangePercent * leverage
    : -positionValue * priceChangePercent * leverage

  return pnl
}

type SupabaseClientType = ReturnType<typeof createSupabaseServiceClient>

async function ensureTradingAccount({
  supabase,
  userId,
  agentId,
  agentName,
  type,
}: {
  supabase: SupabaseClientType
  userId: string
  agentId: string
  agentName: string | null
  type: TradingRecordType
}) {
  const { data: existingAccount, error: fetchError } = await supabase
    .from('trading_accounts')
    .select('id, label')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching trading account:', fetchError)
    throw fetchError
  }

  if (existingAccount) {
    return existingAccount
  }

  const defaultLabel = agentName
    ? `${agentName} (${type === 'real' ? 'Real' : 'Paper'})`
    : `${type === 'real' ? 'Real' : 'Paper'} Account`

  const { data: createdAccount, error: createError } = await supabase
    .from('trading_accounts')
    .insert({
      user_id: userId,
      agent_id: agentId,
      label: defaultLabel,
      type,
    })
    .select('id, label')
    .single()

  if (createError) {
    console.error('Error creating trading account:', createError)
    throw createError
  }

  return createdAccount
}

async function recordLedgerExecution({
  supabase,
  accountId,
  agentId,
  userId,
  symbol,
  executionSide,
  quantity,
  price,
  fee = 0,
  clientOrderId = null,
  realizedPnL = 0,
  metadata,
  description,
  orderType = 'MARKET',
  status = 'FILLED',
  type = 'real',
}: {
  supabase: SupabaseClientType
  accountId: string
  agentId: string
  userId: string
  symbol: string
  executionSide: 'BUY' | 'SELL'
  quantity: number
  price: number
  fee?: number
  clientOrderId?: string | null
  realizedPnL?: number
  metadata?: Record<string, unknown>
  description?: string
  orderType?: string
  status?: string
  type?: TradingRecordType
}) {
  const sanitizedMetadata = sanitizeMetadata({
    ...(metadata || {}),
    executionSide,
  })
  const safeQuantity = Number(quantity) || 0
  const safePrice = Number(price) || 0
  const safeFee = Number(fee) || 0
  const rawNotional = safePrice * safeQuantity
  const safeNotional = Number.isFinite(rawNotional) ? rawNotional : 0
  const signedAmount =
    safeNotional * (executionSide === 'BUY' ? -1 : 1)
  const netAmount = signedAmount - safeFee

  const { data: order, error: orderError } = await supabase
    .from('trading_orders')
    .insert({
      account_id: accountId,
      user_id: userId,
      agent_id: agentId,
      type,
      client_order_id: clientOrderId,
      symbol,
      side: executionSide,
      order_type: orderType,
      status,
      quantity: safeQuantity,
      filled_quantity: safeQuantity,
      average_fill_price: safePrice || null,
      meta: sanitizedMetadata,
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error recording trading order:', orderError)
    throw orderError
  }

  const { data: trade, error: tradeError } = await supabase
    .from('trading_trades')
    .insert({
      order_id: order?.id ?? null,
      account_id: accountId,
      user_id: userId,
      agent_id: agentId,
      type,
      symbol,
      side: executionSide,
      quantity: safeQuantity,
      price: safePrice || 0,
      fee: safeFee,
      realized_pnl: realizedPnL ?? 0,
      meta: sanitizedMetadata,
    })
    .select()
    .single()

  if (tradeError) {
    console.error('Error recording trading trade:', tradeError)
    throw tradeError
  }

  const { data: transaction, error: transactionError } = await supabase
    .from('trading_transactions')
    .insert({
      account_id: accountId,
      user_id: userId,
      agent_id: agentId,
      type,
      category: 'TRADE',
      amount: Number(netAmount.toFixed(8)),
      reference_order_id: order?.id ?? null,
      reference_trade_id: trade?.id ?? null,
      description:
        description ||
        `Executed ${executionSide} ${safeQuantity} ${symbol} @ ${safePrice}`,
      metadata: {
        ...sanitizedMetadata,
        fee: safeFee,
        notional: Number(safeNotional.toFixed(8)),
      },
    })
    .select()
    .single()

  if (transactionError) {
    console.error('Error recording trading transaction:', transactionError)
    throw transactionError
  }

  return {
    order,
    trade,
    transaction,
  }
}

function sanitizeMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  if (!metadata) return {}
  try {
    return JSON.parse(JSON.stringify(metadata))
  } catch (error) {
    console.warn('Failed to sanitize metadata, falling back to empty object', error)
    return {}
  }
}
