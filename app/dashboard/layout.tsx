import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logoutbutton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR UTAMA */}
      <aside className="w-64 bg-[#172033] text-white flex flex-col justify-between border-r border-slate-800 fixed inset-y-0 left-0 z-50 shadow-xl">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
                S
              </div>
              <div>
                <h1 className="font-bold text-base tracking-wide text-white">SIMO</h1>
                <p className="text-xs text-slate-400">PT. Mega Arista Jaya</p>
              </div>
            </div>
          </div>

          {/* Menu Navigasi */}
          <div className="px-4 py-6">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
            <nav className="space-y-1.5">
              <Link href="/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span>📊</span> Dashboard
              </Link>
              <Link href="/dashboard/kendaraan" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors">
                <span>🚛</span> Data Kendaraan
              </Link>
              <Link href="/dashboard/input-operasional" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors">
                <span>➕</span> Input Operasional
              </Link>
              <Link href="/dashboard/kas-kecil" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors">
                <span>💳</span> Kas Kecil
              </Link>
              <Link href="/dashboard/laporan" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors">
                <span>📈</span> Laporan
              </Link>
              <Link href="/dashboard/manajemen-user" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors">
                <span>👤</span> Manajemen User
              </Link>
            </nav>
          </div>
        </div>

        {/* Profil Pengguna di Bagian Bawah Sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#141b2d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{session?.user?.name || "Pengguna"}</p>
                <p className="text-xs text-emerald-400 capitalize">{session?.user?.role || "Staff"}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 pl-64">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}