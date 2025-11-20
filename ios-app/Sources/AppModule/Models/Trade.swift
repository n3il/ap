import Foundation

struct Trade: Codable, Identifiable, Hashable {
    let id: UUID
    let agentID: UUID
    let accountID: UUID?
    let symbol: String
    let side: String
    let status: String
    let quantity: Double
    let entryPrice: Double?
    let exitPrice: Double?
    let leverage: Double?
    let realizedPnL: Double?
    let unrealizedPnL: Double?
    let entryTimestamp: Date?
    let exitTimestamp: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case agentID = "agent_id"
        case accountID = "account_id"
        case symbol
        case side
        case status
        case quantity = "size"
        case entryPrice = "entry_price"
        case exitPrice = "exit_price"
        case leverage
        case realizedPnL = "realized_pnl"
        case unrealizedPnL = "unrealized_pnl"
        case entryTimestamp = "entry_timestamp"
        case exitTimestamp = "exit_timestamp"
    }
}

struct PositionAggregate: Codable, Identifiable, Hashable {
    let id: UUID
    let accountID: UUID
    let symbol: String
    let longQuantity: Double?
    let shortQuantity: Double?
    let netQuantity: Double?
    let netNotional: Double?
    let leverage: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case accountID = "account_id"
        case symbol
        case longQuantity = "long_quantity"
        case shortQuantity = "short_quantity"
        case netQuantity = "net_quantity"
        case netNotional = "net_notional"
        case leverage
    }
}

struct TradingFill: Codable, Identifiable, Hashable {
    let id: UUID
    let accountID: UUID
    let agentID: UUID?
    let userID: UUID
    let symbol: String
    let side: String
    let quantity: Double
    let price: Double
    let fee: Double?
    let executedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case accountID = "account_id"
        case agentID = "agent_id"
        case userID = "user_id"
        case symbol
        case side
        case quantity
        case price
        case fee
        case executedAt = "executed_at"
    }
}

struct TradingLedgerSnapshot {
    let accounts: [TradingAccount]
    let positions: [PositionAggregate]
    let orders: [TradingOrder]
    let trades: [TradingFill]
    let transactions: [TradingTransaction]
}
