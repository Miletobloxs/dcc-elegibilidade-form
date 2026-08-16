"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, TrendingUp } from "lucide-react";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
}

export default function CadastroInvestidorPage() {
  // Empresa
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  // Contato / acesso
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Aceites (planilha: Termos de Uso + NDA para todas as personas; Minuta só sell side)
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [ndaAceito, setNdaAceito] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!companyName.trim()) return "Informe o nome da empresa.";
    if (cnpj.replace(/\D/g, "").length !== 14) return "Informe um CNPJ válido.";
    if (!firstName.trim() || !lastName.trim()) return "Informe nome e sobrenome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail corporativo válido.";
    if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (password !== confirmPassword) return "As senhas não coincidem.";
    if (!termosAceitos) return "É necessário aceitar os Termos de Uso.";
    if (!ndaAceito) return "É necessário aceitar o NDA.";
    return null;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "BUY",
          companyName: companyName.trim(),
          cnpj: cnpj.replace(/\D/g, ""),
          razaoSocial: razaoSocial.trim(),
          cidade: cidade.trim(),
          estado,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          termosAceitos,
          ndaAceito,
          minutaAceita: false,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Erro desconhecido.");

      setSuccess(true);

      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (loginError) {
        window.location.href = "/login?redirectTo=/onboarding/investidor";
        return;
      }
      window.location.href = "/onboarding/investidor";
    } catch (err: any) {
      setError(err.message || "Erro ao processar o cadastro.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm text-gray-900 placeholder-gray-400 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";
  const sectionTitle = "text-xs font-bold text-gray-400 uppercase tracking-widest";

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Parabéns, sua conta Bloxs foi criada</h1>
          <p className="text-sm text-gray-500 mt-2">Vamos personalizar suas preferências...</p>
          <Loader2 size={18} className="animate-spin text-blue-600 mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-gray-100 p-6 sm:p-10">
        <Link
          href="/cadastro"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          Escolher outro tipo de conta
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Cadastro Buy-Side</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Crie sua conta de investidor para receber oportunidades alinhadas à sua tese.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Empresa */}
          <div>
            <p className={`${sectionTitle} mb-3`}>Sua empresa</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome da empresa *</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nome fantasia" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CNPJ *</label>
                <input type="text" inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Razão social</label>
                <input type="text" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Razão social" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cidade</label>
                <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
                  <option value="">Selecionar</option>
                  {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contato / acesso */}
          <div>
            <p className={`${sectionTitle} mb-3`}>Seus dados de acesso</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Sobrenome *</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>E-mail corporativo *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" autoComplete="email" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Senha *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirmar senha *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Aceites */}
          <div>
            <p className={`${sectionTitle} mb-3`}>Termos e assinaturas</p>
            <div className="space-y-2.5">
              {[
                {
                  checked: termosAceitos,
                  toggle: () => setTermosAceitos(!termosAceitos),
                  label: "Li e aceito os Termos de Uso da plataforma Bloxs.",
                },
                {
                  checked: ndaAceito,
                  toggle: () => setNdaAceito(!ndaAceito),
                  label: "Li e aceito o Acordo de Confidencialidade (NDA).",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.toggle}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left text-sm transition-all ${
                    item.checked
                      ? "border-blue-300 bg-blue-50/50 text-gray-900"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      item.checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                    }`}
                  >
                    {item.checked && (
                      <svg viewBox="0 0 10 8" className="w-3 h-2.5" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-500 mt-6">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
