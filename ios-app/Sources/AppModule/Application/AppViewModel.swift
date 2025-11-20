import Foundation

@MainActor
final class AppViewModel: ObservableObject {
    enum Phase: Equatable {
        case launching
        case needsConfiguration(String)
        case ready(AppEnvironment)
    }

    @Published private(set) var phase: Phase = .launching

    init() {
        Task { await bootstrap() }
    }

    func bootstrap() async {
        do {
            let configuration = try AppConfiguration.load()
            let keychain = KeychainStore(service: "com.puppetai.app.native")
            let httpClient = HTTPClient()
            let sessionStore = SupabaseSessionStore(keychain: keychain)
            let supabaseClient = SupabaseClient(configuration: configuration, httpClient: httpClient, sessionStore: sessionStore)
            let authService = SupabaseAuthService(client: supabaseClient)
            let agentService = AgentService(client: supabaseClient)
            let promptService = PromptService(client: supabaseClient)
            let assessmentService = AssessmentService(client: supabaseClient)
            let tradeService = TradeService(client: supabaseClient)
            let profileService = ProfileService(client: supabaseClient)
            let marketHistoryService = MarketHistoryService()
            let priceService = HyperliquidPriceService()
            let functionService = SupabaseFunctionService(client: supabaseClient)
            let environment = AppEnvironment(
                configuration: configuration,
                keychain: keychain,
                httpClient: httpClient,
                supabaseClient: supabaseClient,
                authService: authService,
                agentService: agentService,
                promptService: promptService,
                assessmentService: assessmentService,
                tradeService: tradeService,
                profileService: profileService,
                marketHistoryService: marketHistoryService,
                priceService: priceService,
                functionService: functionService
            )
            phase = .ready(environment)
        } catch {
            phase = .needsConfiguration(error.localizedDescription)
        }
    }
}
