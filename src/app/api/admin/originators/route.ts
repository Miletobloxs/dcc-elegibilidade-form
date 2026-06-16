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
      include: { originatorProfile: true },
    });

    const body = await request.json();
    const { id, name, cnpj, type, phone, status, hubspotCompanyId, hubspotContactId } = body;

    const isSelf = dbUser?.originatorProfile?.id === id;
    const isAdmin = dbUser?.role === "SUPER_ADMIN" || dbUser?.role === "ADMIN";

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const targetOriginator = await prisma.originator.findUnique({
      where: { id },
      include: { user: true }
    });

    if (targetOriginator?.user?.email === "carlos.carneiro@bloxs.com.br" && dbUser?.email !== "carlos.carneiro@bloxs.com.br") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    if (!id || !name || !cnpj || !phone) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const updateData: any = {
      name,
      cnpj,
      type,
      phone,
    };

    if (isAdmin) {
      if (status) updateData.status = status;
      if (hubspotCompanyId !== undefined) updateData.hubspotCompanyId = hubspotCompanyId || null;
      if (hubspotContactId !== undefined) updateData.hubspotContactId = hubspotContactId || null;
    }

    const updated = await prisma.originator.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, originator: updated });
  } catch (error: any) {
    console.error("Error updating originator:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
    });

    const body = await request.json();
    const { userId, name, cnpj, type, phone, status, hubspotCompanyId, hubspotContactId } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId || "" }
    });

    if (!targetUser) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    // Only allow SUPER_ADMIN or ADMIN. If target is Carlos, only Carlos can do it.
    const isAdmin = dbUser?.role === "SUPER_ADMIN" || dbUser?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    if (targetUser?.email === "carlos.carneiro@bloxs.com.br" && dbUser?.email !== "carlos.carneiro@bloxs.com.br") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    if (!userId || !name || !cnpj || !phone) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Create originator in Prisma DB
    const newOriginator = await prisma.originator.create({
      data: {
        name,
        cnpj: cnpj.replace(/\D/g, ""),
        type,
        phone,
        email: targetUser.email,
        status: status || "ATIVO",
        userId,
        hubspotCompanyId: hubspotCompanyId || null,
        hubspotContactId: hubspotContactId || null,
      }
    });

    return NextResponse.json({ success: true, originator: newOriginator });
  } catch (error: any) {
    console.error("Error creating originator:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}
