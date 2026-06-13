"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const redirectToUrl = `${window.location.origin}/auth/callback?next=/recuperar-senha/alterar`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl,
    });

    if (error) {
      console.error("Erro ao solicitar reset de senha:", error);
      setError(
        error.message === "Rate limit exceeded"
          ? "Muitas solicitações enviadas. Tente novamente mais tarde."
          : "Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto."
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-gray-100 p-8">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md mb-4">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight text-center">
            Recuperar Senha
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Digite seu e-mail para receber as instruções
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-800">
              <p className="font-semibold mb-1">E-mail enviado!</p>
              <p className="text-xs text-green-700">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
            </div>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-2"
            >
              <ArrowLeft size={14} /> Voltar para o Login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@bloxs.com.br"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <div className="text-center mt-4">
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={13} /> Voltar para o Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
