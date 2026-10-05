# Security Policy

## Supported code

Security fixes are maintained for the current `main` branch and the production deployment derived from it. Historical clients and archived code may remain in the repository for reference but are not necessarily supported.

## Reporting a vulnerability

Please do not open a public issue for suspected vulnerabilities, authentication bypasses, exposed credentials, private-data exposure, or other security-sensitive findings.

Report security issues privately to **devon@anevum.com**. If GitHub private vulnerability reporting is enabled for this repository, that channel may also be used.

A useful report includes:

- the affected route, component, or commit;
- the observed and expected behavior;
- clear reproduction steps;
- the potential impact;
- screenshots, logs, or proof-of-concept material with secrets and personal data redacted.

## Safe research

Please avoid destructive testing, denial-of-service activity, social engineering, accessing data that is not yours, changing production state, or attempting to execute trades or financial actions. Stop testing and report the issue if you encounter credentials, private account information, or non-public operational data.

ANEVUM does not currently operate a public bug-bounty program unless one is announced separately.

## Sensitive boundaries

The public repository may describe parts of ANEVUM's architecture, but production credentials, broker secrets, private operator data, and authenticated Command state are not intended to be public. Cloudflare Access and server-side authorization remain the security boundary for private Command routes.
