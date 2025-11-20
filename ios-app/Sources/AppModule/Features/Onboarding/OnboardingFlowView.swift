import SwiftUI

struct OnboardingFlowView: View {
    @EnvironmentObject private var sessionController: SessionController
    @State private var displayName: String = ""
    @State private var bio: String = ""
    @State private var notifications = true
    @State private var theme: String = "dark"
    @State private var step: Int = 0
    @State private var isSubmitting = false
    @State private var alertMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            TabView(selection: $step) {
                welcomeStep.tag(0)
                profileStep.tag(1)
                preferenceStep.tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            HStack {
                if step > 0 {
                    Button("onboarding.steps.preferences.back") {
                        withAnimation { step -= 1 }
                    }
                    .buttonStyle(.secondary)
                }

                Spacer()

                Button(action: nextAction) {
                    if isSubmitting { ProgressView().tint(.white) }
                    Text(step == 2 ? "onboarding.steps.preferences.complete" : "onboarding.steps.profile.next")
                        .fontWeight(.semibold)
                }
                .buttonStyle(.primary)
                .disabled(isSubmitting)
            }
        }
        .padding()
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
        .alert(Text("common.error"), isPresented: Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        ), actions: {
            Button("OK", role: .cancel) { alertMessage = nil }
        }, message: {
            Text(alertMessage ?? "")
        })
    }

    private var welcomeStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("onboarding.steps.welcome.title")
                .font(.largeTitle)
                .bold()
            Text("onboarding.steps.welcome.description")
                .foregroundColor(AppTheme.palette.textSecondary)
        }
        .padding(.top, 60)
    }

    private var profileStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("onboarding.steps.profile.title")
                .font(.title2)
                .bold()
            TextField(LocalizedStringKey("onboarding.steps.profile.displayNamePlaceholder"), text: $displayName)
                .padding()
                .background(AppTheme.palette.surface.opacity(0.6))
                .cornerRadius(18)
            TextField(LocalizedStringKey("onboarding.steps.profile.bioPlaceholder"), text: $bio, axis: .vertical)
                .padding()
                .background(AppTheme.palette.surface.opacity(0.6))
                .cornerRadius(18)
        }
        .padding(.top, 40)
    }

    private var preferenceStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Toggle(isOn: $notifications) {
                Text("onboarding.steps.preferences.enableNotifications")
            }
            .toggleStyle(SwitchToggleStyle(tint: AppTheme.palette.accent))

            Picker("Theme", selection: $theme) {
                Text("onboarding.steps.preferences.light").tag("light")
                Text("onboarding.steps.preferences.dark").tag("dark")
            }
            .pickerStyle(.segmented)
        }
        .padding(.top, 40)
    }

    private func nextAction() {
        switch step {
        case 0:
            withAnimation { step = 1 }
        case 1:
            guard !displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                alertMessage = NSLocalizedString("onboarding.errors.enterDisplayName", comment: "")
                return
            }
            withAnimation { step = 2 }
        default:
            Task { await submit() }
        }
    }

    private func submit() async {
        guard case .needsOnboarding = sessionController.state else { return }
        isSubmitting = true
        do {
            try await sessionController.completeOnboarding(displayName: displayName, bio: bio, notificationsEnabled: notifications, theme: theme)
        } catch {
            alertMessage = error.localizedDescription
        }
        isSubmitting = false
    }
}
