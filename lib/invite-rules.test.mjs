// node --test lib/invite-rules.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { decideClaim, CAP } from "./invite-rules.ts";

test("a fresh friend on a live code is allowed, week 1 for them", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: null, claims: 0 }),
    { ok: true, weekN: 1 });
});

test("an unknown code is refused", () => {
  assert.deepEqual(decideClaim({ code: null, friendRc: "f1", alreadyClaimed: null, claims: 0 }),
    { ok: false, reason: "no_code" });
});

test("the sender cannot claim their own code", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "s1", alreadyClaimed: null, claims: 0 }),
    { ok: false, reason: "own_code" });
});

test("a friend claims once, ever", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: "someone", claims: 0 }),
    { ok: false, reason: "already" });
});

test("the fourth friend is refused; the third is claim 3", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f4", alreadyClaimed: null, claims: CAP }),
    { ok: false, reason: "cap" });
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f3", alreadyClaimed: null, claims: 2 }),
    { ok: true, weekN: 3 });
});
