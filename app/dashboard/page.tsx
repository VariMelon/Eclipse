import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const username = session?.user?.name || session?.user?.email || userId;

  if (!session || !userId) {
    redirect("/auth/signin");
  }

  return <DashboardClient username={username || userId} />;
}
