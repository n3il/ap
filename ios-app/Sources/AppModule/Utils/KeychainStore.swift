import Foundation
import Security

struct KeychainStore {
    enum KeychainError: Error {
        case unexpectedStatus(OSStatus)
    }

    private let service: String

    init(service: String) {
        self.service = service
    }

    func readValue(for key: String) throws -> Data? {
        var query: [String: Any] = baseQuery(for: key)
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        query[kSecReturnData as String] = kCFBooleanTrue

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        if status == errSecItemNotFound {
            return nil
        }

        guard status == errSecSuccess else {
            throw KeychainError.unexpectedStatus(status)
        }

        return item as? Data
    }

    func save(_ data: Data, for key: String) throws {
        var query: [String: Any] = baseQuery(for: key)

        let attributes: [String: Any] = [kSecValueData as String: data]
        let status: OSStatus

        if try readValue(for: key) != nil {
            status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        } else {
            query.merge(attributes) { $1 }
            status = SecItemAdd(query as CFDictionary, nil)
        }

        guard status == errSecSuccess else {
            throw KeychainError.unexpectedStatus(status)
        }
    }

    func deleteValue(for key: String) throws {
        let query = baseQuery(for: key)
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unexpectedStatus(status)
        }
    }

    private func baseQuery(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }
}
