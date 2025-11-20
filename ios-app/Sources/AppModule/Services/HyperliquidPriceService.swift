import Foundation

actor HyperliquidPriceService {
    struct PricePayload: Decodable {
        struct DataPayload: Decodable {
            let mids: [String: String]
        }
        let channel: String?
        let data: DataPayload?
    }

    private struct Subscription {
        let id: UUID
        let symbols: [String]
        let handler: @Sendable ([MarketAsset]) -> Void
    }

    private var subscriptions: [UUID: Subscription] = [:]
    private var socket: URLSessionWebSocketTask?
    private let session: URLSession
    private var latestRaw: [String: String] = [:]
    private var reconnectWorkItem: DispatchWorkItem?

    init(session: URLSession = .shared) {
        self.session = session
    }

    func subscribe(to symbols: [String], handler: @escaping @Sendable ([MarketAsset]) -> Void) -> UUID {
        let normalized = symbols.map { $0.uppercased() }
        let subscription = Subscription(id: UUID(), symbols: normalized, handler: handler)
        subscriptions[subscription.id] = subscription
        ensureConnection()
        if !latestRaw.isEmpty {
            notify(subscription: subscription, mids: latestRaw)
        }
        return subscription.id
    }

    func unsubscribe(id: UUID) {
        subscriptions.removeValue(forKey: id)
        if subscriptions.isEmpty {
            closeConnection()
        }
    }

    private func ensureConnection() {
        guard socket == nil else { return }
        var request = URLRequest(url: URL(string: "wss://api.hyperliquid.xyz/ws")!)
        request.timeoutInterval = 15
        socket = session.webSocketTask(with: request)
        socket?.resume()
        listen()
        sendSubscription()
    }

    private func closeConnection() {
        socket?.cancel(with: .goingAway, reason: nil)
        socket = nil
    }

    private func listen() {
        socket?.receive { result in
            Task { await self.handle(result: result) }
        }
    }

    private func handle(result: Result<URLSessionWebSocketTask.Message, Error>) async {
        switch result {
        case .failure:
            socket = nil
            scheduleReconnect()
        case .success(let message):
            switch message {
            case .string(let text):
                if let data = text.data(using: .utf8) {
                    parseMessage(data: data)
                }
            case .data(let data):
                parseMessage(data: data)
            @unknown default:
                break
            }
            listen()
        }
    }

    private func parseMessage(data: Data) {
        do {
            let payload = try JSONDecoder().decode(PricePayload.self, from: data)
            guard payload.channel == "allMids", let mids = payload.data?.mids else { return }
            latestRaw = mids
            subscriptions.values.forEach { subscription in
                notify(subscription: subscription, mids: mids)
            }
        } catch {
            Logger.error(error, category: "Hyperliquid", context: "parseMessage")
        }
    }

    private func notify(subscription: Subscription, mids: [String: String]) {
        let assets = subscription.symbols.map { symbol -> MarketAsset in
            let price = mids[symbol].flatMap(Double.init)
            return MarketAsset(id: symbol, symbol: symbol, name: symbol, price: price, change: nil)
        }
        subscription.handler(assets)
    }

    private func sendSubscription() {
        let payload: [String: Any] = [
            "method": "subscribe",
            "subscription": ["type": "allMids"]
        ]
        do {
            let data = try JSONSerialization.data(withJSONObject: payload, options: [])
            socket?.send(.data(data)) { error in
                if let error {
                    Logger.error(error, category: "Hyperliquid", context: "subscribe")
                }
            }
        } catch {
            Logger.error(error, category: "Hyperliquid", context: "subscribe encode")
        }
    }

    private func scheduleReconnect() {
        guard reconnectWorkItem == nil else { return }
        let workItem = DispatchWorkItem { [weak self] in
            guard let self else { return }
            Task { await self.ensureConnection() }
            reconnectWorkItem = nil
        }
        reconnectWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: workItem)
    }
}
