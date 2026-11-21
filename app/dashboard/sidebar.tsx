// Contoh komponen Navigasi Sidebar yang mendeteksi halaman aktif
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Data Kendaraan", href: "/dashboard/kendaraan", icon: "🚛" },
    { name: "Input Operasional", href: "/dashboard/input-operasional", icon: "➕" },
    { name: "Kas Kecil", href: "/dashboard/kas-kecil", icon: "💳" },
    { name: "Laporan", href: "/dashboard/laporan", icon: "📈" },
    { name: "Manajemen User", href: "/dashboard/manajemen-user", icon: "👤" },
  ];

  return (
    <nav className="space-y-1.5">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <span>{item.icon}</span> {item.name}
          </Link>
        );
      })}
    </nav>
  );
}