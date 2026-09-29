import Foundation

struct RHENFeed: Codable, Sendable {
    let ok: Bool
    let generatedAt: String?
    let source: String?
    let live: Bool?
    let state: String?
    let freshnessSeconds: Double?
    let activeStrategy: ActiveStrategy?
    let telemetry: Telemetry?
    let events: [TelemetryEvent]?
    let operational: Operational?
    let performance: Performance?
    let research: Research?

    enum CodingKeys: String, CodingKey {
        case ok
        case generatedAt = "generated_at"
        case source
        case live
        case state
        case freshnessSeconds = "freshness_seconds"
        case activeStrategy = "active_strategy"
        case telemetry
        case events
        case operational
        case performance
        case research
    }

    struct ActiveStrategy: Codable, Sendable {
        let versionId: String?
        let strategyName: String?
        let environment: String?
        let status: String?
        let activatedAt: String?

        enum CodingKeys: String, CodingKey {
            case versionId = "version_id"
            case strategyName = "strategy_name"
            case environment
            case status
            case activatedAt = "activated_at"
        }
    }

    struct Telemetry: Codable, Sendable {
        let events60m: Int?
        let scanEvents10m: Int?
        let symbols10m: Int?
        let executionEvents2h: Int?
        let reconciliations2h: Int?
        let errors2h: Int?

        enum CodingKeys: String, CodingKey {
            case events60m = "events_60m"
            case scanEvents10m = "scan_events_10m"
            case symbols10m = "symbols_10m"
            case executionEvents2h = "execution_events_2h"
            case reconciliations2h = "reconciliations_2h"
            case errors2h = "errors_2h"
        }
    }

    struct TelemetryEvent: Codable, Hashable, Sendable, Identifiable {
        let at: String?
        let type: String?
        let kind: String?
        let label: String?

        var id: String { [at, type, kind, label].compactMap { $0 }.joined(separator: "|") }
    }

    struct Operational: Codable, Sendable {
        let latestScan: LatestScan?

        enum CodingKeys: String, CodingKey {
            case latestScan = "latest_scan"
        }
    }

    struct LatestScan: Codable, Sendable {
        let observedAt: String?
        let marketSession: String?
        let cycleOutcome: String?
        let dataStatus: String?
        let degraded: Bool?

        enum CodingKeys: String, CodingKey {
            case observedAt = "observed_at"
            case marketSession = "market_session"
            case cycleOutcome = "cycle_outcome"
            case dataStatus = "data_status"
            case degraded
        }
    }

    struct Performance: Codable, Sendable {
        let status: String?
        let methodologyVersion: String?
        let sampleState: String?
        let tradingSessions: Int?
        let closedTrades: Int?
        let wins: Int?
        let losses: Int?
        let winRatePct: Double?
        let accountReturnPct: Double?
        let realizedReturnPct: Double?
        let maxDrawdownPct: Double?
        let curve: [CurvePoint]?

        enum CodingKeys: String, CodingKey {
            case status
            case methodologyVersion = "methodology_version"
            case sampleState = "sample_state"
            case tradingSessions = "trading_sessions"
            case closedTrades = "closed_trades"
            case wins
            case losses
            case winRatePct = "win_rate_pct"
            case accountReturnPct = "account_return_pct"
            case realizedReturnPct = "realized_return_pct"
            case maxDrawdownPct = "max_drawdown_pct"
            case curve
        }
    }

    struct CurvePoint: Codable, Hashable, Sendable {
        let at: String?
        let returnPct: Double?

        enum CodingKeys: String, CodingKey {
            case at
            case returnPct = "return_pct"
        }
    }

    struct Research: Codable, Sendable {
        let currentFocus: String?
        let currentStatus: String?

        enum CodingKeys: String, CodingKey {
            case currentFocus = "current_focus"
            case currentStatus = "current_status"
        }
    }
}

