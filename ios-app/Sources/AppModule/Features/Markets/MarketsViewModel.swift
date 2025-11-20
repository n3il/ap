import Foundation

@MainActor
final class MarketsViewModel: ObservableObject {
    @Published var selectedSymbol: String = "BTC" {
        didSet { Task { await loadHistory() } }
    }
    @Published var chartData: [CandlePoint] = []
    @Published var ledger: TradingLedgerSnapshot?
    @Published var isPlacingOrder = false
    @Published var alertMessage: String?

    private let environment: AppEnvironment
    private let sessionController: SessionController

    init(environment: AppEnvironment, sessionController: SessionController) {
        self.environment = environment
        self.sessionController = sessionController
        Task {
            await loadHistory()
            await loadLedger()
        }
    }

    func loadHistory() async {
        do {
            chartData = try await environment.marketHistoryService.fetchHistory(for: selectedSymbol, timeframe: .day)
        } catch {
            Logger.error(error, category: "Markets", context: "history")
        }
    }

    func loadLedger() async {
        guard case .ready(let user) = sessionController.state else { return }
        do {
            ledger = try await environment.tradeService.fetchLedger(type: "paper", userID: user.id)
        } catch {
            Logger.error(error, category: "Markets", context: "ledger")
        }
    }

    func placeOrder(side: String, amount: Double, leverage: Double) async {
        guard case .ready = sessionController.state else { return }
        isPlacingOrder = true
        defer { isPlacingOrder = false }
        do {
            let payload: [String: Any] = [
                "action": [
                    "action": "OPEN_\(side.uppercased())_\(selectedSymbol)",
                    "asset": "\(selectedSymbol)-PERP",
                    "side": side.uppercased(),
                    "size": amount,
                    "leverage": leverage
                ]
            ]
            struct FunctionResponse: Decodable { let status: String }
            _ = try await environment.functionService.invoke("execute_hyperliquid_trade", payload: payload, decode: FunctionResponse.self)
            await loadLedger()
        } catch {
            alertMessage = error.localizedDescription
        }
    }
}
