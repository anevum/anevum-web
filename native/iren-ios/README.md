# Archived client — not part of Foundation v2

This retained client uses retired Supabase Auth and mobile APIs. Its build/release workflows have been removed. Do not distribute or use it against current production; a future native client needs an explicit Access-compatible design. Historical implementation follows.

# IREN Native 0.3

IREN Native is the Apple-only companion layer for the continuously deployed ANEVUM operating console at https://anevum.com/iren.

It intentionally does not duplicate the full Command/IREN web interface. The native project owns only capabilities that require iOS/iPadOS frameworks:

- WidgetKit Home Screen and Lock Screen widgets
- ActivityKit Live Activity
- Dynamic Island presentations on supported iPhone models
- RHENLINK native authentication with Keychain session storage
- App Group snapshot sharing between the app and widget extension
- ActivityKit push-token capture and founder-protected server registration
- Deep links back into IREN

## Lock Screen surface

The accessory rectangular widget shows RHEN state, market state, normalized tracked return, compact live performance sparkline, open-position count, pending-order count, and the latest RHEN/order activity. Private order/position rows are marked privacy-sensitive so iOS can redact them on a locked device according to system settings.

## Live Activity surface

The Live Activity shows RHEN state and market state, normalized tracked return and performance curve, open positions and pending orders, latest RHEN/order events, error count, and Dynamic Island expanded/compact/minimal presentations.

The app captures the ActivityKit push token and registers it through:

POST https://anevum.com/api/command/trader/mobile/live-activity-token

The registration call requires the same RHENLINK founder bearer token as Command.

## Security boundary

The native app contains only the Supabase publishable key, which is intended for shipped clients. RHENLINK access and refresh tokens are stored in the iOS Keychain. Broker credentials, Supabase secret/service-role keys, Railway secrets, APNs signing keys, and trading execution credentials are never embedded in the app or widget.

The widget extension never receives the RHENLINK bearer token. The app fetches private Command state, reduces it to the minimal display snapshot, and shares that snapshot through group.com.anevum.iren.

## Generate the Xcode project

Install XcodeGen on a Mac/cloud-Mac, then run:

xcodegen generate

Open IREN.xcodeproj, choose an Apple Development Team for both targets, and enable the App Group and Push Notifications capabilities.

## APNs activation still required

Local Live Activity updates work once the app is signed and installed. Continuous remote updates while IREN is suspended require Apple APNs signing credentials on the RHEN server:

- Apple Team ID
- APNs Key ID
- .p8 private signing key
- final IREN bundle ID

Those values belong in protected server environment variables, never in this repository.


## Current production architecture

The RHEN server now owns a separate display-only ActivityKit delivery service. It:

- stores ActivityKit tokens durably in the private Supabase schema
- refreshes Live Activities on meaningful RHEN state changes with a periodic heartbeat
- sends at most 24 normalized performance points and three compact activity rows
- keeps ActivityKit payloads below Apple's 4 KB limit
- records APNs delivery status privately for diagnosis
- deactivates unregistered or invalid tokens
- never participates in strategy, sizing, risk, order, or reconciliation decisions

The IREN System view exposes mobile delivery health after founder authentication.

## Automated verification

`.github/workflows/iren-native-verify.yml` regenerates the Xcode project and builds:

1. Debug for the iOS Simulator.
2. Release for a generic iOS device with signing disabled.

It also verifies the WidgetKit/ActivityKit source, App Group, push entitlement, and the mobile registration/deactivation routes.

## TestFlight

`.github/workflows/iren-testflight.yml` is a manual, credential-gated release workflow. Once the Apple account is ready, configure these repository secrets:

- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY_BASE64`

The workflow then generates the project, archives a signed Release build with automatic provisioning, and uploads it to App Store Connect/TestFlight.

The App Store Connect app record and identifiers must match:

- app bundle: `com.anevum.iren`
- widget bundle: `com.anevum.iren.widgets`
- App Group: `group.com.anevum.iren`

## RHEN APNs server secrets

Continuous remote Live Activity updates activate when the RHEN Railway service has:

- `IREN_APNS_TEAM_ID`
- `IREN_APNS_KEY_ID`
- `IREN_APNS_PRIVATE_KEY`
- `IREN_BUNDLE_ID=com.anevum.iren`

Until those values are present, token registration and local ActivityKit updates still function and RHEN reports `apns_configured=false` rather than pretending remote delivery is active.
