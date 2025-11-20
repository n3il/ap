import SwiftUI

struct SegmentedControl<Option: Hashable & CustomStringConvertible>: View {
    @Binding var selection: Option
    let options: [Option]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(options, id: \.self) { option in
                Button(action: { selection = option }) {
                    Text(option.description)
                        .font(.footnote)
                        .fontWeight(.semibold)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(selection == option ? AppTheme.palette.accent.opacity(0.2) : Color.clear)
                        )
                        .foregroundColor(selection == option ? AppTheme.palette.accent : AppTheme.palette.textSecondary)
                }
            }
        }
        .padding(6)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(AppTheme.palette.surface.opacity(0.4))
        )
    }
}
