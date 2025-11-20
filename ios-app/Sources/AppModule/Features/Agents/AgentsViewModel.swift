import Foundation

@MainActor
final class AgentsViewModel: ObservableObject {
    @Published var personalAgents: [Agent] = []
    @Published var sharedAgents: [Agent] = []
    @Published var alertMessage: String?
    @Published var isLoading = false

    private let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment
    }

    func load(userID: UUID?) async {
        isLoading = true
        defer { isLoading = false }
        do {
            sharedAgents = try await environment.agentService.fetchPublishedAgents()
            if let userID {
                personalAgents = try await environment.agentService.fetchAgents(for: userID)
            } else {
                personalAgents = []
            }
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    func createAgent(userID: UUID, request: AgentCreateRequest) async throws {
        _ = try await environment.agentService.createAgent(request: request, userID: userID)
        await load(userID: userID)
    }
}
