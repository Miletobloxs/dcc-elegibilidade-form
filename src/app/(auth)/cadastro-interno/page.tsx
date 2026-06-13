"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function CadastroInternoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tratador do formulário de e-mail / senha
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    const emailLower = email.toLowerCase();
    const isAllowedDomain = emailLower.endsWith("@bloxs.com.br");

    if (!isAllowedDomain) {
      setError("Apenas e-mails institucionais @bloxs.com.br são permitidos.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/cadastro-interno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao realizar cadastro.");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Erro de cadastro:", err);
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-gray-100 p-8">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 112 28" className="h-9 w-auto">
              <path fill="#032952" d="M71.3564 22.8712C67.581 22.8712 66.4493 20.2289 66.4493 17.5865C66.4493 14.9442 67.5823 12.3018 71.3564 12.3018C75.1304 12.3018 76.2634 14.9442 76.2634 17.5865C76.2634 20.2289 75.1304 22.8712 71.3564 22.8712ZM71.3564 8.15009C65.3163 8.15009 61.9199 11.9254 61.9199 17.5865C61.9199 23.2476 65.3176 27.0229 71.3564 27.0229C77.3951 27.0229 80.7928 23.2476 80.7928 17.5865C80.7928 11.9254 77.3951 8.15009 71.3564 8.15009Z"></path>
              <path fill="#032952" d="M105.707 15.6982C103.857 15.1695 103.443 14.4779 103.443 13.8724C103.443 13.0558 104.198 12.3005 105.707 12.3005C106.811 12.3005 108.015 12.5727 109.123 13.2837L111.695 10.3666C109.967 8.78562 108 8.14749 105.33 8.14749C101.178 8.14749 98.9121 10.601 98.9121 13.9987C98.9121 17.5839 101.932 18.7169 104.952 19.4722C107.464 20.1 107.595 20.7146 107.595 21.3593C107.595 22.0039 106.839 22.8686 105.33 22.8686C104.022 22.8686 102.715 22.5834 101.583 21.8333L98.9629 24.8038C100.712 26.4044 103.348 27.0204 105.709 27.0204C110.238 27.0204 112.126 23.8115 112.126 21.358C112.126 17.2063 108.351 16.4509 105.709 15.6956"></path>
              <path fill="#032952" d="M93.062 8.52646L89.0978 14.392L85.1349 8.52646H80.0391L86.4854 17.5865L80.0391 26.6453H85.1349L89.0978 20.7798L93.062 26.6453H98.1579L91.7115 17.5865L98.1579 8.52646H93.062Z"></path>
              <path fill="#032952" d="M59.6544 5.50644H55.125V26.6453H59.6544V5.50644Z"></path>
              <path fill="#032952" d="M46.2552 22.4936H38.517V18.153H46.2552C47.6708 18.153 48.3311 19.1271 48.3311 20.3226C48.3311 21.5182 47.6708 22.4936 46.2552 22.4936ZM38.517 9.65945H44.7446C46.1602 9.65945 46.8204 10.6336 46.8204 11.8304C46.8204 13.0272 46.1602 14 44.7446 14H38.517V9.65945ZM49.8418 15.3218C50.5971 14.5665 51.3511 13.0988 51.3511 11.8304C51.3511 8.34413 48.8025 5.50774 44.7446 5.50774H33.9863V26.6466H46.254C50.3119 26.6466 52.8605 23.8102 52.8605 20.3239C52.8605 17.5878 51.3511 16.0772 49.8405 15.3218"></path>
              <path fill="#032952" d="M3.42243 26.6453H19.679C22.9868 26.6453 25.6682 23.9639 25.6682 20.656C25.6682 17.3482 22.9868 14.6668 19.679 14.6668H5.13365C2.29855 14.6668 0 16.9653 0 19.8004V23.2229C0 25.1125 1.5328 26.6453 3.42243 26.6453Z"></path>
              <path fill="#2E61FF" d="M5.13365 12.9556H19.679C22.9868 12.9556 25.6682 10.2741 25.6682 6.96631C25.6682 3.65848 22.9868 0.977051 19.679 0.977051H3.42243C1.5328 0.977051 0 2.50985 0 4.39948V15.288C1.25541 13.862 3.08904 12.9556 5.13365 12.9556Z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight text-center">
            Cadastro de Equipe
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Área interna Bloxs / Vortex
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-2 text-green-500">
              <CheckCircle2 size={48} className="stroke-[1.5]" />
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-800">
              <p className="font-semibold mb-1">Cadastro concluído!</p>
              <p className="text-xs text-green-700">
                Sua conta de administrador foi criada. Você já pode fazer login na plataforma.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors mt-2"
            >
              Ir para o Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu Nome"
                  required
                  autoComplete="name"
                  className="w-full px-3.5 py-2.2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@bloxs.com.br"
                  required
                  autoComplete="email"
                  className="w-full px-3.5 py-2.2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.2 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.2 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name || !email || !password || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Cadastrando..." : "Cadastrar Administrador"}
              </button>
            </form>

            <div className="text-center mt-4">
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={13} /> Voltar para o Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
