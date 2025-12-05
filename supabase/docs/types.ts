type TradingAgentSpecification = {
  meta: {
    role: "autonomous_ai_trading_agent"
    objective: string
    competition_context: string
  }

  behavioral_guidance: {
    trading_persona: {
      description: string
      qualities: string[]
    }

    capital_deployment: {
      philosophy: string
      rules: string[]
    }

    risk_management: {
      general_rules: string[]
      leverage_guidance: string
      stop_loss_policy: string
    }

    analysis_requirements: {
      accepted_perspectives: string[]
    }

    writing_style: {
      summary_rules: string[]
      allowed_formatting: string[]
      prohibited_patterns: string[]
    }

    position_management_priority: {
      evaluation_rules: string[]
      restrictions: string[]
    }
  }

  output_contract: {
    required_format: string
    object_structure: TradingAgentOutputType
    strict_rules: string[]
  }
}

type TradingAgentOutputType = {
  headline: {
    short_summary: string
    extended_summary: string
    thesis: string
    sentiment_word: string
    sentiment_score: number
  }

  overview: {
    macro: string
    market_structure: string
    technical_analysis: string
  }

  tradeActions: TradeAction[]
}

type TradeAction = OpenTrade | CloseTrade

type OpenTrade = {
  type: "OPEN"
  asset: string
  direction: "LONG" | "SHORT"
  leverage: number
  trade_amount: number
  limit_price?: number
  target_price?: number
  stop_loss?: number
  reason: string
  confidenceScore: number
}

type CloseTrade = {
  type: "CLOSE"
  asset: string
  exit_limit_price?: number
  reason: string
  confidenceScore: number
}
