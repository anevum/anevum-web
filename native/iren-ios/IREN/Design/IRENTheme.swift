import SwiftUI

extension Color {
    static let irenDeepSpace = IRENBrand.deepSpace
    static let irenNavy = IRENBrand.navy
    static let irenElectric = IRENBrand.electric
    static let irenLuminance = IRENBrand.luminance
    static let irenText = IRENBrand.text
    static let irenMuted = IRENBrand.muted
    static let irenPanel = IRENBrand.panel
}

struct IRENBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.black, .irenDeepSpace, Color(red: 0.02, green: 0.035, blue: 0.065)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(
                colors: [.irenElectric.opacity(0.20), .clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 430
            )
            RadialGradient(
                colors: [.irenLuminance.opacity(0.07), .clear],
                center: .bottomLeading,
                startRadius: 10,
                endRadius: 360
            )
        }
        .ignoresSafeArea()
    }
}

struct IRENPanelModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(.irenPanel.opacity(0.82), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(.irenLuminance.opacity(0.10), lineWidth: 1)
            }
    }
}

extension View {
    func irenPanel() -> some View { modifier(IRENPanelModifier()) }
}

func rhenStateColor(_ state: String, errors: Int = 0) -> Color {
    if errors > 0 { return .orange }
    let normalized = state.lowercased()
    if normalized.contains("run") || normalized.contains("active") || normalized.contains("open") { return .green }
    if normalized.contains("error") || normalized.contains("fail") || normalized.contains("offline") { return .red }
    return .irenLuminance
}
