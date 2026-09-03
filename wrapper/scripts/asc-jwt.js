// App Store Connect API JWT (ES256, ieee-p1363, exp +840s: Apple 401s past ~+900).
// Usage: node asc-jwt.js  -> prints the token. Key: AuthKey_F9Z3VFTX73.p8.
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const KEY_ID = 'F9Z3VFTX73';
const ISSUER = 'fadfc58a-8c12-4d69-8483-600d0aaec371';
const key = fs.readFileSync(os.homedir() + '/.appstoreconnect/private_keys/AuthKey_' + KEY_ID + '.p8', 'utf8');
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' });
const body = b64({ iss: ISSUER, iat: now, exp: now + 840, aud: 'appstoreconnect-v1' });
const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' })
  .toString('base64url');
process.stdout.write(head + '.' + body + '.' + sig);
