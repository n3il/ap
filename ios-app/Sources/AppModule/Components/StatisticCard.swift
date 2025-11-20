import SwiftUI

struct StatisticCard: View {
    let title: String
    let value: String
    var trend: String?
    var trendColor: Color = AppTheme.palette.accent

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 6) {
                Text(title.uppercased())
                    .font(.caption)
                    .foregroundColor(AppTheme.palette.textSecondary)
                Text(value)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(AppTheme.palette.textPrimary)
                if let trend {
                    Text(trend)
                        .font(.footnote)
                        .foregroundColor(trendColor)
                }
            }
        }
    }
}
