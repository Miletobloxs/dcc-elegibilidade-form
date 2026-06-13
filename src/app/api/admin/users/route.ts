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

    if (dbUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Apenas o Super Admin pode alterar permissões e perfis de usuários." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, role, blocked } = body;

    if (!id || !role) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Update user name, role, and blocked status in Prisma
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        blocked: blocked !== undefined ? Boolean(blocked) : undefined,
      },
    });

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
