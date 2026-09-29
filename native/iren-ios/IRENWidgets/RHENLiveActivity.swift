import ActivityKit
import SwiftUI
import WidgetKit

struct RHENLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RHENActivityAttributes.self) { context in
            VStack(alignment: .leading, spacing: 9) {
                HStack(spacing: 8) {
                    RHENMark().frame(width: 28, height: 24)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("IREN / RHEN")
                            .font(.caption2.weight(.bold))
                            .tracking(1.2)
                            .foregroundStyle(IRENBrand.muted)
                        Text(context.state.systemState + "  /  " + context.state.marketState)
                            .font(.caption.weight(.semibold))
                    }
                    Spacer()
                    Text(context.state.accountReturnPct.signedPercentText)
                        .font(.title3.weight(.semibold).monospacedDigit())
                }

                RHENSparkline(points: context.state.performancePoints, lineWidth: 1.8)
                    .frame(height: 42)

                HStack(spacing: 14) {
                    Label("\(context.state.openPositions) positions", systemImage: "chart.bar.doc.horizontal")
                        .privacySensitive()
                    Label("\(context.state.pendingOrders) orders", systemImage: "arrow.left.arrow.right")
                        .privacySensitive()
                    Spacer()
                    if context.state.errors2h > 0 {
                        Label("\(context.state.errors2h)", systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                    }
                }
                .font(.caption2.weight(.semibold))
                .foregroundStyle(IRENBrand.muted)

                VStack(alignment: .leading, spacing: 3) {
                    ForEach(context.state.latestActivity.prefix(2)) { item in
                        HStack(spacing: 6) {
                            Text(item.kind)
                                .font(.system(size: 8, weight: .bold))
                                .tracking(0.7)
                                .foregroundStyle(IRENBrand.luminance)
                            Text(item.headline)
                                .font(.caption2.weight(.medium))
                                .lineLimit(1)
                            Spacer(minLength: 0)
                        }
                        .privacySensitive(item.isPrivate)
                    }
                }
            }
            .padding(.vertical, 5)
            .widgetURL(URL(string: "iren://rhen/live"))
            .activityBackgroundTint(IRENBrand.deepSpace)
            .activitySystemActionForegroundColor(IRENBrand.text)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 5) {
                        RHENMark().frame(width: 24, height: 21)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("RHEN").font(.caption.weight(.bold)).tracking(1)
                            Text(context.state.systemState).font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(context.state.accountReturnPct.signedPercentText)
                            .font(.headline.monospacedDigit())
                        Text(context.state.marketState)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    RHENSparkline(points: context.state.performancePoints, lineWidth: 1.4)
                        .frame(height: 26)
                        .padding(.horizontal, 6)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 5) {
                        HStack {
                            Label("\(context.state.openPositions) pos", systemImage: "chart.bar.doc.horizontal")
                                .privacySensitive()
                            Spacer()
                            Label("\(context.state.pendingOrders) ord", systemImage: "arrow.left.arrow.right")
                                .privacySensitive()
                            Spacer()
                            Label("\(context.state.errors2h) err", systemImage: "exclamationmark.triangle")
                        }
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                        if let item = context.state.latestActivity.first {
                            Text(item.kind + " / " + item.headline)
                                .font(.caption2.weight(.medium))
                                .lineLimit(1)
                                .privacySensitive(item.isPrivate)
                        }
                    }
                }
            } compactLeading: {
                RHENMark().frame(width: 17, height: 15)
            } compactTrailing: {
                Text(context.state.accountReturnPct.signedPercentText)
                    .font(.caption2.weight(.semibold).monospacedDigit())
            } minimal: {
                Image(systemName: context.state.errors2h > 0 ? "exclamationmark.triangle.fill" : "waveform.path.ecg")
                    .foregroundStyle(context.state.errors2h > 0 ? .orange : IRENBrand.luminance)
            }
            .widgetURL(URL(string: "iren://rhen/live"))
            .keylineTint(IRENBrand.luminance)
        }
    }
}
