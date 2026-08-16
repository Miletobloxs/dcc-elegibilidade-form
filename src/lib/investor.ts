// Opções e matching do perfil de investidor (buy-side).
// Fonte: planilha "Mapeamento de propriedades Workspace V2" + propriedades
// reais do HubSpot (labels e valores internos verificados via API).

// instrumentos_financeiro (Contato) — labels = valores internos
export const INSTRUMENTOS_INTERESSE = [
  "CPR",
  "CR",
  "CRA",
  "CRI",
  "Debênture",
  "FIAGRO",
  "FIDC",
  "FIF",
  "FII",
  "FIP",
  "Nota Comercial",
  "Outros",
];

// area_of_interest (Contato) — labels = valores internos
export const SETORES_INTERESSE = [
  "Imobiliário",
  "Agronegócio",
  "Infraestrutura",
  "Ativos Judiciais",
  "Outros",
];

export type SegmentOption = { value: string; label: string };

// segment_of_interest_* (Contato) — value = interno HubSpot, label = exibição
export const SEGMENTOS_POR_SETOR: Record<
  string,
  { sector: string; hubspotProp: string; options: SegmentOption[] }
> = {
  realEstate: {
    sector: "Imobiliário",
    hubspotProp: "segment_of_interest_real_estate",
    options: [
      { value: "RESIDENTIAL", label: "Residencial" },
      { value: "COMMERCIAL", label: "Comercial" },
      { value: "LAND_DEVELOPMENT", label: "Loteamento" },
      { value: "TIMESHARE", label: "Multipropriedade" },
      { value: "HOTELS_AND_RESORTS", label: "Hotéis & Resorts" },
      { value: "LOGISTICS_INDUSTRIAL_WAREHOUSE", label: "Galpão Logístico / Industrial" },
      { value: "SHOPPING_CENTERS", label: "Shopping Centers" },
      { value: "SECOND_HOME", label: "Segunda Moradia" },
      { value: "LAND_FOR_DEVELOPMENT", label: "Terrenos para Desenvolvimento" },
      { value: "URBAN_REDEVELOPMENT_REVITALIZATION", label: "Renovação Urbana / Revitalização" },
      { value: "OTHERS", label: "Outros" },
    ],
  },
  agribusiness: {
    sector: "Agronegócio",
    hubspotProp: "segment_of_interest_agribusiness",
    options: [
      { value: "GRAINS_AND_CEREALS", label: "Grãos e Cereais" },
      { value: "LIVESTOCK", label: "Pecuária" },
      { value: "FORESTRY", label: "Florestal / Silvicultura" },
      { value: "BIOENERGY_ETANOL", label: "Bionergia / Etanol" },
      { value: "AGRICULTURAL_INPUTS", label: "Insumos Agrícolas" },
      { value: "FRUITS_AND_HORTICULTURE", label: "Frutas & Horticultura" },
      { value: "AGROINDUSTRY", label: "Agroindústria" },
      { value: "RURAL_PRODUCER", label: "Produtor Rural" },
      { value: "OTHERS", label: "Outros" },
    ],
  },
  infrastructure: {
    sector: "Infraestrutura",
    hubspotProp: "segment_of_interest_infrastructure",
    options: [
      { value: "HIGHWAYS", label: "Rodovias" },
      { value: "PORTS", label: "Portos" },
      { value: "AIRPORTS", label: "Aeroportos" },
      { value: "RENEWABLE_ENERGY", label: "Energia Renovável" },
      { value: "ENERGY_GENERATION_AND_TRANSMISSION", label: "Geração e Transmissão de Energia" },
      { value: "SANITATION", label: "Saneamento" },
      { value: "TELECOM_DATA_CENTERS", label: "Telecom / Data Centers" },
      { value: "OTHERS", label: "Outros" },
    ],
  },
  judicialAssets: {
    sector: "Ativos Judiciais",
    hubspotProp: "segment_of_interest_judicial_assets",
    options: [
      { value: "FEDERAL_PRECATORIOS", label: "Precatórios Federais" },
      { value: "STATE_MUNICIPAL_PRECATORIOS", label: "Precatórios Estaduais e Municipais" },
      { value: "RPV_SMALL_VALUE_CLAIMS", label: "Requisições de Pequeno Valor (RPV)" },
      { value: "JUDICIAL_CREDIT_RIGHTS", label: "Direitos Creditórios Judiciais" },
      { value: "TAX_DISPUTE_CREDITS", label: "Créditos Tributários em Disputa" },
      { value: "LITIGATION_DAMAGES_CLAIMS", label: "Ações Indenizatórias" },
      { value: "RESTRUCTURING_INSOLVENCY_CREDITS", label: "Recuperação Judicial / Crédito de Massa Falida" },
      { value: "LABOR_JUDICIAL_CREDITS", label: "Créditos Trabalhistas" },
      { value: "BANK_JUDICIALIZED_CREDITS", label: "Créditos Bancários Judicializados" },
      { value: "OTHER_JUDICIAL_ASSETS", label: "Outros" },
    ],
  },
};

