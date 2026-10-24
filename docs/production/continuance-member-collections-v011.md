# ANEVUM — My Collection / Unified Member Organization V011
Session: ANEVUM.WEB.BUILD.2026-10-23.002.UNIFIED-MEMBER-COLLECTIONS
Status: Default-OFF source review. Do not deploy, merge to main, or change V131.

## Four simple destinations
My Space — /member: account, wall, creator work and personal display.
Saved Projects — /saved: private saved project list/gallery/category/search; no fabricated folders.
Evolution — /levels: verified earned specimens, undisclosed future art.
Awards — /recognition: verified earned badges and honors only.

One My Collection navigation is rendered by verified owner experiences when VITE_MEMBER_COLLECTION_NAV_REVIEW=true. All routes remain canonical. The Saved Projects route remains unavailable unless the server explicitly enables canonical saves. Existing source identities and verification are never bridged to the Creator V1 legacy session.

The My Space toolbar becomes Overview, My Wall, optional existing Creations and Player Card, with Edit Profile, Appearance, Creator Studio, Community, Support, Privacy and verified staff navigation inside a simple Profile & Tools expander. Existing query deep links remain valid and default-off mode preserves current toolbar.

Owner earned specimen list starts with at most four verified recently earned items, and the owner earned distinctions list with at most three confirmed awards. Show More reveals only values from existing trusted API results. Public member profiles retain the existing visibility contract and presentation.

No XP or honor awards are created here. No unearned names, models or private collection membership are disclosed. No DB schema or API updates.

## Acceptance
Exactly scoped source diff to saved-collections PR #684 head 47db4dddb3795a0c9c876a680fc0a46b7b392539.
Typecheck, node contract tests, normal default-off production build, explicit review build, compiled 1440px/390px/320px Chromium captures. Test signed-in, guest, available/disabled saves and responsive IREN obstruction. Physical Safari, real account privacy acceptance, inherited Commons guard and owner visual approval remain release gates. Reconcile PR #680 progression after upstream integration; preserve V131 production.
