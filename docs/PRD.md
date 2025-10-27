# Trading Ledger PRD (Current Implementation)

## 1. Objective

Deliver a single-owner trading ledger for each user, optionally scoped to an Agent, that records orders, trades, transactions, and position aggregates. The ledger supports both paper and real modes and integrates with Hyperliquid execution for “real” mode.

Out of scope for the current codebase: pooled user investments into agents, cross-user fund accounting, ownership ratios, and scheduled PnL/user snapshots.

## 2. Core Entities and Relationships

- Agent
  - LLM trading agent owned by a user (`agents`).
  - May be “published” for read-only community visibility; ownership remains singular.
- Trading Account
  - A per-user ledger account (`trading_accounts`) optionally tied to an `agent_id`.
  - Scoped by `type`: `paper` or `real`.
- Trading Order
  - Order intent and fills metadata (`trading_orders`).
- Trading Trade
  - Executions with price/size/fee and realized PnL (`trading_trades`).
- Trading Transaction
  - Cash ledger movements (category: `TRADE`, `DEPOSIT`, `WITHDRAWAL`, etc.) (`trading_transactions`).
- Legacy Trade History
  - Original agent-level trade rows (`trades`) used for agent timelines and basic stats.
- Assessment
  - LLM assessment records for agent decision context (`assessments`).

Relationships:
- A user owns agents and trading accounts; there is no multi-investor pooling.
- Orders, trades, and transactions reference both `account_id` and `agent_id` for filtering.

## 3. High‑Level Architecture

- Market Data
  - Frontend subscribes directly to Hyperliquid WebSocket (`src/services/priceService.js`).
- Supabase Database (Postgres)
  - Tables
    - `agents`, `trades` (legacy), `assessments`
    - `trading_accounts`, `trading_orders`, `trading_trades`, `trading_transactions`
  - Views
    - `trading_position_aggregates`
    - `trading_account_position_totals`
- Edge Functions (Supabase)
  - `execute_hyperliquid_trade`: Executes and records orders/trades/transactions in the ledger and updates legacy `trades` rows for agent timelines.
  - `run_agent_assessment`: Produces LLM assessments and market data snapshot payloads.
  - `create_agent`, `agent_scheduler`: Agent lifecycle/scheduling helpers; a cron trigger stub exists but may require enabling in project settings.
- Frontend UI (Expo/React Native)
  - Markets/Terminal screen reads the ledger and shows positions, orders, trades, and transactions.
  - Agent cards and history display legacy `trades` and assessments.

## 4. Schema (Implemented)

Notes:
- All “trading_*” tables are RLS‑protected so users can only access their own rows.
- Accounts store equity/buying_power fields, but automated revaluation is not implemented in the backend at this time.

Key tables and enums (see migrations and `supabase/schema.sql` for full DDL):

- Enum: `trading_record_type` = `('paper','real')`
- `trading_accounts`
  - Columns include: `id`, `user_id`, `agent_id`, `type`, `starting_balance`, `buying_power`, `equity`, `margin_used`, `settings`, timestamps
  - Unique: `(user_id, label, type)`
- `trading_orders`
  - Order intent, fill info, `status`, quantities, optional `client_order_id`
- `trading_trades`
  - Executions with `symbol`, `side`, `quantity`, `price`, `fee`, `realized_pnl`, `executed_at`
- `trading_transactions`
  - Cash movements with `category` in `('DEPOSIT','WITHDRAWAL','ADJUSTMENT','TRADE','FEE','TRANSFER')`
- Views
  - `trading_position_aggregates`: sums long/short and net notional per `account_id`/`symbol` based on executions
  - `trading_account_position_totals`: account‑level totals aggregated from the above
- Legacy
  - `trades`: agent‑level position rows with realized PnL when closed
  - `assessments`: LLM decision audit trail and market snapshot payloads

Not implemented in this codebase:
- `user_agent_investments`, `user_agent_transactions`, `agent_pnl_snapshots`, `user_agent_snapshots`
- `agent_portfolio_summary`, `user_portfolio_summary` views

## 5. Views and Logic (Implemented)

- Position Aggregation
  - `trading_position_aggregates` provides per‑symbol position math based on signed executed quantity and notional.
  - `trading_account_position_totals` rolls up to account totals.
