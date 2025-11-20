import SwiftUI

struct SwipeableTab: Identifiable {
    let id: UUID
    let title: String
    let content: AnyView

    init(title: String, @ViewBuilder content: () -> some View) {
        self.id = UUID()
        self.title = title
        self.content = AnyView(content())
    }
}

struct SwipeableTabsView: View {
    let tabs: [SwipeableTab]
    @State private var selection: UUID

    init(tabs: [SwipeableTab]) {
        self.tabs = tabs
        self._selection = State(initialValue: tabs.first?.id ?? UUID())
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                ForEach(tabs) { tab in
                    Button(action: { selection = tab.id }) {
                        Text(tab.title)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(
                                Capsule()
                                    .fill(selection == tab.id ? AppTheme.palette.accent.opacity(0.2) : Color.clear)
                            )
                            .foregroundColor(selection == tab.id ? AppTheme.palette.accent : AppTheme.palette.textSecondary)
                    }
                }
            }
            .padding(.horizontal, 8)

            TabView(selection: $selection) {
                ForEach(tabs) { tab in
                    tab.content
                        .tag(tab.id)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
    }
}
