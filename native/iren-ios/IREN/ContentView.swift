import SwiftUI

struct ContentView: View {
    @StateObject private var model = RHENFeedViewModel()
    @StateObject private var liveActivity = LiveActivityManager()
    @State private var showSignIn = false

    var body: some View {
        ZStack {
            IRENBackground()
            ScrollView {
                VStack(spacing: 18) {
                    header
                    performanceCard
                    activityCard
                    liveActivityCard
                    accessCard
                    installCard
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
            }
            .refreshable { await model.refresh() }
        }
        .preferredColorScheme(.dark)
        .task { model.start() }
        .onDisappear { model.stop() }
        .onChange(of: model.snapshot) { _, next in
            guard liveActivity.isActive else { return }
            Task { await liveActivity.update(using: next) }
        }
        .onChange(of: model.accessToken) { _, token in
            guard token != nil, liveActivity.isActive else { return }
            Task { await liveActivity.registerCurrentPushToken(accessToken: token) }
        }
        .sheet(isPresented: $showSignIn) {
            RHENLinkSignInSheet(model: model)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            ANEVUMMark()
                .frame(width: 38, height: 38)
            VStack(alignment: .leading, spacing: 2) {
                Text("IREN")
                    .font(.system(size: 20, weight: .semibold, design: .rounded))
                    .tracking(4)
                    .foregroundStyle(Color.irenText)
                Text("ANEVUM NATIVE SURFACE")
                    .font(.caption2.weight(.semibold))
                    .tracking(1.6)
                    .foregroundStyle(Color.irenMuted)
            }
            Spacer()
            Link(destination: URL(string: "https://anevum.com/iren")!) {
                Image(systemName: "arrow.up.right")
                    .font(.headline)
                    .frame(width: 42, height: 42)
                    .background(Color.irenPanel.opacity(0.9), in: Circle())
            }
            .foregroundStyle(Color.irenLuminance)
            .accessibilityLabel("Open full IREN console")
        }
    }

    private var performanceCard: some View {
        VStack(spacing: 14) {
            HStack(alignment: .top) {
                HStack(spacing: 9) {
                    RHENMark()
                        .frame(width: 34, height: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("RHEN")
                            .font(.headline.weight(.semibold))
                            .tracking(2.2)
                        Text(model.snapshot.strategy.replacingOccurrences(of: "_", with: " ").uppercased())
                            .font(.caption2)
                            .foregroundStyle(Color.irenMuted)
                            .lineLimit(1)
                    }
                }
                Spacer()
                statusPill
            }

            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.snapshot.accountReturnPct.signedPercentText)
                        .font(.system(size: 42, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                    Text("NORMALIZED TRACKED RETURN")
                        .font(.caption2.weight(.semibold))
                        .tracking(1.25)
                        .foregroundStyle(Color.irenMuted)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 5) {
                    metric("MARKET", model.snapshot.marketState)
                    metric("DRAWDOWN", model.snapshot.maxDrawdownPct.signedPercentText)
                }
            }

            RHENSparkline(points: model.snapshot.performancePoints, lineWidth: 2.2)
                .frame(height: 82)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(Color.irenLuminance.opacity(0.08)).frame(height: 1)
                }

            HStack(spacing: 8) {
                smallStat("POSITIONS", "\(model.snapshot.openPositions)")
                smallStat("ORDERS", "\(model.snapshot.pendingOrders)")
                smallStat("EVENTS / 60M", "\(model.snapshot.events60m)")
                smallStat("ERRORS / 2H", "\(model.snapshot.errors2h)")
            }
        }
        .irenPanel()
    }

    private var activityCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("ACTIVITY TAPE")
                        .font(.caption2.weight(.semibold))
                        .tracking(1.4)
                        .foregroundStyle(Color.irenLuminance)
                    Text(model.snapshot.hasPrivateDetail ? "Orders, positions and RHEN events" : "Public RHEN events")
                        .font(.caption)
                        .foregroundStyle(Color.irenMuted)
                }
                Spacer()
                if model.snapshot.hasPrivateDetail {
                    Image(systemName: "lock.open.fill")
                        .font(.caption)
                        .foregroundStyle(Color.irenLuminance)
                }
            }

            ForEach(model.snapshot.activity.prefix(4)) { item in
                HStack(alignment: .top, spacing: 10) {
                    Circle()
                        .fill(item.kind == "ORDER" ? Color.irenLuminance : Color.irenElectric)
                        .frame(width: 6, height: 6)
                        .padding(.top, 6)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(item.kind)
                                .font(.caption2.weight(.bold))
                                .tracking(1)
                                .foregroundStyle(Color.irenLuminance)
                            if item.isPrivate {
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 8))
                                    .foregroundStyle(Color.irenMuted)
                            }
                            Spacer()
                            if let date = parseISO(item.timestamp) {
                                Text(date, style: .time)
                                    .font(.caption2.monospacedDigit())
                                    .foregroundStyle(Color.irenMuted)
                            }
                        }
                        Text(item.headline)
                            .font(.subheadline.weight(.medium))
                            .lineLimit(2)
                        Text(item.detail)
                            .font(.caption2)
                            .foregroundStyle(Color.irenMuted)
                    }
                }
                if item.id != model.snapshot.activity.prefix(4).last?.id {
                    Divider().overlay(.white.opacity(0.06))
                }
            }
        }
        .irenPanel()
    }

    private var liveActivityCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("LOCK SCREEN LIVE ACTIVITY")
                        .font(.caption2.weight(.semibold))
                        .tracking(1.4)
                        .foregroundStyle(Color.irenLuminance)
                    Text(liveActivity.isActive ? "RHEN is attached to the Lock Screen" : "Start the richer live RHEN surface")
                        .font(.caption)
                        .foregroundStyle(Color.irenMuted)
                }
                Spacer()
                Circle()
                    .fill(liveActivity.isActive ? Color.green : Color.irenMuted)
                    .frame(width: 9, height: 9)
            }

            HStack(spacing: 10) {
                Button {
                    Task {
                        await liveActivity.startOrUpdate(using: model.snapshot, accessToken: model.accessToken)
                    }
                } label: {
                    Label(liveActivity.isActive ? "Update Live Activity" : "Start Live Activity", systemImage: "bolt.horizontal.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.irenElectric)

                if liveActivity.isActive {
                    Button(role: .destructive) {
                        Task { await liveActivity.end(using: model.snapshot, accessToken: model.accessToken) }
                    } label: {
                        Image(systemName: "xmark")
                            .frame(width: 32, height: 32)
                    }
                    .buttonStyle(.bordered)
                }
            }

            HStack {
                Label(liveActivity.pushTokenHex == nil ? "Push token pending" : "Push token captured", systemImage: liveActivity.pushTokenHex == nil ? "antenna.radiowaves.left.and.right.slash" : "antenna.radiowaves.left.and.right")
                Spacer()
                Text(liveActivity.pushRegistered ? "REMOTE READY" : "LOCAL READY")
                    .font(.caption2.weight(.bold))
                    .tracking(1)
            }
            .font(.caption2)
            .foregroundStyle(Color.irenMuted)

            if let error = liveActivity.lastError {
                Text(error)
                    .font(.caption2)
                    .foregroundStyle(.orange)
            }
        }
        .irenPanel()
    }

    private var accessCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("RHENLINK")
                        .font(.caption2.weight(.semibold))
                        .tracking(1.4)
                        .foregroundStyle(Color.irenLuminance)
                    Text(model.isAuthenticated ? "Founder-private order and position detail is enabled" : "Unlock private order and position detail")
                        .font(.caption)
                        .foregroundStyle(Color.irenMuted)
                }
                Spacer()
                Image(systemName: model.isAuthenticated ? "checkmark.shield.fill" : "lock.shield")
                    .foregroundStyle(model.isAuthenticated ? .green : Color.irenMuted)
            }

            if model.isAuthenticated {
                HStack {
                    Text(model.authenticatedEmail)
                        .font(.caption.monospaced())
                        .foregroundStyle(Color.irenText)
                    Spacer()
                    Button("Sign out") { Task { await model.signOut() } }
                        .font(.caption)
                }
            } else {
                Button("Sign in to RHENLINK") { showSignIn = true }
                    .buttonStyle(.bordered)
                    .tint(Color.irenLuminance)
            }
        }
        .irenPanel()
    }

    private var installCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("LOCK SCREEN WIDGET")
                .font(.caption2.weight(.semibold))
                .tracking(1.4)
                .foregroundStyle(Color.irenLuminance)
            Text("After IREN is installed on the device: long-press the Lock Screen, choose Customize, tap the widget area, then select IREN. The rectangular RHEN widget carries the performance sparkline, return, position/order counts and latest activity.")
                .font(.caption)
                .foregroundStyle(Color.irenMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .irenPanel()
    }

    private var statusPill: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(rhenStateColor(model.snapshot.state, errors: model.snapshot.errors2h))
                .frame(width: 7, height: 7)
            Text(model.snapshot.state)
                .font(.caption2.weight(.bold))
                .tracking(1)
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 6)
        .background(.white.opacity(0.05), in: Capsule())
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack(alignment: .trailing, spacing: 1) {
            Text(label).font(.caption2).foregroundStyle(Color.irenMuted)
            Text(value).font(.caption.weight(.semibold).monospacedDigit())
        }
    }

    private func smallStat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.caption.weight(.bold).monospacedDigit())
            Text(label).font(.system(size: 8, weight: .semibold)).foregroundStyle(Color.irenMuted).lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func parseISO(_ raw: String) -> Date? {
        ISO8601DateFormatter().date(from: raw)
    }
}

