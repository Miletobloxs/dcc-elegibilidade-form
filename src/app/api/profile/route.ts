import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
      include: { originatorProfile: true }
    });

    const representativeName = user.user_metadata?.representativeName || "";

    return NextResponse.json({
      email: user.email,
      representativeName,
      role: dbUser?.role ?? "INVESTIDOR",
      originator: dbUser?.originatorProfile ? {
        id: dbUser.originatorProfile.id,
        name: dbUser.originatorProfile.name,
        cnpj: dbUser.originatorProfile.cnpj,
        phone: dbUser.originatorProfile.phone,
        type: dbUser.originatorProfile.type,
      } : null
    });
  } catch (error: any) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json({ message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { representativeName } = body;

    if (!representativeName || !representativeName.trim()) {
      return NextResponse.json({ message: "Nome do representante é obrigatório" }, { status: 400 });
    }

    // 1. Update user metadata in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { representativeName: representativeName.trim() }
    });

    if (authError) {
      console.error("Error updating Supabase user metadata:", authError);
      return NextResponse.json({ message: `Erro ao atualizar perfil: ${authError.message}` }, { status: 400 });
    }

    // Update local User name in Prisma
    await prisma.user.update({
      where: { email: user.email ?? "" },
      data: { name: representativeName.trim() }
    });

    // 2. Sincronizar com HubSpot se for originador e tiver hubspotContactId
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
      include: { originatorProfile: true }
    });

    if (dbUser?.originatorProfile?.hubspotContactId) {
      const token = process.env.HUBSPOT_ACCESS_TOKEN;
      if (token) {
        try {
          const hsContactId = dbUser.originatorProfile.hubspotContactId;
          const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hsContactId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              properties: {
                firstname: representativeName.trim(),
              }
            })
          });

          if (!response.ok) {
            console.error("HubSpot: Failed to update contact name:", await response.text());
          } else {
            console.log(`HubSpot: Contact ${hsContactId} name updated to ${representativeName.trim()}`);
          }
        } catch (err) {
          console.error("HubSpot: Sync representative name error:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso"
    });
  } catch (error: any) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json({ message: "Erro interno no servidor" }, { status: 500 });
  }
}
