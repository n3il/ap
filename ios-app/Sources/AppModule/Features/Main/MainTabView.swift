import SwiftUI

struct MainTabView: View {
    let environment: AppEnvironment
    @EnvironmentObject private var sessionController: SessionController
    @State private var selection = 0

    var body: some View {
        TabView(selection: $selection) {
            ExploreView(environment: environment)
                .tabItem { Label("Explore", systemImage: "globe") }
                .tag(0)

            AgentsView(environment: environment)
                .tabItem { Label("Agents", systemImage: "person.3") }
                .tag(1)

            MarketsView(environment: environment, sessionController: sessionController)
                .tabItem { Label("Trade", systemImage: "chart.line.uptrend.xyaxis") }
                .tag(2)

            PerformanceView(environment: environment, sessionController: sessionController)
                .tabItem { Label("Performance", systemImage: "speedometer") }
                .tag(3)

            ProfileView(environment: environment, sessionController: sessionController)
                .tabItem { Label("Profile", systemImage: "person.circle") }
                .tag(4)

            SearchView(environment: environment)
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
                .tag(5)
        }
        .tint(AppTheme.palette.accent)
    }
}
