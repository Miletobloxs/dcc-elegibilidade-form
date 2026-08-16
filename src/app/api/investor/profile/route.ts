import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import {
  SETORES_INTERESSE,
  INSTRUMENTOS_INTERESSE,
  SEGMENTOS_POR_SETOR,
  UF_TO_HUBSPOT_LOCATION,
  CARGOS,
} from "@/lib/investor";

async function getAuthedInvestor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email ?? "" },
    include: { investorProfile: true },
  });
  // INVESTIDOR puro ou "Ambos" (originador com perfil de investidor)
  if (!dbUser || (dbUser.role !== "INVESTIDOR" && !dbUser.investorProfile)) return null;
  return dbUser;
}

// Sincroniza as preferências de alocação nas propriedades de CONTATO do HubSpot
// (planilha "Buy Side Onboarding - Complemente informações"). Resiliente: erros
// são logados e não bloqueiam o salvamento local.
async function syncPreferencesToHubspot(email: string, p: Record<string, any>) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // localiza o contato por e-mail
  const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
    method: "POST",
    headers,
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
      limit: 1,
    }),
  });
  const searchData = await searchRes.json().catch(() => ({}));
  const contactId = searchData.results?.[0]?.id;
  if (!contactId) {
    console.error(`HubSpot: contato não encontrado para ${email} — preferências não sincronizadas.`);
    return;
  }

  const seg = (p.segmentsBySector || {}) as Record<string, string[]>;
  const properties: Record<string, string> = {
    instrumentos_financeiro: (p.instruments || []).join(";"),
    area_of_interest: (p.sectors || []).join(";"),
    area_of_interest_others: p.sectorOther || "",
    segment_of_interest_real_estate: (seg.realEstate || []).join(";"),
    segment_of_interest_agribusiness: (seg.agribusiness || []).join(";"),
    segment_of_interest_infrastructure: (seg.infrastructure || []).join(";"),
    segment_of_interest_judicial_assets: (seg.judicialAssets || []).join(";"),
    preferred_location: (p.geoPreferences || [])
      .map((uf: string) => UF_TO_HUBSPOT_LOCATION[uf])
      .filter(Boolean)
      .join(";"),
    minimum_ticket: p.ticketMin === null ? "" : String(p.ticketMin),
    maximum_ticket: p.ticketMax === null ? "" : String(p.ticketMax),
    minimum_return: p.minRemuneration || "",
    minimum_construction_progress: p.minWorksProgress === null ? "" : String(p.minWorksProgress),
    minimum_sales_percentage: p.minSalesPercent === null ? "" : String(p.minSalesPercent),
    dealmatch_observations: p.dealmatchObs || "",
  };
  if (typeof p.requiresStructurer === "boolean") {
    properties.requires_co_structuring = String(p.requiresStructurer);
  }
  if (p.cellphone) properties.phone = p.cellphone;
  if (p.cpf) properties.cpf = p.cpf;
  if (p.jobTitle) properties.job_title = p.jobTitle;

  const patchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ properties }),
  });
  if (!patchRes.ok) {
    const err = await patchRes.text();
    console.error(`HubSpot PATCH contato ${contactId} falhou: ${patchRes.status} ${err.slice(0, 300)}`);
  }
}

export async function GET() {
  try {
    const dbUser = await getAuthedInvestor();
    if (!dbUser) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }
    return NextResponse.json({ profile: dbUser.investorProfile });
  } catch (error: any) {
    console.error("Error in GET /api/investor/profile:", error);
    return NextResponse.json({ message: error.message || "Erro interno." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const dbUser = await getAuthedInvestor();
    if (!dbUser) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();

    const asStringArray = (v: unknown, allowed?: string[]) => {
      const arr = Array.isArray(v) ? v.filter((i) => typeof i === "string").slice(0, 60) : [];
      return allowed ? arr.filter((i) => allowed.includes(i)) : arr;
    };
    const asNumberOrNull = (v: unknown) =>
      v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v);
    const asPercentOrNull = (v: unknown) => {
      const n = asNumberOrNull(v);
      return n === null ? null : Math.min(100, Math.max(0, Math.round(n)));
    };
    const asTextOrNull = (v: unknown, max = 200) =>
      typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

    const ticketMin = asNumberOrNull(body.ticketMin);
    const ticketMax = asNumberOrNull(body.ticketMax);
    if (ticketMin !== null && ticketMax !== null && ticketMax < ticketMin) {
      return NextResponse.json(
        { message: "O cheque máximo deve ser maior que o mínimo." },
        { status: 400 }
      );
    }

    // Segmentos: só chaves conhecidas, só valores internos válidos
    const rawSeg = body.segmentsBySector && typeof body.segmentsBySector === "object" ? body.segmentsBySector : {};
    const segmentsBySector: Record<string, string[]> = {};
    for (const [key, group] of Object.entries(SEGMENTOS_POR_SETOR)) {
      const allowed = group.options.map((o) => o.value);
      const values = asStringArray((rawSeg as any)[key], allowed);
      if (values.length) segmentsBySector[key] = values;
    }

    const jobTitle = asTextOrNull(body.jobTitle, 40);
    const validJobTitle = jobTitle && CARGOS.some((c) => c.value === jobTitle) ? jobTitle : null;

    const data: Record<string, unknown> = {
      sectors: asStringArray(body.sectors, SETORES_INTERESSE),
      instruments: asStringArray(body.instruments, INSTRUMENTOS_INTERESSE),
      segmentsBySector,
      sectorOther: asTextOrNull(body.sectorOther),
      segmentOther: asTextOrNull(body.segmentOther),
      geoPreferences: asStringArray(body.geoPreferences, Object.keys(UF_TO_HUBSPOT_LOCATION)),
      ticketMin,
      ticketMax,
      minRemuneration: asTextOrNull(body.minRemuneration, 120),
      requiresStructurer:
        typeof body.requiresStructurer === "boolean" ? body.requiresStructurer : null,
      minSalesPercent: asPercentOrNull(body.minSalesPercent),
      minWorksProgress: asPercentOrNull(body.minWorksProgress),
      dealmatchObs: asTextOrNull(body.dealmatchObs, 2000),
      cellphone: asTextOrNull(body.cellphone, 20),
      cpf: asTextOrNull(body.cpf, 14),
      jobTitle: validJobTitle,
    };
    if (body.onboardingDone === true) data.onboardingDone = true;

    const profile = await prisma.investorProfile.upsert({
      where: { userId: dbUser.id },
      update: data,
      create: { userId: dbUser.id, ...data } as any,
    });

    // Sync HubSpot (não bloqueante)
    try {
      await syncPreferencesToHubspot(dbUser.email, data);
    } catch (hsErr) {
      console.error("Sync de preferências com HubSpot falhou:", hsErr);
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Error in PUT /api/investor/profile:", error);
    return NextResponse.json({ message: error.message || "Erro interno." }, { status: 500 });
  }
}
