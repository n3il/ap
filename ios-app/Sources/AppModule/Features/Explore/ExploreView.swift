import SwiftUI
import Charts

struct ExploreView: View {
    @StateObject private var viewModel: ExploreViewModel
    @State private var category: ExploreCategory = .top

    init(environment: AppEnvironment) {
        _viewModel = StateObject(wrappedValue: ExploreViewModel(environment: environment))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                timeframePicker
                marketWidget
                chartSection
                agentSection
            }
            .padding(20)
        }
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Explore Agents")
                    .font(.title)
                    .bold()
                Text("Live market data & strategy performance")
                    .foregroundColor(AppTheme.palette.textSecondary)
            }
            Spacer()
        }
    }

    private var timeframePicker: some View {
        Picker("Timeframe", selection: $viewModel.timeframe) {
            ForEach(MarketTimeframe.allCases) { timeframe in
                Text(timeframe.displayName).tag(timeframe)
            }
        }
        .pickerStyle(.segmented)
    }

    private var marketWidget: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Markets").font(.headline)
            if viewModel.marketPrices.isEmpty {
                ProgressView()
            } else {
                ForEach(viewModel.marketPrices, id: \.symbol) { asset in
                    HStack {
                        Text(asset.symbol)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        Spacer()
                        if let price = asset.price {
                            Text("$\(price, specifier: "%.2f")")
                                .font(.subheadline)
                        } else {
                            ProgressView().scaleEffect(0.5)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(AppTheme.palette.surface.opacity(0.5))
        .cornerRadius(20)
    }

    private var chartSection: some View {
        VStack(alignment: .leading) {
            Text("BTC Snapshot")
                .font(.headline)
            if viewModel.chartData.isEmpty {
                ProgressView()
            } else {
                Chart(viewModel.chartData) { point in
                    LineMark(
                        x: .value("Time", point.timestamp),
                        y: .value("Price", point.close)
                    )
                    .foregroundStyle(AppTheme.palette.accent)
                }
                .chartXAxis(.hidden)
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
                .frame(height: 200)
            }
        }
    }

    private var agentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SegmentedControl(selection: $category, options: ExploreCategory.allCases)
            if viewModel.isLoadingAgents {
                ProgressView()
            } else if viewModel.agents.isEmpty {
                Text("No agents available")
                    .foregroundColor(AppTheme.palette.textSecondary)
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.agents(for: category)) { agent in
                        AgentCardView(agent: agent)
                    }
                }
            }
        }
    }
}
