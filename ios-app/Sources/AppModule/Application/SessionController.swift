import Foundation

@MainActor
final class SessionController: ObservableObject {
    enum State: Equatable {
        case loading
        case signedOut
        case needsOnboarding(SupabaseUser)
        case ready(SupabaseUser)
    }

    @Published private(set) var state: State = .loading
    @Published private(set) var session: SupabaseSession?
    @Published private(set) var profile: UserProfile?
    @Published private(set) var currentUser: SupabaseUser?

    private let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment
        Task { await bootstrap() }
    }

    func bootstrap() async {
        state = .loading
        if let storedSession = environment.supabaseClient.currentSession {
            session = storedSession
            await refreshUserState()
        } else {
            state = .signedOut
        }
    }

    func refreshUserState() async {
        do {
            let user = try await environment.authService.fetchUser()
            session = environment.supabaseClient.currentSession
            currentUser = user
            if let profile = try await environment.profileService.fetchProfile(userID: user.id), profile.onboardingCompleted {
                self.profile = profile
                state = .ready(user)
            } else {
                state = .needsOnboarding(user)
            }
        } catch {
            Logger.error(error, category: "Session", context: "refreshUserState")
            state = .signedOut
        }
    }

    func signOut() async {
        environment.authService.signOut()
        session = nil
        profile = nil
        currentUser = nil
        state = .signedOut
    }

    func completeOnboarding(displayName: String, bio: String?, notificationsEnabled: Bool, theme: String) async throws {
        guard case .needsOnboarding(let user) = state else { return }
        try await persistProfile(for: user.id, displayName: displayName, bio: bio, notificationsEnabled: notificationsEnabled, theme: theme)
        await refreshUserState()
    }

    func updateProfile(displayName: String, bio: String?, notificationsEnabled: Bool, theme: String) async {
        guard let user = currentUser else { return }
        do {
            try await persistProfile(for: user.id, displayName: displayName, bio: bio, notificationsEnabled: notificationsEnabled, theme: theme)
            self.profile = try await environment.profileService.fetchProfile(userID: user.id)
        } catch {
            Logger.error(error, category: "Session", context: "updateProfile")
        }
    }

    private func persistProfile(for userID: UUID, displayName: String, bio: String?, notificationsEnabled: Bool, theme: String) async throws {
        let request = ProfileUpdateRequest(displayName: displayName, bio: bio, notificationsEnabled: notificationsEnabled, theme: theme)
        try await environment.profileService.upsertProfile(userID: userID, update: request)
    }

    func sendPhoneOTP(phone: String) async throws {
        try await environment.authService.sendPhoneOTP(phone: phone)
    }

    func verifyPhoneOTP(phone: String, token: String) async throws {
        let session = try await environment.authService.verifyPhoneOTP(phone: phone, token: token)
        self.session = session
        await refreshUserState()
    }

    func sendEmailOTP(email: String) async throws {
        try await environment.authService.sendEmailOTP(email: email)
    }

    func verifyEmailOTP(email: String, token: String) async throws {
        let session = try await environment.authService.verifyEmailOTP(email: email, token: token)
        self.session = session
        await refreshUserState()
    }

    func signIn(email: String, password: String) async throws {
        let session = try await environment.authService.signIn(email: email, password: password)
        self.session = session
        await refreshUserState()
    }

    func signUp(email: String, password: String, metadata: [String: String]) async throws {
        _ = try await environment.authService.signUp(email: email, password: password, metadata: metadata)
    }

    func signInWithGoogle() async throws {
        let session = try await environment.authService.startOAuthFlow(provider: "google", callbackScheme: environment.configuration.deepLinkScheme)
        self.session = session
        await refreshUserState()
    }

    func signInWithApple() async throws {
        let session = try await environment.authService.startOAuthFlow(provider: "apple", callbackScheme: environment.configuration.deepLinkScheme)
        self.session = session
        await refreshUserState()
    }
}
