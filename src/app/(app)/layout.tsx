import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import prisma from "@/lib/prisma";
import SupportWidget from "@/components/layout/SupportWidget";

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
    redirect("/login");
  }

  // Fetch role from DB
  const dbUser = await prisma.user.findUnique({
    where: { email: activeUser.email ?? "" },
  });

  if (dbUser?.blocked) {
    await supabase.auth.signOut();
    redirect("/login?error=user_blocked");
  }

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
    <>
      <AppShell
        role={role}
        displayName={displayName}
        initials={initials}
        email={activeUser.email ?? ""}
      >
        {children}
      </AppShell>
      <SupportWidget />
    </>
  );
}