struct RHENCommandSnapshot: Codable, Sendable {
    let mode: String?
    let market: Market?
    let bot: Bot?
    let positions: [Position]?
    let recentOrders: [Order]?

    enum CodingKeys: String, CodingKey {
        case mode, market, bot, positions
        case recentOrders = "recent_orders"
    }

    struct Market: Codable, Sendable {
        let isOpen: Bool?
        enum CodingKeys: String, CodingKey { case isOpen = "is_open" }
    }

    struct Bot: Codable, Sendable {
        let botArmed: Bool?
        let runtimePaused: Bool?
        let entriesEnabled: Bool?
        let reconciliationSafe: Bool?

        enum CodingKeys: String, CodingKey {
            case botArmed = "bot_armed"
            case runtimePaused = "runtime_paused"
            case entriesEnabled = "entries_enabled"
            case reconciliationSafe = "reconciliation_safe"
        }
    }

    struct Position: Codable, Hashable, Sendable {
        let symbol: String?
        let side: String?
        let unrealizedPLPC: String?

        enum CodingKeys: String, CodingKey {
            case symbol, side
            case unrealizedPLPC = "unrealized_plpc"
        }
    }

    struct Order: Codable, Hashable, Sendable {
        let id: String?
        let symbol: String?
        let side: String?
        let status: String?
        let submittedAt: String?
        let filledAt: String?
        let canceledAt: String?

        enum CodingKeys: String, CodingKey {
            case id, symbol, side, status
            case submittedAt = "submitted_at"
            case filledAt = "filled_at"
            case canceledAt = "canceled_at"
        }
    }
}

struct RHENActivityDigest: Codable, Hashable, Sendable, Identifiable {
    var id: String
    var kind: String
    var headline: String
    var detail: String
    var timestamp: String
    var isPrivate: Bool
}

struct RHENPositionDigest: Codable, Hashable, Sendable, Identifiable {
    var id: String { symbol }
    var symbol: String
    var side: String
    var unrealizedPct: Double?
}

struct RHENWidgetSnapshot: Codable, Hashable, Sendable {
    var state: String
    var live: Bool
    var marketState: String
    var freshnessSeconds: Double?
    var accountReturnPct: Double?
    var realizedReturnPct: Double?
    var maxDrawdownPct: Double?
    var performancePoints: [Double]
    var events60m: Int
    var symbols10m: Int
    var executionEvents2h: Int
    var errors2h: Int
    var openPositions: Int
    var pendingOrders: Int
    var positions: [RHENPositionDigest]
    var activity: [RHENActivityDigest]
    var strategy: String
    var generatedAt: Date
    var hasPrivateDetail: Bool

    static let placeholder = RHENWidgetSnapshot(
        state: "CONNECTING",
        live: false,
        marketState: "UNKNOWN",
        freshnessSeconds: nil,
        accountReturnPct: nil,
        realizedReturnPct: nil,
        maxDrawdownPct: nil,
        performancePoints: [0, 0, 0, 0, 0, 0, 0, 0],
        events60m: 0,
        symbols10m: 0,
        executionEvents2h: 0,
        errors2h: 0,
        openPositions: 0,
        pendingOrders: 0,
        positions: [],
        activity: [RHENActivityDigest(id: "waiting", kind: "SYSTEM", headline: "Waiting for RHEN", detail: "Telemetry has not arrived yet.", timestamp: "", isPrivate: false)],
        strategy: "RHEN",
        generatedAt: Date(),
        hasPrivateDetail: false
    )

