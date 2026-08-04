#!/bin/bash
# Sideload Konvo onto every iPhone currently paired to this Mac.
#
# Per phone, one time, done by hand on the phone itself:
#   1. Plug in over USB, tap "Trust This Computer", enter passcode.
#   2. Settings > Privacy & Security > Developer Mode > on (phone reboots).
# No Apple ID is needed on the phone; dev-signed installs never touch it.
#
# What this does: reads each paired phone's hardware UDID, registers any new
# ones with App Store Connect (100 slots/yr, resets 2027-07-24), rebuilds the
# dev-signed IPA only if its embedded profile is missing a UDID, verifies the
# profile inside the built artifact, then installs to each phone.
#
# ./sideload.sh --check   does everything except build+install (pre-flight).
#
# Installs expire with the profile (currently 2027-07-26). Does not touch the
# App Store submission: dev-signed builds never reach App Store Connect.
set -uo pipefail
cd "$(dirname "$0")"

KEY_ID=F9Z3VFTX73
ISSUER=fadfc58a-8c12-4d69-8483-600d0aaec371
API=https://api.appstoreconnect.apple.com/v1
CHECK=${1:-}

token() {
  node -e '
    const crypto = require("crypto"), fs = require("fs");
    const key = fs.readFileSync(process.env.HOME + "/.appstoreconnect/private_keys/AuthKey_'"$KEY_ID"'.p8");
    const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const msg = b64({alg: "ES256", kid: "'"$KEY_ID"'", typ: "JWT"}) + "." +
      b64({iss: "'"$ISSUER"'", iat: now, exp: now + 1200, aud: "appstoreconnect-v1"});
    const sig = crypto.sign("sha256", Buffer.from(msg), {key, dsaEncoding: "ieee-p1363"}).toString("base64url");
    console.log(msg + "." + sig);'
}

# ---- 1. Who is plugged in / paired -----------------------------------------
DEVJSON=$(mktemp)
xcrun devicectl list devices --json-output "$DEVJSON" >/dev/null
# lines: identifier|udid|name|devmode
DEVICES=$(python3 -c "
import json
d = json.load(open('$DEVJSON'))
for dev in d['result']['devices']:
    if dev.get('connectionProperties', {}).get('pairingState') != 'paired': continue
    hw = dev.get('hardwareProperties', {})
    if hw.get('platform') != 'iOS' or not hw.get('udid'): continue
    print('|'.join([dev['identifier'], hw['udid'],
                    dev['deviceProperties']['name'],
                    dev['deviceProperties'].get('developerModeStatus', 'unknown')]))
")
if [ -z "$DEVICES" ]; then
  echo "No paired iPhones found. Plug the phone in and tap Trust, then rerun."
  exit 1
fi
echo "Paired devices:"
echo "$DEVICES" | while IFS='|' read -r id udid name devmode; do
  echo "  $name  $udid  (developer mode: $devmode)"
  if [ "$devmode" != "enabled" ]; then
    echo "  ^ enable Developer Mode on this phone (Settings > Privacy & Security), it will reboot"
  fi
done

# ---- 2. Register unknown UDIDs with App Store Connect ----------------------
TOKEN=$(token)
REGISTERED=$(curl -sf -H "Authorization: Bearer $TOKEN" "$API/devices?limit=200" |
  python3 -c "import json,sys; [print(d['attributes']['udid']) for d in json.load(sys.stdin)['data']]")
NEW=0
while IFS='|' read -r id udid name devmode; do
  if ! grep -qi "$udid" <<<"$REGISTERED"; then
    echo "Registering $name ($udid)..."
    OUT=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d "{\"data\":{\"type\":\"devices\",\"attributes\":{\"name\":\"$name\",\"udid\":\"$udid\",\"platform\":\"IOS\"}}}" \
      "$API/devices")
    grep -q '"udid"' <<<"$OUT" || { echo "Registration failed: $OUT"; exit 1; }
    NEW=1
  fi
