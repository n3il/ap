import Foundation

struct PerformanceStats {
    let totalTrades: Int
    let openPositions: Int
    let winRate: Double
    let totalPnL: Double
}

@MainActor
final class PerformanceViewModel: ObservableObject {
    @Published var stats: PerformanceStats = PerformanceStats(totalTrades: 0, openPositions: 0, winRate: 0, totalPnL: 0)
    @Published var assessments: [Assessment] = []
    @Published var isLoading = false

    private let environment: AppEnvironment
    private let sessionController: SessionController

    init(environment: AppEnvironment, sessionController: SessionController) {
        self.environment = environment
        self.sessionController = sessionController
        Task { await refresh() }
    }

    func refresh() async {
        guard case .ready(let user) = sessionController.state else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let personal = try await environment.agentService.fetchAgents(for: user.id)
            let agentIDs = personal.map { $0.id }
            let trades = try await environment.tradeService.fetchTrades(agentIDs: agentIDs)
            let openPositions = trades.filter { $0.status == "OPEN" }
            let closedTrades = trades.filter { $0.status == "CLOSED" }
            let wins = closedTrades.filter { ($0.realizedPnL ?? 0) > 0 }
            let totalPnL = closedTrades.reduce(0) { $0 + ($1.realizedPnL ?? 0) }
            stats = PerformanceStats(
                totalTrades: trades.count,
                openPositions: openPositions.count,
                winRate: closedTrades.isEmpty ? 0 : (Double(wins.count) / Double(closedTrades.count)) * 100,
                totalPnL: totalPnL
            )
            assessments = try await environment.assessmentService.fetchAssessments(agentIDs: agentIDs)
        } catch {
            Logger.error(error, category: "Performance", context: "refresh")
        }
    }
}
