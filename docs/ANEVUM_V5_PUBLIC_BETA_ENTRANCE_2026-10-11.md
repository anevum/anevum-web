# V5 Public Member Beta Entrance — October 11

Session: ANEVUM.WEB.BUILD.2026-10-11.006.PUBLIC-BETA-ENTRANCE
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Master WEB #259; reconstruction WEB #265.
Source parent: draft WEB #298 at 077b30959fccba4a267c36a192e21af726c5259e.

This source-only slice introduces a canonical public /beta page in the V5 Commons shell. It advertises actual Google sign-in only when the existing /api/member/availability verifies it. Visitors without accounts can read published research and privacy/terms/help; signed-in users can open /me/beta for their own identity-scoped checks. It is neither an open UGC launch nor a broker-connect launch.

Public page metadata and sitemap inclusion are explicit in the Worker, client route registry and App. Desktop/mobile browser sweeps include /beta. The site distinguishes currently deployed account features from staging-only personal RHEN workspace/draft tests. Public posting, member trading, subscriptions, payouts and Alpaca Connect remain OFF under their separate release gates.

Before actual public beta publication: full candidate CI, real owner and second-member sign-in tests, restored database proof for any required migrations, legal/privacy acceptance and separately authorized production release. No existing staging reviewer SHA was moved; production untouched.
