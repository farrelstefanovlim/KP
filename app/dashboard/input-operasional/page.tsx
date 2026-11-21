import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import InputOperasionalClient from "@/app/dashboard/input-operasional/InputOperasionalClient";

const fmtTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default async function InputOperasionalPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [kendaraanRaw, sopirRaw, recentBbm, recentLain, recentAngin, recentSparepart] =
    await Promise.all([
      prisma.kendaraan.findMany({
        where: { deleted_at: null },
        orderBy: { plat_nomor: "asc" },
        include: {
          kendaraan_sopir: {
            where: { selesai: null, deleted_at: null },
            include: { sopir: true },
          },
        },
      }),
      prisma.sopir.findMany({
        where: { deleted_at: null, is_active: true },
        orderBy: { nama: "asc" },
      }),
      prisma.logBensin.findMany({
        where: { deleted_at: null },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { kendaraan: true, sopir: true, user_input: true },
      }),
      prisma.logLain.findMany({
        where: { deleted_at: null },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { kendaraan: true, user_input: true },
      }),
      prisma.logAngin.findMany({
        where: { deleted_at: null },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { kendaraan: true, user_input: true },
      }),
      prisma.pembelianSparepart.findMany({
        where: { deleted_at: null },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { kendaraan: true, user_input: true, item_sparepart: true },
      }),
    ]);

  const kendaraanList = kendaraanRaw.map((k) => ({
    id_kendaraan: k.id_kendaraan,
    plat_nomor: k.plat_nomor,
    merk: k.merk,
    km_terakhir: Number(k.km_terakhir),
    id_sopir_aktif: k.kendaraan_sopir[0]?.id_sopir ?? "",
  }));

  const sopirList = sopirRaw.map((s) => ({
    id_sopir: s.id_sopir,
    nama: s.nama,
  }));

  const riwayatTerbaru = [
    ...recentBbm.map((item) => ({
      id: `bbm-${item.id_bbm}`,
      tanggal: fmtTanggal.format(item.tanggal),
      createdAt: item.created_at.getTime(),
      jenis: `BBM (${item.sumber})`,
      kendaraan: item.kendaraan.plat_nomor,
      detail: `${Number(item.jumlah_liter)} L • Jarak ${Number(item.jarak_tempuh)} km${
        item.sopir ? ` • ${item.sopir.nama}` : ""
      }`,
      nominal: Number(item.total_harga),
      oleh: item.user_input.nama,
    })),
    ...recentLain.map((item) => ({
      id: `lain-${item.id_lain}`,
      tanggal: fmtTanggal.format(item.tanggal),
      createdAt: item.created_at.getTime(),
      jenis: item.kategori,
      kendaraan: item.kendaraan.plat_nomor,
      detail: `${item.keterangan || "-"} (${item.sumber_dana})`,
      nominal: Number(item.biaya),
      oleh: item.user_input.nama,
    })),
    ...recentAngin.map((item) => ({
      id: `angin-${item.id_angin}`,
      tanggal: fmtTanggal.format(item.tanggal),
      createdAt: item.created_at.getTime(),
      jenis: "Tambah Angin",
      kendaraan: item.kendaraan.plat_nomor,
      detail: `${item.keterangan || "Isi angin ban"} (${item.sumber_dana})`,
      nominal: Number(item.biaya),
      oleh: item.user_input.nama,
    })),
    ...recentSparepart.map((item) => ({
      id: `sp-${item.id_nota_sparepart}`,
      tanggal: fmtTanggal.format(item.tanggal_beli),
      createdAt: item.created_at.getTime(),
      jenis: "Sparepart",
      kendaraan: item.kendaraan.plat_nomor,
      detail: `${item.item_sparepart.map((i) => i.nama).join(", ")} (${item.sumber_dana})`,
      nominal: Number(item.total_harga),
      oleh: item.user_input.nama,
    })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Input Operasional</h1>
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
            {me.role === "SUPERADMIN" ? "Super Admin" : "Staff"}
          </span>
        </div>
      </div>

      <InputOperasionalClient
        kendaraanList={kendaraanList}
        sopirList={sopirList}
        riwayatTerbaru={riwayatTerbaru}
      />
    </div>
  );
}