import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      return NextResponse.json(
        { message: "Apenas Administradores e Super Admins podem alterar permissões e perfis de usuários." },
        { status: 403 }
      );
    }

    const isSuperAdmin = dbUser.role === "SUPER_ADMIN";

    const body = await request.json();
    const { id, name, role, blocked } = body;

    if (!id) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (targetUser?.email === "carlos.carneiro@bloxs.com.br" && dbUser.email !== "carlos.carneiro@bloxs.com.br") {
      return NextResponse.json(
        { message: "Apenas o próprio Super Admin pode editar seus dados de perfil." },
        { status: 403 }
      );
    }

    // Update user in Prisma. Only SUPER_ADMIN may change the role;
    // for ADMIN the incoming role is ignored (no privilege escalation).
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        role: isSuperAdmin ? role : undefined,
        blocked: blocked !== undefined ? Boolean(blocked) : undefined,
      },
      include: { originatorProfile: true }
    });

    // 1. Update Supabase Auth user metadata
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { representativeName: name }
      });
      console.log(`Supabase Auth updated: set representativeName = ${name} for user ${id}`);
    } catch (authErr) {
      console.error("Supabase Auth metadata update failed on admin save:", authErr);
    }

    // 2. Sincronizar com HubSpot se for originador e tiver hubspotContactId
    if (updated.originatorProfile?.hubspotContactId) {
      const token = process.env.HUBSPOT_ACCESS_TOKEN;
      if (token) {
        try {
          const hsContactId = updated.originatorProfile.hubspotContactId;
          const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${hsContactId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              properties: {
                firstname: name
              }
            })
          });

          if (!response.ok) {
            console.error("HubSpot: Failed to update contact name on admin save:", await response.text());
          } else {
            console.log(`HubSpot: Contact ${hsContactId} name updated to ${name} on admin save`);
          }
        } catch (err) {
          console.error("HubSpot: Sync representative name error on admin save:", err);
        }
      }
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email ?? "" },
    });

    if (dbUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Apenas o Super Admin pode excluir usuários." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ message: "ID do usuário ausente." }, { status: 400 });
    }

    if (userId === dbUser.id) {
      return NextResponse.json({ message: "Você não pode excluir o seu próprio usuário." }, { status: 400 });
    }

    // 1. Delete from Supabase Auth via Admin client
    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.warn("Supabase Auth deletion warning (could already be deleted):", authError.message);
    }

    // 2. Delete from Prisma DB
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: "Usuário excluído com sucesso." });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}
