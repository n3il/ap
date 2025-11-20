import SwiftUI

struct ProfileView: View {
    let environment: AppEnvironment
    @ObservedObject var sessionController: SessionController
    @State private var displayName: String = ""
    @State private var bio: String = ""
    @State private var notificationsEnabled: Bool = true
    @State private var theme: String = "dark"
    @State private var isSaving = false
    @State private var saveMessage: String?
    @State private var showLanguageAlert = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    AvatarView(name: sessionController.profile?.displayName ?? sessionController.currentUser?.email)
                    VStack(alignment: .leading) {
                        Text(sessionController.profile?.displayName ?? sessionController.currentUser?.email ?? "User")
                            .font(.title2)
                            .bold()
                        Text(sessionController.currentUser?.email ?? sessionController.currentUser?.phone ?? "")
                            .foregroundColor(AppTheme.palette.textSecondary)
                    }
                }
                .padding()
                .background(AppTheme.palette.surface.opacity(0.6))
                .cornerRadius(20)

                VStack(alignment: .leading, spacing: 16) {
                    Text("Profile").font(.headline)
                    TextField("Display Name", text: $displayName)
                        .textInputAutocapitalization(.words)
                        .padding()
                        .background(AppTheme.palette.surface.opacity(0.5))
                        .cornerRadius(16)

                    TextField("Bio", text: $bio, axis: .vertical)
                        .lineLimit(3, reservesSpace: true)
                        .padding()
                        .background(AppTheme.palette.surface.opacity(0.5))
                        .cornerRadius(16)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Preferences").font(.headline)
                    Toggle("Enable Notifications", isOn: $notificationsEnabled)
                        .toggleStyle(SwitchToggleStyle(tint: AppTheme.palette.accent))
                    Picker("Theme", selection: $theme) {
                        Text("Light").tag("light")
                        Text("Dark").tag("dark")
                    }
                    .pickerStyle(.segmented)

                    Button("Language") { showLanguageAlert = true }
                        .buttonStyle(.secondary)
                }

                Button(action: saveProfile) {
                    if isSaving {
                        ProgressView().tint(.white)
                    } else {
                        Text("Save Changes")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.primary)
                .disabled(isSaving || displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                Button(action: { Task { await sessionController.signOut() } }) {
                    Text("Sign Out")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.primary)

                Text("Version 1.0.0")
                    .font(.footnote)
                    .foregroundColor(AppTheme.palette.textSecondary)
            }
            .padding()
        }
        .background(
            LinearGradient(colors: [AppTheme.palette.background, AppTheme.palette.surface], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
        )
        .onAppear(perform: populateFromProfile)
        .onChange(of: sessionController.profile?.id) { _ in
            populateFromProfile()
        }
        .alert("Coming Soon", isPresented: $showLanguageAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Language selector is under development.")
        }
        .alert("Profile Updated", isPresented: Binding(
            get: { saveMessage != nil },
            set: { if !$0 { saveMessage = nil } }
        )) {
            Button("OK", role: .cancel) { saveMessage = nil }
        } message: {
            Text(saveMessage ?? "")
        }
    }

    private func populateFromProfile() {
        displayName = sessionController.profile?.displayName ?? sessionController.currentUser?.email ?? ""
        bio = sessionController.profile?.bio ?? ""
        notificationsEnabled = sessionController.profile?.notificationsEnabled ?? true
        theme = sessionController.profile?.preferredTheme ?? "dark"
    }

    private func saveProfile() {
        isSaving = true
        Task {
            await sessionController.updateProfile(
                displayName: displayName,
                bio: bio.isEmpty ? nil : bio,
                notificationsEnabled: notificationsEnabled,
                theme: theme
            )
            await MainActor.run {
                isSaving = false
                saveMessage = "Settings saved successfully."
            }
        }
    }
}
