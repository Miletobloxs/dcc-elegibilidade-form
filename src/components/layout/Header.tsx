"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, Search, LogOut, ChevronDown } from "lucide-react";
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

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
    </header>
  );
}
