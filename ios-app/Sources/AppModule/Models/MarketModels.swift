import Foundation

enum MarketTimeframe: String, CaseIterable, Identifiable {
    case oneHour = "1h"
    case day = "24h"
    case week = "7d"
    case month = "1M"
    case year = "1Y"

    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .oneHour: return "1H"
        case .day: return "24H"
        case .week: return "7D"
        case .month: return "1M"
        case .year: return "1Y"
        }
    }
}

struct MarketAsset: Identifiable, Hashable {
    let id: String
    let symbol: String
    let name: String
    var price: Double?
    var change: Double?
}

struct CandlePoint: Identifiable, Codable, Hashable {
    let id = UUID()
    let timestamp: Date
    let open: Double
    let close: Double
    let high: Double
    let low: Double
}
