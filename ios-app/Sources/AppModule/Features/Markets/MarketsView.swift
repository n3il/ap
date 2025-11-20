import SwiftUI
import Charts

struct MarketsView: View {
    let environment: AppEnvironment
    let sessionController: SessionController
    @StateObject private var viewModel: MarketsViewModel
    @State private var orderSide: String = "LONG"
    @State private var amount: String = "1"
    @State private var leverage: Double = 2

    init(environment: AppEnvironment, sessionController: SessionController) {
        self.environment = environment
        self.sessionController = sessionController
        _viewModel = StateObject(wrappedValue: MarketsViewModel(environment: environment, sessionController: sessionController))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                picker
                chart
                orderForm
                ledgerSection
            }
            .padding()
        }
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
        .task {
            await viewModel.loadLedger()
        }
    }

    private var picker: some View {
        Picker("Symbol", selection: $viewModel.selectedSymbol) {
            ForEach(["BTC", "ETH", "SOL", "AVAX"], id: \.self) { symbol in
                Text(symbol).tag(symbol)
            }
        }
        .pickerStyle(.segmented)
    }

    private var chart: some View {
        VStack(alignment: .leading) {
            Text("\(viewModel.selectedSymbol) Price")
                .font(.headline)
            if viewModel.chartData.isEmpty {
                ProgressView()
            } else {
                Chart(viewModel.chartData) { candle in
                    LineMark(
                        x: .value("Time", candle.timestamp),
                        y: .value("Price", candle.close)
                    )
                    .foregroundStyle(AppTheme.palette.accent)
                }
                .frame(height: 200)
            }
        }
    }

    private var orderForm: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Place Order").font(.headline)
            Picker("Side", selection: $orderSide) {
                Text("Long").tag("LONG")
                Text("Short").tag("SHORT")
            }
            .pickerStyle(.segmented)

            TextField("Size", text: $amount)
                .keyboardType(.decimalPad)
                .padding()
                .background(AppTheme.palette.surface.opacity(0.6))
                .cornerRadius(16)

            VStack(alignment: .leading) {
                Text("Leverage: \(Int(leverage))x")
                Slider(value: $leverage, in: 1...5, step: 1)
            }

            Button(action: placeOrder) {
                if viewModel.isPlacingOrder {
                    ProgressView().tint(.white)
                } else {
                    Text("Submit Order").fontWeight(.bold)
                }
            }
            .buttonStyle(.primary)
            .disabled(viewModel.isPlacingOrder)
        }
    }

    private var ledgerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ledger")
                .font(.headline)
            if let ledger = viewModel.ledger {
                ForEach(ledger.positions.prefix(5)) { position in
                    HStack {
                        Text(position.symbol)
                        Spacer()
                        Text(position.net ?? "0")
                    }
                    .padding(.vertical, 4)
                }
            } else {
                Text("No data")
                    .foregroundColor(AppTheme.palette.textSecondary)
            }
        }
    }

    private func placeOrder() {
        guard let amountValue = Double(amount) else { return }
        Task {
            await viewModel.placeOrder(side: orderSide, amount: amountValue, leverage: leverage)
        }
    }
}