private struct RHENLinkSignInSheet: View {
    @ObservedObject var model: RHENFeedViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            IRENBackground()
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 10) {
                    RHENMark().frame(width: 34, height: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("RHENLINK")
                            .font(.headline.weight(.semibold))
                            .tracking(2)
                        Text("FOUNDER ACCESS")
                            .font(.caption2.weight(.semibold))
                            .tracking(1.4)
                            .foregroundStyle(Color.irenMuted)
                    }
                }

                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .textContentType(.username)
                    .padding(12)
                    .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))

                SecureField("Password", text: $password)
                    .textContentType(.password)
                    .padding(12)
                    .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.orange)
                }

                Button {
                    Task {
                        isSubmitting = true
                        defer { isSubmitting = false }
                        do {
                            try await model.signIn(email: email, password: password)
                            password = ""
                            dismiss()
                        } catch {
                            errorMessage = error.localizedDescription
                        }
                    }
                } label: {
                    HStack {
                        Spacer()
                        if isSubmitting { ProgressView().tint(.white) }
                        Text(isSubmitting ? "Authenticating" : "Unlock IREN")
                        Spacer()
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.irenElectric)
                .disabled(email.isEmpty || password.isEmpty || isSubmitting)

                Text("RHENLINK credentials are sent directly to Supabase Auth. Session tokens are stored in the device Keychain; no broker credentials are stored in IREN.")
                    .font(.caption2)
                    .foregroundStyle(Color.irenMuted)
            }
            .padding(22)
        }
        .preferredColorScheme(.dark)
    }
}
