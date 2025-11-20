import Foundation

struct SupabaseClient {
    let configuration: AppConfiguration
    let httpClient: HTTPClientProtocol
    let sessionStore: SupabaseSessionStoreProtocol

    var currentSession: SupabaseSession? {
        sessionStore.loadSession()
    }

    func updateSession(_ session: SupabaseSession?) {
        sessionStore.save(session: session)
    }

    func restRequest(path: String, queryItems: [URLQueryItem] = [], method: HTTPRequest.Method = .get, body: Data? = nil, requiresAuth: Bool = true) throws -> HTTPRequest {
        var components = URLComponents(url: configuration.supabaseURL.appendingPathComponent("rest/v1/" + path), resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems
        guard let url = components?.url else {
            throw ConfigurationError.invalidURL(path)
        }
        var request = HTTPRequest(method: method, url: url)
        request.body = body
        request.headers = defaultHeaders(includeAuth: requiresAuth)
        if method != .get {
            request.headers["Content-Type"] = "application/json"
        }
        return request
    }

    func authRequest(path: String, method: HTTPRequest.Method = .post, body: Data? = nil, useSession: Bool = false) throws -> HTTPRequest {
        let url = configuration.supabaseURL.appendingPathComponent("auth/v1/" + path)
        var request = HTTPRequest(method: method, url: url)
        request.body = body
        var headers = ["apikey": configuration.supabaseAnonKey, "Content-Type": "application/json"]
        if useSession, let token = currentSession?.tokens.accessToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        request.headers = headers
        return request
    }

    func functionRequest(name: String, body: Data) throws -> HTTPRequest {
        var url = configuration.supabaseURL
        url.appendPathComponent("functions/v1/" + name)
        var request = HTTPRequest(method: .post, url: url)
        request.body = body
        request.headers = defaultHeaders(includeAuth: true)
        request.headers["Content-Type"] = "application/json"
        return request
    }

    private func defaultHeaders(includeAuth: Bool) -> [String: String] {
        var headers = [
            "apikey": configuration.supabaseAnonKey,
            "Prefer": "return=representation"
        ]
        if includeAuth, let token = currentSession?.tokens.accessToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
}
