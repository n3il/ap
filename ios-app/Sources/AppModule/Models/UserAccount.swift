import Foundation

struct UserAccount: Codable, Identifiable, Equatable {
    let id: UUID
    let email: String?
    let phone: String?
    let metadata: [String: String]?

    init(id: UUID, email: String?, phone: String?, metadata: [String: String]?) {
        self.id = id
        self.email = email
        self.phone = phone
        self.metadata = metadata
    }
}
