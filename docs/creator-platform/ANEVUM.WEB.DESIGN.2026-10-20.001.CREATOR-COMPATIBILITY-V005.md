# ANEVUM Creator Compatibility V005 — initial experience and release gates

Status: development-only draft stacked on PR #562. No deployment authorization or production migration.

## Creator journey

1. Sign in on /creator-lab/v004 and choose a ZIP or standalone HTML export. No file is stored during the initial compatibility probe.
2. IREN returns a runtime classification, blocking issues, and specific export instructions. Unsupported Python, JS-source and Godot-source ZIPs receive advice; they are not executed, saved, or automatically converted.
3. Only root-index browser builds may proceed to the existing bounded V004 upload. V004 revalidates ZIP structure, entrypoint, quotas, duplicate SHA, and extracted assets. Client-side and probe results are never trusted for admission.
4. Upload creates a temporary private, owner-only preview. Creator can switch between desktop and phone-sized viewports. This is a layout simulation, not evidence of actual device support.
5. Creator saves, discards, replaces, or submits the exact immutable build for review. Published releases remain online during revisions.
6. Staff uses the isolated preview, checks asset integrity, manually tests on actual mobile hardware, and assesses security. The reviewer records a release-ID-and-SHA-bound attestation. The separate Publish action fails closed without this attestation and existing inventory checks.
7. Published release keeps its identity and URL; revocation and cleanup retain V004 resource protections.

## Scope and guarantees

- Browser static HTML is the only playable V005 intake. WebAssembly and engine web exports are candidates, not guaranteed to work.
- ZIP is a transport container, not the long-term application standard. A future AEP manifest can describe capabilities, runtime, asset inventory, app version, and SDK integration.
- The advisory probe parses ZIP directory metadata only. It does not unpack unknown source assets, store code, execute code, build source projects, or certify malware safety.
- V004 authoritative admission remains strict; unknown extensions, source-only archives, invalid manifests and unsafe archive paths are rejected before storage.
- Preview runs on an isolated host, in a sandboxed iframe, with no ANEVUM member cookies or direct progression permissions.
- Attestation records human assertions, **not** a completed malware scan or automated mobile certification. Real mobile QA and independent security review are required before approval.
- The V005 review-attestation migration is additive, but staging restore-tests and explicit operator approval are required before applying anywhere.

## Deferred work (not disguised as complete)

- Secure GitHub repository import and reproducible build adapters.
- Source-only project vault, server-side build workers, Python hosted runtime, native executable distribution.
- Automated malware scanning with signed immutable evidence, sandboxed headless runtime tests, device-farm iOS/Android verification.
- Persisted compatibility diagnostics bound to every release; rich device console and screenshot review evidence; stronger reviewer independence and audit trails.
- Canonical Creator Studio bridge and general public launch.

## Acceptance

- Run V004/V005 unit, integration, isolated-runtime and security checks.
- Verify authenticated upload/probe/preview/review end-to-end with real devices and actual isolated host.
- Ensure no cross-origin access, credentials leakage, or publication bypass.
- Preserve V004 quota, expiry, cleanup and published-release invariants.
- No merge or deployment until parent PR #562 is approved and the release operator has applied reviewed migrations to staging.
