import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

// Cadastro V2 (Workspace) — único para todas as personas.
// Persona: BUY (investidor), SELL (originador) ou AMBOS.
// Mapeamento de propriedades conforme "Mapeamento de propriedades Workspace V2".

const HUBSPOT_BASE = "https://api.hubapi.com";
const LIFECYCLE_ONBOARDING = "1378351179"; // Fase do ciclo de vida = Onboarding

type Persona = "BUY" | "SELL" | "AMBOS";

function personaCompanyValue(p: Persona) {
  return p === "AMBOS" ? "SELL_SIDE;BUY_SIDE" : p === "BUY" ? "BUY_SIDE" : "SELL_SIDE";
}

async function hubspotRequest(path: string, method: string, body?: unknown) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN ausente");
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HubSpot ${method} ${path}: HTTP ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

async function searchHubspot(objectType: string, property: string, value: string): Promise<string | null> {
  try {
    const data = await hubspotRequest(`/crm/v3/objects/${objectType}/search`, "POST", {
      filterGroups: [{ filters: [{ propertyName: property, operator: "EQ", value }] }],
      limit: 1,
    });
    return data.results?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function syncHubspotV2(input: {
  persona: Persona;
  companyName: string;
  cnpj: string;
  razaoSocial: string;
  cidade: string;
  estado: string;
  firstName: string;
  lastName: string;
  email: string;
  termosAceitos: boolean;
  ndaAceito: boolean;
  minutaAceita: boolean;
  workspaceCompanyId: string;
}): Promise<{ companyId: string | null; contactId: string | null }> {
  const now = Date.now();

  // ── Empresa (busca por CNPJ; atualiza ou cria) ──
  const companyProperties: Record<string, string> = {
    name: input.companyName,
    cnpj_oficial: input.cnpj,
    razao_social: input.razaoSocial,
    city: input.cidade,
    state_: input.estado,
    company_persona: personaCompanyValue(input.persona),
    termos_de_uso_assinado: String(input.termosAceitos),
    nda_assinado: String(input.ndaAceito),
    lifecyclestage: LIFECYCLE_ONBOARDING,
    workspace: "Ativo",
    bloxs_workspace_company_id: input.workspaceCompanyId,
    bloxs_workspace_company_created_at: String(now),
    bloxs_workspace_company_last_login_at: String(now),
  };
  if (input.persona !== "BUY") {
    companyProperties.minuta_assinada = String(input.minutaAceita);
  }

  let companyId = await searchHubspot("companies", "cnpj_oficial", input.cnpj);
  if (companyId) {
    await hubspotRequest(`/crm/v3/objects/companies/${companyId}`, "PATCH", { properties: companyProperties });
  } else {
    const created = await hubspotRequest("/crm/v3/objects/companies", "POST", { properties: companyProperties });
    companyId = created.id;
  }

  // ── Contato (busca por e-mail; atualiza ou cria) ──
  const contactProperties: Record<string, string> = {
    firstname: input.firstName,
    lastname: input.lastName,
    email: input.email,
    persona_bloxs: personaCompanyValue(input.persona),
    lifecyclestage: LIFECYCLE_ONBOARDING,
    data_de_cadastro_do_contato_no_bloxs_workspace: String(now),
  };

  let contactId = await searchHubspot("contacts", "email", input.email);
  if (contactId) {
    await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, "PATCH", { properties: contactProperties });
  } else {
    const created = await hubspotRequest("/crm/v3/objects/contacts", "POST", { properties: contactProperties });
    contactId = created.id;
  }

  // ── Associação contato ↔ empresa ──
  if (companyId && contactId) {
    await hubspotRequest(
      `/crm/v4/objects/contacts/${contactId}/associations/default/companies/${companyId}`,
      "PUT"
    ).catch((e) => console.error("Associação contato-empresa falhou:", e));
  }

  return { companyId, contactId };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      persona,
      companyName,
      cnpj,
      razaoSocial,
      cidade,
      estado,
      firstName,
      lastName,
      email,
      password,
      termosAceitos,
      ndaAceito,
      minutaAceita,
    } = body as Record<string, any>;

    // ── Validações ──
    if (!["BUY", "SELL", "AMBOS"].includes(persona)) {
      return NextResponse.json({ message: "Persona inválida." }, { status: 400 });
    }
    if (!companyName || !cnpj || !firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }
    const cnpjDigits = String(cnpj).replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      return NextResponse.json({ message: "CNPJ inválido." }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ message: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    if (termosAceitos !== true || ndaAceito !== true) {
      return NextResponse.json(
        { message: "É necessário aceitar os Termos de Uso e o NDA." },
        { status: 400 }
      );
    }
    const isSellSide = persona === "SELL" || persona === "AMBOS";
    if (isSellSide && minutaAceita !== true) {
      return NextResponse.json(
        { message: "É necessário aceitar a Minuta de Parceria." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ message: "Este e-mail já está cadastrado no sistema." }, { status: 400 });
    }
    if (isSellSide) {
      const existingOriginator = await prisma.originator.findUnique({ where: { cnpj: cnpjDigits } });
      if (existingOriginator) {
        return NextResponse.json({ message: "Este CNPJ já está cadastrado como originador." }, { status: 400 });
      }
    }

    // ── Supabase Auth ──
    const fullName = `${firstName} ${lastName}`.trim();
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: fullName, companyName, persona },
    });
    if (authError || !authData.user) {
      let errMsg = authError?.message || "Erro desconhecido";
      if (errMsg.includes("already been registered")) errMsg = "Este e-mail já está cadastrado.";
      return NextResponse.json({ message: `Erro ao criar usuário: ${errMsg}` }, { status: 400 });
    }
    const userId = authData.user.id;

    // ── Registros locais ──
    const acceptedAt = new Date().toISOString();
    const signupData = {
      persona,
      companyName,
      cnpj: cnpjDigits,
      razaoSocial: razaoSocial || "",
      cidade: cidade || "",
      estado: estado || "",
      aceites: {
        termosDeUso: { aceito: true, em: acceptedAt },
        nda: { aceito: true, em: acceptedAt },
        ...(isSellSide ? { minutaParceria: { aceito: true, em: acceptedAt } } : {}),
      },
    };

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { role: isSellSide ? "ORIGINADOR" : "INVESTIDOR", name: fullName, signupData },
      create: {
        id: userId,
        email: normalizedEmail,
        name: fullName,
        role: isSellSide ? "ORIGINADOR" : "INVESTIDOR",
        signupData,
      },
    });

    let originatorId: string | null = null;
    if (isSellSide) {
      const originator = await prisma.originator.create({
        data: {
          name: companyName,
          cnpj: cnpjDigits,
          type: "JURIDICA",
          email: normalizedEmail,
          phone: "",
          status: "ATIVO",
          userId,
        },
      });
      originatorId = originator.id;
    }

    if (persona === "BUY" || persona === "AMBOS") {
      await prisma.investorProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          companyProfile: { companyName, cnpj: cnpjDigits, cidade: cidade || "", estado: estado || "" },
        },
      });
    }

    // ── HubSpot (resiliente: falha não bloqueia o cadastro) ──
    let hubspot: { companyId: string | null; contactId: string | null } = { companyId: null, contactId: null };
    try {
      hubspot = await syncHubspotV2({
        persona,
        companyName,
        cnpj: cnpjDigits,
        razaoSocial: razaoSocial || companyName,
        cidade: cidade || "",
        estado: estado || "",
        firstName,
        lastName,
        email: normalizedEmail,
        termosAceitos: true,
        ndaAceito: true,
        minutaAceita: isSellSide,
        workspaceCompanyId: originatorId || userId,
      });
      if (originatorId && (hubspot.companyId || hubspot.contactId)) {
        await prisma.originator.update({
          where: { id: originatorId },
          data: { hubspotCompanyId: hubspot.companyId, hubspotContactId: hubspot.contactId },
        });
      }
    } catch (hsErr) {
      console.error("HubSpot sync V2 falhou durante o cadastro:", hsErr);
    }

    return NextResponse.json({
      success: true,
      message: "Cadastro realizado com sucesso.",
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        persona,
        hubspot,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/cadastro:", error);
    return NextResponse.json({ message: error.message || "Erro interno no cadastro." }, { status: 500 });
  }
}
