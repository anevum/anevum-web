# IREN / RHEN ActivityKit remote updates

## Implemented registration contract

The native app captures Activity.pushTokenUpdates and POSTs the current ActivityKit push token to:

/api/command/trader/mobile/live-activity-token

The ANEVUM Cloudflare worker proxies that route to RHEN:

/v1/command/mobile/live-activity-token

The route requires RHENLINK founder authorization. It validates the iOS token and ActivityKit activity ID and never publishes the token in public telemetry.

Request body:

```json
{
  "push_token": "<activitykit token hex>",
  "activity_id": "<Activity.id>",
  "platform": "ios",
  "surface": "rhen_live_activity"
}
```

## Content-state contract

Remote ActivityKit pushes should encode these content-state fields:

- systemState
- marketState
- accountReturnPct
- drawdownPct
- performancePoints (maximum 24 normalized points)
- openPositions
- pendingOrders
- errors2h
- latestActivity (maximum 3 rows)
- updatedAt

Never include broker credentials, raw account balances, full order objects, order prices, quantities, or risk configuration in ActivityKit payloads.

## Remaining protected setup

Remote APNs delivery cannot be activated without Apple developer credentials. Required server secrets:

- IREN_APNS_TEAM_ID
- IREN_APNS_KEY_ID
- IREN_APNS_PRIVATE_KEY
- IREN_BUNDLE_ID=com.anevum.iren

APNs requests must use the Live Activity topic <bundle-id>.push-type.liveactivity and the ActivityKit device token registered above.
