# ANEVUM portal redesign: research decision record

Session: ANEVUM.WEB.BUILD.2026-10-11.001.CREATOR-PLATFORM-SEPARATION
Status: design proposal; not production approval
Date: 2026-10-11

## Direction superseded

The initial mint/lime marketing homepage is rejected by the owner. Do not treat its palette, giant headline, sparse project gallery or geometric decoration as the target design. Preserve its source and infrastructure history, but stop refining it as if it were approved.

## Owner requirements

ANEVUM is a Newgrounds-inspired community for AI-assisted software, with Envato-style project discovery and item detail. Levels, voting, creator identity, awards, publishing, reviews and community activity are core product systems, not decorative add-ons. Preserve meaningful free participation and external creator hosting. Do not connect the public platform to Backstage, V5 member data or RHEN execution.

## Research findings

Newgrounds places creator work, category portals, editorial features, ranked lists, events and community news directly in the browsing experience. Its documented identity system includes experience, levels, voting power, medals and reporting reputation. Its Project System distinguishes contributor/manager permissions and preview testers. These are separate mechanisms rather than one generic gamification score.

Envato Market supplies a different pattern: searchable categories, previews, author portfolios, product ratings and counts, item-details/reviews/comments/support tabs, licensing and compatibility metadata, collections, and author accomplishments. Envato Elements is a separate subscription-oriented product and is not the model for ANEVUM's free community.

Sources reviewed:
- https://www.newgrounds.com/
- https://www.newgrounds.com/portal
- https://www.newgrounds.com/wiki/help-information/user-accounts
- https://www.newgrounds.com/wiki/help-information/user-accounts/experience-points
- https://www.newgrounds.com/wiki/help-information/user-accounts/level
- https://www.newgrounds.com/wiki/help-information/user-accounts/blams-and-saves
- https://www.newgrounds.com/wiki/help-information/user-accounts/whistle-status
- https://www.newgrounds.com/wiki/help-information/user-accounts/medals
- https://www.newgrounds.com/wiki/help-information/content-submission/project-system
- https://www.newgrounds.com/wiki/help-information/content-submission/scouting
- https://www.newgrounds.com/wiki/help-information/terms-of-use/game-guidelines
- https://themeforest.net/
- https://themeforest.net/item/avada-responsive-multipurpose-theme/2833226
- https://codecanyon.net/category/javascript
- https://help.market.envato.com/hc/en-us/articles/203269490-Giving-Feedback-On-Items
- https://help.market.envato.com/hc/en-us/articles/202821260-What-are-Public-Collections-on-Envato-Market
- https://help.author.envato.com/hc/en-us/articles/360000424706-Our-Envato-Author-Community

## Proposed product rules

1. Build a compact, content-first portal: header/search, category navigation, media-led project shelf, fresh submissions, newcomer exposure, award/activity sidebar, creator news and community discussions. Replace hero-led brochure layout.
2. Give each project a persistent home with preview, source/release links, version-aware reviews, permissions/privacy, attribution, license, dependencies, external costs, compatibility, updates and support status.
3. Separate community rating, written review, bookmark, moderation report, XP and trusted-reviewer authorization. Popularity must never certify safety or confer administrator access.
4. Start with one active 0-5 community vote per eligible member/project; editing a vote cannot manufacture extra votes or XP. Show count and uncertainty. Low ratings affect discovery, not automatic destruction of a beginner's work.
5. Make levels persistent, free and contribution-based. No XP purchases, paid vote weight, login-streak penalties, or automatic trust from account age. Use a server-authoritative, deduplicated, reversible event ledger.
6. Provide distinct badges for verified contribution, editorial award, external-app achievement and supporter status. A supporter badge does not certify quality.
7. Accept AI-assisted development, but require disclosure, provenance, a meaningful working result and accurate screenshots. Do not copy Newgrounds' policy verbatim: its current game guidelines reject prompt-generated games and prohibit AI-generated thumbnails.
8. Keep binaries, source repositories and running apps on creator-controlled hosting at launch. ANEVUM hosts listings/community data and bounded media only. Outbound links are not proof of installability or security.
9. Preserve original brands and artwork. Borrow organizational patterns, not Newgrounds' characters/weapon icons or Envato's badges.

## Research limitations

Public pages and first-party help documentation were retrieved. Authenticated creator dashboards were not inspected. Direct live-browser screenshot capture of reference sites was blocked in this environment; no pixel-perfect visual audit is claimed. The next visual study is an ANEVUM proposal, not a screenshot of either reference site.

## Delivery order

Portal shell and representative populated states -> profiles and project pages -> authenticated publishing and moderation -> voting and XP ledger -> collections/reviews/awards -> limited creator-commerce experiments. All design fixtures must be conspicuously labeled; no invented activity may appear as real production activity. Preserve issue #324 and the current branch; no V5/RHEN or apex-domain cutover is part of this design pass.
