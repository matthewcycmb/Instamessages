#!/bin/sh
# asc.sh METHOD PATH [JSON]  -> App Store Connect API call with a fresh JWT.
# Paths are relative to https://api.appstoreconnect.apple.com/v1/ .
# Uses curl -g so bracket filters (filter[version]=99) survive.
SP=$(cd "$(dirname "$0")" && pwd)
TOKEN=$(node "$SP/asc-jwt.js")
METHOD=$1; P=$2; BODY=$3
if [ -n "$BODY" ]; then
  curl -gsS -X "$METHOD" "https://api.appstoreconnect.apple.com/v1/$P" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY"
else
  curl -gsS -X "$METHOD" "https://api.appstoreconnect.apple.com/v1/$P" \
    -H "Authorization: Bearer $TOKEN"
fi