export function segmentLabel(value: string): string {
  for (const group of Object.values(SEGMENTOS_POR_SETOR)) {
    const found = group.options.find((o) => o.value === value);
    if (found) return found.label;
  }
  return value;
}

// UF ↔ preferred_location (valores internos do HubSpot em minúsculas)
export const UF_TO_HUBSPOT_LOCATION: Record<string, string> = {
  AC: "acre", AL: "alagoas", AP: "amapa", AM: "amazonas", BA: "bahia",
  CE: "ceara", DF: "distrito_federal", ES: "espirito_santo", GO: "goias",
  MA: "maranhao", MT: "mato_grosso", MS: "mato_grosso_do_sul", MG: "minas_gerais",
  PA: "para", PB: "paraiba", PR: "parana", PE: "pernambuco", PI: "piaui",
  RJ: "rio_de_janeiro", RN: "rio_grande_do_norte", RS: "rio_grande_do_sul",
  RO: "rondonia", RR: "roraima", SC: "santa_catarina", SP: "sao_paulo",
  SE: "sergipe", TO: "tocantins",
};

export const UF_LABELS: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

export const ESTADOS = Object.keys(UF_TO_HUBSPOT_LOCATION);

// job_title (Contato) — planilha "Personalize seu perfil"
export const CARGOS: { value: string; label: string }[] = [
  { value: "CEO", label: "Presidente / CEO" },
  { value: "PARTNER", label: "Proprietário / Sócio" },
  { value: "C_LEVEL", label: "Diretor / C-Level" },
  { value: "MANAGER", label: "Gerente / Head" },
  { value: "CONSULTANT", label: "Consultor" },
  { value: "COORDINATOR", label: "Coordenador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "SPECIALIST", label: "Especialista" },
  { value: "ANALYST", label: "Analista" },
  { value: "ASSISTANT", label: "Assistente" },
  { value: "INTERN", label: "Estagiário" },
  { value: "OTHER", label: "Outro" },
];

export type InvestorProfileData = {
  sectors: string[];
  instruments: string[];
  geoPreferences: string[];
  ticketMin: number | null;
  ticketMax: number | null;
};

export type OfferForMatch = {
  volume: number;
  metadata: Record<string, unknown> | null;
};

export type MatchResult = {
  score: number;
  matched: string[];
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Compara o perfil com um deal. Critérios sem dado no deal ou não
// preenchidos no perfil são neutros (não pontuam nem eliminam).
export function matchOffer(profile: InvestorProfileData, offer: OfferForMatch): MatchResult {
  const meta = offer.metadata || {};
  const matched: string[] = [];

  // Setor: os deals usam lista antiga (ex. "Infraestrutura & Logística");
  // considera match quando um contém o outro (normalizado)
  const setorDeal = String(meta.empresaSetor || "");
  if (profile.sectors.length && setorDeal) {
    const nDeal = normalize(setorDeal);
    const hit = profile.sectors.find((s) => {
      const nS = normalize(s);
      return nS !== "outros" && (nDeal.includes(nS) || nS.includes(nDeal));
    });
    if (hit) matched.push(`Setor: ${hit}`);
  }

  const instrumento = String(meta.estruturaInstrumento || "");
  if (profile.instruments.length && instrumento) {
    const nInstr = normalize(instrumento);
    const hit = profile.instruments.find(
      (i) => i !== "Outros" && nInstr.includes(normalize(i).split(" ")[0])
    );
    if (hit) matched.push(`Instrumento: ${hit}`);
  }

  const estado = String(meta.empresaEstado || "");
  if (profile.geoPreferences.length && estado) {
    if (profile.geoPreferences.includes("BRASIL") || profile.geoPreferences.includes(estado)) {
      matched.push(`Localidade: ${estado}`);
    }
  }

  const min = profile.ticketMin ?? null;
  const max = profile.ticketMax ?? null;
  if ((min !== null || max !== null) && offer.volume > 0) {
    const okMin = min === null || offer.volume >= min;
    const okMax = max === null || offer.volume <= max;
    if (okMin && okMax) matched.push("Faixa de valor");
  }

  return { score: matched.length, matched };
}
