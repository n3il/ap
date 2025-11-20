import SwiftUI

struct AgentDetailView: View {
    let agent: Agent

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(agent.name)
                    .font(.largeTitle)
                    .bold()
                Text("Model: \(agent.modelName)")
                Text("Provider: \(agent.llmProvider)")
                Text("Initial Capital: $\(Int(agent.initialCapital))")
                if let address = agent.hyperliquidAddress {
                    Text("Address: \(address)")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
        }
        .navigationTitle(agent.name)
    }
}
