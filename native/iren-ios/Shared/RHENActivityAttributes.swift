import ActivityKit
import Foundation
import SwiftUI

struct RHENActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var systemState: String
        var marketState: String
        var accountReturnPct: Double?
        var drawdownPct: Double?
        var performancePoints: [Double]
        var openPositions: Int
        var pendingOrders: Int
        var errors2h: Int
        var latestActivity: [RHENActivityDigest]
        var updatedAt: Date
    }

    var systemName: String
    var moduleName: String
    var sessionID: String
}

extension RHENActivityAttributes.ContentState {
    init(snapshot: RHENWidgetSnapshot) {
        systemState = snapshot.state
        marketState = snapshot.marketState
        accountReturnPct = snapshot.accountReturnPct
        drawdownPct = snapshot.maxDrawdownPct
        performancePoints = Array(snapshot.performancePoints.suffix(24))
        openPositions = snapshot.openPositions
        pendingOrders = snapshot.pendingOrders
        errors2h = snapshot.errors2h
        latestActivity = Array(snapshot.activity.prefix(3))
        updatedAt = snapshot.generatedAt
    }
}

enum IRENBrand {
    static let deepSpace = Color(red: 10 / 255, green: 18 / 255, blue: 36 / 255)
    static let navy = Color(red: 15 / 255, green: 39 / 255, blue: 74 / 255)
    static let electric = Color(red: 30 / 255, green: 79 / 255, blue: 167 / 255)
    static let luminance = Color(red: 111 / 255, green: 209 / 255, blue: 255 / 255)
    static let text = Color(red: 201 / 255, green: 215 / 255, blue: 234 / 255)
    static let muted = Color(red: 107 / 255, green: 123 / 255, blue: 147 / 255)
    static let panel = Color(red: 14 / 255, green: 22 / 255, blue: 38 / 255)
}

struct ANEVUMMark: View {
    var lineWidth: CGFloat = 1.2

    var body: some View {
        GeometryReader { proxy in
            let s = min(proxy.size.width, proxy.size.height) / 100
            ZStack {
                Path { path in
                    path.addEllipse(in: CGRect(x: 4 * s, y: 4 * s, width: 92 * s, height: 92 * s))
                    path.move(to: CGPoint(x: 50 * s, y: 14 * s))
                    path.addCurve(to: CGPoint(x: 20 * s, y: 78 * s), control1: CGPoint(x: 47 * s, y: 34 * s), control2: CGPoint(x: 39 * s, y: 58 * s))
                    path.move(to: CGPoint(x: 50 * s, y: 14 * s))
                    path.addCurve(to: CGPoint(x: 80 * s, y: 78 * s), control1: CGPoint(x: 53 * s, y: 34 * s), control2: CGPoint(x: 61 * s, y: 58 * s))
                    path.move(to: CGPoint(x: 50 * s, y: 31 * s))
                    path.addCurve(to: CGPoint(x: 33 * s, y: 69 * s), control1: CGPoint(x: 45 * s, y: 49 * s), control2: CGPoint(x: 40 * s, y: 62 * s))
                    path.move(to: CGPoint(x: 50 * s, y: 31 * s))
                    path.addCurve(to: CGPoint(x: 67 * s, y: 69 * s), control1: CGPoint(x: 55 * s, y: 49 * s), control2: CGPoint(x: 60 * s, y: 62 * s))
                    path.move(to: CGPoint(x: 50 * s, y: 52 * s))
                    path.addLine(to: CGPoint(x: 50 * s, y: 78 * s))
                }
                .stroke(IRENBrand.text, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))

                Circle()
                    .fill(IRENBrand.text)
                    .frame(width: 9.6 * s, height: 9.6 * s)
                    .position(x: 50 * s, y: 81 * s)
            }
        }
        .aspectRatio(1, contentMode: .fit)
    }
}

struct RHENMark: View {
    var lineWidth: CGFloat = 1.15

    var body: some View {
        GeometryReader { proxy in
            let sx = proxy.size.width / 120
            let sy = proxy.size.height / 104
            ZStack {
                Path { path in
                    path.move(to: CGPoint(x: 17 * sx, y: 70 * sy))
                    path.addCurve(to: CGPoint(x: 103 * sx, y: 70 * sy), control1: CGPoint(x: 17 * sx, y: 37 * sy), control2: CGPoint(x: 35 * sx, y: 15 * sy))
                    path.move(to: CGPoint(x: 60 * sx, y: 3 * sy))
                    path.addLine(to: CGPoint(x: 60 * sx, y: 94 * sy))
                    path.move(to: CGPoint(x: 60 * sx, y: 35 * sy))
                    path.addCurve(to: CGPoint(x: 33 * sx, y: 88 * sy), control1: CGPoint(x: 59 * sx, y: 57 * sy), control2: CGPoint(x: 51 * sx, y: 74 * sy))
                    path.move(to: CGPoint(x: 60 * sx, y: 35 * sy))
                    path.addCurve(to: CGPoint(x: 87 * sx, y: 88 * sy), control1: CGPoint(x: 61 * sx, y: 57 * sy), control2: CGPoint(x: 69 * sx, y: 74 * sy))
                    path.move(to: CGPoint(x: 60 * sx, y: 45 * sy))
                    path.addCurve(to: CGPoint(x: 50 * sx, y: 88 * sy), control1: CGPoint(x: 58 * sx, y: 66 * sy), control2: CGPoint(x: 55 * sx, y: 79 * sy))
                    path.move(to: CGPoint(x: 60 * sx, y: 45 * sy))
                    path.addCurve(to: CGPoint(x: 70 * sx, y: 88 * sy), control1: CGPoint(x: 62 * sx, y: 66 * sy), control2: CGPoint(x: 65 * sx, y: 79 * sy))
                    path.move(to: CGPoint(x: 5 * sx, y: 92 * sy))
                    path.addQuadCurve(to: CGPoint(x: 115 * sx, y: 92 * sy), control: CGPoint(x: 60 * sx, y: 78 * sy))
                    path.move(to: CGPoint(x: 60 * sx, y: 8 * sy))
                    path.addLine(to: CGPoint(x: 60 * sx, y: 22 * sy))
                    path.move(to: CGPoint(x: 53 * sx, y: 15 * sy))
                    path.addLine(to: CGPoint(x: 67 * sx, y: 15 * sy))
                }
                .stroke(IRENBrand.luminance, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
            }
        }
        .aspectRatio(120.0 / 104.0, contentMode: .fit)
    }
}

struct RHENSparkline: View {
    var points: [Double]
    var lineWidth: CGFloat = 1.5

    var body: some View {
        GeometryReader { proxy in
            let values = points.isEmpty ? [0] : points
            let minValue = values.min() ?? 0
            let maxValue = values.max() ?? 0
            let spread = max(maxValue - minValue, 0.0001)
            Path { path in
                for (index, value) in values.enumerated() {
                    let x = values.count <= 1 ? 0 : proxy.size.width * CGFloat(index) / CGFloat(values.count - 1)
                    let normalized = (value - minValue) / spread
                    let y = proxy.size.height - (proxy.size.height * CGFloat(normalized))
                    if index == 0 { path.move(to: CGPoint(x: x, y: y)) }
                    else { path.addLine(to: CGPoint(x: x, y: y)) }
                }
            }
            .stroke(IRENBrand.luminance, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
        }
        .accessibilityHidden(true)
    }
}
