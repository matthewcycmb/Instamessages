#!/bin/sh
# finish101.sh [--pull]: the store swap. With --pull it first cancels the pending
# 1.5.0 review submission (c627e42d, build 86). Then attaches build 101 to iOS
# 1.5.0 (f88c7172) and expires 86 on TestFlight (90 is already expired). Matthew
# resubmits 1.5.0 himself after re-reading What's New (it was written for 86).
set -e
SP=$(cd "$(dirname "$0")" && pwd)
BID=$(cat "$SP/build101.id")
V=f88c7172-e9b4-4173-a691-cb12d8fd23f8
RS=c627e42d-5973-41aa-a583-9cb5bfa2caba
if [ "$1" = "--pull" ]; then
  echo "== cancel review submission =="
  "$SP/asc.sh" PATCH "reviewSubmissions/$RS" "{\"data\":{\"type\":\"reviewSubmissions\",\"id\":\"$RS\",\"attributes\":{\"canceled\":true}}}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('attributes') or d)"
  sleep 3
fi
echo "== version state =="
"$SP/asc.sh" GET "appStoreVersions/$V?fields[appStoreVersions]=appStoreState,versionString" | python3 -c "import sys,json; a=json.load(sys.stdin)['data']['attributes']; print(a)"
echo "== attach 101 =="
"$SP/asc.sh" PATCH "appStoreVersions/$V/relationships/build" "{\"data\":{\"type\":\"builds\",\"id\":\"$BID\"}}" | head -c 300; echo
echo "== expire 86 and the superseded 100 =="
for OLD in 9c96baf5-cdfd-4081-9023-44d2311a6ac5 8781d3eb-9be7-426c-8ff2-1da8fd67fb3e; do
  "$SP/asc.sh" PATCH "builds/$OLD" "{\"data\":{\"type\":\"builds\",\"id\":\"$OLD\",\"attributes\":{\"expired\":true}}}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('attributes',{}).get('expired', d))"
done
echo "== attached build now =="
"$SP/asc.sh" GET "appStoreVersions/$V/build?fields[builds]=version,processingState" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['attributes'])"
echo "DONE: Matthew resubmits 1.5.0 (re-read What's New: it was written for 86)"
