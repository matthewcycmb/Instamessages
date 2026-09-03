#!/bin/sh
# install-dev.sh <udid> [--keep]: put the current dev IPA on a phone. Without
# --keep the app is uninstalled first so onboarding, the login and the paywall
# replay. The phone must be on the cable and "available (paired)".
DEV=$1; shift
IPA=/Users/matthewchan/Instamessages/wrapper/src-tauri/gen/apple/build/arm64/Konvo.ipa
for i in $(seq 1 30); do
  xcrun devicectl list devices 2>/dev/null | grep -q "$DEV.*available (paired)" && break
  echo "waiting for $DEV to be paired ($i)"; sleep 4
done
if [ "$1" != "--keep" ]; then
  xcrun devicectl device uninstall app --device "$DEV" com.matthewchan.konvo 2>&1 | tail -1
fi
for i in 1 2 3; do
  xcrun devicectl device install app --device "$DEV" "$IPA" 2>&1 | tail -1 && break
  sleep 5
done
xcrun devicectl device info apps --device "$DEV" --bundle-id com.matthewchan.konvo 2>/dev/null | grep -i konvo
xcrun devicectl device process launch --device "$DEV" com.matthewchan.konvo 2>&1 | tail -1
