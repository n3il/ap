import Foundation

struct SupabaseFilter {
    let column: String
    let op: String
    let value: String

    static func equals(_ column: String, _ value: String) -> SupabaseFilter {
        SupabaseFilter(column: column, op: "eq", value: value)
    }

    static func `in`(_ column: String, values: [String]) -> SupabaseFilter {
        let list = values.joined(separator: ",")
        return SupabaseFilter(column: column, op: "in", value: "(\(list))")
    }

    static func greaterThan(_ column: String, _ value: String) -> SupabaseFilter {
        SupabaseFilter(column: column, op: "gt", value: value)
    }

    static func greaterThanOrEqual(_ column: String, _ value: String) -> SupabaseFilter {
        SupabaseFilter(column: column, op: "gte", value: value)
    }
}

struct SupabaseOrder {
    let column: String
    let ascending: Bool
}

struct SupabaseRange {
    let from: Int
    let to: Int
}

struct SupabaseQueryBuilder {
    let table: String
    var select: String = "*"
    var filters: [SupabaseFilter] = []
    var order: SupabaseOrder?
    var range: SupabaseRange?

    func queryItems() -> [URLQueryItem] {
        var items = [URLQueryItem(name: "select", value: select)]
        filters.forEach { filter in
            items.append(URLQueryItem(name: filter.column, value: "\(filter.op).\(filter.value)"))
        }
        if let order {
            items.append(URLQueryItem(name: "order", value: "\(order.column).\(order.ascending ? "asc" : "desc")"))
        }
        if let range {
            items.append(URLQueryItem(name: "offset", value: String(range.from)))
            items.append(URLQueryItem(name: "limit", value: String(range.to - range.from + 1)))
        }
        return items
    }
}
