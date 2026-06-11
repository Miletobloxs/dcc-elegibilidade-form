import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import prisma from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeUser = user;

  // Bypass para testes locais via Docker / Orbstack
  if (!activeUser && process.env.BYPASS_AUTH === "true") {
    activeUser = {
      email: "tester@orbstack.local",
      user_metadata: { name: "Local Tester" },
    } as any;
  }

  if (!activeUser) {
    redirect("/bypass-cadastro");
  }

  // Fetch role from DB
  const dbUser = await prisma.user.findUnique({
    where: { email: activeUser.email ?? "" },
  });
  const role = dbUser?.role ?? "INVESTIDOR";

  const displayName =
    (activeUser as any).user_metadata?.name ??
    (activeUser as any).user_metadata?.full_name ??
    (activeUser as any).email?.split("@")[0] ??
    "Usuário";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header displayName={displayName} initials={initials} email={activeUser.email ?? ""} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
