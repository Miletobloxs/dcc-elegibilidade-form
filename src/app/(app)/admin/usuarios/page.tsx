import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, UserCheck, Shield, Building2, CheckCircle2, AlertTriangle, FileText, DollarSign, Layers } from "lucide-react";

export const revalidate = 0; // Disable caching for the admin view

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const { tab = "usuarios" } = await searchParams;

  const users = await prisma.user.findMany({
    include: {
      originatorProfile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const offers = await prisma.offer.findMany({
    include: {
      originator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalVolume = offers.reduce((sum, off) => sum + Number(off.volume), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento Administrativo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Painel de controle para auditoria de usuários, originadores cadastrados e backup de deals no Supabase.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total de Usuários</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{users.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Originadores Ativos</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {users.filter(u => u.originatorProfile?.status === "ATIVO").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Deals Registrados</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{offers.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Volume Originado</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5">
              {totalVolume.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <Link 
          href="/admin/usuarios?tab=usuarios" 
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${tab === "usuarios" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Usuários & Originadores
        </Link>
        <Link 
          href="/admin/usuarios?tab=deals" 
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${tab === "deals" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Backup de Deals (Supabase)
        </Link>
      </div>

      {/* Content Panels */}
      {tab === "usuarios" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-3 px-6">Usuário / Email</th>
                  <th className="py-3 px-6">Perfil / Função</th>
                  <th className="py-3 px-6">Dados do Originador</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Sincronização HubSpot</th>
                  <th className="py-3 px-6">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map((user) => {
                  const op = user.originatorProfile;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4.5 px-6">
                        <p className="font-semibold text-gray-900">{user.name || "Sem nome"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                          ${user.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" :
                            user.role === "ADMIN" ? "bg-blue-100 text-blue-800" :
                            user.role === "ORIGINADOR" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
                          {user.role === "SUPER_ADMIN" && <Shield size={10} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        {op ? (
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-800 flex items-center gap-1.5 font-medium">
                              <Building2 size={12} className="text-gray-400" />
                              CNPJ: <span className="font-mono text-gray-500 font-semibold">{op.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</span>
                            </p>
                            <p className="text-gray-400">Tipo: <span className="text-gray-600 font-medium">{op.type}</span></p>
                            <p className="text-gray-400">Telefone: <span className="text-gray-600 font-medium">{op.phone}</span></p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Nenhum vínculo comercial</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        {op ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                            ${op.status === "ATIVO" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                              op.status === "EM_ANALISE" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${op.status === "ATIVO" ? "bg-emerald-500" : op.status === "EM_ANALISE" ? "bg-amber-500" : "bg-red-500"}`} />
                            {op.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        {op ? (
                          <div className="space-y-1.5 text-xs">
                            {op.hubspotCompanyId ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 size={12} /> Empresa: {op.hubspotCompanyId}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <AlertTriangle size={12} /> Empresa desvinculada
                              </span>
                            )}
                            {op.hubspotContactId ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 size={12} /> Contato: {op.hubspotContactId}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <AlertTriangle size={12} /> Contato desvinculado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 text-xs text-gray-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-3 px-6">Empresa / Deal</th>
                  <th className="py-3 px-6">Originador</th>
                  <th className="py-3 px-6">Volume Solicitado</th>
                  <th className="py-3 px-6">Estrutura & Taxa</th>
                  <th className="py-3 px-6">HubSpot Deal ID</th>
                  <th className="py-3 px-6">Detalhes do Backup (Supabase)</th>
                  <th className="py-3 px-6">Data de Originação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {offers.map((offer) => {
                  const meta = offer.metadata as any;
                  
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Empresa / Deal */}
                      <td className="py-4.5 px-6">
                        <p className="font-semibold text-gray-900">{meta?.empresaNome || offer.name}</p>
                        {meta?.empresaSite && (
                          <a 
                            href={`https://${meta.empresaSite}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-600 hover:underline mt-0.5 block"
                          >
                            {meta.empresaSite}
                          </a>
                        )}
                      </td>

                      {/* Originator */}
                      <td className="py-4.5 px-6">
                        <p className="font-semibold text-gray-800">{offer.originator.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{offer.originator.cnpj}</p>
                      </td>

                      {/* Volume */}
                      <td className="py-4.5 px-6 font-bold text-gray-900">
                        {Number(offer.volume).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>

                      {/* Structure & Rate */}
                      <td className="py-4.5 px-6">
                        {meta ? (
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-800 font-semibold">{meta.estruturaInstrumento || "Sem Produto"}</p>
                            <p className="text-gray-400">
                              Remuneração: <span className="text-gray-600 font-medium">{meta.estruturaIndexador} {meta.estruturaTaxa ? `+ ${meta.estruturaTaxa}% a.a.` : ""}</span>
                            </p>
                            <p className="text-gray-400">
                              Fluxo: <span className="text-gray-600 font-medium">{meta.estruturaFluxo}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{offer.type}</span>
                        )}
                      </td>

                      {/* HubSpot Link */}
                      <td className="py-4.5 px-6">
                        {meta?.hubspotDealId ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 size={13} /> {meta.hubspotDealId}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-500 font-semibold text-xs">
                            <AlertTriangle size={13} /> Sem HubSpot ID
                          </span>
                        )}
                      </td>

                      {/* Backup metadata preview */}
                      <td className="py-4.5 px-6 max-w-xs">
                        {meta ? (
                          <div className="space-y-1 text-xs text-gray-500">
                            <p className="line-clamp-2"><span className="font-semibold text-gray-700">Atividade:</span> {meta.empresaDescricao}</p>
                            <p><span className="font-semibold text-gray-700">Finalidade:</span> {meta.captacaoFinalidade}</p>
                            {meta.captacaoGarantia && (
                              <p><span className="font-semibold text-gray-700">Garantia:</span> {meta.captacaoGarantia}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sem metadados adicionais</span>
                        )}
                      </td>

                      {/* CreatedAt */}
                      <td className="py-4.5 px-6 text-xs text-gray-500 font-medium">
                        {new Date(offer.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
