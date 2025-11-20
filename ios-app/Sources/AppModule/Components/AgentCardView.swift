import SwiftUI

struct AgentCardView: View {
    let agent: Agent

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(agent.name)
                            .font(.headline)
                        Text(agent.llmProvider.uppercased())
                            .font(.caption)
                            .foregroundColor(AppTheme.palette.textSecondary)
                    }
                    Spacer()
                    StatusBadge(isPublished: agent.publishedAt != nil)
                }
                HStack {
                    Label("$\(Int(agent.initialCapital))", systemImage: "banknote")
                        .font(.subheadline)
                    Spacer()
                    Text(agent.modelName)
                        .font(.caption)
                        .foregroundColor(AppTheme.palette.textSecondary)
                }
            }
        }
    }
}

private struct StatusBadge: View {
    let isPublished: Bool
    var body: some View {
        Text(isPublished ? "PUBLIC" : "PRIVATE")
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(isPublished ? AppTheme.palette.accent.opacity(0.2) : AppTheme.palette.surface)
            .foregroundColor(isPublished ? AppTheme.palette.accent : AppTheme.palette.textSecondary)
            .clipShape(Capsule())
    }
}
