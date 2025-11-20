import Foundation

@MainActor
final class SearchViewModel: ObservableObject {
    @Published var query: String = ""
    @Published private(set) var agents: [Agent] = []
    @Published private(set) var isLoading = false
    @Published var alertMessage: String?

    private let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            agents = try await environment.agentService.fetchPublishedAgents()
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    var filteredAgents: [Agent] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return agents }
        return agents.filter { agent in
            let haystack = "\(agent.name) \(agent.llmProvider) \(agent.modelName) \(agent.hyperliquidAddress ?? "")".lowercased()
            return haystack.contains(trimmed.lowercased())
        }
    }
}
