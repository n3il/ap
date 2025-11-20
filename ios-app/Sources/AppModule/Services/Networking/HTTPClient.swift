import Foundation

struct HTTPRequest {
    enum Method: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case patch = "PATCH"
        case delete = "DELETE"
    }

    var method: Method
    var url: URL
    var headers: [String: String] = [:]
    var body: Data? = nil

    init(method: Method = .get, url: URL) {
        self.method = method
        self.url = url
    }
}

enum HTTPClientError: Error {
    case invalidResponse
    case statusCode(Int, Data)
}

protocol HTTPClientProtocol {
    func perform<T: Decodable>(_ request: HTTPRequest, decode type: T.Type) async throws -> T
    func perform(_ request: HTTPRequest) async throws
}

struct HTTPClient: HTTPClientProtocol {
    private let session: URLSession

    init(configuration: URLSessionConfiguration = .default) {
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 30
        self.session = URLSession(configuration: configuration)
    }

    func perform<T: Decodable>(_ request: HTTPRequest, decode type: T.Type) async throws -> T {
        let data = try await perform(request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(T.self, from: data)
    }

    @discardableResult
    func perform(_ request: HTTPRequest) async throws -> Data {
        var urlRequest = URLRequest(url: request.url)
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.httpBody = request.body
        request.headers.forEach { key, value in
            urlRequest.addValue(value, forHTTPHeaderField: key)
        }

        let (data, response) = try await session.data(for: urlRequest)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw HTTPClientError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw HTTPClientError.statusCode(httpResponse.statusCode, data)
        }

        return data
    }
}
