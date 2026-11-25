"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/kendaraan", label: "Data Kendaraan", icon: "🚛" },
  { href: "/dashboard/input-operasional", label: "Input Operasional", icon: "➕" },
  { href: "/dashboard/kas-kecil", label: "Kas Kecil", icon: "💳" },
  { href: "/dashboard/laporan", label: "Laporan", icon: "📈" },
  { href: "/dashboard/manajemen-user", label: "Manajemen User", icon: "👤" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
              isActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            {isActive && (
              <span className="absolute left-1 top-2 bottom-2 w-1 bg-emerald-500 rounded-full" />
            )}
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
