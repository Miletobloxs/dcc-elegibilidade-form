import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── HubSpot Sync ─────────────────────────────────────────────────────────────

async function syncToHubspot(data: {
  name: string;
  email: string;
  phone: string;
  type: string;
  cnpj: string;
  representativeName?: string;
  representativeCpf?: string;
  representativeRole?: string;
  companyName?: string;
  categoria?: string;
  address?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}): Promise<{ contactId: string | null; companyId: string | null }> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    console.warn("HubSpot integration ignored: HUBSPOT_ACCESS_TOKEN is not defined.");
    return { contactId: null, companyId: null };
  }

  const {
    name, email, phone, type, representativeName, representativeCpf,
    representativeRole, companyName, address
  } = data;

  let contactId: string | null = null;
  let companyId: string | null = null;

  // ── 1. Company Search / Creation ───────────────────────────────────────────
  try {
    const companySearchRes = await fetch("https://api.hubapi.com/crm/v3/objects/companies/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ value: companyName || name, propertyName: "name", operator: "EQ" }]
        }]
      })
    });

    if (companySearchRes.ok) {
      const searchData = await companySearchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        companyId = searchData.results[0].id;
        console.log(`HubSpot: Company already exists with ID ${companyId}`);
      }
    }

    if (!companyId) {
      const companyPayload = {
        properties: {
          name: companyName || name,
          phone,
          zip: address?.cep || "",
          address: address ? `${address.logradouro}, ${address.numero}` : "",
          city: address?.cidade || "",
          state: address?.estado || "",
          company_persona: "SELL_SIDE",
        }
      };

      const createCompanyRes = await fetch("https://api.hubapi.com/crm/v3/objects/companies", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(companyPayload)
      });

      if (createCompanyRes.ok) {
        const companyData = await createCompanyRes.json();
        companyId = companyData.id;
        console.log(`HubSpot: Company created with ID ${companyId}`);
      } else {
        console.error("HubSpot: Failed to create company:", await createCompanyRes.text());
      }
    }
  } catch (companyErr) {
    console.error("HubSpot: Company sync failed:", companyErr);
  }

  // ── 2. Contact Search / Creation ───────────────────────────────────────────
  try {
    const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ value: email, propertyName: "email", operator: "EQ" }]
        }]
      })
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        contactId = searchData.results[0].id;
        console.log(`HubSpot: Contact already exists with ID ${contactId}`);
      }
    }

    if (!contactId) {
      const contactPayload = {
        properties: {
          email,
          firstname: representativeName || name,
          lastname: "",
          phone,
          company: companyName || name,
          jobtitle: representativeRole || "",
          address: address ? `${address.logradouro}, ${address.numero}` : "",
          city: address?.cidade || "",
          state: address?.estado || "",
          zip: address?.cep || "",
          hs_lead_status: "BYPASS_KYB",
        }
      };

      const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(contactPayload)
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        contactId = createData.id;
        console.log(`HubSpot: Contact created with ID ${contactId}`);
      } else {
        const errJson = await createRes.json().catch(() => ({}));
        console.error("HubSpot: Failed to create contact:", errJson);
        const match = errJson.message?.match(/Existing ID: (\d+)/);
        if (match) {
          contactId = match[1];
          console.log(`HubSpot: Recovered existing Contact ID ${contactId} from error payload`);
        }
      }
    }
  } catch (contactErr) {
    console.error("HubSpot: Contact sync failed:", contactErr);
  }

  // ── 3. Associate Contact ↔ Company ─────────────────────────────────────────
  if (contactId && companyId) {
    try {
      const assocRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (assocRes.ok) {
        console.log(`HubSpot: Contact ${contactId} associated with Company ${companyId}`);
      } else {
        console.error("HubSpot: Failed to associate contact to company:", await assocRes.text());
      }
    } catch (assocErr) {
      console.error("HubSpot: Contact-Company association failed:", assocErr);
    }
  }

  return { contactId, companyId };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Step 1 - Company
      cnpj,
      name,
      companyName,
      categoria,
      // Step 2 - Representative
      representativeName,
      representativeCpf,
      email,
      phone,
      representativeRole,
      // Step 3 - Address
      address,
      // Step 4 - Credentials
      password,
      type = "JURIDICA",
      // Perfil "Ambos": origina e também recebe matching de deals (buy-side)
      alsoInvestor = false,
    } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!cnpj || !name || !email || !password || !phone) {
      return NextResponse.json(
        { message: "Campos obrigatórios ausentes. Verifique todos os passos." },
        { status: 400 }
      );
    }

    if (type !== "FISICA" && type !== "JURIDICA") {
      return NextResponse.json(
        { message: "Tipo de pessoa inválido. Use FISICA ou JURIDICA." },
        { status: 400 }
      );
    }

    // ── Duplicate checks ────────────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.error(`Bypass signup: Email ${email} already exists in local DB.`);
      return NextResponse.json(
        { message: "Este e-mail já está cadastrado no sistema." },
        { status: 400 }
      );
    }

    const existingOriginator = await prisma.originator.findUnique({ where: { cnpj } });
    if (existingOriginator) {
      console.error(`Bypass signup: CNPJ ${cnpj} already exists in local DB.`);
      return NextResponse.json(
        { message: "Este CNPJ já está cadastrado como originador." },
        { status: 400 }
      );
    }

    // ── HubSpot sync (synchronous before DB write, handled resiliently) ──────
    let hubspotContactId: string | null = null;
    let hubspotCompanyId: string | null = null;

    try {
      const hsResult = await syncToHubspot({
        name: companyName || name,
        email,
        phone,
        type,
        cnpj,
        representativeName,
        representativeCpf,
        representativeRole,
        companyName,
        categoria,
        address,
      });
      hubspotContactId = hsResult.contactId;
      hubspotCompanyId = hsResult.companyId;
    } catch (hsErr) {
      console.error("HubSpot sync failed during registration flow:", hsErr);
    }

    // ── Create Supabase Auth user ────────────────────────────────────────────
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: companyName || name, representativeName },
    });

    if (authError || !authData.user) {
      let errMsg = authError?.message || "Erro desconhecido";
      console.error("Bypass signup: Supabase Auth error:", errMsg);
      if (errMsg.includes("already been registered")) errMsg = "Este e-mail já está cadastrado.";
      return NextResponse.json(
        { message: `Erro ao criar usuário: ${errMsg}` },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // ── Create DB records ────────────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { role: "ORIGINADOR", name: representativeName || name },
      create: { id: userId, email, name: representativeName || name, role: "ORIGINADOR" },
    });

    const originator = await prisma.originator.create({
      data: {
        name: companyName || name,
        cnpj,
        type: type as "FISICA" | "JURIDICA",
        email,
        phone,
        status: "ATIVO",
        userId,
        hubspotContactId,
        hubspotCompanyId,
      },
    });

    if (alsoInvestor === true) {
      await prisma.investorProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          companyProfile: { companyName: companyName || name, phone },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Originador cadastrado com sucesso (KYB Bypassed).",
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        originator: {
          id: originator.id,
          cnpj: originator.cnpj,
          status: originator.status,
          hubspotContactId: originator.hubspotContactId,
          hubspotCompanyId: originator.hubspotCompanyId,
        },
      },
    });
  } catch (error: any) {
    console.error("Bypass signup error:", error);
    return NextResponse.json(
      { message: `Erro interno no servidor: ${error.message || error}` },
      { status: 500 }
    );
  }
}
