import Foundation

struct Agent: Codable, Identifiable, Hashable {
    let id: UUID
    let userID: UUID
    let name: String
    let llmProvider: String
    let modelName: String
    let hyperliquidAddress: String?
    let initialCapital: Double
    let isActive: Date?
    let publishedAt: Date?
    let promptID: UUID?
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case name
        case llmProvider = "llm_provider"
        case modelName = "model_name"
        case hyperliquidAddress = "hyperliquid_address"
        case initialCapital = "initial_capital"
        case isActive = "is_active"
        case publishedAt = "published_at"
        case promptID = "prompt_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
