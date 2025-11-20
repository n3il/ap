import SwiftUI

struct AuthOTPContext: Hashable {
    enum Mode: Hashable { case phone(String), email(String) }
    let mode: Mode
}

struct AuthFlowView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            LoginView { context in
                path.append(context)
            }
            .navigationDestination(for: AuthOTPContext.self) { context in
                OTPVerificationView(context: context)
            }
            .navigationBarHidden(true)
        }
    }
}

private enum AuthMode: String, CaseIterable, CustomStringConvertible {
    case phone
    case email

    var description: String {
        switch self {
        case .phone: return "SMS"
        case .email: return "Email"
        }
    }
}

private struct LoginView: View {
    @EnvironmentObject private var sessionController: SessionController
    @State private var mode: AuthMode = .phone
    @State private var phoneNumber = ""
    @State private var email = ""
    @State private var isLoading = false
    @State private var alertMessage: String?

    let onOTPRequested: (AuthOTPContext) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("login.title")
                    .font(.system(size: 34, weight: .bold))
                    .foregroundColor(AppTheme.palette.textPrimary)

                Text("login.subtitle")
                    .foregroundColor(AppTheme.palette.textSecondary)

                SegmentedControl(selection: $mode, options: AuthMode.allCases)

                Group {
                    switch mode {
                    case .phone:
                        VStack(alignment: .leading, spacing: 12) {
                            Text("login.phoneNumber").font(.headline)
                            TextField(LocalizedStringKey("login.phonePlaceholder"), text: $phoneNumber)
                                .keyboardType(.phonePad)
                                .textContentType(.telephoneNumber)
                                .padding()
                                .background(AppTheme.palette.surface.opacity(0.6))
                                .cornerRadius(16)
                            Text("login.smsLegal")
                                .font(.footnote)
                                .foregroundColor(AppTheme.palette.textSecondary)
                        }
                    case .email:
                        VStack(alignment: .leading, spacing: 12) {
                            Text("login.email").font(.headline)
                            TextField(LocalizedStringKey("login.emailPlaceholder"), text: $email)
                                .keyboardType(.emailAddress)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .padding()
                                .background(AppTheme.palette.surface.opacity(0.6))
                                .cornerRadius(16)
                        }
                    }
                }

                Button(action: handlePrimaryAction) {
                    HStack {
                        if isLoading { ProgressView().tint(.white) }
                        Text("login.sendCode")
                            .fontWeight(.semibold)
                    }
                }
                .buttonStyle(.primary)
                .disabled(isLoading)

                Text("login.orContinueWith")
                    .font(.caption)
                    .foregroundColor(AppTheme.palette.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 12)

                HStack(spacing: 12) {
                    Button(action: { Task { await signInWithGoogle() } }) {
                        Label("Google", systemImage: "g.circle")
                            .font(.headline)
                    }
                    .buttonStyle(.secondary)

                    Button(action: { Task { await signInWithApple() } }) {
                        Label("Apple", systemImage: "apple.logo")
                            .font(.headline)
                    }
                    .buttonStyle(.secondary)
                }

                Spacer(minLength: 40)
            }
            .padding(24)
        }
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

    private func handlePrimaryAction() {
        Task {
            await sendOTP()
        }
    }

    private func sendOTP() async {
        guard validateFields() else { return }
        isLoading = true
        do {
            switch mode {
            case .phone:
                try await sessionController.sendPhoneOTP(phone: phoneNumber)
                onOTPRequested(AuthOTPContext(mode: .phone(phoneNumber)))
            case .email:
                try await sessionController.sendEmailOTP(email: email)
                onOTPRequested(AuthOTPContext(mode: .email(email)))
            }
        } catch {
            alertMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func validateFields() -> Bool {
        switch mode {
        case .phone:
            let digits = phoneNumber.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !digits.isEmpty else {
                alertMessage = NSLocalizedString("login.errors.enterPhoneNumber", comment: "")
                return false
            }
        case .email:
            guard email.contains("@") else {
                alertMessage = NSLocalizedString("signup.errors.invalidEmail", comment: "")
                return false
            }
        }
        return true
    }

    private func signInWithGoogle() async {
        do {
            try await sessionController.signInWithGoogle()
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func signInWithApple() async {
        do {
            try await sessionController.signInWithApple()
        } catch {
            alertMessage = error.localizedDescription
        }
    }
}

private struct OTPVerificationView: View {
    @EnvironmentObject private var sessionController: SessionController
    @Environment(\.dismiss) private var dismiss
    @State private var code: String = ""
    @State private var isLoading = false
    @State private var countdown: Int = 60
    @State private var alertMessage: String?
    @State private var timer: Timer?
    let context: AuthOTPContext

    var body: some View {
        VStack(spacing: 20) {
            Text("login.verificationCode")
                .font(.title2)
                .bold()
            Text(description)
                .foregroundColor(AppTheme.palette.textSecondary)
            TextField("••••••", text: $code)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.largeTitle)
                .padding()
                .background(AppTheme.palette.surface.opacity(0.6))
                .cornerRadius(20)

            Button(action: verifyCode) {
                if isLoading {
                    ProgressView().tint(.white)
                } else {
                    Text("login.verify").fontWeight(.semibold)
                }
            }
            .buttonStyle(.primary)
            .disabled(code.count != 6 || isLoading)

            Button(action: resendCode) {
                HStack(spacing: 4) {
                    Text("login.resendCode")
                    if countdown > 0 {
                        Text("(\(countdown)s)")
                    }
                }
                .foregroundColor(countdown > 0 ? AppTheme.palette.textSecondary : AppTheme.palette.accent)
            }
            .disabled(countdown > 0)

            Spacer()
        }
        .padding()
        .onAppear(perform: startCountdown)
        .onDisappear {
            timer?.invalidate()
            timer = nil
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

    private var description: String {
        switch context.mode {
        case .phone(let phone):
            return String(format: NSLocalizedString("login.sentTo", comment: ""), phone)
        case .email(let email):
            return String(format: NSLocalizedString("login.sentTo", comment: ""), email)
        }
    }

    private func startCountdown() {
        timer?.invalidate()
        countdown = 60
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            countdown -= 1
            if countdown <= 0 {
                timer.invalidate()
                self.timer = nil
            }
        }
    }

    private func verifyCode() {
        Task {
            isLoading = true
            do {
                switch context.mode {
                case .phone(let phone):
                    try await sessionController.verifyPhoneOTP(phone: phone, token: code)
                case .email(let email):
                    try await sessionController.verifyEmailOTP(email: email, token: code)
                }
                dismiss()
            } catch {
                alertMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func resendCode() {
        Task {
            do {
                switch context.mode {
                case .phone(let phone): try await sessionController.sendPhoneOTP(phone: phone)
                case .email(let email): try await sessionController.sendEmailOTP(email: email)
                }
                startCountdown()
            } catch {
                alertMessage = error.localizedDescription
            }
        }
    }
}
