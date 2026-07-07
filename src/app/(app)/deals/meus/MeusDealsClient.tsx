"use client";

import Link from "next/link";
import { Building2, FileText, TrendingUp, Clock, Plus } from "lucide-react";

type Offer = {
  id: string;
  name: string;
  type: string;
  status: string;
  volume: number;
  raised: number;
  progress: number;
  minTicket: number;
  deadline: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

const STATUS_LABEL: Record<string, string> = {
  EM_TRIAGEM: "Triagem",
  EM_CAPTACAO: "Em Captação",
  COMPLETA: "Completa",
  ADIMPLENTE: "Adimplente",
  INADIMPLENTE: "Inadimplente",
};

const STATUS_COLOR: Record<string, string> = {
  EM_TRIAGEM: "bg-amber-100 text-amber-700",
  EM_CAPTACAO: "bg-blue-100 text-blue-700",
  COMPLETA: "bg-green-100 text-green-700",
  ADIMPLENTE: "bg-emerald-100 text-emerald-700",
  INADIMPLENTE: "bg-red-100 text-red-700",
};

// Bridge pré-deploy: o pipeline HubSpot fica em metadata.hubspotPipeline (JSON),
// pois o build de produção ainda não conhece o enum EM_TRIAGEM. Enquanto o deal
// estiver no status legado EM_CAPTACAO mas marcado no pipeline de TRIAGEM,
// o badge exibe "Triagem".
function offerBadge(offer: Offer): { label: string; color: string } {
  const pipeline = offer.metadata?.hubspotPipeline as string | undefined;
  if (offer.status === "EM_CAPTACAO" && pipeline === "TRIAGEM") {
    return { label: "Triagem", color: "bg-amber-100 text-amber-700" };
  }
  return {
    label: STATUS_LABEL[offer.status] ?? offer.status,
    color: STATUS_COLOR[offer.status] ?? "bg-gray-100 text-gray-600",
  };
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function DealCard({ offer }: { offer: Offer }) {
  const empresaNome = (offer.metadata?.empresaNome as string) || offer.name;
  const setor = (offer.metadata?.empresaSetor as string) || "—";
  const badge = offerBadge(offer);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{empresaNome}</p>
            <p className="text-xs text-gray-400 mt-0.5">{setor}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span className="flex items-center gap-1"><TrendingUp size={12} /> Captação</span>
          <span className="font-medium text-gray-700">{offer.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(offer.progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>{formatBRL(offer.raised)} captados</span>
          <span>{formatBRL(offer.volume)} meta</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Prazo: {formatDate(offer.deadline)}
        </span>
        <span className="font-medium text-gray-600">{offer.type === "RCVM_175" ? "RCVM 175" : "RCVM 88"}</span>
      </div>
    </div>
  );
}

export default function MeusDealsClient({ offers }: { offers: Offer[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Meus Deals</h1>
            <p className="text-sm text-gray-500">{offers.length} {offers.length === 1 ? "operação" : "operações"}</p>
          </div>
        </div>
        <Link
          href="/deals/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Deal</span>
        </Link>
      </div>

      {/* Empty state */}
      {offers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={28} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Nenhum deal ainda</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Você ainda não cadastrou nenhuma operação. Clique em "Novo Deal" para começar.
          </p>
          <Link
            href="/deals/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Novo Deal
          </Link>
        </div>
      )}

      {/* Cards grid */}
      {offers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <DealCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
