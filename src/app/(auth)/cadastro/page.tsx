"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Persona = "buy" | "sell" | "ambos";

const OPTIONS: { value: Persona; title: string; description: string }[] = [
  {
    value: "buy",
    title: "Buy-Side",
    description: "Para investidores que buscam oportunidades no mercado de capitais.",
  },
  {
    value: "sell",
    title: "Sell-Side",
    description: "Para empresas que desejam originar operações no mercado de capitais.",
  },
  {
    value: "ambos",
    title: "Ambos",
    description: "Para empresas que atuam como investidores e originadores no mercado.",
  },
];

const DESTINATIONS: Record<Persona, string> = {
  buy: "/cadastro-investidor",
  sell: "/bypass-cadastro",
  ambos: "/bypass-cadastro?perfil=ambos",
};

export default function CadastroEscolhaPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Persona | null>(null);

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-gray-100 p-6 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Criar sua conta Bloxs</h1>
          <p className="text-sm text-gray-500 mt-2">
            Para personalizar sua experiência, nos conte qual é o seu perfil.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`text-left rounded-2xl border p-5 transition-all ${
                  active
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center mb-4 transition-colors ${
                    active ? "border-blue-600" : "border-gray-300"
                  }`}
                >
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </span>
                <p className="font-semibold text-gray-900">{opt.title}</p>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && router.push(DESTINATIONS[selected])}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors"
        >
          Continuar
        </button>
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
