import Foundation
import Security

struct RHENLinkSession: Codable, Sendable {
    var accessToken: String
    var refreshToken: String
    var expiresAt: Date
    var email: String

    var needsRefresh: Bool { expiresAt.timeIntervalSinceNow < 90 }
}

enum RHENAPIError: LocalizedError {
    case badResponse(Int)
    case invalidPayload
    case authentication(String)

    var errorDescription: String? {
        switch self {
        case .badResponse(let status): return "RHEN returned HTTP \(status)."
        case .invalidPayload: return "RHEN returned an unreadable payload."
        case .authentication(let message): return message
        }
    }
}

enum RHENAPI {
    static let publicFeedURL = URL(string: "https://anevum.com/api/public/trading/live")!
    static let commandStatusURL = URL(string: "https://anevum.com/api/command/trader/status")!
    static let mobileRegistrationURL = URL(string: "https://anevum.com/api/command/trader/mobile/live-activity-token")!

    static func fetchPublicFeed() async throws -> RHENFeed {
        var request = URLRequest(url: publicFeedURL)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 12
        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response)
        return try JSONDecoder().decode(RHENFeed.self, from: data)
    }

    static func fetchCommandSnapshot(accessToken: String) async throws -> RHENCommandSnapshot {
        var request = URLRequest(url: commandStatusURL)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 12
        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response)
        return try JSONDecoder().decode(RHENCommandSnapshot.self, from: data)
    }

    static func fetchSnapshot(accessToken: String? = nil) async throws -> RHENWidgetSnapshot {
        async let publicFeedTask = fetchPublicFeed()
        if let accessToken {
            async let privateStatusTask = fetchCommandSnapshot(accessToken: accessToken)
            let feed = try await publicFeedTask
            let privateStatus = try await privateStatusTask
            return RHENWidgetSnapshot(feed: feed, privateSnapshot: privateStatus)
        }
        let feed = try await publicFeedTask
        return RHENWidgetSnapshot(feed: feed)
    }

    static func registerLiveActivityToken(
        pushToken: String,
        activityID: String,
        accessToken: String
    ) async throws {
        var request = URLRequest(url: mobileRegistrationURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "push_token": pushToken,
            "activity_id": activityID,
            "platform": "ios",
            "surface": "rhen_live_activity"
        ])
        request.timeoutInterval = 12
        let (_, response) = try await URLSession.shared.data(for: request)
        try validate(response)
    }

    private static func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw RHENAPIError.invalidPayload }
        guard (200..<300).contains(http.statusCode) else { throw RHENAPIError.badResponse(http.statusCode) }
    }
}

actor RHENAuthClient {
    static let shared = RHENAuthClient()

    private let baseURL = URL(string: "https://mfntzxheldzdvlokyntk.supabase.co")!
    private let publishableKey = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae"
    private let keychain = IRENKeychain(service: "com.anevum.iren.rhenlink")

    func storedSession() -> RHENLinkSession? {
        guard let data = keychain.data(account: "session") else { return nil }
        return try? JSONDecoder().decode(RHENLinkSession.self, from: data)
    }

    func signIn(email: String, password: String) async throws -> RHENLinkSession {
        let url = baseURL.appending(path: "/auth/v1/token").appending(queryItems: [URLQueryItem(name: "grant_type", value: "password")])
        let payload: [String: Any] = ["email": email, "password": password]
        let response: AuthResponse = try await authRequest(url: url, payload: payload)
        let session = response.session(fallbackEmail: email)
        try save(session)
        return session
    }

    func validSession() async throws -> RHENLinkSession? {
        guard let session = storedSession() else { return nil }
        if !session.needsRefresh { return session }
        return try await refresh(session)
    }

    func refresh(_ session: RHENLinkSession) async throws -> RHENLinkSession {
        let url = baseURL.appending(path: "/auth/v1/token").appending(queryItems: [URLQueryItem(name: "grant_type", value: "refresh_token")])
        let response: AuthResponse = try await authRequest(url: url, payload: ["refresh_token": session.refreshToken])
        let refreshed = response.session(fallbackEmail: session.email)
        try save(refreshed)
        return refreshed
    }

    func signOut() {
        keychain.delete(account: "session")
    }

    private func save(_ session: RHENLinkSession) throws {
        let data = try JSONEncoder().encode(session)
        try keychain.set(data: data, account: "session")
    }

    private func authRequest<T: Decodable>(url: URL, payload: [String: Any]) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        request.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw RHENAPIError.invalidPayload }
        guard (200..<300).contains(http.statusCode) else {
            let error = try? JSONDecoder().decode(AuthErrorResponse.self, from: data)
            throw RHENAPIError.authentication(error?.message ?? error?.errorDescription ?? "RHENLINK authentication failed.")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private struct AuthResponse: Decodable {
        let accessToken: String
        let refreshToken: String
        let expiresIn: Double
        let user: AuthUser?

        enum CodingKeys: String, CodingKey {
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
            case expiresIn = "expires_in"
            case user
        }

        func session(fallbackEmail: String) -> RHENLinkSession {
            RHENLinkSession(
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: Date().addingTimeInterval(max(expiresIn - 30, 60)),
                email: user?.email ?? fallbackEmail
            )
        }
    }

    private struct AuthUser: Decodable { let email: String? }

    private struct AuthErrorResponse: Decodable {
        let message: String?
        let errorDescription: String?

        enum CodingKeys: String, CodingKey {
            case message
            case errorDescription = "error_description"
        }
    }
}

private struct IRENKeychain {
    let service: String

    func set(data: Data, account: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
        var add = query
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(add as CFDictionary, nil)
        guard status == errSecSuccess else { throw NSError(domain: NSOSStatusErrorDomain, code: Int(status)) }
    }

    func data(account: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess else { return nil }
        return result as? Data
    }

    func delete(account: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}
