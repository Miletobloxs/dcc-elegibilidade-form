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

    if (dbUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Apenas o Super Admin pode alterar permissões e perfis de usuários." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, role } = body;

    if (!id || !role) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Update user name and role in Prisma
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}