done <<<"$DEVICES"

# ---- 3. Build only if the current IPA's profile is missing someone ---------
profile_has_all() {  # $1 = ipa path; succeeds if every paired UDID is provisioned
  local dir; dir=$(mktemp -d)
  unzip -o -q "$1" 'Payload/*.app/embedded.mobileprovision' -d "$dir" || return 1
  security cms -D -i "$dir"/Payload/*.app/embedded.mobileprovision > "$dir/prof.plist" 2>/dev/null || return 1
  local provisioned
  provisioned=$(python3 -c "
import plistlib
p = plistlib.load(open('$dir/prof.plist','rb'))
print('\n'.join(p.get('ProvisionedDevices', [])))
print('expires', p['ExpirationDate'])")
  echo "$provisioned" | grep expires
  while IFS='|' read -r id udid name devmode; do
    grep -qi "$udid" <<<"$provisioned" || { echo "Profile is missing $name ($udid)"; return 1; }
  done <<<"$DEVICES"
}

# KONVO_BETA=1 builds the tester variant (no funnel, no wall) via the
# konvo-beta cargo feature. The binary is the only truth: an env var once
# died at the xcodebuild boundary and shipped a walled build silently, so
# the IPA's beta-ness is checked against KONVO_BETA and a mismatch forces
# a rebuild (and fails the run if it survives one).
beta_matches() {  # $1 = ipa; succeeds if the binary's beta-ness matches KONVO_BETA
  local bin; bin=$(mktemp)
  unzip -p "$1" 'Payload/*.app/Konvo' > "$bin" 2>/dev/null || return 1
  # grep reads to EOF (no -q): -q quits at first match, strings takes a
  # SIGPIPE, and pipefail turns a real match into a false failure.
  if [ -n "${KONVO_BETA:-}" ]; then strings "$bin" | grep 'konvoBeta=true' >/dev/null
  else ! strings "$bin" | grep 'konvoBeta=true' >/dev/null; fi
}

IPA=$(ls -t src-tauri/gen/apple/build/*/*.ipa 2>/dev/null | head -1)
NEED_BUILD=0
if [ -z "$IPA" ] || [ "$NEW" = 1 ] || ! profile_has_all "$IPA" || ! beta_matches "$IPA"; then NEED_BUILD=1; fi

if [ "$CHECK" = "--check" ]; then
  echo "Pre-flight only. Would build: $([ $NEED_BUILD = 1 ] && echo yes || echo no)."
  exit 0
fi

if [ "$NEED_BUILD" = 1 ]; then
  echo "Building dev-signed IPA (~2 min)..."
  PATH="$HOME/.cargo/bin:$PATH" npx @tauri-apps/cli ios build --export-method debugging --ci ${KONVO_BETA:+--features konvo-beta} || exit 1
  IPA=$(ls -t src-tauri/gen/apple/build/*/*.ipa | head -1)
  # Trust nothing: confirm the fresh artifact's profile really gained the phones.
  profile_has_all "$IPA" || {
    echo "Build finished but the embedded profile still lacks a device."
    echo "Xcode cached an old profile: rm ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision and rebuild."
    exit 1
  }
  beta_matches "$IPA" || {
    echo "Build finished but the binary's beta-ness does not match KONVO_BETA."
    exit 1
  }
fi
echo "IPA: $IPA"

# ---- 4. Install ------------------------------------------------------------
# The phone drops off the bus constantly; three tries each with a fresh poll.
echo "$DEVICES" | while IFS='|' read -r id udid name devmode; do
  for try in 1 2 3; do
    echo "Installing to $name (try $try)..."
    xcrun devicectl device install app --device "$id" "$IPA" && break
    [ "$try" = 3 ] && echo "Gave up on $name: check cable, unlock the phone, rerun."
    sleep 3
  done
done
echo "Done. First launch on each phone: it just opens - no Apple ID, no TestFlight."
