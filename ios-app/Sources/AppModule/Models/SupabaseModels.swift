import Foundation

struct SupabaseUser: Codable, Identifiable, Hashable {
    let id: UUID
    let email: String?
    let phone: String?
    let userMetadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case phone
        case userMetadata = "user_metadata"
    }
}

struct SupabaseSession: Codable {
    struct Token: Codable {
        let accessToken: String
        let refreshToken: String
        let expiresIn: Int
        let tokenType: String

        enum CodingKeys: String, CodingKey {
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
            case expiresIn = "expires_in"
            case tokenType = "token_type"
        }
    }

    let user: SupabaseUser
    let tokens: Token
}
