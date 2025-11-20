import Foundation

protocol SupabaseSessionStoreProtocol {
    func loadSession() -> SupabaseSession?
    func save(session: SupabaseSession?)
}

final class SupabaseSessionStore: SupabaseSessionStoreProtocol {
    private let keychain: KeychainStore
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let key = "supabase.session"

    init(keychain: KeychainStore) {
        self.keychain = keychain
    }

    func loadSession() -> SupabaseSession? {
        do {
            guard let data = try keychain.readValue(for: key) else { return nil }
            return try decoder.decode(SupabaseSession.self, from: data)
        } catch {
            Logger.error(error, category: "Supabase", context: "Load session")
            return nil
        }
    }

    func save(session: SupabaseSession?) {
        do {
            if let session {
                let data = try encoder.encode(session)
                try keychain.save(data, for: key)
            } else {
                try keychain.deleteValue(for: key)
            }
        } catch {
            Logger.error(error, category: "Supabase", context: "Save session")
        }
    }
}
