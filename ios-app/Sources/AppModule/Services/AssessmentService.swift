import Foundation

struct AssessmentStats {
    let totalAssessments: Int
    let actionsTriggered: Int
}

struct AssessmentService {
    private let client: SupabaseClient
    private let decoder = JSONDecoder()

    init(client: SupabaseClient) {
        self.client = client
        decoder.dateDecodingStrategy = .iso8601
    }

    func fetchAssessments(agentID: UUID, limit: Int? = nil) async throws -> [Assessment] {
        var builder = SupabaseQueryBuilder(table: "assessments")
        builder.filters = [.equals("agent_id", agentID.uuidString)]
        builder.order = SupabaseOrder(column: "timestamp", ascending: false)
        if let limit {
            builder.range = SupabaseRange(from: 0, to: max(limit - 1, 0))
        }
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Assessment].self)
    }

    func fetchAssessments(agentIDs: [UUID]) async throws -> [Assessment] {
        guard !agentIDs.isEmpty else { return [] }
        var builder = SupabaseQueryBuilder(table: "assessments")
        builder.filters = [.in("agent_id", values: agentIDs.map { $0.uuidString })]
        builder.order = SupabaseOrder(column: "timestamp", ascending: false)
        let request = try client.restRequest(path: builder.table, queryItems: builder.queryItems())
        return try await client.httpClient.perform(request, decode: [Assessment].self)
    }

    func fetchStats(agentIDs: [UUID]) async throws -> AssessmentStats {
        let assessments = try await fetchAssessments(agentIDs: agentIDs)
        let actionCount = assessments.filter { assessment in
            guard let action = assessment.tradeActionTaken else { return false }
            return action != "NO_ACTION"
        }.count
        return AssessmentStats(totalAssessments: assessments.count, actionsTriggered: actionCount)
    }
}
