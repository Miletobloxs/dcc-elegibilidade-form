import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Preencha nome, e-mail e senha." },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado no sistema." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, accountType: "INVESTIDOR" },
    });

    if (authError || !authData.user) {
      let errMsg = authError?.message || "Erro desconhecido";
      console.error("Investor signup: Supabase Auth error:", errMsg);
      if (errMsg.includes("already been registered")) errMsg = "Este e-mail já está cadastrado.";
      return NextResponse.json(
        { message: `Erro ao criar usuário: ${errMsg}` },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { role: "INVESTIDOR", name },
      create: { id: userId, email, name, role: "INVESTIDOR" },
    });

    const profile = await prisma.investorProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        companyProfile: phone ? { phone } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Investidor cadastrado com sucesso.",
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        profileId: profile.id,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/cadastro-investidor:", error);
    return NextResponse.json(
      { message: error.message || "Erro interno ao cadastrar investidor." },
      { status: 500 }
    );
  }
}
