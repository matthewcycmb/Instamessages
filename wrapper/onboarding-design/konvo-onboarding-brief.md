# Konvo iOS Onboarding — Design Brief
### Hand-off for a design session. Every decision below is settled; the design job is execution, not exploration.
July 30, 2026 · decisions locked with Matthew · research basis: Mobbin 1,460-flow study, Adapty State of In-App Subscriptions 2026 ($3B/16k apps), Superwall 40M-paywall-open study, RevenueCat State of Subscription Apps, Opal/one sec/ClearSpace teardowns.

---

## 1. What Konvo is (context the designer needs)

Konvo is a paid iOS app that is Instagram with the algorithm amputated: DMs, profiles, and friends' stories work; the feed, Reels feed, and Explore do not exist. Technically it's a Tauri webview wrapping instagram.com with an injected "cage" script. Brand identity: **Apple-utility**. Blue iMessage-style bubble icon, system fonts, true-black UI. **No mascot** (decided previously), no illustration style, no gradients-and-blobs AI look. The competitive positioning is the trust-first lane (like one sec: "it's not our goal to get rich over your phone addiction"), executed with the structural rigor of Opal's funnel (24 steps, $400K/mo).

**Tone rule for all copy:** the villain is the algorithm, never the user. No guilt, no red, no countdown timers, no fake urgency, no invented social proof (Konvo has no reviews yet — omit social proof entirely rather than fake it).

## 2. Locked product decisions

| Decision | Value |
|---|---|
| Platform | iOS only, portrait. (macOS variant later, out of scope.) |
| Flow length | ~13 perceived screens (9 pre-login + login + 2-page paywall + decline path) |
| Pricing on paywall | **$29.99/yr with 7-day free trial (trial on annual ONLY)** + $4.99/mo anchor, no trial. Per-day framing: "$0.08/day". |
| Purchase | **Fake gate in v1**: "Start my 7 days free" just proceeds. Design all real states anyway (selected plan, Restore Purchases link) but no loading/error states needed yet. |
| Login position | Instagram login comes **before** the paywall. Never ask for money before login is proven to work. |
| Personalization | **One honest config question** (strictness) that genuinely changes app behavior. Everything else in the quiz feeds copy only. |
| Emotional peak | Warm reframe, not shock ("reclaim", not "you wasted 9 years") |
| Commitment | One quiet-tap commitment screen. No signatures, no fist bumps, no hold-to-fill. |
| Decline path | ✕ on paywall → one $1.99/week counter-offer (no trial) → hard stop with Restore Purchases |

## 3. Style tokens (from the shipped app — do not invent new ones)

```
Background:      #000 (true black; the whole app is dark-only. No light mode.)
Text primary:    #f5f5f7
Text secondary:  #8e8e93
Surface/cards:   #1c1c1e, 1px border #2c2c2e, 12px radius
Accent:          #0a84ff (iOS system blue, dark variant)
Font:            -apple-system, system-ui; wordmark weight 600, 17px,
                 letter-spacing -0.01em (matches splash). Large titles: 28px/700.
Spinner:         20px, 2px border #2c2c2e, top #0a84ff (exists in splash — reuse)
Logo:            existing SVG — 512 rounded-rect (radius 116) #0a84ff, white
                 stroked chat-bubble path. In wrapper/dist/index.html. Reuse verbatim.
```

**Buttons**
- Primary: full-width minus 20px side margins, 50px tall, 14px radius, #0a84ff fill, white 600 17px label, pinned to bottom with 16px bottom margin. Exactly one primary button per screen, ever.
- Secondary/decline: plain text button, #8e8e93, below primary. Small (15px).
- Selection cards (quiz): full-width rows, #1c1c1e, 12px radius, 16px padding, 17px label + optional 13px #8e8e93 subtext. Selected state: 1px → 2px #0a84ff border + subtle #0a84ff-at-10% fill. **Tap auto-advances after ~300ms** — no Continue button on card screens (tap-to-select measured +12% completion vs typed input; auto-advance keeps momentum).

