// node --test lib/invite-rules.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { decideClaim, CAP } from "./invite-rules.ts";

test("a fresh friend on a live code gets in", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: null, claims: 0 }), { ok: true, joinN: 1 });
});
test("three friends per code, the fourth is refused", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f3", alreadyClaimed: null, claims: CAP - 1 }), { ok: true, joinN: 3 });
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f4", alreadyClaimed: null, claims: CAP }), { ok: false, reason: "cap" });
});
test("an unknown code is refused", () => {
  assert.deepEqual(decideClaim({ code: null, friendRc: "f1", alreadyClaimed: null, claims: 0 }), { ok: false, reason: "no_code" });
});
test("the sender cannot claim their own code", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "s1", alreadyClaimed: null, claims: 0 }), { ok: false, reason: "own_code" });
});
test("a friend claims once, ever", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: "someone", claims: 0 }), { ok: false, reason: "already" });
});
