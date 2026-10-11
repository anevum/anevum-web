# Founder personal paper observation — V5 source slice

Session: ANEVUM.WEB.BUILD.2026-10-11.007.OWNER-PERSONAL-PAPER-OBSERVER
Parent source: WEB #299 at 8dce184b8ad392b0a3789bb68c1f4c224e58cc41.
Master #259; site reconstruction #265; separate brokerage approval #282.

A backend-only read-only Alpaca Trading API paper account GET is available for a future authorized **founder personal member** smoke test. It is NOT Alpaca Connect, not customer brokerage, not company treasury, and not live trading. The provider origin is fixed to paper-api.alpaca.markets/v2/account. The owner endpoint requires one exact verified Cloudflare Access identity AND the independently bound Better Auth member account. It has no request-selected account, query, method besides GET, live URL or order route. Credentials are read from two staging-only Worker secret bindings, never from browser input or source files. Response is narrowly projected to masked account suffix and provider status, no balances, account IDs or secrets; all errors fail unavailable with private no-store/noindex.

This source is OFF by default in both production and reviewer/member staging. It has an extra preview-only origin and exact flag gate even after owner authorization. Never enable it against the pinned Alpaca reviewer Worker without separately approved deployment/secret provisioning and source acceptance. It cannot be made live by changing only an environment hostname. Current deployed member portals and existing production brokerage are unaffected.

To activate after separate owner approval: review exact SHA, obtain dual-bound owner member identity (already required elsewhere but not provisioned here), separately provision the founder's own PAPER keys in staging-only Worker secrets OWNER_PERSONAL_PAPER_API_KEY_ID and OWNER_PERSONAL_PAPER_API_SECRET_KEY, enable only ANEVUM_OWNER_PAPER_OBSERVER_ENABLED in an authorized isolated reviewer-safe deployment, and verify no cross-member reading and no outbound broker writes. Never supply keys in GitHub issues, PR text, screenshots, chats or account exports. This does not simulate the real customer OAuth connection lifecycle and does not satisfy Alpaca Connect approval.


## Founder-only member beta presentation

The private /me/beta member experience now includes an owner-only status panel, rendered only after the /api/command/session endpoint independently returns command_admin, owner_member_bound and cloudflare_access. It then reads the dual-bound owner-paper/status endpoint without mutation and accepts only exact masked PAPER status. Other members never make the provider status request. Sign-out or account switches abort prior work. This developer smoke test is not third-party OAuth acceptance.
