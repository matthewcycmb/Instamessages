# Public repo checklist (repo is already public; state on 2026-09-03)

| Item | State | Action |
|---|---|---|
| Open-source license file at root, detected by GitHub (About shows it) | LICENSE (MIT) added 2026-09-03, uncommitted | verify About shows MIT after the push |
| Secret scan of HEAD and history | done: only public client keys (PostHog project token, RevenueCat public SDK key, Superwall public key); no private keys, no personal API keys | state this in README; keep `.env.local` ignored (it is) |
| Internal notes in tree | moved to ~/Instamessages-private on 2026-09-03 (HANDOFF.md, HANDOFF_PROMPT.md, humanbehavior-install-report.md, docs/handoffs, docs/superpowers); docs/shipaton ignored via .gitignore | commit when Matthew says |
| Device UDIDs, key ids, tester names in tracked docs | in the Sep 2 handoff | leaves with the handoffs |
| README: what, architecture, build, run, test, privacy, limits | rewritten 2026-09-03, uncommitted | Matthew reads it once |
| Setup instructions for a stranger: Rust, Node, Xcode, Tauri CLI, signing team, `Konvo.storekit`, sandbox tester | absent | write; note that a free Apple ID builds a dev signed IPA |
| Sample configuration: which keys are public, how to point at a preview host (`-konvoInviteHost`) | absent | `README` section plus `.env.example` for the site |
| Architecture explanation with the cage rules count, the patch channel, the bridge command list | absent | README section, with file references |
| Build steps (iOS, Mac) and verify script | partly in README | update to `scripts/verify-ipa.py` and the ship scripts |
| Test steps: `node test/test_bridge.js && node test/test_onboarding.js`, `node test/test_cage.js` (10 min) | absent from README | add |
| Functional completeness: site and app both in the repo; the invite API needs Upstash and a RevenueCat secret | yes, with env | document required env names |
| Assets and attribution: app icon, proof image, hero images, fonts | unverified | list sources; remove the "1000+" laurel (D6) |
| Privacy notes matching code (section 4 of CURRENT_TRUTH) | absent | add |
| Known limitations: stories and profiles open, single reel permalink opens, one Instagram A/B variant, patch channel blocked by one CSP variant, no crash monitoring | absent | add |
