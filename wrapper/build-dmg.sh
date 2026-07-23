#!/bin/bash
# Builds public/Instachat.dmg with a branded drag-to-Applications window.
# Usage: wrapper/build-dmg.sh <path-to-Instachat.app> <path-to-dmg-bg.png>
set -euo pipefail

APP="${1:?app path}"
BG="${2:?background png}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/Instachat.dmg"
VOL="Instachat Installer"
STAGE="$(mktemp -d)"
RW="$(mktemp -u).dmg"

# Stage: the app, an Applications symlink, and the hidden background.
ditto "$APP" "$STAGE/Instachat.app"
ln -s /Applications "$STAGE/Applications"
mkdir "$STAGE/.background"
cp "$BG" "$STAGE/.background/bg.png"

# Writable image, sized with headroom so layout sticks.
hdiutil create -srcfolder "$STAGE" -volname "$VOL" -fs HFS+ \
  -format UDRW -ov "$RW" -quiet
hdiutil attach "$RW" -mountpoint "/Volumes/$VOL" -nobrowse -quiet

# Finder layout: icon view, custom background, icon positions, no chrome.
osascript <<APPLESCRIPT
tell application "Finder"
  tell disk "$VOL"
    open
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set the bounds of container window to {400, 180, 1060, 620}
    set vo to the icon view options of container window
    set arrangement of vo to not arranged
    set icon size of vo to 112
    set text size of vo to 12
    set background picture of vo to file ".background:bg.png"
    set position of item "Instachat.app" of container window to {165, 195}
    set position of item "Applications" of container window to {495, 195}
    update without registering applications
    delay 1
    close
  end tell
end tell
APPLESCRIPT

sync
hdiutil detach "/Volumes/$VOL" -quiet
hdiutil convert "$RW" -format UDZO -imagekey zlib-level=9 -o "$OUT" -ov -quiet
rm -f "$RW"
rm -rf "$STAGE"
echo "built $OUT"
