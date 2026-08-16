import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";

export const revalidate = 0; // Disable caching for the admin view

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeUser = user;

  // Bypass for local development testing
  if (!activeUser && process.env.BYPASS_AUTH === "true") {
    activeUser = {
      email: "tester@orbstack.local",
    } as any;
  }

  if (!activeUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: activeUser.email ?? "" },
  });

  // Verify authorization: only SUPER_ADMIN and ADMIN (internal staff) can access
  if (!dbUser || (dbUser.role !== "SUPER_ADMIN" && dbUser.role !== "ADMIN")) {
    redirect("/deals/new");
  }

  const users = await prisma.user.findMany({
    include: {
      originatorProfile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const offers = await prisma.offer.findMany({
    include: {
      originator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const investors = await prisma.user.findMany({
    where: { role: "INVESTIDOR" },
    include: { investorProfile: true },
    orderBy: { createdAt: "desc" },
  });

  // Format dates to avoid next.js warning when passing to client component
  const formattedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    originatorProfile: u.originatorProfile
      ? {
          ...u.originatorProfile,
          totalEmitted: Number(u.originatorProfile.totalEmitted),
          registrationDate: u.originatorProfile.registrationDate.toISOString(),
          createdAt: u.originatorProfile.createdAt.toISOString(),
          updatedAt: u.originatorProfile.updatedAt.toISOString(),
        }
      : null,
  }));

  const formattedOffers = offers.map((off) => ({
    ...off,
    volume: Number(off.volume),
    raised: Number(off.raised),
    minTicket: Number(off.minTicket),
    deadline: off.deadline.toISOString(),
    createdAt: off.createdAt.toISOString(),
    updatedAt: off.updatedAt.toISOString(),
    originator: off.originator
      ? {
          ...off.originator,
          totalEmitted: Number(off.originator.totalEmitted),
          registrationDate: off.originator.registrationDate.toISOString(),
          createdAt: off.originator.createdAt.toISOString(),
          updatedAt: off.originator.updatedAt.toISOString(),
        }
      : null,
  }));

  const formattedInvestors = investors.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    blocked: u.blocked,
    createdAt: u.createdAt.toISOString(),
    profile: u.investorProfile
      ? {
          sectors: u.investorProfile.sectors,
          instruments: u.investorProfile.instruments,
          segments: u.investorProfile.segments,
          segmentsBySector: u.investorProfile.segmentsBySector as Record<string, string[]> | null,
          sectorOther: u.investorProfile.sectorOther,
          segmentOther: u.investorProfile.segmentOther,
          dealmatchObs: u.investorProfile.dealmatchObs,
          cellphone: u.investorProfile.cellphone,
          cpf: u.investorProfile.cpf,
          jobTitle: u.investorProfile.jobTitle,
          geoPreferences: u.investorProfile.geoPreferences,
          ticketMin:
            u.investorProfile.ticketMin === null ? null : Number(u.investorProfile.ticketMin),
          ticketMax:
            u.investorProfile.ticketMax === null ? null : Number(u.investorProfile.ticketMax),
          minRemuneration: u.investorProfile.minRemuneration,
          requiresStructurer: u.investorProfile.requiresStructurer,
          minSalesPercent: u.investorProfile.minSalesPercent,
          minWorksProgress: u.investorProfile.minWorksProgress,
          companyProfile: u.investorProfile.companyProfile as Record<string, unknown> | null,
          objectives: u.investorProfile.objectives as Record<string, unknown> | null,
          onboardingDone: u.investorProfile.onboardingDone,
          updatedAt: u.investorProfile.updatedAt.toISOString(),
        }
      : null,
  }));

  return (
    <AdminDashboardClient
      initialUsers={formattedUsers as any}
      initialOffers={formattedOffers as any}
      initialInvestors={formattedInvestors as any}
      currentRole={dbUser.role}
      currentEmail={activeUser.email ?? ""}
    />
  );
}
