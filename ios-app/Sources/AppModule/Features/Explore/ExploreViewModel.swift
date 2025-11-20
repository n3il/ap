import Foundation

@MainActor
final class ExploreViewModel: ObservableObject {
    @Published var timeframe: MarketTimeframe = .day {
        didSet { Task { await loadHistory() } }
    }
    @Published var agents: [Agent] = []
    @Published var chartData: [CandlePoint] = []
    @Published var isLoadingAgents = false
    @Published var isLoadingHistory = false

    private let environment: AppEnvironment
    private let priceStore = MarketPriceStore()

    init(environment: AppEnvironment) {
        self.environment = environment
        Task {
            await loadAgents()
            await loadHistory()
            priceStore.start(tickers: ["BTC", "ETH", "SOL"])
        }
    }

    deinit {
        priceStore.stop()
    }

    var marketPrices: [MarketAsset] {
        priceStore.assets.values.sorted(by: { $0.symbol < $1.symbol })
    }

    func loadAgents() async {
        isLoadingAgents = true
        do {
            agents = try await environment.agentService.fetchPublishedAgents().sorted(by: { ($0.publishedAt ?? Date.distantPast) > ($1.publishedAt ?? Date.distantPast) })
        } catch {
            Logger.error(error, category: "Explore", context: "loadAgents")
        }
        isLoadingAgents = false
    }

    func loadHistory() async {
        isLoadingHistory = true
        do {
            chartData = try await environment.marketHistoryService.fetchHistory(for: "BTC", timeframe: timeframe)
        } catch {
            Logger.error(error, category: "Explore", context: "history")
        }
        isLoadingHistory = false
    }

    func agents(for category: ExploreCategory) -> [Agent] {
        switch category {
        case .top:
            return agents.sorted { ($0.isActive != nil ? 1 : 0) > ($1.isActive != nil ? 1 : 0) }
        case .popular:
            return agents.sorted { ($0.publishedAt ?? .distantPast) > ($1.publishedAt ?? .distantPast) }
        case .new:
            return agents.sorted { ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast) }
        }
    }
}

enum ExploreCategory: String, CaseIterable, CustomStringConvertible {
    case top = "Top"
    case popular = "Popular"
    case new = "New"

    var description: String { rawValue }
}
