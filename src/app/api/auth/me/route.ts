import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
    });

    return NextResponse.json({
      authenticated: true,
      id: user.id,
      email: user.email,
      role: dbUser?.role ?? "INVESTIDOR",
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
