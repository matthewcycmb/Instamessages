#!/bin/bash
#
# Instachat installer.
#   curl -fsSL https://instamessages.vercel.app/install.sh | bash
#
# Downloads the app, clears the quarantine flag that would otherwise stop an
# unsigned build from opening, pins it to the Dock, and launches it.
# Re-running is safe: it replaces the existing copy and will not add a second
# Dock icon.

set -euo pipefail

APP="/Applications/Instachat.app"
ZIP_URL="https://instamessages.vercel.app/Instachat-mac.zip"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This installer is for macOS. On Windows, grab the installer from" >&2
  echo "https://instamessages.vercel.app/testers" >&2
  exit 1
fi

# The Mac build is arm64 only. Without this check an Intel Mac installs the app
# and then fails to launch it with nothing explaining why. The sysctl covers the
# case where this script is running under Rosetta on Apple Silicon, where
# uname reports x86_64.
if [ "$(uname -m)" != "arm64" ] && [ "$(sysctl -n hw.optional.arm64 2>/dev/null)" != "1" ]; then
  echo "Instachat needs an Apple Silicon Mac (M1 or newer) for now." >&2
  echo "This Mac has an Intel chip, so the app will not run on it yet." >&2
  echo "" >&2
  echo "The Chrome extension works on any Mac. Get it at" >&2
  echo "https://instamessages.vercel.app/testers" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading Instachat..."
curl -fsSL "$ZIP_URL" -o "$TMP/instachat.zip"

echo "Installing to /Applications..."
rm -rf "$APP"
ditto -xk "$TMP/instachat.zip" /Applications

# The build is not yet notarised. curl does not set the quarantine flag, but an
# earlier browser download can have left it on the copy we just replaced, and
# Gatekeeper then refuses to open the app at all.
xattr -cr "$APP" 2>/dev/null || true

echo "Opening Instachat..."
open "$APP"

# Deliberately not pinning to the Dock here. Writing persistent-apps only takes
# effect once the Dock restarts, and "killall Dock" restores every minimised
# window on the machine, which turns a one-line install into a screen full of
# windows the user had put away. Writing the pref without the restart is worse:
# the running Dock keeps its own copy and overwrites ours the next time it
# saves, so the tile may simply never appear. The app is in the Dock while it
# runs anyway, so we point at the one-click way to make that permanent.
echo ""
echo "Done. Sign in to Instagram as normal."
echo "Tip: to keep Instachat in your Dock, right-click its icon there"
echo "     and choose Options > Keep in Dock."
