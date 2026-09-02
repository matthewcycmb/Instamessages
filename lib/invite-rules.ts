// The whole referral policy, pure, so it can be tested without a store
// (Sep 2, final): a paying sender gives 3 free days to up to three friends.
// One claim per friend, ever; never their own code; the fourth friend on a
// code is refused. The sender gets nothing: the ask is a gift, after the
// money, never before it.
export const CAP = 3;

export type ClaimInput = {
  code: { rc: string } | null;   // the sender behind the handle, if registered
  friendRc: string;              // the claiming phone's RevenueCat app user id
  alreadyClaimed: string | null; // the handle this friend claimed before, if any
  claims: number;                // claims already on this code
};

export type ClaimVerdict =
  | { ok: true; joinN: number }
  | { ok: false; reason: "no_code" | "own_code" | "already" | "cap" };

export function decideClaim(i: ClaimInput): ClaimVerdict {
  if (!i.code) return { ok: false, reason: "no_code" };
  if (i.code.rc === i.friendRc) return { ok: false, reason: "own_code" };
  if (i.alreadyClaimed) return { ok: false, reason: "already" };
  if (i.claims >= CAP) return { ok: false, reason: "cap" };
  return { ok: true, joinN: i.claims + 1 };
}
