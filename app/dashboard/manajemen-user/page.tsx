import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import UserManager from "./userManager";

const fmtTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta", 
});

export default async function ManajemenUserPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "SUPERADMIN") redirect("/dashboard"); // hanya Super Admin

  const users = await prisma.user.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen User</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
            Super Admin
          </span>
        </div>
      </div>

      <UserManager
        meId={me.id_user}
        users={users.map((u) => ({
          id_user: u.id_user,
          nama: u.nama,
          jabatan: u.jabatan,
          username: u.username,
          role: u.role,
          is_active: u.is_active,
          terdaftar: fmtTanggal.format(u.created_at),
        }))}
      />
    </div>
  );
}