import Foundation
import SwiftUI

@MainActor
final class LocalizationController: ObservableObject {
    @Published var locale: Locale

    init() {
        if let preferred = Locale.preferredLanguages.first {
            self.locale = Locale(identifier: preferred)
        } else {
            self.locale = Locale(identifier: "en")
        }
    }

    func setLocale(identifier: String) {
        locale = Locale(identifier: identifier)
    }
}
