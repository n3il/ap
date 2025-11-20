import SwiftUI

struct SearchView: View {
    let environment: AppEnvironment
    @StateObject private var viewModel: SearchViewModel

    init(environment: AppEnvironment) {
        self.environment = environment
        _viewModel = StateObject(wrappedValue: SearchViewModel(environment: environment))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Search Agents")
                .font(.largeTitle)
                .bold()

            TextField("Search by name, provider, or address", text: $viewModel.query)
                .textInputAutocapitalization(.never)
                .padding()
                .background(AppTheme.palette.surface.opacity(0.6))
                .cornerRadius(18)

            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .center)
            } else if viewModel.filteredAgents.isEmpty {
                Text("No matching agents yet.")
                    .foregroundColor(AppTheme.palette.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(viewModel.filteredAgents) { agent in
                            AgentCardView(agent: agent)
                        }
                    }
                }
            }
            Spacer()
        }
        .padding()
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
        .task {
            await viewModel.load()
        }
        .alert("Error", isPresented: Binding(
            get: { viewModel.alertMessage != nil },
            set: { if !$0 { viewModel.alertMessage = nil } }
        )) {
            Button("OK", role: .cancel) { viewModel.alertMessage = nil }
        } message: {
            Text(viewModel.alertMessage ?? "")
        }
    }
}
