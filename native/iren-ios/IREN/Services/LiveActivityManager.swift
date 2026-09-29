import ActivityKit
import Combine
import Foundation

@MainActor
final class LiveActivityManager: ObservableObject {
    @Published private(set) var activityID: String?
    @Published private(set) var isActive = !Activity<RHENActivityAttributes>.activities.isEmpty
    @Published private(set) var pushTokenHex: String? = RHENFeedStore.liveActivityPushToken()
    @Published private(set) var pushRegistered = false
    @Published private(set) var lastError: String?

    private var tokenTask: Task<Void, Never>?

    func startOrUpdate(using snapshot: RHENWidgetSnapshot, accessToken: String?) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            lastError = "Live Activities are disabled for IREN in Settings."
            return
        }

        if let activity = Activity<RHENActivityAttributes>.activities.first {
            await updateActivity(activity, snapshot: snapshot)
            observePushToken(for: activity, accessToken: accessToken)
            return
        }

        do {
            let attributes = RHENActivityAttributes(
                systemName: "IREN",
                moduleName: "RHEN",
                sessionID: UUID().uuidString
            )
            let activity = try Activity.request(
                attributes: attributes,
                content: ActivityContent(
                    state: RHENActivityAttributes.ContentState(snapshot: snapshot),
                    staleDate: Date().addingTimeInterval(180)
                ),
                pushType: .token
            )
            activityID = activity.id
            isActive = true
            lastError = nil
            observePushToken(for: activity, accessToken: accessToken)
        } catch {
            lastError = error.localizedDescription
        }
    }

    func update(using snapshot: RHENWidgetSnapshot) async {
        guard let activity = Activity<RHENActivityAttributes>.activities.first else {
            isActive = false
            activityID = nil
            return
        }
        await updateActivity(activity, snapshot: snapshot)
    }

    func registerCurrentPushToken(accessToken: String?) async {
        guard let token = pushTokenHex,
              let activity = Activity<RHENActivityAttributes>.activities.first,
              let accessToken else { return }
        do {
            let result = try await RHENAPI.registerLiveActivityToken(
                pushToken: token,
                activityID: activity.id,
                accessToken: accessToken
            )
            pushRegistered = result.remotePushConfigured == true
            lastError = pushRegistered ? nil : "Token registered. Remote APNs delivery will activate when Apple signing credentials are installed on RHEN."
        } catch {
            pushRegistered = false
            lastError = "Live Activity is local-only until server push registration is available: \(error.localizedDescription)"
        }
    }

    func end(using snapshot: RHENWidgetSnapshot, accessToken: String?) async {
        let final = RHENActivityAttributes.ContentState(snapshot: snapshot)
        for activity in Activity<RHENActivityAttributes>.activities {
            if let accessToken {
                try? await RHENAPI.deactivateLiveActivity(
                    activityID: activity.id,
                    accessToken: accessToken
                )
            }
            await activity.end(
                ActivityContent(state: final, staleDate: nil),
                dismissalPolicy: .immediate
            )
        }
        tokenTask?.cancel()
        tokenTask = nil
        isActive = false
        activityID = nil
        pushRegistered = false
    }

    private func updateActivity(_ activity: Activity<RHENActivityAttributes>, snapshot: RHENWidgetSnapshot) async {
        await activity.update(
            ActivityContent(
                state: RHENActivityAttributes.ContentState(snapshot: snapshot),
                staleDate: Date().addingTimeInterval(180)
            )
        )
        activityID = activity.id
        isActive = true
    }

    private func observePushToken(for activity: Activity<RHENActivityAttributes>, accessToken: String?) {
        if tokenTask != nil { return }
        tokenTask = Task { [weak self] in
            for await token in activity.pushTokenUpdates {
                guard !Task.isCancelled else { break }
                let hex = token.map { String(format: "%02x", $0) }.joined()
                RHENFeedStore.saveLiveActivityPushToken(hex)
                await MainActor.run {
                    self?.pushTokenHex = hex
                }
                if let accessToken {
                    do {
                        let result = try await RHENAPI.registerLiveActivityToken(
                            pushToken: hex,
                            activityID: activity.id,
                            accessToken: accessToken
                        )
                        await MainActor.run {
                            self?.pushRegistered = result.remotePushConfigured == true
                            self?.lastError = self?.pushRegistered == true
                                ? nil
                                : "Push token registered; APNs delivery is waiting for Apple server credentials."
                        }
                    } catch {
                        await MainActor.run {
                            self?.pushRegistered = false
                            self?.lastError = "Push token captured; remote updates are waiting for backend APNs activation."
                        }
                    }
                }
            }
        }
    }
}