**Chrome on every quiz screen:** 3px progress bar at top (track #2c2c2e, fill #0a84ff, animates on advance — measured +18% completion), back chevron top-left (#8e8e93), no skip buttons anywhere. Screen transitions: 250ms horizontal slide.

## 4. The flow, screen by screen

Pre-login screens live in `wrapper/dist/index.html` (self-contained HTML/CSS/JS, no external assets, no frameworks — it must paint from disk on frame one). The paywall is injected as an overlay by the cage script after login (see §6).

### S1 · Welcome
Logo (existing SVG, 62px) + wordmark, then:
- H1: **"Instagram, without the feed."**
- Sub: "Your messages, your people, your stories. None of the algorithm."
- Primary: **Get started**
No pagination dots, no feature carousel (Mobbin data: feature tours are the weakest opener; the promise is the opener).

### S2 · Quiz 1 — identity (copy-only)
"What brings you to Konvo?" — cards:
1. "I only ever open Instagram for the messages"
2. "The feed eats hours I don't have"
3. "I want to reply to people without getting pulled in"
Whatever is tapped is echoed later in the paywall ("For people who only come for the messages"). Aspirational, identity-affirming first question per the Noom emotional-arc pattern (Curiosity → Hope → Action).

### S3 · Quiz 2 — usage (feeds the math)
"Honestly — how much time does Instagram get from you a day?"
Horizontal slider: 15 min → 6+ hrs, default 1.5h, live label ("about 2 h 30 m a day"). Slider not cards: the physical drag makes the number feel self-reported, which makes S5's math feel like *their* math, not ours.

### S4 · Quiz 3 — the wedge (feeds the reframe)
"How much of that is actually talking to your people?" — cards:
1. "Almost none of it"
2. "Maybe a quarter"
3. "Most of it, honestly"

### S5 · The reframe (emotional peak)
Computed from S3 (assume to age 80, 16 waking h/day):
- Big number, #f5f5f7, huge type: **"~9 years."**
- "At 2 h 30 m a day, that's what the feed takes from the rest of your life."
- Then the turn, in #0a84ff: **"The part worth keeping — your people — fits in about 20 minutes a day."**
- Primary: **Keep the good part**
Blue, not red. No skull-and-crossbones energy. This is the screen the paywall's legitimacy hangs on (loss-aversion framing; Opal's equivalent "Focus Report" is the highest-praised screen in its teardown).

### S6 · Quiz 4 — strictness (THE REAL ONE)
"How locked down do you want it?" — 2 cards with subtext:
1. **"Just messages"** — "DMs only. Stories, shared Reels and notifications stay hidden."
2. **"Messages + friends' moments"** — "DMs, plus friends' stories and the Reels people send you." *(pre-selected)*
This genuinely configures the cage (§6 flags). The design should visually mark this screen as consequential — e.g. slightly larger cards — because it's the one answer that isn't theater.

### S7 · Commitment (quiet tap)
Full-screen, no progress bar (it reads as a moment, not a step):
- "Instagram, but it's about your people again."
- Primary: **That's what I want**
Cialdini commitment-consistency; a bare checkbox measured +11% conversion. One tap, no pledge text, no signature.

### S8 · Building (honest loader, ~2.5s)
"Setting up your Konvo" + checklist items animating in sequence with checkmarks:
- Hiding the feed ✓ · Hiding Reels ✓ · Hiding Explore ✓ · Keeping your messages ✓ · Keeping friends' stories ✓ *(this last line reflects S6 — strict mode shows "Hiding stories too ✓")*
This is the "personalized plan loader" that Adapty calls table stakes — but every line is literally true (these are the actual cage rules). No fake percentage, no fake "analyzing".

### S9 · Your Konvo (plan reveal)
A single summary card (the "plan"):
- Title: **Your Konvo**
- Their config: "Messages + friends' moments" / their reclaim number: "≈ 2 hours a day back"
- Sub: "Sign in and it's yours."
- Primary: **Sign in with Instagram**
Personalization theater made honest: it shows only things that are real. RocketShip's data: a plan-reveal between quiz and paywall is the single highest-impact element in the funnel; concrete numbers beat generic summaries.

### S10 · Instagram login (existing, untouched)
Tapping S9's button navigates the webview to instagram.com's login. The cage script already leaves the entire auth chain alone (2FA, reCAPTCHA, Meta verification hops). Design note: nothing to design here — do NOT attempt to skin Instagram's login. The onboarding hand-off is the design moment: S9 should set expectations ("You'll sign in on Instagram — Konvo never sees your password" as 13px #8e8e93 footnote. That line matters: it's the #1 trust objection for wrappers).

