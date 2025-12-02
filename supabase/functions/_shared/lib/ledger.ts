import { sanitizeMetadata } from './validation.ts';
import { sanitizeNumericValue } from './numeric.ts';
import { generatePrivateKey, privateKeyToAccount } from 'npm:viem/accounts';

const TRADING_ACCOUNT_FIELDS = [
  'id',
  'label',
  'type',
  'agent_id',
  'user_id',
  'hyperliquid_address',
  'hyperliquid_wallet_address',
  'hyperliquid_wallet_private_key',
].join(', ');

function createHyperliquidWallet() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  return {
    hyperliquid_address: account.address,
    hyperliquid_wallet_address: account.address,
    hyperliquid_wallet_private_key: privateKey,
  };
}

export type TradingRecordType = 'paper' | 'real';
export type ExecutionSide = 'BUY' | 'SELL';

/**
 * Ensures a trading account exists for an agent
 * Creates one if it doesn't exist
 */
export async function ensureTradingAccount({
  supabase,
  userId,
  agentId,
  agentName,
  type,
}: {
  supabase: any;
  userId: string;
  agentId: string;
  agentName: string | null;
  type: TradingRecordType;
}) {
  const { data: existingAccount, error: fetchError } = await supabase
    .from('trading_accounts')
    .select(TRADING_ACCOUNT_FIELDS)
    .eq('user_id', userId)
    .eq('type', type)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching trading account:', fetchError);
    throw fetchError;
  }

  if (existingAccount) {
    const needsWalletSync =
      !existingAccount.hyperliquid_address ||
      !existingAccount.hyperliquid_wallet_address ||
      !existingAccount.hyperliquid_wallet_private_key;

    if (!needsWalletSync) {
      return existingAccount;
    }

    const walletDetails = createHyperliquidWallet();
    const { data: updatedAccount, error: updateError } = await supabase
      .from('trading_accounts')
      .update(walletDetails)
      .eq('id', existingAccount.id)
      .select(TRADING_ACCOUNT_FIELDS)
      .single();

    if (updateError) {
      console.error('Error refreshing trading account wallet:', updateError);
      throw updateError;
    }

    return updatedAccount;
  }

  const defaultLabel = agentName
    ? `${agentName} (${type === 'real' ? 'Real' : 'Paper'})`
    : `${type === 'real' ? 'Real' : 'Paper'} Account`;

  const walletDetails = createHyperliquidWallet();

  const { data: createdAccount, error: createError } = await supabase
    .from('trading_accounts')
    .insert({
      user_id: userId,
      agent_id: agentId,
      label: defaultLabel,
      type,
      ...walletDetails,
    })
    .select(TRADING_ACCOUNT_FIELDS)
    .single();

  if (createError) {
    console.error('Error creating trading account:', createError);
    throw createError;
  }

  return createdAccount;
}

/**
 * Records a trade execution in all ledger tables
 * Creates records in trading_orders, trading_trades, and trading_transactions
 */
export async function recordLedgerExecution({
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
  supabase: any;
  accountId: string;
  agentId: string;
  userId: string;
  symbol: string;
  executionSide: ExecutionSide;
  quantity: number;
  price: number;
  fee?: number;
  clientOrderId?: string | null;
  realizedPnL?: number;
  metadata?: Record<string, unknown>;
  description?: string;
  orderType?: string;
  status?: string;
  type?: TradingRecordType;
}) {
  const sanitized = sanitizeMetadata({
    ...(metadata || {}),
    executionSide,
  });

  const safeQuantity = sanitizeNumericValue(quantity, {
    precision: 18,
    scale: 8,
    allowNegative: false,
    defaultValue: 0,
    label: 'ledger_quantity',
  });
  const safePrice = sanitizeNumericValue(price, {
    precision: 18,
    scale: 8,
    allowNegative: false,
    defaultValue: 0,
    label: 'ledger_price',
  });
  const safeFee = sanitizeNumericValue(fee, {
    precision: 18,
    scale: 8,
    allowNegative: false,
    defaultValue: 0,
    label: 'ledger_fee',
  });
  const rawNotional = safePrice * safeQuantity;
  const safeNotional = sanitizeNumericValue(rawNotional, {
    precision: 18,
    scale: 8,
    allowNegative: false,
    defaultValue: 0,
    label: 'ledger_notional',
  });
  const signedAmount = safeNotional * (executionSide === 'BUY' ? -1 : 1);
  const netAmount = sanitizeNumericValue(signedAmount - safeFee, {
    precision: 18,
    scale: 8,
    allowNegative: true,
    defaultValue: 0,
    label: 'ledger_net_amount',
  });
  const safeRealizedPnL = sanitizeNumericValue(realizedPnL ?? 0, {
    precision: 18,
    scale: 8,
    allowNegative: true,
    defaultValue: 0,
    label: 'ledger_realized_pnl',
  });

  // Insert order record
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
      meta: sanitized,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error recording trading order:', orderError);
    throw orderError;
  }

  // Insert trade record
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
      realized_pnl: safeRealizedPnL,
      meta: sanitized,
    })
    .select()
    .single();

  if (tradeError) {
    console.error('Error recording trading trade:', tradeError);
    throw tradeError;
  }

  // Insert transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('trading_transactions')
    .insert({
      account_id: accountId,
      user_id: userId,
      agent_id: agentId,
      type,
      category: 'TRADE',
      amount: netAmount,
      reference_order_id: order?.id ?? null,
      reference_trade_id: trade?.id ?? null,
      description:
        description ||
        `Executed ${executionSide} ${safeQuantity} ${symbol} @ ${safePrice}`,
      metadata: {
        ...sanitized,
        fee: safeFee,
        notional: safeNotional,
      },
    })
    .select()
    .single();

  if (transactionError) {
    console.error('Error recording trading transaction:', transactionError);
    throw transactionError;
  }

  return {
    order,
    trade,
    transaction,
  };
}
