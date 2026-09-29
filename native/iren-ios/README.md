# IREN Native 0.2

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
