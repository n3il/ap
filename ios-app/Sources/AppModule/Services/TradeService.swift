import Foundation

struct TradeService {
    private let client: SupabaseClient
    private let decoder = JSONDecoder()

    init(client: SupabaseClient) {
        self.client = client
        decoder.dateDecodingStrategy = .iso8601
    }

    func fetchTrades(agentID: UUID) async throws -> [Trade] {
        var builder = SupabaseQueryBuilder(table: "trades")
        builder.filters = [.equals("agent_id", agentID.uuidString)]
        builder.order = SupabaseOrder(column: "entry_timestamp", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Trade].self)
    }

    func fetchTrades(agentIDs: [UUID]) async throws -> [Trade] {
        guard !agentIDs.isEmpty else { return [] }
        var builder = SupabaseQueryBuilder(table: "trades")
        builder.filters = [.in("agent_id", values: agentIDs.map { $0.uuidString })]
        builder.order = SupabaseOrder(column: "entry_timestamp", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Trade].self)
    }

    func fetchOpenPositions(agentID: UUID?) async throws -> [Trade] {
        var builder = SupabaseQueryBuilder(table: "trades")
        builder.filters = [.equals("status", "OPEN")]
        if let agentID {
            builder.filters.append(.equals("agent_id", agentID.uuidString))
        }
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Trade].self)
    }

    func fetchLedger(type: String, userID: UUID, agentID: UUID? = nil, accountID: UUID? = nil) async throws -> TradingLedgerSnapshot {
        async let accountsTask: [TradingAccount] = fetchAccounts(type: type, userID: userID, agentID: agentID)
        async let positionsTask: [PositionAggregate] = fetchPositions(type: type, userID: userID, agentID: agentID, accountID: accountID)
        async let ordersTask: [TradingOrder] = fetchOrders(type: type, userID: userID, agentID: agentID, accountID: accountID)
        async let tradesTask: [TradingFill] = fetchFills(type: type, userID: userID, agentID: agentID, accountID: accountID)
        async let transactionsTask: [TradingTransaction] = fetchTransactions(type: type, userID: userID, agentID: agentID, accountID: accountID)

        return try await TradingLedgerSnapshot(
            accounts: accountsTask,
            positions: positionsTask,
            orders: ordersTask,
            trades: tradesTask,
            transactions: transactionsTask
        )
    }

    private func fetchAccounts(type: String, userID: UUID, agentID: UUID?) async throws -> [TradingAccount] {
        var builder = SupabaseQueryBuilder(table: "trading_accounts")
        builder.filters = [
            .equals("user_id", userID.uuidString),
            .equals("type", type)
        ]
        if let agentID {
            builder.filters.append(.equals("agent_id", agentID.uuidString))
        }
        builder.order = SupabaseOrder(column: "created_at", ascending: true)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [TradingAccount].self)
    }

    private func fetchPositions(type: String, userID: UUID, agentID: UUID?, accountID: UUID?) async throws -> [PositionAggregate] {
        var builder = SupabaseQueryBuilder(table: "trading_position_aggregates")
        builder.filters = [
            .equals("user_id", userID.uuidString),
            .equals("type", type)
        ]
        if let agentID {
            builder.filters.append(.equals("agent_id", agentID.uuidString))
        }
        if let accountID {
            builder.filters.append(.equals("account_id", accountID.uuidString))
        }
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [PositionAggregate].self)
    }

    private func fetchOrders(type: String, userID: UUID, agentID: UUID?, accountID: UUID?) async throws -> [TradingOrder] {
        var builder = SupabaseQueryBuilder(table: "trading_orders")
        builder.filters = [
            .equals("user_id", userID.uuidString),
            .equals("type", type)
        ]
        if let agentID {
            builder.filters.append(.equals("agent_id", agentID.uuidString))
        }
        if let accountID {
            builder.filters.append(.equals("account_id", accountID.uuidString))
        }
        builder.order = SupabaseOrder(column: "created_at", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [TradingOrder].self)
    }

    private func fetchFills(type: String, userID: UUID, agentID: UUID?, accountID: UUID?) async throws -> [TradingFill] {
        var builder = SupabaseQueryBuilder(table: "trading_trades")
        builder.filters = [
            .equals("user_id", userID.uuidString),
            .equals("type", type)
        ]
        if let agentID {
            builder.filters.append(.equals("agent_id", agentID.uuidString))
        }
        if let accountID {
            builder.filters.append(.equals("account_id", accountID.uuidString))
        }
        builder.order = SupabaseOrder(column: "executed_at", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [TradingFill].self)
    }

    private func fetchTransactions(type: String, userID: UUID, agentID: UUID?, accountID: UUID?) async throws -> [TradingTransaction] {
        var builder = SupabaseQueryBuilder(table: "trading_transactions")
        builder.filters = [
            .equals("user_id", userID.uuidString),
            .equals("type", type)
        ]
        if let agentID {
            builder.filters.append(.equals("agent_id", agentID.uuidString))
        }
        if let accountID {
            builder.filters.append(.equals("account_id", accountID.uuidString))
        }
        builder.order = SupabaseOrder(column: "occurred_at", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [TradingTransaction].self)
    }
}
