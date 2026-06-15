"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ChevronDown, ArrowLeft, ArrowRight, Building2, Wallet, Layers, FileCheck } from "lucide-react";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const SETORES = [
  "Agronegócio",
  "Imobiliário",
  "Energia & Utilities",
  "Tecnologia & Telecom",
  "Infraestrutura & Logística",
  "Indústria & Manufatura",
  "Varejo & Consumo",
  "Saúde & Pharma",
  "Serviços Financeiros",
  "Serviços Corporativos",
  "Outro"
];

const FINALIDADES = [
  "Capital de Giro",
  "Expansão / Capex",
  "Refinanciamento de Dívidas",
  "Aquisição de Ativos / M&A",
  "Construção / Desenvolvimento Imobiliário",
  "Outros"
];

const GARANTIAS = [
  "Recebíveis / Cessão Fiduciária",
  "Imóveis (Alienação Fiduciária)",
  "Equipamentos / Máquinas",
  "Aval dos Sócios / Fiança Pessoal",
  "Fiança Bancária / Carta de Fiança",
  "Sem Garantia / Clean",
  "Outros"
];

const INSTRUMENTOS = [
  "CRI (Certificado de Recebíveis Imobiliários)",
  "CRA (Certificado de Recebíveis do Agronegócio)",
  "Debênture Simples",
  "Debênture Incentivada",
  "Nota Comercial / Promissória",
  "FIDC (Cotas de Fundo de Direitos Creditórios)",
  "CCB (Cédula de Crédito Bancário)",
  "Outro"
];

const INDEXADORES = [
  "CDI",
  "IPCA",
  "IGP-M",
  "Taxa Referencial (TR)",
  "Pré-fixado",
  "Outro"
];

const FLUXOS_PAGAMENTO = [
  "Mensal",
  "Trimestral",
  "Semestral",
  "Anual",
  "Bullet (Única no vencimento)",
  "Carência com pagamento periódico",
  "Outro"
];

