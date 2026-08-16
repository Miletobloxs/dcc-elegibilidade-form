import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import NewDealClient from "./NewDealClient";

export default async function NewDealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeUser = user;
  if (!activeUser && process.env.BYPASS_AUTH === "true") {
    const firstUser = await prisma.user.findFirst({
      where: { role: "ORIGINADOR" },
      include: { originatorProfile: true }
    });
    if (firstUser) {
      activeUser = { id: firstUser.id, email: firstUser.email } as any;
    }
  }

  if (!activeUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: activeUser.email ?? "" },
  });

  const role = dbUser?.role ?? "INVESTIDOR";
  if (dbUser?.role === "INVESTIDOR") redirect("/oportunidades");
  const canChooseOriginator = role === "ADMIN" || role === "SUPER_ADMIN";

  let originators: { id: string; name: string; cnpj: string; status: string }[] = [];
  if (canChooseOriginator) {
    originators = await prisma.originator.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, cnpj: true, status: true },
    });
  }

  return <NewDealClient canChooseOriginator={canChooseOriginator} originators={originators} />;
}
