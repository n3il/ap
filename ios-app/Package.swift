// swift-tools-version: 5.10
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "PuppetIOS",
    defaultLocalization: "en",
    platforms: [
        .iOS("17.0")
    ],
    products: [
        .iOSApplication(
            name: "Puppet",
            targets: ["AppModule"],
            bundleIdentifier: "com.puppetai.app.native",
            teamIdentifier: "ABCDE12345",
            displayVersion: "1.0.0",
            bundleVersion: "1",
            appIcon: .asset("AppIcon"),
            accentColor: .asset("AccentColor"),
            supportedDeviceFamilies: [
                .pad,
                .phone
            ],
            supportedInterfaceOrientations: [
                .portrait,
                .portraitUpsideDown(.when(deviceFamilies: [.pad])),
                .landscapeLeft(.when(deviceFamilies: [.pad])),
                .landscapeRight(.when(deviceFamilies: [.pad]))
            ]
        )
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            path: "Sources",
            exclude: [
                "AppModule/README.md"
            ],
            resources: [
                .process("AppModule/Resources")
            ],
            swiftSettings: [
                .define("DEBUG", .when(configuration: .debug))
            ]
        )
    ]
)
