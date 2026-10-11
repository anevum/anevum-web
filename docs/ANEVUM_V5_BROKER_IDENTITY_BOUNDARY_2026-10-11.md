# V5 Identity and Brokerage Boundary

Session: ANEVUM.WEB.DESIGN.2026-10-11.001.BROKER-IDENTITY-SEPARATION

ANEVUM operating company, founder personal member and ordinary external member must remain three distinct authority scopes.

The company operator manages hosting, controls, research and any future company-owned broker account. ANEVUM company trading its own funds is distinct from offering brokerage services or handling customer capital. Company account and legal-entity onboarding must be independently confirmed before deployment.

The founder personal member signs in like an ordinary customer and receives an independent RHEN_NEXT workspace. The founder account must not inherit company brokerage keys, another member's orders, or administrative control merely from signed-in identity. Separately verified owner management capabilities can coexist but never authorize trades in another member's workspace.

Third-party members can register to use Commons without connecting Alpaca. Customer brokerage integration remains OAuth/Alpaca Connect and subject to provider approval and appropriate permissions. For developer-owned Alpaca accounts, direct Trading API credentials can support separate private backend operation; begin with paper credentials and keep them entirely out of public member UI and code. Paper/live environments and keys remain separate. Direct owner credentials are not a public broker-connection substitute.

Future live order routing, firm treasury, automated client strategies, deposits and withdrawals require separately reviewed financial, operational, security, legal and provider boundaries. No copy trading or shared owner keys. Do not imply Alpaca Connect or Broker API partnership approval.
