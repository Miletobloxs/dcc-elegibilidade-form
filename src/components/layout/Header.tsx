"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, Search, LogOut, ChevronDown, Settings, Loader2, X, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type HeaderProps = {
  displayName: string;
  initials: string;
  email: string;
};

export default function Header({ displayName, initials, email }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [representativeName, setRepresentativeName] = useState("");
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Originator states
  const [originatorId, setOriginatorId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("JURIDICA");

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function fetchProfile() {
    setFetchingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setRepresentativeName(data.representativeName || "");
        if (data.originator) {
          setOriginatorId(data.originator.id);
          setCompanyName(data.originator.name || "");
          setCnpj(data.originator.cnpj || "");
          setPhone(data.originator.phone || "");
          setType(data.originator.type || "JURIDICA");
        } else {
          setOriginatorId(null);
        }
      } else {
        setProfileError("Não foi possível carregar os dados do perfil.");
      }
    } catch (err) {
      setProfileError("Erro de conexão ao carregar o perfil.");
    } finally {
      setFetchingProfile(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!representativeName.trim()) {
      setProfileError("O nome do representante é obrigatório.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representativeName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao salvar as alterações do representante.");
      }

      if (originatorId) {
        if (!companyName.trim() || !cnpj.trim() || !phone.trim()) {
          throw new Error("Campos da empresa são obrigatórios.");
        }
        const resOriginator = await fetch("/api/admin/originators", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: originatorId,
            name: companyName.trim(),
            cnpj: cnpj.replace(/\D/g, ""),
            phone: phone.trim(),
            type: type,
          })
        });
        if (!resOriginator.ok) {
          const data = await resOriginator.json();
          throw new Error(data.message || "Erro ao salvar os dados comerciais.");
        }
      }

      setProfileSuccess(true);
      setTimeout(() => {
        setProfileSuccess(false);
        setShowProfileModal(false);
      }, 1500);
      router.refresh();
    } catch (err: any) {
      setProfileError(err.message || "Erro de conexão ao salvar as alterações.");
    } finally {
      setSavingProfile(false);
    }
  }

  useEffect(() => {
    if (showProfileModal) {
      fetchProfile();
    }
  }, [showProfileModal]);

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-4 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3.5 py-2 w-72 mr-auto">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar no produto..."
          className="bg-transparent text-sm text-gray-600 outline-none placeholder-gray-400 w-full"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1.5">
        <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <HelpCircle size={16} />
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold text-amber-800">
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
              {displayName}
            </span>
            <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1.5 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <Settings size={14} className="text-gray-500" />
                  Editar Perfil
                </button>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <LogOut size={14} />
                  {signingOut ? "Saindo..." : "Sair"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !savingProfile && setShowProfileModal(false)}
          />
          
          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 z-10 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowProfileModal(false)}
              disabled={savingProfile}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Editar Perfil
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Atualize as informações do representante legal da sua conta.
            </p>

            {fetchingProfile ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Carregando dados...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Nome do Representante
                  </label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    placeholder="Digite o nome completo"
                    required
                    disabled={savingProfile || profileSuccess}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-gray-50"
                  />
                </div>

                {originatorId && (
                  <>
                    <div className="border-t border-gray-100 my-4 pt-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Dados Comerciais
                      </h4>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Nome Comercial / Razão Social
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nome fantasia ou Razão social"
                        required
                        disabled={savingProfile || profileSuccess}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-gray-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          value={cnpj}
                          onChange={(e) => setCnpj(e.target.value)}
                          placeholder="CNPJ"
                          required
                          disabled={savingProfile || profileSuccess}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Telefone"
                          required
                          disabled={savingProfile || profileSuccess}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Tipo de Pessoa
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        disabled={savingProfile || profileSuccess}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all bg-white disabled:bg-gray-50"
                      >
                        <option value="JURIDICA">Pessoa Jurídica (PJ)</option>
                        <option value="FISICA">Pessoa Física (PF)</option>
                      </select>
                    </div>
                  </>
                )}

                {profileError && (
                  <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                    {profileError}
                  </p>
                )}

                {profileSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-100">
                    <CheckCircle2 size={16} />
                    Alterações salvas com sucesso!
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    disabled={savingProfile || profileSuccess}
                    className="px-4 py-2.5 border border-gray-200 text-sm font-semibold rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile || profileSuccess}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400"
                  >
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingProfile ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

