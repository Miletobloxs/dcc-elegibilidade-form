"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Map,
  ListTodo,
  Zap,
  Tag,
  MessageSquare,
  Settings,
  HelpCircle,
  BarChart3,
  Activity,
  AlertOctagon,
  BookOpen,
  Building2,
  Flag,
  FileText,
  GitBranch,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string | null;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Originação",
    items: [
      { href: "/deals/new", label: "Novo Deal", icon: Building2 },
    ],
  },
];

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const groups = [...navGroups];
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    groups.push({
      label: "Administração",
      items: [
        { href: "/admin/usuarios", label: "Usuários & Cadastros", icon: Users },
      ],
    });
  }

  return (
    <aside className="w-64 min-w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.4" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Powered by</p>
            <p className="text-sm font-bold text-gray-900 leading-none tracking-wide">Bloxs</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 pt-4 pb-2 overflow-y-auto space-y-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1.5">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                      <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

    </aside>
  );
}
