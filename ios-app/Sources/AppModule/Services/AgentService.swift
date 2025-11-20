import Foundation
import Security

struct AgentCreateRequest: Encodable {
    let name: String
    let llmProvider: String
    let modelName: String
    let initialCapital: Double
    let promptID: UUID?

    enum CodingKeys: String, CodingKey {
        case name
        case llmProvider = "llm_provider"
        case modelName = "model_name"
        case initialCapital = "initial_capital"
        case promptID = "prompt_id"
    }
}

struct AgentService {
    private let client: SupabaseClient
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(client: SupabaseClient) {
        self.client = client
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }

    func fetchAgents(for userID: UUID) async throws -> [Agent] {
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.equals("user_id", userID.uuidString)]
        builder.order = SupabaseOrder(column: "created_at", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Agent].self)
    }

    func fetchPublishedAgents() async throws -> [Agent] {
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.greaterThan("published_at", "1970-01-01T00:00:00Z")]
        builder.order = SupabaseOrder(column: "published_at", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Agent].self)
    }

    func fetchAgent(id: UUID) async throws -> Agent {
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.equals("id", id.uuidString)]
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        let response = try await client.httpClient.perform(request, decode: [Agent].self)
        guard let agent = response.first else {
            throw ConfigurationError.missingValue("agent")
        }
        return agent
    }

    func createAgent(request payload: AgentCreateRequest, userID: UUID) async throws -> Agent {
        var body = try encoder.encode(payload)
        var dictionary = try JSONSerialization.jsonObject(with: body, options: []) as? [String: Any] ?? [:]
        dictionary["user_id"] = userID.uuidString
        dictionary["hyperliquid_address"] = generateHyperliquidAddress()
        dictionary["is_active"] = ISO8601DateFormatter().string(from: Date())
        body = try JSONSerialization.data(withJSONObject: [dictionary], options: [])
        var request = try client.restRequest(path: "agents", method: .post)
        request.body = body
        let response = try await client.httpClient.perform(request, decode: [Agent].self)
        guard let agent = response.first else {
            throw ConfigurationError.missingValue("agent")
        }
        return agent
    }

    func updateStatus(agentID: UUID, isActive: Bool) async throws {
        let timestamp = isActive ? ISO8601DateFormatter().string(from: Date()) : NSNull()
        let payload: [[String: Any]] = [["is_active": timestamp]]
        let data = try JSONSerialization.data(withJSONObject: payload, options: [])
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.equals("id", agentID.uuidString)]
        var request = try client.restRequest(path: builder.table, queryItems: builder.queryItems(), method: .patch)
        request.body = data
        _ = try await client.httpClient.perform(request)
    }

    func publish(agentID: UUID, publish: Bool) async throws {
        let timestamp = publish ? ISO8601DateFormatter().string(from: Date()) : NSNull()
        let payload: [[String: Any]] = [["published_at": timestamp]]
        let data = try JSONSerialization.data(withJSONObject: payload, options: [])
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.equals("id", agentID.uuidString)]
        var request = try client.restRequest(path: builder.table, queryItems: builder.queryItems(), method: .patch)
        request.body = data
        _ = try await client.httpClient.perform(request)
    }

    func delete(agentID: UUID) async throws {
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.equals("id", agentID.uuidString)]
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems(), method: .delete)
        _ = try await client.httpClient.perform(request)
    }

    private func generateHyperliquidAddress() -> String {
        var bytes = [UInt8](repeating: 0, count: 20)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return "0x" + bytes.map { String(format: "%02x", $0) }.joined()
    }
}
