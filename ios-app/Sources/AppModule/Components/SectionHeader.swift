import SwiftUI

struct SectionHeader: View {
    let title: String
    var subtitle: String?
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title.uppercased())
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.palette.textSecondary)
                if let subtitle {
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundColor(AppTheme.palette.textSecondary.opacity(0.8))
                }
            }
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.caption)
                    .foregroundColor(AppTheme.palette.accent)
            }
        }
    }
}
