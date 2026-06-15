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

  const groups: NavGroup[] = [];
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    groups.push({
      label: "Administração",
      items: [
        { href: "/admin/usuarios", label: "Usuários & Cadastros", icon: Users },
      ],
    });
  } else {
    groups.push({
      label: "Originação",
      items: [
        { href: "/deals/new", label: "Novo Deal", icon: Building2 },
      ],
    });
  }

  const logoHref = (role === "SUPER_ADMIN" || role === "ADMIN") ? "/admin/usuarios" : "/deals/new";

  return (
    <aside className="w-64 min-w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href={logoHref} className="block hover:opacity-80 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 112 28" className="h-7 w-auto">
            <path fill="#032952" d="M71.3564 22.8712C67.581 22.8712 66.4493 20.2289 66.4493 17.5865C66.4493 14.9442 67.5823 12.3018 71.3564 12.3018C75.1304 12.3018 76.2634 14.9442 76.2634 17.5865C76.2634 20.2289 75.1304 22.8712 71.3564 22.8712ZM71.3564 8.15009C65.3163 8.15009 61.9199 11.9254 61.9199 17.5865C61.9199 23.2476 65.3176 27.0229 71.3564 27.0229C77.3951 27.0229 80.7928 23.2476 80.7928 17.5865C80.7928 11.9254 77.3951 8.15009 71.3564 8.15009Z"></path>
            <path fill="#032952" d="M105.707 15.6982C103.857 15.1695 103.443 14.4779 103.443 13.8724C103.443 13.0558 104.198 12.3005 105.707 12.3005C106.811 12.3005 108.015 12.5727 109.123 13.2837L111.695 10.3666C109.967 8.78562 108 8.14749 105.33 8.14749C101.178 8.14749 98.9121 10.601 98.9121 13.9987C98.9121 17.5839 101.932 18.7169 104.952 19.4722C107.464 20.1 107.595 20.7146 107.595 21.3593C107.595 22.0039 106.839 22.8686 105.33 22.8686C104.022 22.8686 102.715 22.5834 101.583 21.8333L98.9629 24.8038C100.712 26.4044 103.348 27.0204 105.709 27.0204C110.238 27.0204 112.126 23.8115 112.126 21.358C112.126 17.2063 108.351 16.4509 105.709 15.6956"></path>
            <path fill="#032952" d="M93.062 8.52646L89.0978 14.392L85.1349 8.52646H80.0391L86.4854 17.5865L80.0391 26.6453H85.1349L89.0978 20.7798L93.062 26.6453H98.1579L91.7115 17.5865L98.1579 8.52646H93.062Z"></path>
            <path fill="#032952" d="M59.6544 5.50644H55.125V26.6453H59.6544V5.50644Z"></path>
            <path fill="#032952" d="M46.2552 22.4936H38.517V18.153H46.2552C47.6708 18.153 48.3311 19.1271 48.3311 20.3226C48.3311 21.5182 47.6708 22.4936 46.2552 22.4936ZM38.517 9.65945H44.7446C46.1602 9.65945 46.8204 10.6336 46.8204 11.8304C46.8204 13.0272 46.1602 14 44.7446 14H38.517V9.65945ZM49.8418 15.3218C50.5971 14.5665 51.3511 13.0988 51.3511 11.8304C51.3511 8.34413 48.8025 5.50774 44.7446 5.50774H33.9863V26.6466H46.254C50.3119 26.6466 52.8605 23.8102 52.8605 20.3239C52.8605 17.5878 51.3511 16.0772 49.8405 15.3218"></path>
            <path fill="#032952" d="M3.42243 26.6453H19.679C22.9868 26.6453 25.6682 23.9639 25.6682 20.656C25.6682 17.3482 22.9868 14.6668 19.679 14.6668H5.13365C2.29855 14.6668 0 16.9653 0 19.8004V23.2229C0 25.1125 1.5328 26.6453 3.42243 26.6453Z"></path>
            <path fill="#2E61FF" d="M5.13365 12.9556H19.679C22.9868 12.9556 25.6682 10.2741 25.6682 6.96631C25.6682 3.65848 22.9868 0.977051 19.679 0.977051H3.42243C1.5328 0.977051 0 2.50985 0 4.39948V15.288C1.25541 13.862 3.08904 12.9556 5.13365 12.9556Z"></path>
          </svg>
        </Link>
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
