// Visibilidade de deals para o buy-side, baseada na etapa do HubSpot.
// Regra: apenas deals no pipeline DEALFLOW a partir de [IB] Sounding,
// excluindo etapas operacionais/terminais (Liquidação, Backoffice,
// Finalizado, Perdido, Declinado).

const DEALFLOW_PIPELINE_ID = "796172409";

const INVESTOR_VISIBLE_STAGES = new Set([
  "1170846865", // [IB] Sounding
  "1170846867", // [IB] Pré-Modelagem
  "1170961030", // [IB] Proposta de Mandato
  "1170961031", // [IB] Mandato Assinado
  "1170961032", // [IB + IS] Pilot Fishing
  "1170961033", // [LE] Estruturação Jurídica
  "1170961035", // [IS] Coordenação
  "1170961036", // [IS + IB] Distribuição
]);

// Labels para exibição no card do investidor
const STAGE_LABELS: Record<string, string> = {
  "1170846865": "Sounding",
  "1170846867": "Pré-Modelagem",
  "1170961030": "Proposta de Mandato",
  "1170961031": "Mandato Assinado",
  "1170961032": "Pilot Fishing",
  "1170961033": "Estruturação Jurídica",
  "1170961035": "Coordenação",
  "1170961036": "Distribuição",
};

type StageInfo = { visible: boolean; stageLabel: string | null };

// Cache simples em memória para não bater no HubSpot a cada page view
let cache: { at: number; data: Map<string, StageInfo> } | null = null;
const CACHE_TTL_MS = 60_000;

export async function fetchInvestorVisibleStages(
  hubspotDealIds: string[]
): Promise<Map<string, StageInfo> | null> {
  const ids = hubspotDealIds.filter(Boolean);
  if (ids.length === 0) return new Map();

  if (cache && Date.now() - cache.at < CACHE_TTL_MS && ids.every((id) => cache!.data.has(id))) {
    return cache.data;
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    console.error("HUBSPOT_ACCESS_TOKEN ausente — vitrine do investidor ficará vazia.");
    return null;
  }

  try {
    const result = new Map<string, StageInfo>();
    // batch/read aceita até 100 ids por chamada
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals/batch/read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: batch.map((id) => ({ id })),
          properties: ["dealstage", "pipeline"],
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        console.error(`HubSpot batch/read falhou: HTTP ${res.status}`);
        return null;
      }
      const data = await res.json();
      for (const r of data.results || []) {
        const { pipeline, dealstage } = r.properties || {};
        const visible =
          pipeline === DEALFLOW_PIPELINE_ID && INVESTOR_VISIBLE_STAGES.has(dealstage);
        result.set(String(r.id), {
          visible,
          stageLabel: visible ? STAGE_LABELS[dealstage] ?? null : null,
        });
      }
    }
    // Deals não retornados (arquivados/inexistentes) ficam invisíveis
    for (const id of ids) {
      if (!result.has(id)) result.set(id, { visible: false, stageLabel: null });
    }
    cache = { at: Date.now(), data: result };
    return result;
  } catch (err) {
    console.error("Erro ao consultar etapas no HubSpot:", err);
    return null;
  }
}
