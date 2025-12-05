type MarketReport = {
  timestamp: string
  raw_dashboard: RawDashboard
  narrative_reality: NarrativeReality[]
  fomo_map: FomoMap
  alpha_setups: Record<string, TickerHypotheses>
  edge_quality_matrix: EdgeQualityMatrix
  competition_state: CompetitionState
  portfolio_state: PortfolioState
}

type RawDashboard = {
  market_state: string
  global_tone: string
  tickers: Record<string, TickerState>
}

type TickerState = {
  global_structure: {
    intraday: string
    h4: string
  }
  local: {
    funding?: number | string
    oi?: number | string
  }
  rel_vol: string
  dog_vs_tail: string
}

type NarrativeReality = {
  ticker: string
  narrative: string
  narrative_time: string
  reality_check: string
  catalyst_risk: string[]
  state: string
}

type FomoMap = {
  scheduled_events: EventInfo[]
  thematic_risk: {
    fed_rates: RiskBlock
    geopolitics_trade: RiskBlock
    corporate_regulatory: RiskBlock
  }
  fomo_levels: Record<string, {
    upside_chase: string
    downside_flush: string
  }>
}

type EventInfo = {
  date: string
  events: string[]
}

type RiskBlock = {
  current?: string
  risk: string[]
}

type TickerHypotheses = {
  hypotheses: Hypothesis[]
}

type Hypothesis = {
  id: string
  view: string
  timeframe: string
  alpha_type: string
  edge_depth: string
  risk_regime: string
  edge_freshness: string
  execution?: string
  invalidation: string
  steelman_risk: string
}

type EdgeQualityMatrix = {
  high_conviction: string[]
  tactical_skews: string[]
  no_edge: string[]
}

type CompetitionState = {
  standings: CompetitionEntry[]
}

type CompetitionEntry = {
  model: string
  total_account_value: number
  return_pct: number
  sharpe: number
  max_drawdown: number
}

type PortfolioState = {
  available_capital: number
  nav: number
  prices: Record<string, number>
  positions: Position[]
}

type Position = {
  symbol: string
  quantity: number
  entry_price: number
  current_price: number
  liquidation_price: number
  unrealized_pnl: number
  leverage: number
  exit_plan: {
    profit_target: number
    stop_loss: number
    invalidation_condition: string
  }
  confidence: number
  risk_usd: number
  sl_oid: number
  tp_oid: number
  wait_for_fill: boolean
  entry_oid: number
  notional_usd: number
}
