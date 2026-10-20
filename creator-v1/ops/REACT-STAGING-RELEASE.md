# Creator V1 React staging / manual release

## Boundary

This draft PR adds a dedicated React Worker scoped to next.anevum.com/creator/* only, using staging D1. The existing next.anevum.com homepage and next.anevum.com/api/v1/member/* remain on their existing distinct Workers. Production anevum.com/* and its database are untouched. This is not a public signup release.

## Gated release procedure

The exact-SHA workflow is .github/workflows/creator-v1-react-staging-release.yml. GitHub only permits manual workflow_dispatch for workflows installed on the repository default branch (main), so this PR workflow cannot currently be triggered through Actions until the release workflow itself is reviewed and independently installed on main. Do not merge the incomplete React frontend into production just to make a deploy button available.

After that workflow is installed, use its GitHub Actions Run workflow command, enter the reviewed current SHA of build/creator-v1-react-shell-20261012, and type DEPLOY_CREATOR_REACT_STAGING_ONLY. It checks the SHA, builds both UI and tests, verifies Cloudflare routes/D1, deploys only the narrow staging route, checks public API status and anonymous account denial, then proves the old staging homepage is unchanged.

The workflow does not connect to the private staff Studio or simulate authenticated member accounts. Those require independently invited real human test identities.

## Actual acceptance required after deployment

Member A: signed-in email/Turnstile flow, genuine owned private draft, edit, submit.
Studio: independent staff approval or change-request with a durable reason.
Guest: approved projects only, no draft visibility.
Member B: independent sign-in, save/rate accepted work, server-owned XP, cross-account isolation and vote integrity.
At 1440/1024 desktop and 390/320 mobile: no horizontal overflow or fake published activity. Repeat visual acceptance with the owner before any production promotion.

Do not publish Evergrove without completed family-data redaction, licensing, disclosures, and an owner-approved demo destination. No credentials, source maps, mocked data or staging member records may be copied to the public production host.

## Rollback

If deployment or verification fails after the narrow route was created, remove only next.anevum.com/creator/* after verifying its exact Cloudflare route ID; or restore the previously reviewed version of anevum-creator-v1-react-staging. Do not change the member Worker, the existing next.anevum.com Custom Domain, or anevum.com/*.
