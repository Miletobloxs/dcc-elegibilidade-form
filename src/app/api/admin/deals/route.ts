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
    const {
      id,
      name,
      volume,
      status,
      // Metadata fields
      empresaNome,
      empresaSite,
      empresaDescricao,
      captacaoFinalidade,
      captacaoGarantia,
      estruturaInstrumento,
      estruturaIndexador,
      estruturaTaxa,
      estruturaFluxo,
      hubspotDealId
    } = body;

    if (!id || !name || volume === undefined) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Retrieve original deal to merge metadata
    const originalOffer = await prisma.offer.findUnique({ where: { id } });
    if (!originalOffer) {
      return NextResponse.json({ message: "Deal não encontrado." }, { status: 404 });
    }

    const originalMeta = (originalOffer.metadata as any) || {};
    const updatedMeta = {
      ...originalMeta,
      empresaNome: empresaNome || originalMeta.empresaNome,
      empresaSite: empresaSite || originalMeta.empresaSite,
      empresaDescricao: empresaDescricao || originalMeta.empresaDescricao,
      captacaoFinalidade: captacaoFinalidade || originalMeta.captacaoFinalidade,
      captacaoGarantia: captacaoGarantia || originalMeta.captacaoGarantia,
      estruturaInstrumento: estruturaInstrumento || originalMeta.estruturaInstrumento,
      estruturaIndexador: estruturaIndexador || originalMeta.estruturaIndexador,
      estruturaTaxa: estruturaTaxa ? Number(estruturaTaxa) : originalMeta.estruturaTaxa,
      estruturaFluxo: estruturaFluxo || originalMeta.estruturaFluxo,
      hubspotDealId: hubspotDealId || originalMeta.hubspotDealId,
    };

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        name,
        volume: Number(volume),
        status,
        metadata: updatedMeta,
      },
    });

    return NextResponse.json({ success: true, offer: updated });
  } catch (error: any) {
    console.error("Error updating deal:", error);
    return NextResponse.json({ message: error.message || "Erro interno" }, { status: 500 });
  }
}
