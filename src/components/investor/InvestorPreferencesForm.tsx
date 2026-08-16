"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Info, Loader2, X, CheckCircle2 } from "lucide-react";
import {
  SETORES_INTERESSE,
  INSTRUMENTOS_INTERESSE,
  SEGMENTOS_POR_SETOR,
  ESTADOS,
  UF_LABELS,
  CARGOS,
} from "@/lib/investor";

type SegmentsBySector = Record<string, string[]>;

type ProfileInput = {
  sectors: string[];
  instruments: string[];
  segmentsBySector: SegmentsBySector | null;
  sectorOther: string | null;
  segmentOther: string | null;
  geoPreferences: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  minRemuneration: string | null;
  requiresStructurer: boolean | null;
  minSalesPercent: number | null;
  minWorksProgress: number | null;
  dealmatchObs: string | null;
  cellphone: string | null;
  cpf: string | null;
  jobTitle: string | null;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function formatCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
}

// ── Controles reutilizáveis ──────────────────────────────────────────────────

function PillCheckbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
        checked
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      }`}
    >
      <span
        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
          checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function MultiSelectDropdown({
  placeholder,
  options,
  selected,
  onChange,
}: {
  placeholder: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);

  return (
    <div className="relative max-w-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-left outline-none focus:border-blue-500 transition-all"
      >
        <span className={`truncate ${selectedLabels.length ? "text-gray-900" : "text-gray-400"}`}>
          {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
        </span>
        <ChevronDown size={15} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto py-1">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors ${
                    checked ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  progress,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  progress: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-gray-500">{progress}%</span>
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

// ── Formulário ───────────────────────────────────────────────────────────────

export default function InvestorPreferencesForm({
  initialProfile,
  mode,
}: {
  initialProfile: ProfileInput;
  mode: "onboarding" | "edit";
}) {
  const router = useRouter();

  // Personalize seu perfil (contato)
  const [cellphone, setCellphone] = useState(initialProfile.cellphone || "");
  const [cpf, setCpf] = useState(initialProfile.cpf || "");
  const [jobTitle, setJobTitle] = useState(initialProfile.jobTitle || "");
  // Preferências de alocação
  const [instruments, setInstruments] = useState<string[]>(initialProfile.instruments || []);
  const [sectors, setSectors] = useState<string[]>(initialProfile.sectors || []);
  const [segmentsBySector, setSegmentsBySector] = useState<SegmentsBySector>(
    (initialProfile.segmentsBySector as SegmentsBySector) || {}
  );
  const [sectorOther, setSectorOther] = useState(initialProfile.sectorOther || "");
  const [segmentOther, setSegmentOther] = useState(initialProfile.segmentOther || "");
  const [geo, setGeo] = useState<string[]>(initialProfile.geoPreferences || []);
  const [ticketMin, setTicketMin] = useState<number | "">(initialProfile.ticketMin ?? "");
  const [ticketMax, setTicketMax] = useState<number | "">(initialProfile.ticketMax ?? "");
  const [minRemuneration, setMinRemuneration] = useState(initialProfile.minRemuneration || "");
  const [requiresStructurer, setRequiresStructurer] = useState<boolean | null>(
    initialProfile.requiresStructurer
  );
  const [minSalesPercent, setMinSalesPercent] = useState<number | "">(
    initialProfile.minSalesPercent ?? ""
  );
  const [minWorksProgress, setMinWorksProgress] = useState<number | "">(
    initialProfile.minWorksProgress ?? ""
  );
  const [dealmatchObs, setDealmatchObs] = useState(initialProfile.dealmatchObs || "");

  const [openSection, setOpenSection] = useState<string | null>("alocacao");
  const [showSkipHint, setShowSkipHint] = useState(mode === "onboarding");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImobiliario = sectors.includes("Imobiliário");
  const isOutros = sectors.includes("Outros");

  const toggleSection = (key: string) => setOpenSection(openSection === key ? null : key);

  const toggleSector = (s: string) => {
    if (sectors.includes(s)) {
      setSectors(sectors.filter((i) => i !== s));
      // limpa segmentos do setor removido
      const groupKey = Object.keys(SEGMENTOS_POR_SETOR).find(
        (k) => SEGMENTOS_POR_SETOR[k].sector === s
      );
      if (groupKey) {
        const next = { ...segmentsBySector };
        delete next[groupKey];
        setSegmentsBySector(next);
      }
    } else {
      setSectors([...sectors, s]);
    }
  };

  // Progresso por seção
  const progress = useMemo(() => {
    const pct = (filled: number, total: number) => Math.round((filled / total) * 100);
    const alocacaoFields = [
      instruments.length > 0,
      sectors.length > 0,
      geo.length > 0,
      ticketMin !== "" || ticketMax !== "",
      !!minRemuneration,
      requiresStructurer !== null,
    ];
    return {
      perfil: pct([cellphone, cpf, jobTitle].filter(Boolean).length, 3),
      alocacao: pct(alocacaoFields.filter(Boolean).length, alocacaoFields.length),
    };
  }, [cellphone, cpf, jobTitle, instruments, sectors, geo, ticketMin, ticketMax, minRemuneration, requiresStructurer]);

  const overall = Math.round((progress.perfil + progress.alocacao) / 2);

  async function save(markDone: boolean) {
    if (mode === "onboarding" && !cellphone.trim() && markDone && overall > 0) {
      // celular é obrigatório na planilha, mas permitimos pular o onboarding inteiro
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/investor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cellphone: cellphone || null,
          cpf: cpf || null,
          jobTitle: jobTitle || null,
          instruments,
          sectors,
          segmentsBySector,
          sectorOther: sectorOther || null,
          segmentOther: segmentOther || null,
          geoPreferences: geo,
          ticketMin: ticketMin === "" ? null : Number(ticketMin),
          ticketMax: ticketMax === "" ? null : Number(ticketMax),
          minRemuneration: minRemuneration || null,
          requiresStructurer,
          minSalesPercent: minSalesPercent === "" ? null : Number(minSalesPercent),
          minWorksProgress: minWorksProgress === "" ? null : Number(minWorksProgress),
          dealmatchObs: dealmatchObs || null,
          onboardingDone: markDone ? true : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Erro ao salvar. Tente novamente.");
        setSaving(false);
        return;
      }
      if (mode === "onboarding") {
        router.push("/oportunidades");
        router.refresh();
      } else {
        setSaved(true);
        setSaving(false);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none bg-white focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <div className="relative">
      {/* Toast de pular etapa (onboarding) */}
      {showSkipHint && (
        <div className="absolute -top-2 right-0 z-30 bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl flex items-start gap-3 max-w-xs">
          <div>
            <button
              type="button"
              onClick={() => save(true)}
              className="text-sm font-semibold hover:underline text-left"
            >
              Clique aqui para pular esta etapa
            </button>
            <p className="text-xs text-gray-300 mt-0.5">Você pode preencher esta etapa mais tarde.</p>
          </div>
          <button type="button" onClick={() => setShowSkipHint(false)} className="text-gray-400 hover:text-white shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {mode === "onboarding" ? "Estamos quase lá..." : "Minhas Preferências"}
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              {mode === "onboarding"
                ? "Adicione as informações sobre você e seus interesses. Você pode pular algumas etapas se quiser."
                : "Ajuste seus critérios para receber oportunidades mais certeiras."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full border-2 border-blue-500 text-blue-600 text-xs font-bold flex items-center justify-center">
              03
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Dealmatch</p>
              <p className="text-xs text-gray-400 max-w-[200px]">
                Responda para receber recomendações certas.
              </p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-gray-100 rounded-full mt-5 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.max(overall, 4)}%` }} />
        </div>
      </div>

      {/* Seções */}
      <div className="space-y-3">
        <SectionCard
          title="Personalize seu perfil"
          subtitle="Dados de contato de quem usa a plataforma."
          progress={progress.perfil}
          open={openSection === "perfil"}
          onToggle={() => toggleSection("perfil")}
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Celular *</label>
              <input
                type="tel"
                value={cellphone}
                onChange={(e) => setCellphone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CPF</label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cargo</label>
              <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass}>
                <option value="">Selecionar</option>
                {CARGOS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Preferências de alocação"
          subtitle="Ajude-nos a entender quais oportunidades fazem mais sentido para você."
          progress={progress.alocacao}
          open={openSection === "alocacao"}
          onToggle={() => toggleSection("alocacao")}
        >
          <div className="space-y-5">
            {/* Tipo de ativo */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2.5">Tipo de ativo de interesse</p>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTOS_INTERESSE.map((i) => (
                  <PillCheckbox
                    key={i}
                    label={i}
                    checked={instruments.includes(i)}
                    onToggle={() =>
                      setInstruments(
                        instruments.includes(i)
                          ? instruments.filter((x) => x !== i)
                          : [...instruments, i]
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Setores */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2.5">Setores de interesse</p>
              <div className="flex flex-wrap gap-2">
                {SETORES_INTERESSE.map((s) => (
                  <PillCheckbox key={s} label={s} checked={sectors.includes(s)} onToggle={() => toggleSector(s)} />
                ))}
              </div>
              {isOutros && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={sectorOther}
                    onChange={(e) => setSectorOther(e.target.value)}
                    placeholder="Qual setor?"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={segmentOther}
                    onChange={(e) => setSegmentOther(e.target.value)}
                    placeholder="Qual segmento?"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Segmentos condicionais por setor */}
            {Object.entries(SEGMENTOS_POR_SETOR)
              .filter(([, group]) => sectors.includes(group.sector))
              .map(([key, group]) => (
                <div key={key}>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Segmento de interesse <span className="text-gray-400 font-normal">[{group.sector}]</span>
                  </p>
                  <MultiSelectDropdown
                    placeholder="Selecionar"
                    options={group.options}
                    selected={segmentsBySector[key] || []}
                    onChange={(next) => setSegmentsBySector({ ...segmentsBySector, [key]: next })}
                  />
                </div>
              ))}

            {/* Localização */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Localização de preferência</p>
              <MultiSelectDropdown
                placeholder="Selecionar estados"
                options={ESTADOS.map((uf) => ({ value: uf, label: UF_LABELS[uf] }))}
                selected={geo}
                onChange={setGeo}
              />
            </div>

            {/* Cheques */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2.5">Cheque por operação</p>
              <div className="flex items-center gap-3 max-w-md">
                <input
                  type="number"
                  min={0}
                  value={ticketMin}
                  onChange={(e) => setTicketMin(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Cheque mínimo (R$)"
                  className={inputClass}
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  min={0}
                  value={ticketMax}
                  onChange={(e) => setTicketMax(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Cheque máximo (R$)"
                  className={inputClass}
                />
              </div>
              {ticketMin !== "" && ticketMax !== "" && Number(ticketMax) < Number(ticketMin) && (
                <p className="text-xs text-red-500 mt-1.5">O cheque máximo deve ser maior que o mínimo.</p>
              )}
              {(ticketMin !== "" || ticketMax !== "") && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {ticketMin !== "" ? formatBRL(Number(ticketMin)) : "—"} até{" "}
                  {ticketMax !== "" ? formatBRL(Number(ticketMax)) : "—"}
                </p>
              )}
            </div>

            {/* Remuneração mínima */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                Remuneração mínima
                <span className="group relative">
                  <Info size={13} className="text-gray-400" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-56 z-10">
                    Informe a taxa de remuneração da operação. Exemplos: CDI + X% ou IPCA + X%.
                  </span>
                </span>
              </p>
              <input
                type="text"
                value={minRemuneration}
                onChange={(e) => setMinRemuneration(e.target.value)}
                placeholder="Insira o valor"
                className={`${inputClass} max-w-md`}
              />
            </div>

            {/* Condicionais Imobiliário */}
            {isImobiliario && (
              <>
                {[
                  { label: "Avanço de obras mínimo", value: minWorksProgress, set: setMinWorksProgress },
                  { label: "Porcentagem mínima de vendas", value: minSalesPercent, set: setMinSalesPercent },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      {field.label} <span className="text-gray-400 font-normal">[Imobiliário]</span>
                    </p>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5 max-w-md">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                    <div className="max-w-md space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={field.value === "" ? 0 : field.value}
                        onChange={(e) => field.set(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="relative max-w-[160px]">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.set(v === "" ? "" : Math.min(100, Math.max(0, Number(v))));
                          }}
                          placeholder="0"
                          className={`${inputClass} pr-8`}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Co-estruturação */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2.5">Necessita co-estruturar?</p>
              <div className="flex gap-2">
                {[
                  { label: "Sim", value: true },
                  { label: "Não", value: false },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setRequiresStructurer(opt.value)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                      requiresStructurer === opt.value
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        requiresStructurer === opt.value ? "border-blue-600" : "border-gray-300"
                      }`}
                    >
                      {requiresStructurer === opt.value && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Observações adicionais sobre perfil de alocação
              </p>
              <textarea
                value={dealmatchObs}
                onChange={(e) => setDealmatchObs(e.target.value)}
                placeholder="Conte-nos mais sobre sua tese de investimento..."
                rows={3}
                className={`${inputClass} max-w-xl resize-y`}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Preferências salvas com sucesso.
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between mt-6">
        {mode === "onboarding" ? (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Pular por enquanto
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving || (ticketMin !== "" && ticketMax !== "" && Number(ticketMax) < Number(ticketMin))}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {mode === "onboarding" ? "Continuar" : "Salvar preferências"}
        </button>
      </div>
    </div>
  );
}
