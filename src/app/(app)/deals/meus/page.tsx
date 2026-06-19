import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import MeusDealsClient from "./MeusDealsClient";

export default async function MeusDealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email ?? "" },
    include: { originatorProfile: true },
  });

  const role = dbUser?.role ?? "INVESTIDOR";

  // Only ORIGINADORs access this page
  if (role !== "ORIGINADOR") {
    redirect("/deals/new");
  }

  const originator = dbUser?.originatorProfile;
  if (!originator) {
    redirect("/deals/new");
  }

  const offers = await prisma.offer.findMany({
    where: { originatorId: originator.id },
    orderBy: { createdAt: "desc" },
  });

  const serializedOffers = offers.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    status: o.status,
    volume: Number(o.volume),
    raised: Number(o.raised),
    progress: o.progress,
    minTicket: Number(o.minTicket),
    deadline: o.deadline.toISOString(),
    createdAt: o.createdAt.toISOString(),
    metadata: o.metadata as Record<string, unknown> | null,
  }));

  return <MeusDealsClient offers={serializedOffers} />;
}
