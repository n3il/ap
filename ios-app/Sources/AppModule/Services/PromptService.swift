import Foundation

struct PromptInput: Encodable {
    let name: String
    let description: String?
    let systemInstruction: String
    let userTemplate: String

    enum CodingKeys: String, CodingKey {
        case name
        case description
        case systemInstruction = "system_instruction"
        case userTemplate = "user_template"
    }
}

struct PromptService {
    private let client: SupabaseClient
    private let encoder = JSONEncoder()

    init(client: SupabaseClient) {
        self.client = client
        encoder.dateEncodingStrategy = .iso8601
    }

    func listPrompts(userID: UUID) async throws -> [PromptTemplate] {
        var builder = SupabaseQueryBuilder(table: "prompts")
        builder.filters = [
            .equals("is_active", "true")
        ]
        builder.order = SupabaseOrder(column: "updated_at", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        let prompts = try await client.httpClient.perform(request, decode: [PromptTemplate].self)
        return prompts.filter { prompt in
            prompt.userID == nil || prompt.userID == userID
        }
    }

    func createPrompt(input: PromptInput, userID: UUID) async throws -> PromptTemplate {
        var body = try encoder.encode(input)
        var dictionary = try JSONSerialization.jsonObject(with: body, options: []) as? [String: Any] ?? [:]
        dictionary["user_id"] = userID.uuidString
        dictionary["is_active"] = true
        body = try JSONSerialization.data(withJSONObject: [dictionary], options: [])
        var request = try client.restRequest(path: "prompts", method: .post)
        request.body = body
        let response = try await client.httpClient.perform(request, decode: [PromptTemplate].self)
        guard let prompt = response.first else {
            throw ConfigurationError.missingValue("prompt")
        }
        return prompt
    }

    func assignPrompt(promptID: UUID?, to agentID: UUID) async throws {
        var payload: [String: Any] = [:]
        if let promptID {
            payload["prompt_id"] = promptID.uuidString
        } else {
            payload["prompt_id"] = NSNull()
        }
        let data = try JSONSerialization.data(withJSONObject: [payload], options: [])
        var builder = SupabaseQueryBuilder(table: "agents")
        builder.filters = [.equals("id", agentID.uuidString)]
        var request = try client.restRequest(path: builder.table, queryItems: builder.queryItems(), method: .patch)
        request.body = data
        _ = try await client.httpClient.perform(request)
    }
}
