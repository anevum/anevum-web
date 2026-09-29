import Foundation

struct RHENFeedStore {
    static let appGroup = "group.com.anevum.iren"
    private static let snapshotKey = "rhen.widget.snapshot.v2"
    private static let liveActivityTokenKey = "rhen.live-activity.token.v1"

    static func save(_ snapshot: RHENWidgetSnapshot) {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults.set(data, forKey: snapshotKey)
    }

    static func load() -> RHENWidgetSnapshot? {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.data(forKey: snapshotKey),
              let snapshot = try? JSONDecoder().decode(RHENWidgetSnapshot.self, from: data) else {
            return nil
        }
        return snapshot
    }

    static func saveLiveActivityPushToken(_ token: String) {
        UserDefaults(suiteName: appGroup)?.set(token, forKey: liveActivityTokenKey)
    }

    static func liveActivityPushToken() -> String? {
        UserDefaults(suiteName: appGroup)?.string(forKey: liveActivityTokenKey)
    }
}
