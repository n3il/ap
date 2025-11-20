import Foundation

struct PromptTemplate: Codable, Identifiable, Hashable {
    let id: UUID
    let userID: UUID?
    let name: String
    let description: String?
    let systemInstruction: String
    let userTemplate: String
    let isDefault: Bool
    let isActive: Bool
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case name
        case description
        case systemInstruction = "system_instruction"
        case userTemplate = "user_template"
        case isDefault = "is_default"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
