import Foundation

struct UserProfile: Codable, Identifiable, Hashable {
    let id: UUID
    let displayName: String?
    let bio: String?
    let onboardingCompleted: Bool
    let notificationsEnabled: Bool?
    let preferredTheme: String?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case bio
        case onboardingCompleted = "onboarding_completed"
        case notificationsEnabled = "notifications_enabled"
        case preferredTheme = "theme"
        case updatedAt = "updated_at"
    }
}
