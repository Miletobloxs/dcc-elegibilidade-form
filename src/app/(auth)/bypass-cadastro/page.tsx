"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, ArrowLeft,
  Building2, User, MapPin, Lock, ChevronDown
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

function formatCEP(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
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

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const STEPS = [
  { label: "Empresa", icon: Building2 },
  { label: "Representante", icon: User },
  { label: "Endereço", icon: MapPin },
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

  // Step 1 - Company
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [categoria, setCategoria] = useState("");

  // Step 2 - Representative
  const [repName, setRepName] = useState("");
  const [repCpf, setRepCpf] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repRole, setRepRole] = useState("");

  // Step 3 - Address
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  // Step 4 - Credentials
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── CEP lookup ──────────────────────────────────────────────────────────────
  async function handleCepBlur() {
    const raw = cep.replace(/\D/g, "");
    if (raw.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "");
      }
    } catch {}
  }

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
      if (!cep || cep.replace(/\D/g, "").length !== 8) return "CEP inválido.";
      if (!logradouro.trim()) return "Logradouro é obrigatório.";
      if (!numero.trim()) return "Número é obrigatório.";
      if (!bairro.trim()) return "Bairro é obrigatório.";
      if (!cidade.trim()) return "Cidade é obrigatória.";
      if (!estado) return "Estado é obrigatório.";
    }
    if (step === 3) {
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
          // Company (Step 1)
          cnpj: cnpj.replace(/\D/g, ""),
          name: razaoSocial.trim(),
          companyName: razaoSocial.trim(),
          categoria,
          // Representative (Step 2)
          representativeName: repName.trim(),
          representativeCpf: repCpf.replace(/\D/g, ""),
          email: repEmail.trim().toLowerCase(),
          phone: repPhone.replace(/\D/g, ""),
          representativeRole: repRole.trim(),
          // Address (Step 3)
          address: {
            cep: cep.replace(/\D/g, ""),
            logradouro: logradouro.trim(),
            numero: numero.trim(),
            complemento: complemento.trim(),
            bairro: bairro.trim(),
            cidade: cidade.trim(),
            estado,
          },
          // Credentials (Step 4)
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

  const stepColors = ["from-[#6B9FFF] to-[#2F5CFF]", "from-[#4D80FF] to-[#1C3FA0]", "from-[#3264DD] to-[#0B2478]", "from-[#1C3FA0] to-[#0B1636]"];

  return (
    <div className="w-full max-w-[900px] bg-white rounded-[28px] shadow-2xl shadow-blue-900/10 border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in duration-300">

      {/* ── Left panel ── */}
      <div className="w-full md:w-[58%] p-8 md:p-10 flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-[#0B1636]" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="2" width="8" height="8" rx="2" />
            <rect x="14" y="2" width="8" height="8" rx="2" fillOpacity="0.75" />
            <rect x="2" y="14" width="8" height="8" rx="2" fillOpacity="0.75" />
            <rect x="14" y="14" width="8" height="8" rx="2" fillOpacity="0.35" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-[#0B1636]">Bloxs</span>
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
              {step === 2 && "Endereço da empresa"}
              {step === 3 && "Crie seu acesso"}
            </h1>
            <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">
              {step === 0 && "Insira as informações da empresa para iniciar o cadastro."}
              {step === 1 && "Dados do responsável legal pela empresa no Bloxs."}
              {step === 2 && "Informe o endereço comercial da empresa."}
              {step === 3 && "Configure a senha para acessar a plataforma."}
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
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="flex-1 flex flex-col">

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

              {/* ── Step 2: Address ── */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={cep}
                          onChange={(e) => setCep(formatCEP(e.target.value))}
                          onBlur={handleCepBlur}
                          placeholder=" "
                          className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-slate-200 text-sm text-[#0B1636]
                                     placeholder-transparent focus:border-[#2F5CFF] focus:ring-2 focus:ring-[#2F5CFF]/20
                                     outline-none transition-all bg-white"
                        />
                        <label className="absolute left-4 top-2 text-[11px] font-medium text-[#2F5CFF] pointer-events-none
                                          peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400
                                          peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2F5CFF] transition-all">
                          CEP*
                        </label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Field label="Logradouro" value={logradouro} onChange={setLogradouro} placeholder=" " />
                    </div>
                    <Field label="Número" value={numero} onChange={setNumero} placeholder=" " />
                    <Field label="Complemento" value={complemento} onChange={setComplemento} placeholder=" " required={false} />
                    <div className="col-span-2">
                      <Field label="Bairro" value={bairro} onChange={setBairro} placeholder=" " />
                    </div>
                    <Field label="Cidade" value={cidade} onChange={setCidade} placeholder=" " />
                    <SelectField label="Estado" value={estado} onChange={setEstado} options={ESTADOS} placeholder="UF" />
                  </div>
                </>
              )}

              {/* ── Step 3: Credentials ── */}
              {step === 3 && (
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
                    <span>{step === 3 ? "Criar conta" : "Avançar"}</span>
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
        <div className={`absolute inset-0 bg-gradient-to-br ${stepColors[step]} transition-all duration-500`} />

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
              {step === 2 && "Verificamos cada detalhe da sua empresa"}
              {step === 3 && "Seu workspace está quase pronto"}
            </h2>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              {step === 0 && "Insira os dados da sua empresa para iniciar a jornada no Bloxs Workspace."}
              {step === 1 && "O representante legal é responsável pelas operações na plataforma."}
              {step === 2 && "Utilizamos seu endereço para verificação cadastral e compliance."}
              {step === 3 && "Configure o acesso seguro para você e sua equipe no Bloxs."}
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
