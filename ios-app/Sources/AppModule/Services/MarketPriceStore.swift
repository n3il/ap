import Foundation
import SwiftUI

@MainActor
final class MarketPriceStore: ObservableObject {
    @Published private(set) var assets: [String: MarketAsset] = [:]
    @Published private(set) var lastUpdated: Date?

    private let service: HyperliquidPriceService
    private var subscriptionID: UUID?

    init(service: HyperliquidPriceService = HyperliquidPriceService()) {
        self.service = service
    }

    func start(tickers: [String]) {
        Task {
            subscriptionID = await service.subscribe(to: tickers) { [weak self] updates in
                Task { @MainActor in
                    updates.forEach { self?.assets[$0.symbol] = $0 }
                    self?.lastUpdated = Date()
                }
            }
        }
    }

    func stop() {
        guard let id = subscriptionID else { return }
        Task { await service.unsubscribe(id: id) }
        subscriptionID = nil
    }

    deinit {
        stop()
    }
}
