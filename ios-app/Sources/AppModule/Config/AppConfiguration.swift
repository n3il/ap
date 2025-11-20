import Foundation

enum ConfigurationError: LocalizedError {
    case missingValue(String)
    case invalidURL(String)

    var errorDescription: String? {
        switch self {
        case .missingValue(let key):
            return "Missing configuration value for \(key). Provide it via Secrets.plist or environment variables."
        case .invalidURL(let key):
            return "Invalid URL provided for configuration key \(key)."
        }
    }
}

struct AppConfiguration {
    let supabaseURL: URL
    let supabaseAnonKey: String
    let deepLinkScheme: String
    let appName: String
    let requireAuthentication: Bool
    let mockDataEnabled: Bool

    static func load(bundle: Bundle = .main) throws -> AppConfiguration {
        var values = SecretsLoader.loadSecrets(bundle: bundle)
        let env = ProcessInfo.processInfo.environment

        func value(for key: String) -> String? {
            if let envValue = env[key], !envValue.isEmpty {
                return envValue
            }
            return values.removeValue(forKey: key)
        }

        guard let supabaseURLString = value(for: "SUPABASE_URL") else {
            throw ConfigurationError.missingValue("SUPABASE_URL")
        }
        guard let supabaseURL = URL(string: supabaseURLString) else {
            throw ConfigurationError.invalidURL("SUPABASE_URL")
        }

        guard let supabaseKey = value(for: "SUPABASE_ANON_KEY"), !supabaseKey.isEmpty else {
            throw ConfigurationError.missingValue("SUPABASE_ANON_KEY")
        }

        let scheme = value(for: "DEEPLINK_SCHEME") ?? "ap"
        let appName = value(for: "APP_NAME") ?? "Puppet"
        let requireAuth = Bool(value(for: "REQUIRE_AUTH") ?? "true") ?? true
        let mocksEnabled = Bool(value(for: "ENABLE_MOCK_DATA") ?? "false") ?? false

        return AppConfiguration(
            supabaseURL: supabaseURL,
            supabaseAnonKey: supabaseKey,
            deepLinkScheme: scheme,
            appName: appName,
            requireAuthentication: requireAuth,
            mockDataEnabled: mocksEnabled
        )
    }
}

private enum SecretsLoader {
    static func loadSecrets(bundle: Bundle) -> [String: String] {
        guard let url = bundle.url(forResource: "Secrets", withExtension: "plist", subdirectory: "Config") else {
            return [:]
        }

        do {
            let data = try Data(contentsOf: url)
            let object = try PropertyListSerialization.propertyList(from: data, options: [], format: nil)
            return object as? [String: String] ?? [:]
        } catch {
            return [:]
        }
    }
}
