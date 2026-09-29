import Combine
import Foundation
import WidgetKit

@MainActor
final class RHENFeedViewModel: ObservableObject {
    @Published private(set) var snapshot: RHENWidgetSnapshot = RHENFeedStore.load() ?? .placeholder
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var session: RHENLinkSession?
    @Published private(set) var lastRefresh = Date.distantPast

    private var pollingTask: Task<Void, Never>?

    var isAuthenticated: Bool { session != nil }
    var accessToken: String? { session?.accessToken }
    var authenticatedEmail: String { session?.email ?? "" }

    func start() {
        guard pollingTask == nil else { return }
        pollingTask = Task { [weak self] in
            guard let self else { return }
            await restoreSession()
            while !Task.isCancelled {
                await refresh()
                try? await Task.sleep(for: .seconds(5))
            }
        }
    }

    func stop() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }

        do {
            if let valid = try await RHENAuthClient.shared.validSession() {
                session = valid
            }
        } catch {
            session = nil
        }

        do {
            let next = try await RHENAPI.fetchSnapshot(accessToken: session?.accessToken)
            snapshot = next
            RHENFeedStore.save(next)
            WidgetCenter.shared.reloadAllTimelines()
            lastRefresh = Date()
            errorMessage = nil
        } catch {
            do {
                let publicOnly = try await RHENAPI.fetchSnapshot()
                snapshot = publicOnly
                RHENFeedStore.save(publicOnly)
                WidgetCenter.shared.reloadAllTimelines()
                lastRefresh = Date()
                errorMessage = session == nil ? nil : "Private RHEN detail is temporarily unavailable."
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func signIn(email: String, password: String) async throws {
        session = try await RHENAuthClient.shared.signIn(email: email, password: password)
        await refresh()
    }

    func signOut() async {
        await RHENAuthClient.shared.signOut()
        session = nil
        await refresh()
    }

    private func restoreSession() async {
        do {
            session = try await RHENAuthClient.shared.validSession()
        } catch {
            session = nil
        }
    }
}
