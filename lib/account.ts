import { getSessionAccountId } from "./session";
import { supabaseAdmin, Account } from "./supabase";

/** Loads the logged-in account from the session cookie, or null. */
export async function currentAccount(): Promise<Account | null> {
  const accountId = await getSessionAccountId();
  if (!accountId) return null;
  const { data } = await supabaseAdmin()
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();
  return (data as Account) ?? null;
}