export default function NewDealClient() {
  const [step, setStep] = useState(0);

  // --- Step 1: Sobre a empresa tomadora ---
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaCnpj, setEmpresaCnpj] = useState("");
  const [empresaCidade, setEmpresaCidade] = useState("");
  const [empresaEstado, setEmpresaEstado] = useState("");
  const [empresaSetor, setEmpresaSetor] = useState("");
  const [empresaSite, setEmpresaSite] = useState("");
  const [empresaDescricao, setEmpresaDescricao] = useState("");
  const [empresaFaturamento, setEmpresaFaturamento] = useState("");

  // --- Step 2: Detalhes da Captação ---
  const [captacaoValor, setCaptacaoValor] = useState("");
  const [captacaoFinalidade, setCaptacaoFinalidade] = useState("");
  const [captacaoGarantia, setCaptacaoGarantia] = useState("");
  const [captacaoGarantiaValor, setCaptacaoGarantiaValor] = useState("");
  const [captacaoPrazo, setCaptacaoPrazo] = useState("");
  const [captacaoRiscos, setCaptacaoRiscos] = useState("");

  // --- Step 3: Estrutura da Operação (Opcional) ---
  const [estruturaInstrumento, setEstruturaInstrumento] = useState("");
  const [estruturaIndexador, setEstruturaIndexador] = useState("");
  const [estruturaTaxa, setEstruturaTaxa] = useState("");
  const [estruturaFluxo, setEstruturaFluxo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);

  // CNPJ Formatter
  function formatCNPJ(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
  }

  // Handle CNPJ inputs
  const handleCnpjChange = (v: string) => {
    setEmpresaCnpj(formatCNPJ(v));
  };

  // Validation
  function validateStep(): string | null {
    if (step === 0) {
      if (!empresaNome.trim()) return "Nome da empresa tomadora é obrigatório.";
      if (!empresaCnpj || empresaCnpj.replace(/\D/g, "").length !== 14) return "CNPJ da empresa tomadora inválido.";
      if (!empresaCidade.trim()) return "Cidade é obrigatória.";
      if (!empresaEstado) return "Selecione o estado.";
      if (!empresaSetor) return "Selecione o setor.";
      if (!empresaDescricao.trim()) return "Informe o que a empresa faz.";
      if (!empresaFaturamento.trim()) return "Faturamento anual é obrigatório.";
    }
    if (step === 1) {
      if (!captacaoValor) return "O valor que a empresa busca é obrigatório.";
      if (!captacaoFinalidade) return "Selecione a finalidade do recurso.";
    }
    return null;
  }

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    setLoading(true);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Step 1
          empresaNome: empresaNome.trim(),
          empresaCnpj: empresaCnpj.replace(/\D/g, ""),
          empresaCidade: empresaCidade.trim(),
          empresaEstado,
          empresaSetor,
          empresaSite: empresaSite.trim(),
          empresaDescricao: empresaDescricao.trim(),
          empresaFaturamento: empresaFaturamento.trim(),
          // Step 2
          captacaoValor: Number(captacaoValor),
          captacaoFinalidade,
          captacaoGarantia,
          captacaoGarantiaValor: captacaoGarantiaValor ? Number(captacaoGarantiaValor) : null,
          captacaoPrazo: captacaoPrazo ? Number(captacaoPrazo) : null,
          captacaoRiscos: captacaoRiscos.trim(),
          // Step 3
          estruturaInstrumento,
          estruturaIndexador,
          estruturaTaxa: estruturaTaxa ? Number(estruturaTaxa) : null,
          estruturaFluxo,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Erro ao criar o negócio.");

      setSuccess(true);
      setDealId(result.data.hubspotDealId || "Criado apenas localmente");
      
      // Reset Form State
      setStep(0);
      setEmpresaNome("");
      setEmpresaCnpj("");
      setEmpresaCidade("");
      setEmpresaEstado("");
      setEmpresaSetor("");
      setEmpresaSite("");
      setEmpresaDescricao("");
      setEmpresaFaturamento("");
      setCaptacaoValor("");
      setCaptacaoFinalidade("");
      setCaptacaoGarantia("");
      setCaptacaoGarantiaValor("");
      setCaptacaoPrazo("");
      setCaptacaoRiscos("");
      setEstruturaInstrumento("");
      setEstruturaIndexador("");
      setEstruturaTaxa("");
      setEstruturaFluxo("");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar o deal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Header with Title and Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Originação Digital de Negócios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submeta a oportunidade para análise e inicie sua jornada de acesso ao Mercado de Capitais.
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0 w-full md:w-48">
          <span className="text-xs text-gray-400 font-medium mb-1.5">Etapa {step + 1} de 4</span>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        
        {/* Form area */}
        <div className="flex-1 p-8 md:p-10">
          
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 flex gap-4 text-emerald-800 animate-in slide-in-from-top-4 duration-300">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-sm">Oportunidade registrada com sucesso!</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Sua oportunidade foi sincronizada com a esteira HubSpot. ID do Negócio: <span className="font-mono bg-emerald-100/50 px-1.5 py-0.5 rounded text-emerald-700">{dealId}</span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!success && (
            <div className="space-y-6">
              
              {/* --- ETAPA 1: SOBRE A EMPRESA TOMADORA --- */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base font-bold text-gray-800">Sobre a empresa tomadora</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Preencha abaixo os campos com informações sobre a empresa tomadora.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nome da Empresa tomadora *</label>
                      <input 
                        type="text" 
                        value={empresaNome} 
                        onChange={(e) => setEmpresaNome(e.target.value)}
                        placeholder="Nome empresarial / Fantasia"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">CNPJ da empresa tomadora *</label>
                      <input 
                        type="text" 
                        value={empresaCnpj} 
                        onChange={(e) => handleCnpjChange(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-10 gap-5">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Em qual cidade ela está localizada? *</label>
                      <input 
                        type="text" 
                        value={empresaCidade} 
                        onChange={(e) => setEmpresaCidade(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Estado *</label>
                      <div className="relative">
                        <select 
                          value={empresaEstado} 
                          onChange={(e) => setEmpresaEstado(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                        >
                          <option value="">Selecione o estado</option>
                          {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Setor *</label>
                      <div className="relative">
                        <select 
                          value={empresaSetor} 
                          onChange={(e) => setEmpresaSetor(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                        >
                          <option value="">Selecione o setor</option>
                          {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual o site da empresa?</label>
                    <input 
                      type="text" 
                      value={empresaSite} 
                      onChange={(e) => setEmpresaSite(e.target.value)}
                      placeholder="Ex: www.suaempresa.com.br"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Em poucas palavras, o que a empresa faz? *</label>
                    <textarea 
                      value={empresaDescricao} 
                      onChange={(e) => setEmpresaDescricao(e.target.value)}
                      placeholder="Escreva brevemente sobre a atividade econômica, produtos ou serviços..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all resize-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual o faturamento anual da empresa? (Últimos 12 meses)*</label>
                    <input 
                      type="text" 
                      value={empresaFaturamento} 
                      onChange={(e) => setEmpresaFaturamento(e.target.value)}
                      placeholder="Ex: R$ 15.000.000"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                    />
                  </div>
                </div>
              )}

              {/* --- ETAPA 2: DETALHES DA CAPTAÇÃO --- */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base font-bold text-gray-800">Detalhes da Captação</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Quanto a empresa precisa e para quê? Esta é a etapa mais importante para encontrarmos o investidor ideal.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual valor que a empresa busca? *</label>
                    <input 
                      type="number" 
                      value={captacaoValor} 
                      onChange={(e) => setCaptacaoValor(e.target.value)}
                      placeholder="Ex: 5000000"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual a finalidade do recurso? *</label>
                    <div className="relative">
                      <select 
                        value={captacaoFinalidade} 
                        onChange={(e) => setCaptacaoFinalidade(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Selecione as finalidades</option>
                        {FINALIDADES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">O que a empresa pode oferecer como garantia?</label>
                      <div className="relative">
                        <select 
                          value={captacaoGarantia} 
                          onChange={(e) => setCaptacaoGarantia(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                        >
                          <option value="">Selecione as garantias</option>
                          {GARANTIAS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual o valor total estimado destas garantias?</label>
                      <input 
                        type="number" 
                        value={captacaoGarantiaValor} 
                        onChange={(e) => setCaptacaoGarantiaValor(e.target.value)}
                        placeholder="Ex: 8000000"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Em quanto tempo a empresa planeja pagar? (meses)</label>
                    <input 
                      type="number" 
                      value={captacaoPrazo} 
                      onChange={(e) => setCaptacaoPrazo(e.target.value)}
                      placeholder="Ex: 36"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Há algum risco ou ponto de atenção que gostaria de destacar?</label>
                    <textarea 
                      value={captacaoRiscos} 
                      onChange={(e) => setCaptacaoRiscos(e.target.value)}
                      placeholder="Indique riscos setoriais, sazonalidade, concentração de clientes ou outros pontos relevantes..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all resize-none text-gray-900"
                    />
                  </div>
                </div>
              )}

              {/* --- ETAPA 3: ESTRUTURA DA OPERAÇÃO (OPCIONAL) --- */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base font-bold text-gray-800">Estrutura da Operação (Opcional)</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Se você já possui uma estrutura em mente (CRI, Debênture, etc.), preencha aqui.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual o instrumento (Produto) desejado?</label>
                    <div className="relative">
                      <select 
                        value={estruturaInstrumento} 
                        onChange={(e) => setEstruturaInstrumento(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Selecione o instrumento</option>
                        {INSTRUMENTOS.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual o indexador da remuneração alvo?</label>
                      <div className="relative">
                        <select 
                          value={estruturaIndexador} 
                          onChange={(e) => setEstruturaIndexador(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                        >
                          <option value="">Selecione o indexador</option>
                          {INDEXADORES.map((idx) => <option key={idx} value={idx}>{idx}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual a taxa (em % ao ano) alvo?</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={estruturaTaxa} 
                        onChange={(e) => setEstruturaTaxa(e.target.value)}
                        placeholder="Ex: 15.5"
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Qual o fluxo de pagamento desejado?</label>
                    <div className="relative">
                      <select 
                        value={estruturaFluxo} 
                        onChange={(e) => setEstruturaFluxo(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Selecione o fluxo de pagamento</option>
                        {FLUXOS_PAGAMENTO.map((fluxo) => <option key={fluxo} value={fluxo}>{fluxo}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* --- ETAPA 4: RESUMO & CONFIRMAÇÃO --- */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base font-bold text-gray-800">Resumo da Oportunidade</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Revise as informações da oportunidade de originação antes de submeter.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Panel 1 */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3 text-blue-700">
                        <Building2 size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Empresa Tomadora</h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block">Nome:</span>
                          <span className="text-slate-800 font-semibold">{empresaNome}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">CNPJ:</span>
                          <span className="text-slate-800 font-mono font-semibold">{empresaCnpj}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Localização:</span>
                          <span className="text-slate-800 font-semibold">{empresaCidade} - {empresaEstado}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Setor:</span>
                          <span className="text-slate-800 font-semibold">{empresaSetor}</span>
                        </div>
                        {empresaSite && (
                          <div>
                            <span className="text-slate-400 block">Website:</span>
                            <span className="text-slate-800 font-semibold">{empresaSite}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 block">Faturamento Anual:</span>
                          <span className="text-slate-800 font-semibold">{empresaFaturamento}</span>
                        </div>
                      </div>
                    </div>

                    {/* Panel 2 */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3 text-blue-700">
                        <Wallet size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Detalhes da Captação</h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block">Valor buscado:</span>
                          <span className="text-slate-800 font-semibold">
                            {Number(captacaoValor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Finalidade:</span>
                          <span className="text-slate-800 font-semibold">{captacaoFinalidade}</span>
                        </div>
                        {captacaoGarantia && (
                          <div>
                            <span className="text-slate-400 block">Garantia:</span>
                            <span className="text-slate-800 font-semibold">{captacaoGarantia}</span>
                          </div>
                        )}
                        {captacaoGarantiaValor && (
                          <div>
                            <span className="text-slate-400 block">Valor das Garantias:</span>
                            <span className="text-slate-800 font-semibold">
                              {Number(captacaoGarantiaValor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                        )}
                        {captacaoPrazo && (
                          <div>
                            <span className="text-slate-400 block">Prazo planejado:</span>
                            <span className="text-slate-800 font-semibold">{captacaoPrazo} meses</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Panel 3 */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3 text-blue-700">
                        <Layers size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Estrutura (Opcional)</h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        {estruturaInstrumento ? (
                          <>
                            <div>
                              <span className="text-slate-400 block">Instrumento desejado:</span>
                              <span className="text-slate-800 font-semibold">{estruturaInstrumento}</span>
                            </div>
                            {estruturaIndexador && (
                              <div>
                                <span className="text-slate-400 block">Indexador:</span>
                                <span className="text-slate-800 font-semibold">{estruturaIndexador}</span>
                              </div>
                            )}
                            {estruturaTaxa && (
                              <div>
                                <span className="text-slate-400 block">Taxa Alvo:</span>
                                <span className="text-slate-800 font-semibold">{estruturaTaxa}% a.a.</span>
                              </div>
                            )}
                            {estruturaFluxo && (
                              <div>
                                <span className="text-slate-400 block">Fluxo de Pagamento:</span>
                                <span className="text-slate-800 font-semibold">{estruturaFluxo}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-400 italic">Estrutura não informada. O comitê técnico da Bloxs definirá a melhor estrutura.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {empresaDescricao && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <span className="text-slate-400 text-xs block mb-1">O que a empresa faz:</span>
                      <p className="text-xs text-slate-800 leading-relaxed">{empresaDescricao}</p>
                    </div>
                  )}

                  {captacaoRiscos && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <span className="text-slate-400 text-xs block mb-1">Riscos e pontos de atenção destacados:</span>
                      <p className="text-xs text-slate-850 leading-relaxed">{captacaoRiscos}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Continuar <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white font-semibold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Submetendo Oportunidade...
                      </>
                    ) : (
                      <>
                        <FileCheck size={16} /> Submeter Oportunidade
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-[30%] bg-gradient-to-br from-blue-900 to-[#0B1636] p-8 md:p-10 flex flex-col justify-between text-white lg:rounded-r-2xl">
          <div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <Building2 size={20} />
            </div>
            <h3 className="font-bold text-lg leading-snug">Origine novos projetos no mercado</h3>
            <p className="text-xs text-white/70 mt-3 leading-relaxed">
              Forneça os dados necessários nas 4 etapas. O time técnico do comitê de crédito e originação Bloxs avaliará a proposta e estruturará os ativos junto a investidores institucionais.
            </p>
          </div>
          <div className="text-[10px] text-white/40 mt-8 border-t border-white/10 pt-4">
            Em conformidade com as diretrizes CVM e políticas internas Bloxs.
          </div>
        </div>

      </div>
    </div>
  );
}
