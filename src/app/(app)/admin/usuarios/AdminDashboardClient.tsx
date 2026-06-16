"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  Shield,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
  Edit2,
  X,
  Loader2,
  Info,
  Plus,
} from "lucide-react";

interface OriginatorProfile {
  id: string;
  name: string;
  cnpj: string;
  type: string;
  email: string;
  phone: string;
  totalEmitted: any;
  activeOffers: number;
  status: string;
  hubspotContactId: string | null;
  hubspotCompanyId: string | null;
  registrationDate: Date | string;
}

interface User {
  id: string;
  email: string;
  role: string;
  name: string | null;
  avatar: string | null;
  blocked: boolean;
  createdAt: Date | string;
  originatorProfile: OriginatorProfile | null;
}

interface Offer {
  id: string;
  name: string;
  type: string;
  status: string;
  volume: any;
  raised: any;
  originator: {
    name: string;
    cnpj: string;
  };
  metadata: any;
  createdAt: Date | string;
}

interface Props {
  initialUsers: User[];
  initialOffers: Offer[];
  currentRole: string;
  currentEmail: string;
}

function CopyableIdTooltip({ label, id }: { label: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group inline-flex items-center">
      <button
        type="button"
        onClick={handleCopy}
        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
        title={`Clique para copiar o ID: ${id}`}
      >
        <Info size={13} className="shrink-0" />
      </button>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
        <span className="bg-gray-950 text-white text-[10px] py-1 px-2 rounded-md shadow-md whitespace-nowrap font-mono flex flex-col items-center gap-0.5 min-w-[120px] text-center">
          <span className="font-sans text-[8px] text-gray-400 uppercase tracking-wider font-bold">
            ID {label}
          </span>
          <span className="font-semibold text-white select-all">{id}</span>
          <span className="font-sans text-[8px] text-blue-300 mt-0.5 font-medium">
            {copied ? "Copiado!" : "Clique para copiar"}
          </span>
        </span>
        <span className="w-1.5 h-1.5 bg-gray-950 rotate-45 -mt-1"></span>
      </span>
    </div>
  );
}

