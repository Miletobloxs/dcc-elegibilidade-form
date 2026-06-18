import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let activeUser = user;

    // Bypass for local dev / testing if activeUser is null and BYPASS_AUTH is active
    if (!activeUser && process.env.BYPASS_AUTH === "true") {
      // Find a tester or first user in the DB
      const firstUser = await prisma.user.findFirst({
        where: { role: "ORIGINADOR" },
        include: { originatorProfile: true }
      });
      if (firstUser) {
        activeUser = { id: firstUser.id, email: firstUser.email } as any;
      }
    }

    if (!activeUser) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: activeUser.id },
    });

    const body = await request.json();
    const {
      originatorId,
      // Step 1
      empresaNome,
      empresaCnpj,
      empresaCidade,
      empresaEstado,
      empresaSetor,
      empresaSite,
      empresaDescricao,
      empresaFaturamento,
      // Step 2
      captacaoValor,
      captacaoFinalidade,
      captacaoGarantia,
      captacaoGarantiaValor,
      captacaoPrazo,
      captacaoRiscos,
      // Step 3
      estruturaInstrumento,
      estruturaIndexador,
      estruturaTaxa,
      estruturaFluxo,
    } = body;

    // Resolve the originator the deal will be attributed to.
    // ADMIN / SUPER_ADMIN create the deal on behalf of a selected originator;
    // regular originators use their own profile.
    const isAdminActor = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";
    let originator;
    if (isAdminActor) {
      if (!originatorId) {
        return NextResponse.json(
          { message: "Selecione o originador em nome de quem o deal será cadastrado." },
          { status: 400 }
        );
      }
      originator = await prisma.originator.findUnique({ where: { id: originatorId } });
      if (!originator) {
        return NextResponse.json(
          { message: "Originador selecionado não encontrado." },
          { status: 404 }
        );
      }
    } else {
      originator = await prisma.originator.findUnique({
        where: { userId: activeUser.id },
      });
      if (!originator) {
        return NextResponse.json(
          { message: "Perfil de originador não encontrado." },
          { status: 404 }
        );
      }
    }

    if (!empresaNome || !empresaCnpj || !empresaCidade || !empresaEstado || !empresaSetor || !empresaDescricao || !empresaFaturamento || !captacaoValor || !captacaoFinalidade) {
      return NextResponse.json(
        { message: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    // ── 1. Resolve or Create Company and Contact in HubSpot ──────────────────
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    let resolvedCompanyId = originator.hubspotCompanyId;
    let resolvedContactId = originator.hubspotContactId;

    if (token) {
      // 1.1. Resolve Originator's Company
      if (!resolvedCompanyId) {
        try {
          console.log(`HubSpot dynamic resolution: Searching company with name ${originator.name}`);
          const companySearchRes = await fetch("https://api.hubapi.com/crm/v3/objects/companies/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              filterGroups: [{
                filters: [{ value: originator.name, propertyName: "name", operator: "EQ" }]
              }]
            })
          });

          if (companySearchRes.ok) {
            const searchData = await companySearchRes.json();
            if (searchData.results && searchData.results.length > 0) {
              resolvedCompanyId = searchData.results[0].id;
              console.log(`HubSpot: Dynamically resolved existing Originator Company ID ${resolvedCompanyId}`);
            }
          }

          if (!resolvedCompanyId) {
            console.log(`HubSpot: Creating Originator Company ${originator.name}`);
            const createCompanyRes = await fetch("https://api.hubapi.com/crm/v3/objects/companies", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                properties: {
                  name: originator.name,
                  phone: originator.phone,
                  company_persona: "SELL_SIDE",
                }
              })
            });

            if (createCompanyRes.ok) {
              const companyData = await createCompanyRes.json();
              resolvedCompanyId = companyData.id;
              console.log(`HubSpot: Dynamically created Originator Company ID ${resolvedCompanyId}`);
            } else {
              console.error("HubSpot: Dynamic Originator Company creation failed:", await createCompanyRes.text());
            }
          }
        } catch (err) {
          console.error("HubSpot: Error resolving Originator Company:", err);
        }
      }

      // 1.2. Resolve Originator's Contact
      if (!resolvedContactId) {
        try {
          console.log(`HubSpot dynamic resolution: Searching contact with email ${originator.email}`);
          const contactSearchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              filterGroups: [{
                filters: [{ value: originator.email, propertyName: "email", operator: "EQ" }]
              }]
            })
          });

          if (contactSearchRes.ok) {
            const searchData = await contactSearchRes.json();
            if (searchData.results && searchData.results.length > 0) {
              resolvedContactId = searchData.results[0].id;
              console.log(`HubSpot: Dynamically resolved existing Originator Contact ID ${resolvedContactId}`);
            }
          }

          if (!resolvedContactId) {
            console.log(`HubSpot: Creating Originator Contact for ${originator.email}`);
            const representativeName = activeUser.user_metadata?.representativeName || originator.name;
            const createContactRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                properties: {
                  email: originator.email,
                  firstname: representativeName,
                  phone: originator.phone,
                  company: originator.name,
                }
              })
            });

            if (createContactRes.ok) {
              const contactData = await createContactRes.json();
              resolvedContactId = contactData.id;
              console.log(`HubSpot: Dynamically created Originator Contact ID ${resolvedContactId}`);
            } else {
              const errJson = await createContactRes.json().catch(() => ({}));
              console.error("HubSpot: Dynamic Originator Contact creation failed:", errJson);
              const match = errJson.message?.match(/Existing ID: (\d+)/);
              if (match) {
                resolvedContactId = match[1];
                console.log(`HubSpot: Recovered existing Originator Contact ID ${resolvedContactId} from error`);
              }
            }
          }
        } catch (err) {
          console.error("HubSpot: Error resolving Originator Contact:", err);
        }
      }

      // If we dynamically resolved either, update our PostgreSQL DB
      if (resolvedCompanyId !== originator.hubspotCompanyId || resolvedContactId !== originator.hubspotContactId) {
        await prisma.originator.update({
          where: { id: originator.id },
          data: {
            hubspotCompanyId: resolvedCompanyId,
            hubspotContactId: resolvedContactId,
          }
        });
        console.log(`Local DB updated: Company ID = ${resolvedCompanyId}, Contact ID = ${resolvedContactId}`);
      }

      // Link Originator Contact ↔ Originator Company in HubSpot if both exist
      if (resolvedContactId && resolvedCompanyId) {
        try {
          await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${resolvedContactId}/associations/companies/${resolvedCompanyId}/contact_to_company`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            }
          );
          console.log(`HubSpot: Linked Originator Contact ${resolvedContactId} to Company ${resolvedCompanyId}`);
        } catch (err) {
          console.error("HubSpot: Association Originator Contact-Company failed:", err);
        }
      }

      // Update Company Persona to SELL_SIDE
      if (resolvedCompanyId) {
        try {
          await fetch(
            `https://api.hubapi.com/crm/v3/objects/companies/${resolvedCompanyId}`,
            {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                properties: {
                  company_persona: "SELL_SIDE"
                }
              })
            }
          );
          console.log(`HubSpot: Updated Company ${resolvedCompanyId} persona to SELL_SIDE`);
        } catch (err) {
          console.error("HubSpot: Failed to update company persona:", err);
        }
      }
    }

    // ── 2. Create Deal in HubSpot ────────────────────────────────────────────
    let hubspotDealId: string | null = null;

    if (token) {
      try {
        const dealDescription = [
          `=== INFORMAÇÕES DA EMPRESA TOMADORA ===`,
          `Nome: ${empresaNome}`,
          `CNPJ: ${empresaCnpj}`,
          `Localização: ${empresaCidade} - ${empresaEstado}`,
          `Setor: ${empresaSetor}`,
          `Site: ${empresaSite || "Não informado"}`,
          `Atividade: ${empresaDescricao}`,
          `Faturamento Anual: ${empresaFaturamento}`,
          ``,
          `=== DETALHES DA CAPTAÇÃO ===`,
          `Valor Solicitado: R$ ${Number(captacaoValor).toLocaleString("pt-BR")}`,
          `Finalidade: ${captacaoFinalidade}`,
          `Garantia Oferecida: ${captacaoGarantia || "Não informado"}`,
          `Valor Estimado da Garantia: ${captacaoGarantiaValor ? "R$ " + Number(captacaoGarantiaValor).toLocaleString("pt-BR") : "Não informado"}`,
          `Prazo Planejado: ${captacaoPrazo ? captacaoPrazo + " meses" : "Não informado"}`,
          `Riscos / Ponto de Atenção: ${captacaoRiscos || "Nenhum informado"}`,
          ``,
          `=== ESTRUTURA DA OPERAÇÃO ===`,
          `Instrumento: ${estruturaInstrumento || "Não informado"}`,
          `Indexador: ${estruturaIndexador || "Não informado"}`,
          `Taxa Alvo: ${estruturaTaxa ? estruturaTaxa + "% a.a." : "Não informado"}`,
          `Fluxo de Pagamento: ${estruturaFluxo || "Não informado"}`,
          ``,
          `=== ORIGINADOR (PARCEIRO) ===`,
          `CNPJ Originador: ${originator.cnpj}`,
          `E-mail Originador: ${originator.email}`,
        ].join("\n");

        const dealPayload = {
          properties: {
            dealname: `${empresaNome} - Captação`,
            dealstage: "1237504035", // 1. Nova oportunidade
            pipeline: "834144642", // 1. ORIGINAÇÃO > TRIAGEM
            amount: captacaoValor.toString(),
            description: dealDescription,
            deal_origin: "BYPASS_FORMS", // Bypass platform = Bypass Formulário
            company_persona: "SELL_SIDE",
          }
        };

        const dealRes = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dealPayload)
        });

        if (dealRes.ok) {
          const dealData = await dealRes.json();
          hubspotDealId = dealData.id;
          console.log(`HubSpot: Deal created with ID ${hubspotDealId}`);

          // Associate with Contact (Representative / Originator)
          if (resolvedContactId) {
            const assocContactRes = await fetch(
              `https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}/associations/contacts/${resolvedContactId}/deal_to_contact`,
              {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              }
            );
            if (assocContactRes.ok) {
              console.log(`HubSpot: Associated Deal ${hubspotDealId} with Contact ${resolvedContactId}`);
            } else {
              console.error("HubSpot: Failed to associate deal with contact:", await assocContactRes.text());
            }
          }

          // Associate with Company (Originator Company)
          if (resolvedCompanyId) {
            const assocCompanyRes = await fetch(
              `https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}/associations/companies/${resolvedCompanyId}/deal_to_company`,
              {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              }
            );
            if (assocCompanyRes.ok) {
              console.log(`HubSpot: Associated Deal ${hubspotDealId} with Originator Company ${resolvedCompanyId}`);
            } else {
              console.error("HubSpot: Failed to associate deal with company:", await assocCompanyRes.text());
            }
          }
        } else {
          console.error("HubSpot: Failed to create deal:", await dealRes.text());
        }
      } catch (hsErr) {
        console.error("HubSpot: Deal sync failed:", hsErr);
      }
    } else {
      console.warn("HubSpot integration ignored: HUBSPOT_ACCESS_TOKEN is not defined.");
    }

    // ── 3. Create Offer locally ──────────────────────────────────────────────
    // Map instrument to OfferType: Default to RCVM_175 if CRA, CRI or Debenture, else RCVM_88
    const isMajorInstrument = estruturaInstrumento.includes("CRI") || 
                             estruturaInstrumento.includes("CRA") || 
                             estruturaInstrumento.includes("Debênture");
    const mappedType = isMajorInstrument ? "RCVM_175" : "RCVM_88";
    
    // Default deadline to 6 months from now
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 6);

    const offer = await prisma.offer.create({
      data: {
        name: `${empresaNome} - Captação`,
        type: mappedType,
        volume: Number(captacaoValor),
        minTicket: 10000, // Default min ticket
        deadline: deadline,
        originatorId: originator.id,
        metadata: {
          empresaNome,
          empresaCnpj,
          empresaCidade,
          empresaEstado,
          empresaSetor,
          empresaSite,
          empresaDescricao,
          empresaFaturamento,
          captacaoValor: Number(captacaoValor),
          captacaoFinalidade,
          captacaoGarantia,
          captacaoGarantiaValor: captacaoGarantiaValor ? Number(captacaoGarantiaValor) : null,
          captacaoPrazo: captacaoPrazo ? Number(captacaoPrazo) : null,
          captacaoRiscos,
          estruturaInstrumento,
          estruturaIndexador,
          estruturaTaxa: estruturaTaxa ? Number(estruturaTaxa) : null,
          estruturaFluxo,
          hubspotDealId,
          hubspotCompanyId: resolvedCompanyId,
          hubspotContactId: resolvedContactId,
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Deal registrado com sucesso no banco local e HubSpot.",
      data: {
        offer,
        hubspotDealId,
      }
    });
  } catch (error: any) {
    console.error("Deal creation error:", error);
    return NextResponse.json(
      { message: `Erro interno no servidor: ${error.message || error}` },
      { status: 500 }
    );
  }
}
