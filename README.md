# Konvo

Your Instagram DMs, without the feed. Three pieces, no backend:

- **`wrapper/`** — Tauri desktop + iOS app. Loads real instagram.com in a cage.
  `wrapper/src-tauri/src/lib.rs` is the whole product: `CAGE_SCRIPT` bounces
  feed URLs to `/direct/inbox/` and hides every navigation doorway; `allowed()`
  gates navigation.
- **`extension/`** — Chrome MV3 extension. Allows 10 auth paths, redirects all
  other instagram.com to `/blocked`.
- **Landing site** — Next.js on Vercel. `/`, `/blocked`, `/privacy`, `/testers`.

There is no API, database, or webhook. An earlier version was a PWA on Supabase
talking to Meta's Messaging API; it was deleted in `f58d1c5` because Meta's
rules made it unusable — no group chats, and no replying outside a 24h window.
Ignore references to that stack in older commits.

## Develop

```sh
npm run dev                                    # landing site
cd wrapper && npx @tauri-apps/cli dev          # desktop app
```

`cargo` may not be on PATH — prefix with `PATH="$HOME/.cargo/bin:$PATH"`.

## Build

```sh
cd wrapper
PATH="$HOME/.cargo/bin:$PATH" npx @tauri-apps/cli build --bundles app
PATH="$HOME/.cargo/bin:$PATH" npx @tauri-apps/cli ios build --export-method app-store-connect
```

Don't commit build output. Mac and Windows are built by CI
(`.github/workflows/`) and published as rolling prereleases. A committed binary
silently drifts from source, which has already shipped one broken build to
testers.

## Distribution

| Target | How |
|---|---|
| macOS | `curl -fsSL https://instamessages.vercel.app/install.sh \| bash` |
| Windows | `windows-preview` prerelease, rebuilt on every `wrapper/**` push |
| iOS | TestFlight internal group — App Store Connect app `6794553167` |
| Extension | Release on `matthewcycmb/instachat-extension`, linked from `/testers` |

## Environment

Two variables, both analytics, both optional — everything no-ops without them:

```
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Known constraints

- The macOS build is arm64 only. `install.sh` refuses Intel Macs with an
  explanation rather than installing something that won't run.
- **The Mac app is not notarized.** Apple returns status 7000, "team is not yet
  configured for notarization", on a fully enrolled account with the Program
  License Agreement accepted — an Apple-side provisioning fault, open with
  their support. `install.sh` strips the quarantine attribute to work around
  it. This does *not* affect TestFlight, which never touches the notary service.
- An Instagram login failing with an `e=1348020` redirect loop is an
  account-level checkpoint, not a wrapper bug. Reproduce it in Safari before
  touching any code — see the comment above `user_agent()` in `lib.rs`.
