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

# Pin to the Dock so the app survives being quit, instead of vanishing from the
# Dock and taking the habit it is meant to replace with it.
#
# Applying this needs "killall Dock", which as a side effect restores every
# minimised window. There is no way to refresh the Dock without that, and
# writing the pref without refreshing is worse than not writing it: the running
# Dock holds its own copy and overwrites ours the next time it saves, so the
# tile can silently never appear. The guard below means this happens once per
# machine, on first install, so warn and carry on rather than surprise anyone.
if ! defaults read com.apple.dock persistent-apps 2>/dev/null | grep -q "Instachat.app"; then
  echo "Adding Instachat to your Dock..."
  echo "  (this restarts the Dock, so minimised windows will reopen)"
  {
    defaults write com.apple.dock persistent-apps -array-add \
      '<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>/Applications/Instachat.app</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>' \
      && killall Dock
  } >/dev/null 2>&1 || {
    echo "  (could not update the Dock. To pin it yourself, right-click the"
    echo "   Instachat icon and choose Options > Keep in Dock.)"
  }
fi

echo "Opening Instachat..."
open "$APP"
echo ""
echo "Done. Sign in to Instagram as normal."
