import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/account";
import { SetupSteps } from "@/components/setup-steps";

export default async function OnboardingPage() {
  const account = await currentAccount();
  if (!account) redirect("/");

  return <SetupSteps username={account.username} />;
}
