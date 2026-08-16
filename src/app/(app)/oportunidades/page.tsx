import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { matchOffer, type InvestorProfileData } from "@/lib/investor";
import { fetchInvestorVisibleStages } from "@/lib/hubspot-deals";
import { Building2, TrendingUp, Clock, Search, SlidersHorizontal, Sparkles } from "lucide-react";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OportunidadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/oportunidades");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email ?? "" },
    include: { investorProfile: true },
  });

  // Acessível para INVESTIDOR e para "Ambos" (originador com perfil de investidor)
  if (!dbUser || (dbUser.role !== "INVESTIDOR" && !dbUser.investorProfile)) redirect("/deals/new");

  // Sem onboarding concluído → direciona para o wizard
  if (!dbUser.investorProfile || !dbUser.investorProfile.onboardingDone) {
    redirect("/onboarding/investidor");
  }

  const p = dbUser.investorProfile;
  const profile: InvestorProfileData = {
    sectors: p.sectors,
    instruments: p.instruments,
    geoPreferences: p.geoPreferences,
    ticketMin: p.ticketMin === null ? null : Number(p.ticketMin),
    ticketMax: p.ticketMax === null ? null : Number(p.ticketMax),
  };

  const hasCriteria =
    profile.sectors.length > 0 ||
    profile.instruments.length > 0 ||
    profile.geoPreferences.length > 0 ||
    profile.ticketMin !== null ||
    profile.ticketMax !== null;

  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
    include: { originator: { select: { name: true } } },
  });

  // Vitrine do buy-side: só deals no DEALFLOW a partir de [IB] Sounding
  const hubspotIds = offers
    .map((o) => String((o.metadata as Record<string, unknown> | null)?.hubspotDealId || ""))
    .filter(Boolean);
  const stages = await fetchInvestorVisibleStages(hubspotIds);

  const visibleOffers = offers.filter((o) => {
    const hsId = String((o.metadata as Record<string, unknown> | null)?.hubspotDealId || "");
    if (!hsId || !stages) return false; // sem vínculo HubSpot ou API indisponível → fora da vitrine
    return stages.get(hsId)?.visible === true;
  });

  const scored = visibleOffers
    .map((o) => {
      const volume = Number(o.volume);
      const meta = (o.metadata as Record<string, unknown> | null) || {};
      const hsId = String(meta.hubspotDealId || "");
      const stageLabel = stages?.get(hsId)?.stageLabel ?? null;
      const { score, matched } = matchOffer(profile, { volume, metadata: meta });
      // Prazo real = criação + meses informados pelo originador; sem isso, não exibe estimativa
      const prazoMeses = Number(meta.captacaoPrazo) > 0 ? Number(meta.captacaoPrazo) : null;
      let deadlineReal: string | null = null;
      if (prazoMeses) {
        const d = new Date(o.createdAt);
        d.setMonth(d.getMonth() + prazoMeses);
        deadlineReal = d.toISOString();
      }
      return {
        stageLabel,
        deadlineReal,
        id: o.id,
        name: (meta.empresaNome as string) || o.name,
        setor: (meta.empresaSetor as string) || "—",
        estado: (meta.empresaEstado as string) || null,
        instrumento: (meta.estruturaInstrumento as string) || null,
        volume,
        raised: Number(o.raised),
        progress: o.progress,
        deadline: o.deadline.toISOString(),
        type: o.type,
        score,
        matched,
      };
    })
    // Com critérios definidos, mostra só o que bate em pelo menos um; sem critérios, mostra tudo
    .filter((o) => (hasCriteria ? o.score > 0 : true))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Oportunidades</h1>
            <p className="text-sm text-gray-500">
              {scored.length} {scored.length === 1 ? "operação compatível" : "operações compatíveis"} com o seu perfil
            </p>
          </div>
        </div>
        <Link
          href="/perfil/investidor"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal size={14} />
          Ajustar preferências
        </Link>
      </div>

      {!hasCriteria && (
        <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
          Você ainda não definiu critérios de interesse — mostrando todas as oportunidades.{" "}
          <Link href="/perfil/investidor" className="font-semibold underline">
            Definir preferências
          </Link>
        </div>
      )}

      {scored.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">Nenhuma oportunidade disponível no momento</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Mostramos apenas operações em estágio avançado (a partir de Sounding) que atendem aos seus
            critérios. Amplie seus filtros de interesse ou volte em breve.
          </p>
          <Link
            href="/perfil/investidor"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <SlidersHorizontal size={14} /> Ajustar preferências
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {scored.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{o.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {o.setor}
                      {o.estado ? ` · ${o.estado}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {o.score > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      {o.score} {o.score === 1 ? "match" : "matches"}
                    </span>
                  )}
                  {o.stageLabel && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {o.stageLabel}
                    </span>
                  )}
                </div>
              </div>

              {o.matched.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {o.matched.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} /> Captação
                  </span>
                  <span className="font-medium text-gray-700">{o.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(o.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>{formatBRL(o.raised)} captados</span>
                  <span>{formatBRL(o.volume)} meta</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {o.deadlineReal
                    ? `Prazo: ${new Date(o.deadlineReal).toLocaleDateString("pt-BR")}`
                    : "Prazo não informado"}
                </span>
                <span className="font-medium text-gray-600 truncate max-w-[45%]" title={o.instrumento || undefined}>
                  {o.instrumento || (o.type === "RCVM_175" ? "RCVM 175" : "RCVM 88")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
