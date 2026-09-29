import SwiftUI

@main
struct IRENApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    guard url.scheme == "iren" else { return }
                }
        }
    }
}
