import SwiftUI

struct AgentsView: View {
    let environment: AppEnvironment
    @EnvironmentObject private var sessionController: SessionController
    @StateObject private var viewModel: AgentsViewModel
    @State private var segment: AgentSegment = .active
    @State private var showingCreate = false

    init(environment: AppEnvironment) {
        self.environment = environment
        _viewModel = StateObject(wrappedValue: AgentsViewModel(environment: environment))
    }

    var body: some View {
        NavigationStack {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Agents").font(.largeTitle).bold()
                Spacer()
                Button(action: { showingCreate = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
            SegmentedControl(selection: $segment, options: AgentSegment.allCases)
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(currentAgents) { agent in
                        NavigationLink(destination: AgentDetailView(agent: agent)) {
                            AgentCardView(agent: agent)
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
        .task {
            await viewModel.load(userID: sessionController.currentUser?.id)
        }
        .sheet(isPresented: $showingCreate) {
            if let userID = sessionController.currentUser?.id {
                CreateAgentView(environment: environment, userID: userID) {
                    showingCreate = false
                    Task { await viewModel.load(userID: userID) }
                }
            }
        }
        }
    }

    private var currentAgents: [Agent] {
        switch segment {
        case .active:
            return viewModel.personalAgents
        case .shared:
            return viewModel.sharedAgents
        case .all:
            let combined = Set(viewModel.sharedAgents + viewModel.personalAgents)
            return Array(combined)
        }
    }
}

enum AgentSegment: String, CaseIterable, CustomStringConvertible {
    case active = "Active"
    case shared = "Shared"
    case all = "All"

    var description: String { rawValue }
}

private struct CreateAgentView: View {
    let environment: AppEnvironment
    let userID: UUID
    var onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var provider = "openai"
    @State private var model = "gpt-4o"
    @State private var capital = "10000"
    @State private var isSaving = false
    @State private var alertMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                    Picker("Provider", selection: $provider) {
                        ForEach(providers, id: \.self) { provider in
                            Text(provider.capitalized).tag(provider)
                        }
                    }
                    TextField("Model", text: $model)
                    TextField("Initial Capital", text: $capital)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("New Agent")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { Task { await save() } }
                        .disabled(isSaving)
                }
            }
            .alert(Text("common.error"), isPresented: Binding(
                get: { alertMessage != nil },
                set: { if !$0 { alertMessage = nil } }
            ), actions: {
                Button("OK", role: .cancel) { alertMessage = nil }
            }, message: {
                Text(alertMessage ?? "")
            })
        }
    }

    private var providers: [String] { ["openai", "google", "anthropic", "deepseek"] }

    private func save() async {
        guard let amount = Double(capital) else {
            alertMessage = "Enter a valid amount"
            return
        }
        isSaving = true
        let request = AgentCreateRequest(name: name, llmProvider: provider, modelName: model, initialCapital: amount, promptID: nil)
        do {
            try await environment.agentService.createAgent(request: request, userID: userID)
            onComplete()
            dismiss()
        } catch {
            alertMessage = error.localizedDescription
        }
        isSaving = false
    }
}
