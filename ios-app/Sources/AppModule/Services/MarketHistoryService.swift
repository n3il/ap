import Foundation

struct MarketHistoryService {
    enum HistoryError: Error { case invalidResponse }

    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func fetchHistory(for symbol: String, timeframe: MarketTimeframe) async throws -> [CandlePoint] {
        let config = timeframeConfig(timeframe)
        let end = Date()
        let start = end.addingTimeInterval(-config.duration)
        let payload: [String: Any] = [
            "type": "candleSnapshot",
            "req": [
                "coin": symbol,
                "interval": config.interval,
                "startTime": Int(start.timeIntervalSince1970 * 1000),
                "endTime": Int(end.timeIntervalSince1970 * 1000)
            ]
        ]
        let body = try JSONSerialization.data(withJSONObject: payload, options: [])
        var request = URLRequest(url: URL(string: "https://api.hyperliquid.xyz/info")!)
        request.httpMethod = "POST"
        request.httpBody = body
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await session.data(for: request)
        guard
            let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200,
            let array = try JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else {
            throw HistoryError.invalidResponse
        }

        return array.compactMap { item in
            guard
                let timestamp = item["t"] as? TimeInterval,
                let open = (item["o"] as? NSString)?.doubleValue,
                let close = (item["c"] as? NSString)?.doubleValue,
                let high = (item["h"] as? NSString)?.doubleValue,
                let low = (item["l"] as? NSString)?.doubleValue
            else { return nil }
            return CandlePoint(
                timestamp: Date(timeIntervalSince1970: timestamp / 1000),
                open: open,
                close: close,
                high: high,
                low: low
            )
        }
    }

    private func timeframeConfig(_ timeframe: MarketTimeframe) -> (duration: TimeInterval, interval: String) {
        switch timeframe {
        case .oneHour: return (60 * 60, "1m")
        case .day: return (24 * 60 * 60, "5m")
        case .week: return (7 * 24 * 60 * 60, "1h")
        case .month: return (30 * 24 * 60 * 60, "4h")
        case .year: return (365 * 24 * 60 * 60, "1d")
        }
    }
}
