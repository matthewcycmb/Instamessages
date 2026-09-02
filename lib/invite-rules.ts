// The whole referral policy, pure, so it can be tested without a store
// (Sep 2): 3 free days for everybody, once. A friend who pastes a link gets
// 3 days (one claim per friend, ever, never their own code); the first
// friend to join credits the sender with 3 days, later friends credit
// nothing. No stacking, no cap on how many friends a link can bring.
export type ClaimInput = {
  code: { rc: string } | null;   // the sender behind the handle, if registered
  friendRc: string;              // the claiming phone's RevenueCat app user id
  alreadyClaimed: string | null; // the handle this friend claimed before, if any
  claims: number;                // claims already on this code
};

export type ClaimVerdict =
  | { ok: true; creditSender: boolean; joinN: number }
  | { ok: false; reason: "no_code" | "own_code" | "already" };

export function decideClaim(i: ClaimInput): ClaimVerdict {
  if (!i.code) return { ok: false, reason: "no_code" };
  if (i.code.rc === i.friendRc) return { ok: false, reason: "own_code" };
  if (i.alreadyClaimed) return { ok: false, reason: "already" };
  return { ok: true, creditSender: i.claims === 0, joinN: i.claims + 1 };
}
