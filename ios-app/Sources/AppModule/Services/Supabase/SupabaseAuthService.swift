import Foundation
import AuthenticationServices
import UIKit

struct SupabaseAuthService {
    enum AuthError: LocalizedError {
        case sessionUnavailable
        case oauthCancelled
        case unsupportedProvider

        var errorDescription: String? {
            switch self {
            case .sessionUnavailable:
                return "Authentication session is unavailable."
            case .oauthCancelled:
                return "Authentication was cancelled."
            case .unsupportedProvider:
                return "Provider not supported on native client."
            }
        }
    }

    private let client: SupabaseClient
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(client: SupabaseClient) {
        self.client = client
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }

    func bootstrapSession() -> SupabaseSession? {
        client.currentSession
    }

    func signOut() {
        client.updateSession(nil)
    }

    func sendPhoneOTP(phone: String) async throws {
        struct Payload: Encodable { let phone: String; let channel: String = "sms" }
        let body = try encoder.encode(Payload(phone: phone))
        var request = try client.authRequest(path: "otp", body: body)
        request.headers["Prefer"] = "return=representation"
        _ = try await client.httpClient.perform(request)
    }

    func verifyPhoneOTP(phone: String, token: String) async throws -> SupabaseSession {
        struct Payload: Encodable { let type: String = "sms"; let token: String; let phone: String }
        let body = try encoder.encode(Payload(token: token, phone: phone))
        let request = try client.authRequest(path: "verify", body: body)
        let session = try await client.httpClient.perform(request, decode: SupabaseSession.self)
        client.updateSession(session)
        return session
    }

    func sendEmailOTP(email: String) async throws {
        struct Payload: Encodable { let email: String; let createUser: Bool = true; let channel: String = "email" }
        let body = try encoder.encode(Payload(email: email))
        let request = try client.authRequest(path: "otp", body: body)
        _ = try await client.httpClient.perform(request)
    }

    func verifyEmailOTP(email: String, token: String) async throws -> SupabaseSession {
        struct Payload: Encodable { let type: String = "email"; let token: String; let email: String }
        let body = try encoder.encode(Payload(token: token, email: email))
        let request = try client.authRequest(path: "verify", body: body)
        let session = try await client.httpClient.perform(request, decode: SupabaseSession.self)
        client.updateSession(session)
        return session
    }

    func signIn(email: String, password: String) async throws -> SupabaseSession {
        struct Payload: Encodable { let email: String; let password: String }
        let body = try encoder.encode(Payload(email: email, password: password))
        let request = try client.authRequest(path: "token?grant_type=password", body: body)
        let session = try await client.httpClient.perform(request, decode: SupabaseSession.self)
        client.updateSession(session)
        return session
    }

    func signUp(email: String, password: String, metadata: [String: String]) async throws -> SupabaseSession {
        struct Payload: Encodable {
            let email: String
            let password: String
            let data: [String: String]
        }
        let body = try encoder.encode(Payload(email: email, password: password, data: metadata))
        let request = try client.authRequest(path: "signup", body: body)
        let session = try await client.httpClient.perform(request, decode: SupabaseSession.self)
        client.updateSession(session)
        return session
    }

    func refreshSession() async throws -> SupabaseSession {
        guard let refreshToken = client.currentSession?.tokens.refreshToken else {
            throw AuthError.sessionUnavailable
        }
        struct Payload: Encodable { let refreshToken: String }
        let body = try encoder.encode(Payload(refreshToken: refreshToken))
        let request = try client.authRequest(path: "token?grant_type=refresh_token", body: body)
        let session = try await client.httpClient.perform(request, decode: SupabaseSession.self)
        client.updateSession(session)
        return session
    }

    func fetchUser() async throws -> SupabaseUser {
        let request = try client.authRequest(path: "user", method: .get, useSession: true)
        return try await client.httpClient.perform(request, decode: SupabaseUser.self)
    }

    func startOAuthFlow(provider: String, callbackScheme: String) async throws -> SupabaseSession {
        guard let redirectURI = URL(string: "\(callbackScheme)://auth/callback") else {
            throw ConfigurationError.invalidURL("callback scheme")
        }

        var components = URLComponents(url: client.configuration.supabaseURL.appendingPathComponent("auth/v1/authorize"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            .init(name: "provider", value: provider),
            .init(name: "redirect_to", value: redirectURI.absoluteString)
        ]
        guard let url = components?.url else {
            throw ConfigurationError.invalidURL("oauth")
        }

        let session = try await withCheckedThrowingContinuation { continuation in
            let authSession = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { callbackURL, error in
                if let error {
                    if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin {
                        return continuation.resume(throwing: AuthError.oauthCancelled)
                    }
                    return continuation.resume(throwing: error)
                }

                guard let callbackURL else {
                    return continuation.resume(throwing: AuthError.sessionUnavailable)
                }

                guard let fragment = callbackURL.fragment else {
                    return continuation.resume(throwing: AuthError.sessionUnavailable)
                }

                let params = fragment
                    .split(separator: "&")
                    .reduce(into: [String: String]()) { partial, pair in
                        let parts = pair.split(separator: "=")
                        guard parts.count == 2 else { return }
                        partial[String(parts[0])] = String(parts[1])
                    }

                guard let access = params["access_token"], let refresh = params["refresh_token"], let expires = params["expires_in"], let expiresInt = Int(expires) else {
                    return continuation.resume(throwing: AuthError.sessionUnavailable)
                }

                let token = SupabaseSession.Token(accessToken: access, refreshToken: refresh, expiresIn: expiresInt, tokenType: "bearer")
                Task {
                    do {
                        let user = try await fetchUserWith(accessToken: access)
                        let session = SupabaseSession(user: user, tokens: token)
                        client.updateSession(session)
                        continuation.resume(returning: session)
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
            authSession.presentationContextProvider = ASWebAuthenticationPresentationContextProviderBridge()
            authSession.prefersEphemeralWebBrowserSession = true
            authSession.start()
        }

        return session
    }

    private func fetchUserWith(accessToken: String) async throws -> SupabaseUser {
        var request = try client.authRequest(path: "user", method: .get)
        request.headers["Authorization"] = "Bearer \(accessToken)"
        return try await client.httpClient.perform(request, decode: SupabaseUser.self)
    }
}

private final class ASWebAuthenticationPresentationContextProviderBridge: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first(where: { $0.isKeyWindow }) {
            return window
        }
        return ASPresentationAnchor()
    }
}
