# V121 — V116-pinned private controller, offline specification

Session: `ANEVUM.WEB.RELEASE.2026-10-23.004.V116-CONTROLLER-BUNDLE`.

V120 read-only acceptance plan merged in PR #661 as `083652087e12de04fea7be30db60ca790ecd51be`. V116 apex version `76b8140f-5461-4e79-8523-78bf4054958f` is uploaded but still inactive. Current private controller `b957257c-d265-4656-bd97-db6b5da81b71` has the old apex AUTH pin `86dc4b9d-4020-432a-8a15-e65606f31316`; the public controller `9851d9c5-6270-4c4e-a70e-1b82451b170d` remains 100% and public apex `93cc7f07-cf39-457e-af69-c9f6f4c02d25` remains 100%.

This source adds an offline, source-pinned controller configuration generator. Given a fresh authorized snapshot, it changes only the private controller's `PACKAGE_CANONICAL_AUTH_VERSION` to V116, retains `PACKAGE_PUBLIC_PUBLISH_ENABLED=false`, the existing AUTH service binding, single D1 and R2, secret names without secret values, the 13 binding-name/type identities, and exposure settings. It does not send API requests or upload/deploy a version.

Do not treat offline tests as a provider-backed acceptance. To proceed, build from `site/alpha/v003/api.mjs` at the verified release revision with the exact live settings; preserve the complete compiled Worker hash and use a separate one-shot source-guarded inactive upload workflow. Add its new version at 0% only after verifying deployment list semantics and zero-exposure. A service-binding AUTH pin only targets an apex version present in the apex deployment list; staging V116 as 0% is a prerequisite. Then update the bounded founder-only acceptance entry and protected version selector with Access JWT/CSRF protections. The previous ruleset window expired and must not be unilaterally reactivated.

Production promotion is not authorized by this package. It requires real founder/member/guest and physical iPhone Safari review, stable member authentication, 100%-rollback preservation, and a separate controlled switch under issue #655. The existing public site and member data remain unchanged.
