import SwiftUI

struct AppTheme {
    static let palette = ColorPalette()
    static let typography = Typography()
    static let spacing = Spacing()
}

struct ColorPalette {
    let background = Color(red: 0.07, green: 0.07, blue: 0.08)
    let surface = Color(red: 0.12, green: 0.12, blue: 0.14)
    let card = Color(red: 0.16, green: 0.16, blue: 0.18)
    let accent = Color(red: 0.88, green: 0.51, blue: 0.25)
    let accentSecondary = Color(red: 0.48, green: 0.71, blue: 0.98)
    let success = Color(red: 0.2, green: 0.77, blue: 0.47)
    let warning = Color(red: 0.96, green: 0.75, blue: 0.27)
    let error = Color(red: 0.92, green: 0.33, blue: 0.31)
    let textPrimary = Color.white
    let textSecondary = Color.white.opacity(0.7)
    let border = Color.white.opacity(0.1)
}

struct Typography {
    let title = Font.system(size: 28, weight: .bold, design: .default)
    let headline = Font.system(size: 20, weight: .semibold)
    let body = Font.system(size: 16, weight: .regular)
    let caption = Font.system(size: 13, weight: .medium)
}

struct Spacing {
    let xs: CGFloat = 4
    let sm: CGFloat = 8
    let md: CGFloat = 16
    let lg: CGFloat = 24
    let xl: CGFloat = 32
}
