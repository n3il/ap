import Foundation

struct ProfileUpdateRequest: Encodable {
    let displayName: String
    let bio: String?
    let notificationsEnabled: Bool
    let theme: String

    enum CodingKeys: String, CodingKey {
        case displayName = "display_name"
        case bio
        case notificationsEnabled = "notifications_enabled"
        case theme
    }
}

struct ProfileService {
    private let client: SupabaseClient
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(client: SupabaseClient) {
        self.client = client
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }

    func fetchProfile(userID: UUID) async throws -> UserProfile? {
        var builder = SupabaseQueryBuilder(table: "profiles")
        builder.filters = [.equals("id", userID.uuidString)]
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        let profiles = try await client.httpClient.perform(request, decode: [UserProfile].self)
        return profiles.first
    }

    func upsertProfile(userID: UUID, update: ProfileUpdateRequest) async throws {
        var body = try encoder.encode(update)
        var dictionary = try JSONSerialization.jsonObject(with: body, options: []) as? [String: Any] ?? [:]
        dictionary["id"] = userID.uuidString
        dictionary["onboarding_completed"] = true
        dictionary["updated_at"] = ISO8601DateFormatter().string(from: Date())
        body = try JSONSerialization.data(withJSONObject: [dictionary], options: [])
        var request = try client.restRequest(path: "profiles", method: .post)
        request.body = body
        request.headers["Prefer"] = "resolution=merge-duplicates"
        _ = try await client.httpClient.perform(request)
    }
}