### S11 · Paywall page 1 — value (overlay, after first successful inbox load)
Full-screen overlay, same tokens. **Two-page paywall, not one** (Superwall, 40M opens: multi-page converts 12.41% vs 9.07%, +37%).
- Callback header: "You said you only come for the messages." *(echoes S2 choice)*
- The three value bullets (previously decided these carry the sell):
  1. **No feed, ever.** The algorithm has no door here.
  2. **Everything that matters survives.** DMs, group chats, stories from real friends.
  3. **Your time back.** ≈ 2 hours a day, by your own math.
- Primary: **Continue**
Simple before/after visual if any (chaotic feed silhouette → clean inbox); no screenshots of real IG UI (App Store risk), no press logos, no review stars (we have none — omit, don't fake).

### S12 · Paywall page 2 — price
- ✕ top-left, small, #8e8e93, present from the start (Apple requires dismissibility to be findable; hiding it invites rejection and resentment).
- Plan cards: **Yearly $29.99 — "7 days free, then $29.99/yr ($0.08/day)"** pre-selected · Monthly $4.99 below, no trial.
- Trial timeline (the Blinkist pattern): "Today — everything unlocked · Day 5 — we remind you · Day 7 — $29.99, cancel anytime before"
- Primary: **Start my 7 days free** (label changes to **Subscribe — $4.99/mo** if monthly selected)
- Footer 13px: "Cancel anytime in Settings. · Restore Purchases"
v1 behavior: the primary button sets the paid flag and dismisses (fake gate). Design the real states anyway.

### S13 · Decline path
✕ on S12 → **one** counter-screen:
- "Not ready for a year? Fair."
- Single card: **$1.99/week, cancel anytime.** No trial.
- Primary: **Try a week** · Secondary text: "No thanks"
"No thanks" → hard stop screen: logo, "Konvo is a paid app. Instagram's free version is always there — with everything we just hid." + **See plans** (returns to S12) + "Restore Purchases". Calm, no begging, door stays open. (Adapty: decline-moment recovery is worth 10–15% ARPU; weekly-no-trial is the top-LTV plan type in the 2026 data. No 24h countdown — decided against.)

## 5. What is deliberately absent (do not add)

- No mascot, no illustrations, no confetti (prior decision; Apple-utility brand)
- No social proof anywhere until real reviews exist
- No countdown timers, no strikethrough fake prices, no "83% choose yearly" badges
- No notification-permission screen in v1 (iOS build has no push; the Mac handles notifications)
- No email capture, no account creation (Instagram login is the only identity)
- No light mode

## 6. Engineering notes (so the design survives contact with the codebase)

- **Two origins, one flow.** S1–S9 run on the bundled `tauri://` page; the paywall runs on instagram.com (injected by `CAGE_SCRIPT` in `lib.rs`). localStorage does not cross that boundary — pass the config in the URL fragment when navigating to login (e.g. `#konvo=v1.strict.2.5h.q1a`), and the cage script persists it into instagram.com-origin localStorage at document-start, then strips the hash.
- Flags the strictness answer sets (read by the cage script): `konvo.stories` (hide tray + re-cage /stories/), `konvo.heart` (suppress the floating heart FAB), `konvo.reels` (re-cage shared-reel playback). Defaults = current shipped behavior.
- Paywall trigger: first arrival at `/direct/inbox/` with onboarding config present and no `konvo.paid` flag → inject overlay. `konvo.paid` set by the fake gate.
- Everything must be self-contained HTML/CSS/JS (no CDN, no fonts, no images beyond inline SVG) — the page paints from disk on the first frame, and the cage's raw-string constraint forbids `"#` sequences in injected code (use single quotes in SVG/CSS, established convention in lib.rs).
- The iOS webview is already pinned to the safe area natively — design to the full canvas, no notch math needed.
- Instrument later: log furthest-screen-reached per session; the funnel metric that matters is quiz completion, not paywall conversion.

## 7. Research anchors (one line each, for the designer's conviction)

- 25 screens is the *average* onboarding across 1,460 studied flows; Opal ships 24. Our 13 is the restrained end, on purpose (trust-first lane; Opal's length is its most-complained-about trait).
- 80–90% of trials start on Day 0 — this flow is the monetization moment, there is no "later".
- Multi-page paywall +37% (Superwall). Progress bar +18%, tap-to-select +12% completion. Commitment tap +11%. Plan-reveal before paywall: highest-impact single element (RocketShip/Noom). Per-day price framing: judged 30–40% more favorably (Gourville 1998). Sunk-cost quiz investment: 2–3× commitment continuation (Sleesman 2012 meta-analysis).