    init(feed: RHENFeed, privateSnapshot: RHENCommandSnapshot? = nil) {
        state = feed.state ?? ((feed.live ?? false) ? "RUNNING" : "UNKNOWN")
        live = feed.live ?? false
        freshnessSeconds = feed.freshnessSeconds
        accountReturnPct = feed.performance?.accountReturnPct
        realizedReturnPct = feed.performance?.realizedReturnPct
        maxDrawdownPct = feed.performance?.maxDrawdownPct
        performancePoints = Self.compactCurve(feed.performance?.curve ?? [])
        events60m = feed.telemetry?.events60m ?? 0
        symbols10m = feed.telemetry?.symbols10m ?? 0
        executionEvents2h = feed.telemetry?.executionEvents2h ?? 0
        errors2h = feed.telemetry?.errors2h ?? 0
        strategy = feed.activeStrategy?.strategyName ?? "RHEN"
        generatedAt = ISO8601DateFormatter().date(from: feed.generatedAt ?? "") ?? Date()

        if let privateSnapshot {
            marketState = privateSnapshot.market?.isOpen == true ? "OPEN" : "CLOSED"
            let commandPositions = privateSnapshot.positions ?? []
            positions = commandPositions.prefix(3).map {
                RHENPositionDigest(
                    symbol: $0.symbol ?? "--",
                    side: ($0.side ?? "").uppercased(),
                    unrealizedPct: Self.decimalFractionToPercent($0.unrealizedPLPC)
                )
            }
            openPositions = commandPositions.count
            let orders = privateSnapshot.recentOrders ?? []
            let pending = orders.filter { Self.isPendingOrderStatus($0.status) }
            pendingOrders = pending.count
            let orderActivity = orders.prefix(3).map { order in
                RHENActivityDigest(
                    id: order.id ?? UUID().uuidString,
                    kind: "ORDER",
                    headline: [order.side?.uppercased(), order.symbol].compactMap { $0 }.joined(separator: " "),
                    detail: (order.status ?? "updated").replacingOccurrences(of: "_", with: " ").uppercased(),
                    timestamp: order.filledAt ?? order.canceledAt ?? order.submittedAt ?? "",
                    isPrivate: true
                )
            }
            let publicActivity = Self.publicActivity(feed.events ?? [])
            activity = Array((orderActivity + publicActivity).prefix(4))
            hasPrivateDetail = true
        } else {
            marketState = (feed.operational?.latestScan?.marketSession ?? "UNKNOWN").uppercased()
            openPositions = 0
            pendingOrders = 0
            positions = []
            activity = Self.publicActivity(feed.events ?? [])
            hasPrivateDetail = false
        }

        if activity.isEmpty {
            activity = [RHENActivityDigest(id: "idle", kind: "SYSTEM", headline: state, detail: "No recent RHEN activity.", timestamp: feed.generatedAt ?? "", isPrivate: false)]
        }
    }

    private static func compactCurve(_ curve: [RHENFeed.CurvePoint]) -> [Double] {
        let values = curve.compactMap(\.returnPct)
        guard values.count > 32 else { return values.isEmpty ? [0] : values }
        let step = Double(values.count - 1) / 31.0
        return (0..<32).map { index in values[min(Int((Double(index) * step).rounded()), values.count - 1)] }
    }

    private static func publicActivity(_ events: [RHENFeed.TelemetryEvent]) -> [RHENActivityDigest] {
        events.prefix(4).map { event in
            RHENActivityDigest(
                id: event.id,
                kind: (event.type ?? event.kind ?? "EVENT").uppercased(),
                headline: event.label ?? "RHEN event",
                detail: (event.kind ?? "system").uppercased(),
                timestamp: event.at ?? "",
                isPrivate: false
            )
        }
    }

    private static func decimalFractionToPercent(_ raw: String?) -> Double? {
        guard let raw, let value = Double(raw) else { return nil }
        return value * 100
    }

    private static func isPendingOrderStatus(_ raw: String?) -> Bool {
        let status = (raw ?? "").lowercased()
        return ["new", "accepted", "pending_new", "partially_filled", "held", "pending_replace", "accepted_for_bidding"].contains(status)
    }
}

extension Optional where Wrapped == Double {
    var signedPercentText: String {
        guard let value = self else { return "--" }
        return String(format: "%@%.2f%%", value > 0 ? "+" : "", value)
    }
}