- No DB‑level unrealized PnL calculation or price joins are present; the app computes price‑based UI metrics client‑side using WebSocket snapshots.

## 6. Data Flow

- Open/Close Trade
  - Frontend calls `execute_hyperliquid_trade` with agent + action.
  - Function:
    - Ensures a `trading_accounts` row exists for the agent/user (`type='real'`).
    - Sends order to Hyperliquid.
    - Writes to legacy `trades` for agent timeline.
    - Inserts corresponding `trading_orders`, `trading_trades`, and `trading_transactions` rows.
- Ledger Read Model
  - Frontend `tradeService.getTradingLedger` fetches:
    - Accounts: `trading_accounts`
    - Positions: `trading_position_aggregates`
    - Orders: `trading_orders`
    - Trades: `trading_trades`
    - Transactions: `trading_transactions`
  - Optional filters: `type` (`paper`|`real`), `agent_id`, `account_id`.
- Market Prices
  - Frontend subscribes to Hyperliquid `allMids` and derives asset price maps; no server‑side price storage.
- Snapshots/Cron
  - A PL/pgSQL stub exists to trigger an agent scheduler via HTTP; periodic snapshots are not persisted in DB.

## 7. Frontend Behavior

- Markets/Terminal (`app/(tabs)/(explore)/Markets.js`)
  - Tabs: Trade, Positions, Orders, Trades, Transactions
  - Shows current price, chart, order entry, order book, and ledger tables
  - Ledger scope toggles: `paper` or `real`; can filter by account
- Agent Views
  - Show legacy `trades` for timelines and basic stats
  - Show assessments and market snapshot JSON
- Balances
  - A demo `useAccountBalance` hook simulates deposit/withdraw UI state; it does not write to `trading_transactions`.

## 8. Edge Functions and Jobs

- `execute_hyperliquid_trade` (implemented)
  - Executes orders, records ledger entries, updates legacy `trades`
- `run_agent_assessment` (implemented)
  - Runs LLM assessments and logs market snapshot payloads
- `create_agent`, `agent_scheduler` (implemented)
  - Utility functions; scheduler is callable, cron commented for enablement via project settings
- Not implemented
  - `price_updater`, `agent_snapshot_aggregator`, `user_snapshot_aggregator`, `agent_investment_updater`

## 9. Performance and Cost

- Market data via client WebSocket avoids server cost and DB writes.
- Ledger reads are simple filtered selects plus two lightweight aggregate views.
- No periodic snapshot jobs or heavy server‑side PnL calculations.

## 10. Future Enhancements

- Add pooled investment layer:
  - `user_agent_investments`, `user_agent_transactions`
  - Ownership ratios and proportional PnL
- Snapshotting/analytics:
  - `agent_pnl_snapshots`, `user_agent_snapshots`, leaderboard metrics (Sharpe, drawdown)
  - Views: `agent_portfolio_summary`, `user_portfolio_summary`
- Real funds flow:
  - Map deposits/withdrawals UI to `trading_transactions` and update account equity/buying_power
- Server‑side unrealized PnL:
  - Join price feeds or cache mids and compute unrealized PnL in SQL or a job

## 11. Deliverables (Reflected in Codebase)

- M1: Trading ledger tables and views
  - `trading_accounts`, `trading_orders`, `trading_trades`, `trading_transactions`
  - `trading_position_aggregates`, `trading_account_position_totals`
- M2: Edge functions for execution and assessments
  - `execute_hyperliquid_trade`, `run_agent_assessment`
- M3: Frontend terminal and agent dashboards wired to the ledger and assessments

Deferred (not implemented yet): pooled investments tables, portfolio snapshots and views, price updater, investment updater, and automated equity adjustments.

---

References
- Schema and migrations: `supabase/schema.sql`, `supabase/migrations/20251105000010_add_trading_ledger.sql`
- Execution function: `supabase/functions/execute_hyperliquid_trade/index.ts`
- Ledger read model: `src/services/tradeService.js`
- Market data: `src/services/priceService.js`, `src/hooks/useMarketSnapshot.js`
- Terminal UI: `app/(tabs)/(explore)/Markets.js`
