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
    createdAt: off.createdAt.toISOString(),
    updatedAt: off.updatedAt.toISOString(),
  }));

  return (
    <AdminDashboardClient
      initialUsers={formattedUsers as any}
      initialOffers={formattedOffers as any}
      currentRole={dbUser.role}
      currentEmail={activeUser.email ?? ""}
    />
  );
}
