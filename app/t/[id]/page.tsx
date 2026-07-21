import { redirect } from "next/navigation";
import { getSessionAccountId } from "@/lib/session";
import { Chat } from "@/components/chat";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const accountId = await getSessionAccountId();
  if (!accountId) redirect("/");

  const { id } = await params;
  return <Chat conversationId={id} />;
}
