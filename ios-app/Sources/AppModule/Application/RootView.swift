import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appViewModel: AppViewModel

    var body: some View {
        switch appViewModel.phase {
        case .launching:
            SplashView()
        case .needsConfiguration(let message):
            ConfigurationErrorView(message: message)
        case .ready(let environment):
            AppContentView(environment: environment)
                .environment(\.appEnvironment, environment)
        }
    }
}

private struct SplashView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [AppTheme.palette.background, AppTheme.palette.surface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .tint(AppTheme.palette.accent)
                Text("Preparing systems…")
                    .foregroundColor(AppTheme.palette.textSecondary)
                    .font(.footnote)
            }
        }
    }
}

private struct ConfigurationErrorView: View {
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(AppTheme.palette.error)
            Text("Configuration Required")
                .font(.headline)
                .foregroundColor(AppTheme.palette.textPrimary)
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundColor(AppTheme.palette.textSecondary)
                .font(.subheadline)
                .padding(.horizontal)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppTheme.palette.background.ignoresSafeArea())
    }
}

private struct AppContentView: View {
    let environment: AppEnvironment
    @StateObject private var sessionController: SessionController
    @StateObject private var localization = LocalizationController()

    init(environment: AppEnvironment) {
        self.environment = environment
        _sessionController = StateObject(wrappedValue: SessionController(environment: environment))
    }

    var body: some View {
        Group {
            switch sessionController.state {
            case .loading:
                SplashView()
            case .signedOut:
                AuthFlowView()
            case .needsOnboarding:
                OnboardingFlowView()
            case .ready:
                MainTabView(environment: environment)
            }
        }
        .environmentObject(sessionController)
        .environment(\.locale, localization.locale)
    }
}