export default function AdminDashboardClient({
  initialUsers,
  initialOffers,
  currentRole,
  currentEmail,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"usuarios" | "deals">("usuarios");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);

  // States for modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingOriginator, setEditingOriginator] = useState<OriginatorProfile | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({ name: "", role: "", blocked: false });
  const [originatorForm, setOriginatorForm] = useState({
    name: "",
    cnpj: "",
    type: "",
    phone: "",
    status: "",
    hubspotCompanyId: "",
    hubspotContactId: "",
  });
  const [offerForm, setOfferForm] = useState({
    name: "",
    volume: 0,
    status: "",
    empresaNome: "",
    empresaSite: "",
    empresaDescricao: "",
    captacaoFinalidade: "",
    captacaoGarantia: "",
    estruturaInstrumento: "",
    estruturaIndexador: "",
    estruturaTaxa: "",
    estruturaFluxo: "",
    hubspotDealId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isAdminOrSuper = currentRole === "SUPER_ADMIN" || currentRole === "ADMIN";

  // Total Volume Calculation
  const totalVolume = offers.reduce((sum, off) => sum + Number(off.volume), 0);

  // Open User Edit Modal
  const handleOpenUserEdit = (user: User) => {
    if (!isSuperAdmin) return;
    if (user.email === "carlos.carneiro@bloxs.com.br" && currentEmail !== "carlos.carneiro@bloxs.com.br") return;
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      role: user.role,
      blocked: user.blocked,
    });
    setError(null);
    setSuccessMessage(null);
  };

  // Open Originator Edit Modal
  const handleOpenOriginatorEdit = (op: OriginatorProfile) => {
    const targetUser = users.find((u) => u.originatorProfile?.id === op.id);
    if (targetUser?.email === "carlos.carneiro@bloxs.com.br" && currentEmail !== "carlos.carneiro@bloxs.com.br") return;
    setEditingOriginator(op);
    setOriginatorForm({
      name: op.name,
      cnpj: op.cnpj,
      type: op.type,
      phone: op.phone,
      status: op.status,
      hubspotCompanyId: op.hubspotCompanyId || "",
      hubspotContactId: op.hubspotContactId || "",
    });
    setError(null);
    setSuccessMessage(null);
  };

  // Open Offer Edit Modal
  const handleOpenOfferEdit = (offer: Offer) => {
    setEditingOffer(offer);
    const meta = offer.metadata || {};
    setOfferForm({
      name: offer.name,
      volume: Number(offer.volume),
      status: offer.status,
      empresaNome: meta.empresaNome || "",
      empresaSite: meta.empresaSite || "",
      empresaDescricao: meta.empresaDescricao || "",
      captacaoFinalidade: meta.captacaoFinalidade || "",
      captacaoGarantia: meta.captacaoGarantia || "",
      estruturaInstrumento: meta.estruturaInstrumento || "",
      estruturaIndexador: meta.estruturaIndexador || "",
      estruturaTaxa: meta.estruturaTaxa || "",
      estruturaFluxo: meta.estruturaFluxo || "",
      hubspotDealId: meta.hubspotDealId || "",
    });
    setError(null);
    setSuccessMessage(null);
  };

  // Submit User Changes
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: userForm.name,
          role: userForm.role,
          blocked: userForm.blocked,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao atualizar usuário");

      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: userForm.name, role: userForm.role, blocked: userForm.blocked }
            : u
        )
      );
      setSuccessMessage("Usuário atualizado com sucesso!");
      setTimeout(() => setEditingUser(null), 1000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string, displayName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir permanentemente o usuário "${displayName}"? Esta ação removerá a conta do Supabase e do banco de dados local e não poderá ser desfeita.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao excluir usuário");

      setUsers(users.filter((u) => u.id !== id));
      setSuccessMessage("Usuário excluído com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  // Submit Originator Changes
  const handleSaveOriginator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOriginator) return;
    setLoading(true);
    setError(null);

    try {
      const isNew = editingOriginator.id === "new";
      const res = await fetch("/api/admin/originators", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew
            ? { userId: targetUserId, ...originatorForm }
            : { id: editingOriginator.id, ...originatorForm }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao salvar originador");

      if (isNew) {
        setUsers(
          users.map((u) => {
            if (u.id === targetUserId) {
              return {
                ...u,
                originatorProfile: data.originator,
              };
            }
            return u;
          })
        );
      } else {
        setUsers(
          users.map((u) => {
            if (u.originatorProfile?.id === editingOriginator.id) {
              return {
                ...u,
                originatorProfile: {
                  ...u.originatorProfile!,
                  ...originatorForm,
                },
              };
            }
            return u;
          })
        );
      }
      setSuccessMessage(isNew ? "Originador comercial criado com sucesso!" : "Originador comercial atualizado com sucesso!");
      setTimeout(() => setEditingOriginator(null), 1000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  // Submit Offer Changes
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/deals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOffer.id,
          ...offerForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao atualizar deal");

      setOffers(
        offers.map((off) => {
          if (off.id === editingOffer.id) {
            return {
              ...off,
              name: offerForm.name,
              volume: Number(offerForm.volume),
              status: offerForm.status,
              metadata: {
                ...off.metadata,
                ...offerForm,
              },
            };
          }
          return off;
        })
      );
      setSuccessMessage("Deal e metadados de backup atualizados com sucesso!");
      setTimeout(() => setEditingOffer(null), 1000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

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
              {users.filter((u) => u.originatorProfile?.status === "ATIVO").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Layers size={20} />
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
              {totalVolume.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setTab("usuarios")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all outline-none ${
            tab === "usuarios"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Usuários & Originadores
        </button>
        <button
          onClick={() => setTab("deals")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all outline-none ${
            tab === "deals"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Backup de Deals (Supabase)
        </button>
      </div>

      {/* Tab Panels */}
      {tab === "usuarios" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-3 px-6 min-w-[140px]">Usuário / Email</th>
                  <th className="py-3 px-6 min-w-[100px]">Perfil / Função</th>
                  <th className="py-3 px-6 min-w-[180px]">Dados do Originador</th>
                  <th className="py-3 px-6 min-w-[80px]">Status</th>
                  <th className="py-3 px-6 min-w-[180px]">Sincronização HubSpot</th>
                  <th className="py-3 px-6 min-w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map((u) => {
                  const op = u.originatorProfile;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4.5 px-6">
                        <p className="font-semibold text-gray-900">{u.name || "Sem nome"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                            ${
                              u.role === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : u.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800"
                                : u.role === "ORIGINADOR"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.role === "SUPER_ADMIN" && <Shield size={10} />}
                            {u.role}
                          </span>
                          {u.blocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Bloqueado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        {op ? (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-gray-950 font-bold text-sm truncate max-w-[180px]" title={op.name}>
                                {op.name}
                              </span>
                              {op.hubspotCompanyId && (
                                <CopyableIdTooltip label="Empresa" id={op.hubspotCompanyId} />
                              )}
                            </div>
                            <p className="text-gray-800 flex items-center gap-1.5 font-medium">
                              <Building2 size={12} className="text-gray-400" />
                              CNPJ:{" "}
                              <span className="font-mono text-gray-500 font-semibold">
                                {op.cnpj.replace(
                                  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                  "$1.$2.$3/$4-$5"
                                )}
                              </span>
                            </p>
                            <p className="text-gray-400">
                              Tipo: <span className="text-gray-600 font-medium">{op.type}</span>
                            </p>
                            <p className="text-gray-400">
                              Telefone: <span className="text-gray-600 font-medium">{op.phone}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Nenhum vínculo comercial</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        {op ? (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                            ${
                              op.status === "ATIVO"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : op.status === "EM_ANALISE"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-red-50 text-red-600 border border-red-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                op.status === "ATIVO"
                                  ? "bg-emerald-500"
                                  : op.status === "EM_ANALISE"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {op.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        {op ? (
                          <div className="text-xs">
                            {op.hubspotContactId ? (
                              <div className="flex items-start gap-1.5 text-gray-800">
                                <span className="flex items-start gap-1 text-emerald-600 font-medium min-w-0" title={u.name || "Sem nome"}>
                                  <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                                  <span className="break-words line-clamp-2">
                                    Contato: {u.name || "Sem nome"}
                                  </span>
                                </span>
                                <CopyableIdTooltip label="Contato" id={op.hubspotContactId} />
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <AlertTriangle size={12} className="shrink-0" /> Contato desvinculado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          {isAdminOrSuper && (u.email !== "carlos.carneiro@bloxs.com.br" || currentEmail === "carlos.carneiro@bloxs.com.br") && (
                            <button
                              onClick={() => handleOpenUserEdit(u)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                              title="Editar Perfil e Permissões"
                            >
                              <Edit2 size={12} /> Perfil
                            </button>
                          )}
                          {isSuperAdmin && u.email !== "carlos.carneiro@bloxs.com.br" && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors shrink-0 whitespace-nowrap"
                              title="Excluir Usuário"
                            >
                              Excluir
                            </button>
                          )}
                          {op && (u.email !== "carlos.carneiro@bloxs.com.br" || currentEmail === "carlos.carneiro@bloxs.com.br") && (
                            <button
                              onClick={() => handleOpenOriginatorEdit(op)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                              title="Editar Dados do Originador"
                            >
                              <Edit2 size={12} /> Originador
                            </button>
                          )}
                          {!op && u.email === "carlos.carneiro@bloxs.com.br" && currentEmail === "carlos.carneiro@bloxs.com.br" && (
                            <button
                              onClick={() => {
                                setTargetUserId(u.id);
                                handleOpenOriginatorEdit({
                                  id: "new",
                                  name: "",
                                  cnpj: "",
                                  type: "JURIDICA",
                                  phone: "",
                                  status: "ATIVO",
                                  hubspotCompanyId: "",
                                  hubspotContactId: "",
                                } as any);
                              }}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                              title="Vincular Perfil de Originador"
                            >
                              <Plus size={12} /> Originador
                            </button>
                          )}
                        </div>
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
                  <th className="py-3 px-6 min-w-[140px]">Empresa / Deal</th>
                  <th className="py-3 px-6 min-w-[100px]">Criado em</th>
                  <th className="py-3 px-6 min-w-[140px]">Originador</th>
                  <th className="py-3 px-6 min-w-[110px]">Volume Solicitado</th>
                  <th className="py-3 px-6 min-w-[160px]">Estrutura & Taxa</th>
                  <th className="py-3 px-6 min-w-[110px]">HubSpot Deal ID</th>
                  <th className="py-3 px-6 min-w-[180px]">Detalhes do Backup</th>
                  <th className="py-3 px-6 min-w-[80px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {offers.map((offer) => {
                  const meta = offer.metadata || {};
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
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
                      <td className="py-4.5 px-6 whitespace-nowrap text-xs text-gray-500" suppressHydrationWarning>
                        <div className="font-medium text-gray-700">
                          {new Date(offer.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(offer.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <p className="font-semibold text-gray-800">{offer.originator.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{offer.originator.cnpj}</p>
                      </td>
                      <td className="py-4.5 px-6 font-bold text-gray-900">
                        {Number(offer.volume).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="space-y-1 text-xs">
                          <p className="text-gray-800 font-semibold">
                            {meta.estruturaInstrumento || "Sem Produto"}
                          </p>
                          <p className="text-gray-400">
                            Remuneração:{" "}
                            <span className="text-gray-600 font-medium">
                              {meta.estruturaIndexador}{" "}
                              {meta.estruturaTaxa ? `+ ${meta.estruturaTaxa}% a.a.` : ""}
                            </span>
                          </p>
                          <p className="text-gray-400">
                            Fluxo: <span className="text-gray-600 font-medium">{meta.estruturaFluxo}</span>
                          </p>
                        </div>
                      </td>
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
                      <td className="py-4.5 px-6 max-w-xs">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="line-clamp-2">
                            <span className="font-semibold text-gray-700">Atividade:</span>{" "}
                            {meta.empresaDescricao}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-700">Finalidade:</span>{" "}
                            {meta.captacaoFinalidade}
                          </p>
                          {meta.captacaoGarantia && (
                            <p>
                              <span className="font-semibold text-gray-700">Garantia:</span>{" "}
                              {meta.captacaoGarantia}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <button
                          onClick={() => handleOpenOfferEdit(offer)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="Editar Dados do Deal"
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: USER EDIT (SUPER_ADMIN ONLY) ────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden transform scale-100 transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                Permissões & Perfil
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  E-mail do Usuário
                </label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 font-medium cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {editingUser.role === "ORIGINADOR" ? "Nome do Representante" : "Nome Completo"}
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Nome do usuário"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Função / Permissão (Role)
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Dono / Administrador Geral)</option>
                  <option value="ADMIN">ADMIN (Equipe Interna)</option>
                  <option value="ORIGINADOR">ORIGINADOR (Parceiro Comercial)</option>
                  <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                  <option value="ASSESSOR">ASSESSOR</option>
                  <option value="INVESTIDOR">INVESTIDOR (Padrão)</option>
                </select>
              </div>

              {/* Bloquear Usuário (somente se não for o próprio carlos) */}
              {editingUser.email !== "carlos.carneiro@bloxs.com.br" && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="blocked"
                    checked={userForm.blocked}
                    onChange={(e) => setUserForm({ ...userForm, blocked: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="blocked" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">
                    Bloquear este usuário (impedir acesso à plataforma)
                  </label>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2 text-xs text-red-600 font-medium flex items-start gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ORIGINATOR EDIT (ADMIN & SUPER_ADMIN) ────────────────────────── */}
      {editingOriginator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={18} className="text-emerald-600" />
                Dados Comerciais do Originador
              </h3>
              <button
                onClick={() => setEditingOriginator(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveOriginator} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Razão Social / Nome Fantasia
                </label>
                <input
                  type="text"
                  value={originatorForm.name}
                  onChange={(e) => setOriginatorForm({ ...originatorForm, name: e.target.value })}
                  placeholder="Nome comercial"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    CNPJ (apenas números)
                  </label>
                  <input
                    type="text"
                    value={originatorForm.cnpj}
                    onChange={(e) => setOriginatorForm({ ...originatorForm, cnpj: e.target.value.replace(/\D/g, "") })}
                    placeholder="12345678000199"
                    required
                    maxLength={14}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tipo de Pessoa
                  </label>
                  <select
                    value={originatorForm.type}
                    onChange={(e) => setOriginatorForm({ ...originatorForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="JURIDICA">Pessoa Jurídica (PJ)</option>
                    <option value="FISICA">Pessoa Física (PF)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={originatorForm.phone}
                    onChange={(e) => setOriginatorForm({ ...originatorForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={originatorForm.status}
                    onChange={(e) => setOriginatorForm({ ...originatorForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="EM_ANALISE">EM_ANALISE</option>
                    <option value="SUSPENSO">SUSPENSO</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Info size={11} /> Sincronização HubSpot
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Company ID
                    </label>
                    <input
                      type="text"
                      value={originatorForm.hubspotCompanyId}
                      onChange={(e) => setOriginatorForm({ ...originatorForm, hubspotCompanyId: e.target.value })}
                      placeholder="Sem Company ID"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Contact ID
                    </label>
                    <input
                      type="text"
                      value={originatorForm.hubspotContactId}
                      onChange={(e) => setOriginatorForm({ ...originatorForm, hubspotContactId: e.target.value })}
                      placeholder="Sem Contact ID"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2 text-xs text-red-600 font-medium flex items-start gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOriginator(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DEAL/OFFER EDIT (ADMIN & SUPER_ADMIN) ────────────────────────── */}
      {editingOffer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                Dados do Deal / Offer (Backup)
              </h3>
              <button
                onClick={() => setEditingOffer(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveOffer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Nome da Operação
                  </label>
                  <input
                    type="text"
                    value={offerForm.name}
                    onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Volume Total (R$)
                  </label>
                  <input
                    type="number"
                    value={offerForm.volume}
                    onChange={(e) => setOfferForm({ ...offerForm, volume: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Status da Captação
                  </label>
                  <select
                    value={offerForm.status}
                    onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none bg-white focus:border-blue-500 transition-all"
                  >
                    <option value="EM_CAPTACAO">EM_CAPTACAO</option>
                    <option value="COMPLETA">COMPLETA</option>
                    <option value="ADIMPLENTE">ADIMPLENTE</option>
                    <option value="INADIMPLENTE">INADIMPLENTE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    HubSpot Deal ID
                  </label>
                  <input
                    type="text"
                    value={offerForm.hubspotDealId}
                    onChange={(e) => setOfferForm({ ...offerForm, hubspotDealId: e.target.value })}
                    placeholder="Sem ID HubSpot"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Detalhes da Empresa
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={offerForm.empresaNome}
                      onChange={(e) => setOfferForm({ ...offerForm, empresaNome: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Site Corporativo
                    </label>
                    <input
                      type="text"
                      value={offerForm.empresaSite}
                      onChange={(e) => setOfferForm({ ...offerForm, empresaSite: e.target.value })}
                      placeholder="exemplo.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Descrição da Atividade
                  </label>
                  <textarea
                    rows={2}
                    value={offerForm.empresaDescricao}
                    onChange={(e) => setOfferForm({ ...offerForm, empresaDescricao: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Estrutura Financeira (Backup)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Instrumento Financeiro
                    </label>
                    <input
                      type="text"
                      value={offerForm.estruturaInstrumento}
                      onChange={(e) => setOfferForm({ ...offerForm, estruturaInstrumento: e.target.value })}
                      placeholder="ex: Debêntures"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Indexador de Taxa
                    </label>
                    <input
                      type="text"
                      value={offerForm.estruturaIndexador}
                      onChange={(e) => setOfferForm({ ...offerForm, estruturaIndexador: e.target.value })}
                      placeholder="ex: CDI ou IPCA"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Taxa Adicional (% a.a.)
                    </label>
                    <input
                      type="text"
                      value={offerForm.estruturaTaxa}
                      onChange={(e) => setOfferForm({ ...offerForm, estruturaTaxa: e.target.value })}
                      placeholder="ex: 5.5"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Fluxo de Amortização
                    </label>
                    <input
                      type="text"
                      value={offerForm.estruturaFluxo}
                      onChange={(e) => setOfferForm({ ...offerForm, estruturaFluxo: e.target.value })}
                      placeholder="ex: Semestral"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2 text-xs text-red-600 font-medium flex items-start gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
