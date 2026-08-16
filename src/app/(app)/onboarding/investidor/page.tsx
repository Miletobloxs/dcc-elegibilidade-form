import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import InvestorPreferencesForm from "@/components/investor/InvestorPreferencesForm";

export default async function InvestorOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/onboarding/investidor");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email ?? "" },
    include: { investorProfile: true },
  });

  // Acessível para INVESTIDOR e para "Ambos" (originador com perfil de investidor)
  if (!dbUser || (dbUser.role !== "INVESTIDOR" && !dbUser.investorProfile)) redirect("/deals/new");

  const profile =
    dbUser.investorProfile ??
    (await prisma.investorProfile.create({ data: { userId: dbUser.id } }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <InvestorPreferencesForm
        mode="onboarding"
        initialProfile={{
          sectors: profile.sectors,
          instruments: profile.instruments,
          segmentsBySector: profile.segmentsBySector as Record<string, string[]> | null,
          sectorOther: profile.sectorOther,
          segmentOther: profile.segmentOther,
          geoPreferences: profile.geoPreferences,
          ticketMin: profile.ticketMin === null ? null : Number(profile.ticketMin),
          ticketMax: profile.ticketMax === null ? null : Number(profile.ticketMax),
          minRemuneration: profile.minRemuneration,
          requiresStructurer: profile.requiresStructurer,
          minSalesPercent: profile.minSalesPercent,
          minWorksProgress: profile.minWorksProgress,
          dealmatchObs: profile.dealmatchObs,
          cellphone: profile.cellphone,
          cpf: profile.cpf,
          jobTitle: profile.jobTitle,
        }}
      />
    </div>
  );
}
