import SwiftUI

struct GlassBackground: ViewModifier {
    var cornerRadius: CGFloat
    var stroke: Color
    var fill: Color

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(fill)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(stroke, lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.35), radius: 20, y: 6)
            )
    }
}

extension View {
    func glassCard(cornerRadius: CGFloat = 20, opacity: Double = 0.35) -> some View {
        modifier(
            GlassBackground(
                cornerRadius: cornerRadius,
                stroke: Color.white.opacity(0.08),
                fill: Color.white.opacity(opacity)
            )
        )
    }
}
