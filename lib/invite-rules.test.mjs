// node --test lib/invite-rules.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { decideClaim } from "./invite-rules.ts";

test("the first friend on a live code is allowed and credits the sender", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: null, claims: 0 }),
    { ok: true, creditSender: true, joinN: 1 });
});

test("later friends are allowed but credit nothing (no stacking)", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f2", alreadyClaimed: null, claims: 1 }),
    { ok: true, creditSender: false, joinN: 2 });
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f9", alreadyClaimed: null, claims: 8 }),
    { ok: true, creditSender: false, joinN: 9 });
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
