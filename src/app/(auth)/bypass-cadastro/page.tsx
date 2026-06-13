"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, ArrowLeft,
  Building2, User, Lock, ChevronDown
} from "lucide-react";

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
}

function formatCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "");
  if (d.length <= 10)
    return d.slice(0, 10).replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
  return d.slice(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY_CATEGORIES = [
  "Administração de Carteiras",
  "Administração de Recursos",
  "Agente Autônomo",
  "Banco Comercial",
  "Banco de Investimento",
  "Boutique de Investimentos",
  "Corretoras",
  "Family Office",
  "Fintech",
  "Firmas de Consultoria",
  "Formação de Mercado",
  "Fundo de Hedge",
  "Fundos de Pensão",
  "Fundos Mútuos",
  "Fundos Patrimoniais",
  "Fundos Soberanos",
  "Gestão de Ativos",
  "Gestão de Recursos",
  "Instituição Financeira",
  "Outro/Não especificado",
  "Pesquisa de Ações",
  "Private Equity",
  "Securitização",
  "Seguros",
  "Vendas e Negociação",
  "Venture Capital",
];

const STEPS = [
  { label: "Empresa", icon: Building2 },
  { label: "Representante", icon: User },
  { label: "Acesso", icon: Lock },
];

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", placeholder, required = true, children, autoComplete
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
  children?: React.ReactNode; autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || " "}
        required={required}
        autoComplete={autoComplete}
        className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-slate-200 text-sm text-[#0B1636]
                   placeholder-transparent focus:border-[#2F5CFF] focus:ring-2 focus:ring-[#2F5CFF]/20
                   outline-none transition-all bg-white"
      />
      <label className="absolute left-4 top-2 text-[11px] font-medium text-[#2F5CFF] pointer-events-none
                        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                        peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2F5CFF] transition-all">
        {label}{required && "*"}
      </label>
      {children}
    </div>
  );
}

// ─── Select Component ─────────────────────────────────────────────────────────

