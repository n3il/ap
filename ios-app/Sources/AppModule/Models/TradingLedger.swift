import Foundation

struct TradingAccount: Codable, Identifiable, Hashable {
    let id: UUID
    let userID: UUID
    let agentID: UUID?
    let label: String?
    let type: String
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case agentID = "agent_id"
        case label
        case type
        case createdAt = "created_at"
    }
}

struct TradingOrder: Codable, Identifiable, Hashable {
    let id: UUID
    let accountID: UUID
    let agentID: UUID?
    let userID: UUID
    let symbol: String
    let side: String
    let quantity: Double
    let limitPrice: Double?
    let averageFillPrice: Double?
    let status: String
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case accountID = "account_id"
        case agentID = "agent_id"
        case userID = "user_id"
        case symbol
        case side
        case quantity
        case limitPrice = "limit_price"
        case averageFillPrice = "average_fill_price"
        case status
        case createdAt = "created_at"
    }
}

struct TradingTransaction: Codable, Identifiable, Hashable {
    let id: UUID
    let accountID: UUID
    let userID: UUID
    let agentID: UUID?
    let category: String
    let amount: Double
    let balanceAfter: Double?
    let description: String?
    let occurredAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case accountID = "account_id"
        case userID = "user_id"
        case agentID = "agent_id"
        case category
        case amount
        case balanceAfter = "balance_after"
        case description
        case occurredAt = "occurred_at"
    }
}
