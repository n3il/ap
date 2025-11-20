import SwiftUI

struct PerformanceView: View {
    let environment: AppEnvironment
    let sessionController: SessionController
    @StateObject private var viewModel: PerformanceViewModel

    init(environment: AppEnvironment, sessionController: SessionController) {
        self.environment = environment
        self.sessionController = sessionController
        _viewModel = StateObject(wrappedValue: PerformanceViewModel(environment: environment, sessionController: sessionController))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Performance")
                    .font(.largeTitle)
                    .bold()

                HStack(spacing: 12) {
                    StatisticCard(title: "Trades", value: "\(viewModel.stats.totalTrades)")
                    StatisticCard(title: "Win %", value: String(format: "%.1f%%", viewModel.stats.winRate))
                }
                HStack(spacing: 12) {
                    StatisticCard(title: "Open", value: "\(viewModel.stats.openPositions)")
                    StatisticCard(title: "P&L", value: String(format: "$%.0f", viewModel.stats.totalPnL))
                }

                Text("Assessments")
                    .font(.headline)
                ForEach(viewModel.assessments.prefix(10)) { assessment in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(assessment.agent?.name ?? "Agent")
                            .font(.headline)
                        Text(assessment.parsedLLMResponse?.headline?.shortSummary ?? assessment.llmResponseText)
                            .font(.subheadline)
                            .lineLimit(3)
                    }
                    .padding()
                    .background(AppTheme.palette.surface.opacity(0.5))
                    .cornerRadius(20)
                }
            }
            .padding()
        }
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
    }
}
