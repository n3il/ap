import Foundation

struct SupabaseFunctionService {
    private let client: SupabaseClient
    private let encoder = JSONEncoder()

    init(client: SupabaseClient) {
        self.client = client
        encoder.dateEncodingStrategy = .iso8601
    }

    func invoke<T: Decodable>(_ name: String, payload: [String: Any], decode type: T.Type) async throws -> T {
        let data = try JSONSerialization.data(withJSONObject: payload, options: [])
        let request = try client.functionRequest(name: name, body: data)
        return try await client.httpClient.perform(request, decode: T.self)
    }
}
