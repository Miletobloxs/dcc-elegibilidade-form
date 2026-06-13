import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Campos obrigatórios ausentes. Verifique Nome, E-mail e Senha." },
        { status: 400 }
      );
    }

    // Restringe o cadastro ao domínio bloxs.com.br
    const emailLower = email.toLowerCase();
    const isAllowedDomain = emailLower.endsWith("@bloxs.com.br");

    if (!isAllowedDomain) {
      return NextResponse.json(
        { message: "Apenas e-mails institucionais @bloxs.com.br são permitidos." },
        { status: 400 }
      );
    }

    // ── Duplicate check ────────────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado no sistema." },
        { status: 400 }
      );
    }

    // ── Create Supabase Auth user ────────────────────────────────────────────
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError || !authData.user) {
      let errMsg = authError?.message || "Erro desconhecido";
      console.error("Cadastro interno: Supabase Auth error:", errMsg);
      if (errMsg.includes("already been registered")) errMsg = "Este e-mail já está cadastrado.";
      return NextResponse.json(
        { message: `Erro ao criar usuário: ${errMsg}` },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const userRole = emailLower === "carlos.carneiro@bloxs.com.br" ? "SUPER_ADMIN" : "ADMIN";

    // ── Create DB record ─────────────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: userRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário interno cadastrado com sucesso como Administrador.",
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (error: any) {
    console.error("Internal signup error:", error);
    return NextResponse.json(
      { message: `Erro interno no servidor: ${error.message || error}` },
      { status: 500 }
    );
  }
}
