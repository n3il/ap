import SwiftUI

struct LoadingView: View {
    var message: String = "Loading..."

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(AppTheme.palette.accent)
            Text(message)
                .font(.footnote)
                .foregroundColor(AppTheme.palette.textSecondary)
        }
        .padding()
    }
}

struct ErrorStateView: View {
    let message: String
    var retryTitle: String = "Retry"
    var onRetry: (() -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.circle")
                .font(.largeTitle)
                .foregroundColor(AppTheme.palette.error)
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundColor(AppTheme.palette.textSecondary)
            if let onRetry {
                Button(retryTitle, action: onRetry)
                    .buttonStyle(.secondary)
            }
        }
        .padding(24)
    }
}
