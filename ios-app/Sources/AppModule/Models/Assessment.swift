import Foundation

struct Assessment: Codable, Identifiable, Hashable {
    let id: UUID
    let agentID: UUID
    let agent: Agent?
    let timestamp: Date
    let llmResponseText: String
    let tradeActionTaken: String?
    let parsedLLMResponse: ParsedLLMResponse?

    enum CodingKeys: String, CodingKey {
        case id
        case agentID = "agent_id"
        case agent
        case timestamp
        case llmResponseText = "llm_response_text"
        case tradeActionTaken = "trade_action_taken"
        case parsedLLMResponse = "parsed_llm_response"
    }
}

struct ParsedLLMResponse: Codable, Hashable {
    struct Headline: Codable, Hashable {
        let shortSummary: String?
        let extendedSummary: String?
        let thesis: String?
        let sentimentWord: String?
        let sentimentScore: Double?
    }

    struct Overview: Codable, Hashable {
        let macro: String?
        let marketStructure: String?
        let technicalAnalysis: String?

        enum CodingKeys: String, CodingKey {
            case macro
            case marketStructure = "market_structure"
            case technicalAnalysis = "technical_analysis"
        }
    }

    struct TradeAction: Codable, Hashable, Identifiable {
        var id: UUID { UUID() }
        let symbol: String
        let side: String
        let conviction: String?
        let rationale: String?
        let sizing: String?
    }

    let headline: Headline?
    let overview: Overview?
    let tradeActions: [TradeAction]?
}
