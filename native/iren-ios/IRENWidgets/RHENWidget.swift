import SwiftUI
import WidgetKit

struct RHENTimelineEntry: TimelineEntry {
    let date: Date
    let snapshot: RHENWidgetSnapshot
}

struct RHENProvider: TimelineProvider {
    func placeholder(in context: Context) -> RHENTimelineEntry {
        RHENTimelineEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (RHENTimelineEntry) -> Void) {
        completion(RHENTimelineEntry(date: Date(), snapshot: RHENFeedStore.load() ?? .placeholder))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RHENTimelineEntry>) -> Void) {
        Task {
            let snapshot = (try? await WidgetFeedLoader.fetch()) ?? RHENFeedStore.load() ?? .placeholder
            RHENFeedStore.save(snapshot)
            completion(Timeline(
                entries: [RHENTimelineEntry(date: Date(), snapshot: snapshot)],
                policy: .after(Date().addingTimeInterval(5 * 60))
            ))
        }
    }
}

private enum WidgetFeedLoader {
    static func fetch() async throws -> RHENWidgetSnapshot {
        var request = URLRequest(url: URL(string: "https://anevum.com/api/public/trading/live")!)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 12
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        let feed = try JSONDecoder().decode(RHENFeed.self, from: data)
        var next = RHENWidgetSnapshot(feed: feed)

        if let cached = RHENFeedStore.load(),
           cached.hasPrivateDetail,
           Date().timeIntervalSince(cached.generatedAt) < 15 * 60 {
            next.openPositions = cached.openPositions
            next.pendingOrders = cached.pendingOrders
            next.positions = cached.positions
            let privateRows = cached.activity.filter(\.isPrivate)
            next.activity = Array((privateRows + next.activity).prefix(4))
            next.hasPrivateDetail = true
        }
        return next
    }
}

struct RHENStatusWidget: Widget {
    let kind = "RHENStatusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RHENProvider()) { entry in
            RHENWidgetView(entry: entry)
                .widgetURL(URL(string: "iren://rhen/live"))
        }
        .configurationDisplayName("RHEN Live")
        .description("Live RHEN performance, market state, positions, orders and recent activity.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryRectangular])
        .contentMarginsDisabled()
    }
}

private struct RHENWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: RHENTimelineEntry

    var body: some View {
        switch family {
        case .accessoryInline:
            inline
        case .accessoryRectangular:
            rectangular
        case .systemSmall:
            small
        default:
            medium
        }
    }

    private var inline: some View {
        Label {
            Text("RHEN \(entry.snapshot.state)  \(entry.snapshot.accountReturnPct.signedPercentText)")
        } icon: {
            Image(systemName: entry.snapshot.errors2h > 0 ? "exclamationmark.triangle.fill" : "waveform.path.ecg")
        }
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 6) {
                RHENMark()
                    .frame(width: 17, height: 15)
                    .widgetAccentable()
                Text("RHEN")
                    .font(.caption2.weight(.bold))
                    .tracking(1.1)
                Text(entry.snapshot.state)
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                Text(entry.snapshot.accountReturnPct.signedPercentText)
                    .font(.caption.weight(.semibold).monospacedDigit())
            }

            RHENSparkline(points: entry.snapshot.performancePoints, lineWidth: 1.25)
                .frame(height: 15)
                .widgetAccentable()

            HStack(spacing: 8) {
                Text(entry.snapshot.marketState)
                Label("\(entry.snapshot.openPositions)", systemImage: "chart.bar.doc.horizontal")
                    .privacySensitive(entry.snapshot.hasPrivateDetail)
                Label("\(entry.snapshot.pendingOrders)", systemImage: "arrow.left.arrow.right")
                    .privacySensitive(entry.snapshot.hasPrivateDetail)
                Spacer(minLength: 2)
            }
            .font(.system(size: 8, weight: .semibold))
            .foregroundStyle(.secondary)

            if let latest = entry.snapshot.activity.first {
                Text(latest.kind + "  " + latest.headline)
                    .font(.system(size: 8, weight: .medium))
                    .lineLimit(1)
                    .privacySensitive(latest.isPrivate)
            }
        }
        .containerBackground(.clear, for: .widget)
    }

    private var small: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 8) {
                RHENMark().frame(width: 28, height: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text("RHEN").font(.caption.weight(.bold)).tracking(1.5)
                    Text(entry.snapshot.state).font(.system(size: 9, weight: .semibold)).foregroundStyle(.secondary)
                }
                Spacer()
            }

            Text(entry.snapshot.accountReturnPct.signedPercentText)
                .font(.system(size: 29, weight: .semibold, design: .rounded))
                .monospacedDigit()

            RHENSparkline(points: entry.snapshot.performancePoints, lineWidth: 1.8)
                .frame(height: 37)

            HStack {
                Label("\(entry.snapshot.openPositions)", systemImage: "chart.bar.doc.horizontal")
                Spacer()
                Label("\(entry.snapshot.pendingOrders)", systemImage: "arrow.left.arrow.right")
                Spacer()
                Label("\(entry.snapshot.errors2h)", systemImage: "exclamationmark.triangle")
            }
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .padding(14)
        .containerBackground(for: .widget) {
            LinearGradient(
                colors: [IRENBrand.deepSpace, IRENBrand.navy.opacity(0.92)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var medium: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    RHENMark().frame(width: 30, height: 26)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("IREN / RHEN").font(.caption2.weight(.bold)).tracking(1.2)
                        Text(entry.snapshot.state + "  /  " + entry.snapshot.marketState)
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                }
                Text(entry.snapshot.accountReturnPct.signedPercentText)
                    .font(.system(size: 30, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                RHENSparkline(points: entry.snapshot.performancePoints, lineWidth: 1.8)
                    .frame(height: 42)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Rectangle().fill(.white.opacity(0.08)).frame(width: 1)

            VStack(alignment: .leading, spacing: 7) {
                metric("POSITIONS", "\(entry.snapshot.openPositions)", privateData: entry.snapshot.hasPrivateDetail)
                metric("PENDING ORDERS", "\(entry.snapshot.pendingOrders)", privateData: entry.snapshot.hasPrivateDetail)
                metric("EVENTS / 60M", "\(entry.snapshot.events60m)", privateData: false)
                if let latest = entry.snapshot.activity.first {
                    Text(latest.kind + " / " + latest.headline)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .privacySensitive(latest.isPrivate)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .containerBackground(for: .widget) {
            LinearGradient(
                colors: [IRENBrand.deepSpace, IRENBrand.navy.opacity(0.92)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private func metric(_ label: String, _ value: String, privateData: Bool) -> some View {
        HStack {
            Text(label).font(.system(size: 8, weight: .semibold)).foregroundStyle(.secondary)
            Spacer()
            Text(value).font(.caption2.weight(.bold).monospacedDigit())
        }
        .privacySensitive(privateData)
    }
}
