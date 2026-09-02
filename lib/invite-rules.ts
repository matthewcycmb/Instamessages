// The whole referral policy, pure, so it can be tested without a store
// (Sep 1): three claims per sender, one claim per friend ever, never your
// own code, one level only (a friend's friends add weeks to the friend).
export const CAP = 3;

export type ClaimInput = {
  code: { rc: string } | null;   // the sender behind the handle, if registered
  friendRc: string;              // the claiming phone's RevenueCat app user id
  alreadyClaimed: string | null; // the handle this friend claimed before, if any
  claims: number;                // claims already on this code
};

export type ClaimVerdict =
  | { ok: true; weekN: number }
  | { ok: false; reason: "no_code" | "own_code" | "already" | "cap" };

export function decideClaim(i: ClaimInput): ClaimVerdict {
  if (!i.code) return { ok: false, reason: "no_code" };
  if (i.code.rc === i.friendRc) return { ok: false, reason: "own_code" };
  if (i.alreadyClaimed) return { ok: false, reason: "already" };
  if (i.claims >= CAP) return { ok: false, reason: "cap" };
  return { ok: true, weekN: i.claims + 1 };
}
