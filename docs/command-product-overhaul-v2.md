# ANEVUM Command UX Overhaul v2

Status: PREPARED FOR IMPLEMENTATION  
Date: 2026-10-04  
Pairs with: alpaca-trader docs/command-product-overhaul-v2.md

## Product goal

Command should feel like one coherent brokerage automation product.

The default user should not need to understand GRAEN, VELUM, NOSTRA, IREN, Foundation, release pipelines, scheduler jobs, or infrastructure topology in order to start or monitor RHEN.

Primary user question:

> Is my account connected, funded, allocated, and trading safely?

Command should answer that immediately.

## Information architecture

Primary navigation:

- Overview
- Trading
- Money
- Activity
- Settings

Advanced navigation:

- System

Admin-only capabilities may be nested inside System or exposed in a separate protected Admin route.

Do not use subsystem names as the main customer navigation.

## Overview

Purpose: one-screen state of the customer's ANEVUM account.

Top status block:

- PAPER or LIVE badge;
- account lifecycle state;
- RHEN status;
- action required, if any;
- last broker reconciliation.

Primary metrics:

- brokerage equity;
- available/unallocated capital;
- RHEN allocation;
- RHEN current exposure;
- normalized performance;
- current stable strategy release.

Primary action:

- Start;
- Pause;
- Resume;
- Complete setup;
- Resolve account issue.

Only one dominant action should appear when possible.

Secondary cards:

- current positions;
- recent activity;
- current risk usage;
- transfer/funding state.

## Trading

Purpose: everything needed to understand/control RHEN.

Header:

RHEN
- Active / Paused / System Paused / Setup Required
- PAPER/LIVE
- Stable release version
- last decision/reconciliation

Controls:

- Pause new entries;
- Resume;
- Stop and close RHEN-managed positions;
- emergency stop where policy permits.

Do not allow customer controls to bypass IREN/platform safety.

Sections:

- open RHEN positions;
- active/pending RHEN orders;
- exposure/risk gauges;
- recent RHEN decisions;
- strategy release summary;
- performance chart.

Experimental research candidates are not selectable here.

## Money

Purpose: brokerage funding and RHEN capital permission.

Display:

- brokerage equity;
- cash/buying power;
- allocated to RHEN;
- reserve/unallocated;
- pending transfers;
- recent settled transfers;
- funding/withdrawal eligibility.

Actions:

- Deposit;
- Withdraw;
- Change RHEN allocation.

The user experience may look bank-like, but labels must make clear that brokerage assets are held at the broker where required.

Do not render a second ANEVUM cash balance that conflicts with broker truth.

## Activity

Purpose: one chronological customer-relevant record.

Combine:

- deposits/withdrawals/transfers;
- allocation changes;
- pause/resume/stop actions;
- strategy release changes;
- RHEN order submissions;
- fills;
- position opens/closes;
- safety halts;
- broker/account restrictions.

Default language should be human-readable.

Raw event payloads are available only in expandable advanced detail.

Filters may include:

- Trading
- Money
- System
- Account

Do not make users choose GRAEN/VELUM/IREN filters in the default customer activity view.

## Settings

Sections:

Account
- profile;
- membership;
- subscription.

Brokerage
- connected Alpaca account;
- environment;
- permissions;
- reconnect/disconnect protected flow.

Trading preferences
- allocation;
- risk settings allowed by product policy;
- disclosures/consents.

Security
- session/security state;
- step-up authentication;
- protected-action history.

Notifications
- meaningful customer alerts.

## System

The current operations-terminal work belongs here.

System is the advanced observability layer.

It may expose:

- RHEN execution runtime;
- GRAEN current research objective;
- VELUM current replay;
- NOSTRA forecast/regime state;
- IREN operating condition;
- autonomous operating loop;
- candidate counts;
- engineering-required handoffs;
- human-decision-required items;
- incidents;
- deployment/runtime health;
- evidence freshness.

The existing detailed workbench/terminal components should be preserved where useful but moved out of the default customer workflow.

## Onboarding

Target flow:

1. Create account
2. Connect Alpaca
3. Confirm broker account
4. Fund account
5. Set RHEN allocation
6. Review risk/disclosure
7. Start paper trading

Use a single progress component rather than several separate setup pages when practical.

Every stage should explain exactly why the next step is needed.

Do not expose internal service-health terminology during ordinary onboarding.

## Customer-state translation

Translate backend complexity into a small product vocabulary.

Examples:

broker reconciliation stale + IREN deny
-> Trading temporarily unavailable

customer paused
-> Trading paused by you

broker account restricted
-> Account action required

no funds
-> Funding required

no allocation
-> Choose RHEN allocation

research pipeline has no stable live release
-> Live trading not yet available

The advanced System surface may show the exact technical reason.

## Visual hierarchy

Default Command visual hierarchy:

1. account/trading state;
2. primary action;
3. money/allocation;
4. positions/performance;
5. recent activity;
6. advanced system details.

Subsystem visualizations should not dominate the customer home screen.

Animations should communicate state/activity, not exist merely as decoration.

## Mobile

Primary navigation must fit cleanly on phone.

Recommended mobile model:

- bottom or compact icon navigation for Overview / Trading / Money / Activity / Settings;
- System accessible through secondary menu;
- sticky account mode/status;
- actions large enough for touch;
- no horizontal overflow;
- charts readable without requiring desktop width.

## Backend contract

The normal UI should consume customer projections:

/v1/command/overview
/v1/command/trading
/v1/command/money
/v1/command/activity
/v1/command/account

The System page may continue to consume advanced IREN/runtime projections.

Do not build normal customer state by manually joining raw GRAEN/IREN/runtime payloads in the browser.

## Migration from current Command terminal

Preserve:

- existing runtime observation hook where needed for System;
- SystemIcon;
- subsystem instruments/animations;
- IREN operating summary;
- autonomous-loop display;
- event freshness;
- incident detail;
- engineering handoff;
- protected human decision display.

Move these under System.

Replace the default Command landing surface with Overview.

## Public website alignment

Public site message:

ANEVUM Command is the product.

Suggested top-level public navigation:

- Command
- How It Works
- Evidence
- Field Notes
- Company
- Sign In

Subsystems should be presented inside How It Works / System Architecture, not as competing products.

Narrative:

GRAEN researches.
VELUM validates.
NOSTRA adds forecasting intelligence.
IREN governs safety and releases.
RHEN executes.
Command gives the customer control.

## UX acceptance tests

A first-time user should be able to answer within seconds:

- Am I in paper or live mode?
- Is RHEN trading?
- How much money can RHEN use?
- What is my current exposure?
- Can I pause it?
- Is anything wrong?
- What do I need to do next?

A user should not need to know what IREN or GRAEN means to answer those questions.

Advanced users should still be able to see the full autonomous system working in real time under System.

## Implementation sequence

1. Add route shell and primary navigation.
2. Add Overview projection/view.
3. Add Trading projection/view.
4. Add Money projection/view.
5. Add unified Activity view.
6. Add Settings/account view.
7. Move existing operations terminal under System.
8. Replace subsystem-first default route with Overview.
9. Add onboarding state/progress.
10. Complete mobile/responsive pass.
11. Remove duplicated/obsolete subsystem-first navigation.
12. Run visual/browser QA and verify no customer workflow depends on raw internal topology.

## Non-goals

Do not redesign subsystem identities, icons, or research internals during this overhaul unless required for correctness.

Do not rebuild the autonomous operating loop.

Do not create a second finance application.

Do not turn Command into a developer console by default.

Do not remove deep transparency; relocate it to the correct layer.