function SelectField({
  label, value, onChange, options, placeholder = "Selecione"
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-slate-200 text-sm text-[#0B1636]
                   focus:border-[#2F5CFF] focus:ring-2 focus:ring-[#2F5CFF]/20 outline-none
                   transition-all bg-white appearance-none cursor-pointer"
      >
        <option value="" disabled></option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <label className={`absolute left-4 pointer-events-none transition-all font-medium
        ${value ? "top-2 text-[11px] text-[#2F5CFF]" : "top-3.5 text-sm text-slate-400"}`}>
        {label}*
      </label>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BypassCadastroPage() {
  const [step, setStep] = useState(0);

  // Step 0 - Company
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [categoria, setCategoria] = useState("");

  // Step 1 - Representative
  const [repName, setRepName] = useState("");
  const [repCpf, setRepCpf] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repRole, setRepRole] = useState("");

  // Step 2 - Credentials
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(): string | null {
    if (step === 0) {
      if (!cnpj || cnpj.replace(/\D/g, "").length !== 14) return "CNPJ inválido. Verifique o número.";
      if (!razaoSocial.trim()) return "Razão Social é obrigatória.";
      if (!categoria) return "Selecione a categoria da empresa.";
    }
    if (step === 1) {
      if (!repName.trim()) return "Nome do representante é obrigatório.";
      if (!repCpf || repCpf.replace(/\D/g, "").length !== 11) return "CPF inválido.";
      if (!repEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(repEmail)) return "E-mail inválido.";
      const phoneLen = repPhone.replace(/\D/g, "").length;
      if (phoneLen < 10 || phoneLen > 11) return "Telefone inválido.";
      if (!repRole.trim()) return "Cargo/Função é obrigatório.";
    }
    if (step === 2) {
      if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
      if (password !== confirmPassword) return "As senhas não coincidem.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/bypass-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Company (Step 0)
          cnpj: cnpj.replace(/\D/g, ""),
          name: razaoSocial.trim(),
          companyName: razaoSocial.trim(),
          categoria,
          // Representative (Step 1)
          representativeName: repName.trim(),
          representativeCpf: repCpf.replace(/\D/g, ""),
          email: repEmail.trim().toLowerCase(),
          phone: repPhone.replace(/\D/g, ""),
          representativeRole: repRole.trim(),
          // Credentials (Step 2)
          password,
          type: "JURIDICA",
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Erro desconhecido.");

      setSuccess(true);

      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: repEmail.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        setError("Cadastro realizado! Login automático falhou: " + loginError.message);
        setLoading(false);
        return;
      }

      setTimeout(() => {
        window.location.href = "/deals/new";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao processar o cadastro.");
      setLoading(false);
    }
  }

  // ── Step content ────────────────────────────────────────────────────────────

  const stepColors = [
    "from-[#6B9FFF] to-[#2F5CFF]",
    "from-[#4D80FF] to-[#1C3FA0]",
    "from-[#1C3FA0] to-[#0B1636]",
  ];

  return (
    <div className="w-full max-w-[900px] bg-white rounded-[28px] shadow-2xl shadow-blue-900/10 border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[560px] animate-in fade-in zoom-in duration-300">

      {/* ── Left panel ── */}
      <div className="w-full md:w-[58%] p-8 md:p-10 flex flex-col">

        <div className="mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 112 28" className="h-7 w-auto">
            <path fill="#032952" d="M71.3564 22.8712C67.581 22.8712 66.4493 20.2289 66.4493 17.5865C66.4493 14.9442 67.5823 12.3018 71.3564 12.3018C75.1304 12.3018 76.2634 14.9442 76.2634 17.5865C76.2634 20.2289 75.1304 22.8712 71.3564 22.8712ZM71.3564 8.15009C65.3163 8.15009 61.9199 11.9254 61.9199 17.5865C61.9199 23.2476 65.3176 27.0229 71.3564 27.0229C77.3951 27.0229 80.7928 23.2476 80.7928 17.5865C80.7928 11.9254 77.3951 8.15009 71.3564 8.15009Z"></path>
            <path fill="#032952" d="M105.707 15.6982C103.857 15.1695 103.443 14.4779 103.443 13.8724C103.443 13.0558 104.198 12.3005 105.707 12.3005C106.811 12.3005 108.015 12.5727 109.123 13.2837L111.695 10.3666C109.967 8.78562 108 8.14749 105.33 8.14749C101.178 8.14749 98.9121 10.601 98.9121 13.9987C98.9121 17.5839 101.932 18.7169 104.952 19.4722C107.464 20.1 107.595 20.7146 107.595 21.3593C107.595 22.0039 106.839 22.8686 105.33 22.8686C104.022 22.8686 102.715 22.5834 101.583 21.8333L98.9629 24.8038C100.712 26.4044 103.348 27.0204 105.709 27.0204C110.238 27.0204 112.126 23.8115 112.126 21.358C112.126 17.2063 108.351 16.4509 105.709 15.6956"></path>
            <path fill="#032952" d="M93.062 8.52646L89.0978 14.392L85.1349 8.52646H80.0391L86.4854 17.5865L80.0391 26.6453H85.1349L89.0978 20.7798L93.062 26.6453H98.1579L91.7115 17.5865L98.1579 8.52646H93.062Z"></path>
            <path fill="#032952" d="M59.6544 5.50644H55.125V26.6453H59.6544V5.50644Z"></path>
            <path fill="#032952" d="M46.2552 22.4936H38.517V18.153H46.2552C47.6708 18.153 48.3311 19.1271 48.3311 20.3226C48.3311 21.5182 47.6708 22.4936 46.2552 22.4936ZM38.517 9.65945H44.7446C46.1602 9.65945 46.8204 10.6336 46.8204 11.8304C46.8204 13.0272 46.1602 14 44.7446 14H38.517V9.65945ZM49.8418 15.3218C50.5971 14.5665 51.3511 13.0988 51.3511 11.8304C51.3511 8.34413 48.8025 5.50774 44.7446 5.50774H33.9863V26.6466H46.254C50.3119 26.6466 52.8605 23.8102 52.8605 20.3239C52.8605 17.5878 51.3511 16.0772 49.8405 15.3218"></path>
            <path fill="#032952" d="M3.42243 26.6453H19.679C22.9868 26.6453 25.6682 23.9639 25.6682 20.656C25.6682 17.3482 22.9868 14.6668 19.679 14.6668H5.13365C2.29855 14.6668 0 16.9653 0 19.8004V23.2229C0 25.1125 1.5328 26.6453 3.42243 26.6453Z"></path>
            <path fill="#2E61FF" d="M5.13365 12.9556H19.679C22.9868 12.9556 25.6682 10.2741 25.6682 6.96631C25.6682 3.65848 22.9868 0.977051 19.679 0.977051H3.42243C1.5328 0.977051 0 2.50985 0 4.39948V15.288C1.25541 13.862 3.08904 12.9556 5.13365 12.9556Z"></path>
          </svg>
        </div>

        {/* Step indicator */}
        {!success && (
          <div className="flex items-center gap-1 mb-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all
                    ${isActive ? "bg-[#2F5CFF] text-white shadow-md shadow-blue-400/20" :
                      isDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <Icon size={10} />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-4 rounded-full transition-all ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Heading */}
        {!success && (
          <>
            <h1 className="text-[24px] font-extrabold text-[#0B1636] tracking-tight leading-tight mb-1">
              {step === 0 && "Cadastre sua empresa"}
              {step === 1 && "Dados do representante"}
              {step === 2 && "Crie seu acesso"}
            </h1>
            <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">
              {step === 0 && "Insira as informações da empresa para iniciar o cadastro."}
              {step === 1 && "Dados do responsável legal pela empresa no Bloxs."}
              {step === 2 && "Configure a senha para acessar a plataforma."}
            </p>
          </>
        )}

        {/* ── Success state ── */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={34} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B1636]">Cadastro Aprovado!</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                O originador foi registrado com status <span className="font-semibold text-emerald-600">ATIVO</span> — Bypass KYB aplicado.
              </p>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-[#2F5CFF]" />
              Redirecionando para a plataforma...
            </p>
            <button
              onClick={() => window.location.href = "/deals/new"}
              className="bg-[#2F5CFF] hover:bg-[#1C46E2] text-white font-semibold text-sm py-3 px-6 rounded-full
                         flex items-center gap-2 shadow-md shadow-blue-400/20 transition-colors cursor-pointer"
            >
              Acessar Workspace <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="flex-1 flex flex-col">

            <div className="space-y-3 flex-1">

              {/* ── Step 0: Company ── */}
              {step === 0 && (
                <>
                  <Field label="CNPJ" value={cnpj} onChange={(v) => setCnpj(formatCNPJ(v))} placeholder=" " />
                  <Field label="Razão Social" value={razaoSocial} onChange={setRazaoSocial} placeholder=" " />
                  <SelectField label="Categoria da Empresa" value={categoria} onChange={setCategoria} options={COMPANY_CATEGORIES} />
                </>
              )}

              {/* ── Step 1: Representative ── */}
              {step === 1 && (
                <>
                  <Field label="Nome Completo" value={repName} onChange={setRepName} placeholder=" " />
                  <Field label="CPF" value={repCpf} onChange={(v) => setRepCpf(formatCPF(v))} placeholder=" " />
                  <Field label="E-mail" value={repEmail} onChange={setRepEmail} type="email" placeholder=" " autoComplete="username" />
                  <Field label="Telefone" value={repPhone} onChange={(v) => setRepPhone(formatPhone(v))} placeholder=" " />
                  <Field label="Cargo / Função" value={repRole} onChange={setRepRole} placeholder=" " />
                </>
              )}

              {/* ── Step 2: Credentials ── */}
              {step === 2 && (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-2">
                    <p className="text-xs text-blue-700 font-medium">Login com o e-mail informado:</p>
                    <p className="text-sm text-[#0B1636] font-semibold mt-0.5">{repEmail}</p>
                  </div>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=" "
                      autoComplete="new-password"
                      className="peer w-full px-4 pt-5 pb-2 pr-11 rounded-xl border border-slate-200 text-sm text-[#0B1636]
                                 placeholder-transparent focus:border-[#2F5CFF] focus:ring-2 focus:ring-[#2F5CFF]/20
                                 outline-none transition-all bg-white"
                    />
                    <label className="absolute left-4 top-2 text-[11px] font-medium text-[#2F5CFF] pointer-events-none
                                      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                                      peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2F5CFF] transition-all">
                      Senha*
                    </label>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder=" "
                      autoComplete="new-password"
                      className="peer w-full px-4 pt-5 pb-2 pr-11 rounded-xl border border-slate-200 text-sm text-[#0B1636]
                                 placeholder-transparent focus:border-[#2F5CFF] focus:ring-2 focus:ring-[#2F5CFF]/20
                                 outline-none transition-all bg-white"
                    />
                    <label className="absolute left-4 top-2 text-[11px] font-medium text-[#2F5CFF] pointer-events-none
                                      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                                      peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2F5CFF] transition-all">
                      Confirmar Senha*
                    </label>
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Mínimo de 8 caracteres.</p>
                </>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium mt-3">
                {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-2 mt-5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-full border border-slate-200 text-sm text-slate-600 font-medium
                             hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="relative flex-1 bg-[#2F5CFF] hover:bg-[#1C46E2] active:scale-[0.99] disabled:opacity-50
                           disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-6 rounded-full
                           flex items-center justify-center transition-all shadow-lg shadow-blue-500/15 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{step === 2 ? "Criar conta" : "Avançar"}</span>
                    <div className="absolute right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2F5CFF] shadow-sm">
                      <ArrowRight size={15} />
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Login link */}
            <p className="text-center text-xs text-slate-400 mt-4">
              Já tem uma conta Bloxs?{" "}
              <a href="/login" className="text-[#2F5CFF] font-medium hover:underline">Fazer Login</a>
            </p>
          </form>
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="hidden md:flex w-[42%] relative overflow-hidden flex-col">
        <div className={`absolute inset-0 bg-gradient-to-br ${stepColors[step] ?? stepColors[0]} transition-all duration-500`} />

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 flex flex-col h-full p-10 justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
              {(() => {
                const Icon = STEPS[step]?.icon || Building2;
                return <Icon size={22} className="text-white" />;
              })()}
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">
              {step === 0 && "Acesse o mercado de capitais com segurança"}
              {step === 1 && "Transparência e conformidade regulatória"}
              {step === 2 && "Seu workspace está quase pronto"}
            </h2>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              {step === 0 && "Insira os dados da sua empresa para iniciar a jornada no Bloxs Workspace."}
              {step === 1 && "O representante legal é responsável pelas operações na plataforma."}
              {step === 2 && "Configure o acesso seguro para você e sua equipe no Bloxs."}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
