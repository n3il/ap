import Foundation

struct AppEnvironment {
    let configuration: AppConfiguration
    let keychain: KeychainStore
    let httpClient: HTTPClientProtocol
    let supabaseClient: SupabaseClient
    let authService: SupabaseAuthService
    let agentService: AgentService
    let promptService: PromptService
    let assessmentService: AssessmentService
    let tradeService: TradeService
    let profileService: ProfileService
    let marketHistoryService: MarketHistoryService
    let priceService: HyperliquidPriceService
    let functionService: SupabaseFunctionService
}
