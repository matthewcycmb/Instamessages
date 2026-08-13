# Handoff prompt

Paste this as the first message of the next session.

---

You are picking up Konvo, an iOS app in `/Users/matthewchan/Instamessages`
that wraps instagram.com and removes everything except messages, plus its
marketing site konvoinstall.com.

**Read `HANDOFF.md` in the repo root first, all of it, before touching
anything.** It carries the state, the traps and the reasoning. Then read
`~/.claude/projects/-Users-matthewchan-Instamessages/memory/MEMORY.md`.

Rules that hold for the whole session:

- **Never commit or push without my explicit word.** Pushes deploy to
  production.
- No em dashes in anything a user reads.
- Never invent social proof, ratings, user counts, or health claims. Konvo has
  none of them yet and that is deliberate.
- Do the things you can do yourself. Only ask me for what genuinely needs me:
  pressing buttons in App Store Connect, Apple support requests, signing into
  Xcode.
- Run `/ponytail:ponytail ultra` on coding work.

Where things are right now:

- Branch `konvo-onboarding-v2`, one commit ahead of main. Only the build
  number is uncommitted.
- App Store 1.0.0 has build 50 attached and is READY_FOR_REVIEW. **Nothing is
  submitted.** I press Resubmit myself.
- TestFlight has build 49 (`konvo-beta`). My iPhone has build 50 sideloaded
  (`konvo-free`, no paywall).
- macOS is blocked on Apple enabling notarization for the team.

Two things that will waste your time if you skip them:

1. **Check which build variant you are reasoning about.** `konvo-free` has no
   paywall and no impact screen compiled in at all. "The paywall is missing"
   is usually the wrong variant, not a bug.
2. **Verify the IPA, never the source.** A failed export silently leaves the
   previous IPA on disk. Read `CFBundleVersion` and grep the binary for
   `konvoFree=true` / `konvoBeta=true` before you upload or install anything.

Tell me what you have read and what you think the next move is. Do not start
editing until I say what I want.
