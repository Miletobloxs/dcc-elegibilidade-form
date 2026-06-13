import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
    });

    if (dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "ADMIN") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, cnpj, type, phone, status, hubspotCompanyId, hubspotContactId } = body;

    if (!id || !name || !cnpj || !phone) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const updated = await prisma.originator.update({
      where: { id },
      data: {
        name,
        cnpj,
        type,
        phone,
        status,
        hubspotCompanyId: hubspotCompanyId || null,
        hubspotContactId: hubspotContactId || null,
      },
    });

    return NextResponse.json({ success: true, originator: updated });
  } catch (error: any) {
    console.error("Error updating originator:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}
