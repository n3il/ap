import SwiftUI

struct AvatarView: View {
    let name: String?
    var size: CGFloat = 48

    private var initials: String {
        let components = (name ?? "").split(separator: " ")
        let letters = components.prefix(2).map { $0.first.map(String.init) ?? "" }
        let result = letters.joined()
        return result.isEmpty ? "👾" : result.uppercased()
    }

    var body: some View {
        Text(initials)
            .font(.system(size: size / 2, weight: .semibold))
            .frame(width: size, height: size)
            .background(AppTheme.palette.accent.opacity(0.2))
            .foregroundColor(AppTheme.palette.accent)
            .clipShape(Circle())
    }
}
