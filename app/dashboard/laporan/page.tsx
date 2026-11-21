import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "bbm";

  // Menggunakan generic type inference agar Prisma otomatis mendeteksi tipe datanya dengan sempurna
  let dataBbm = await prisma.logBensin.findMany({ take: 0, include: { kendaraan: true, sopir: true, user_input: true } });
  let dataKas = await prisma.kasKecil.findMany({ take: 0, include: { user_input: true } });
  let dataKinerja = await prisma.kendaraan.findMany({ take: 0, include: { kendaraan_sopir: { include: { sopir: true } }, log_bensin: true, log_lain: true, log_angin: true, pembelian_sparepart: true, } });
  
  if (activeTab === "bbm") {
    dataBbm = await prisma.logBensin.findMany({
      where: {deleted_at: null},
      orderBy: { tanggal: "desc" },
      include: { kendaraan: true, sopir: true, user_input: true },
    });
  } else if (activeTab === "kas-kecil") {
    dataKas = await prisma.kasKecil.findMany({
      where: {deleted_at: null},
      orderBy: { tanggal: "desc" },
      include: { user_input: true },
    });
  } else if (activeTab === "kinerja") {
    dataKinerja = await prisma.kendaraan.findMany({
      where: { deleted_at: null },
      include: {
         kendaraan_sopir: { where: { selesai: null, deleted_at: null }, include: { sopir: true } },
         log_bensin: { where: { deleted_at: null } },
         log_lain: { where: { deleted_at: null } },
         log_angin: { where: { deleted_at: null } },
         pembelian_sparepart: { where: { deleted_at: null } },
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan & Analitik</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          {/* TOMBOL EXCEL (Tersambung ke API) */}
          <a
            href={`/api/export-excel?tab=${activeTab}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            ⬇️ Ekspor Excel
          </a>
        </div>
      </div>

      {/* TABS NAVIGASI */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link href="/dashboard/laporan?tab=bbm" className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === "bbm" ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
          Laporan BBM
        </Link>
        <Link href="/dashboard/laporan?tab=kas-kecil" className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === "kas-kecil" ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
          Laporan Kas Kecil
        </Link>
        <Link href="/dashboard/laporan?tab=kinerja" className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === "kinerja" ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
          Kinerja Kendaraan
        </Link>
      </div>

      {/* TABEL KONTEN (Sesuai Tab Aktif) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* --- TAB: LAPORAN BBM --- */}
        {activeTab === "bbm" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Kendaraan</th>
                  <th className="py-4 px-6">Sopir</th>
                  <th className="py-4 px-6">Jumlah (L)</th>
                  <th className="py-4 px-6">Total Biaya</th>
                  <th className="py-4 px-6">Diinput Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {dataBbm.map((log) => (
                  <tr key={log.id_bbm} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">{new Date(log.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="py-4 px-6 font-bold">{log.kendaraan?.plat_nomor}</td>
                    <td className="py-4 px-6">{log.sopir?.nama || "-"}</td>
                    <td className="py-4 px-6">{Number(log.jumlah_liter)} L</td>
                    <td className="py-4 px-6 font-bold text-slate-900">Rp {Number(log.total_harga).toLocaleString("id-ID")}</td>
                    <td className="py-4 px-6 text-slate-500">{log.user_input?.nama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB: LAPORAN KAS KECIL --- */}
        {activeTab === "kas-kecil" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Keterangan</th>
                  <th className="py-4 px-6">Tipe</th>
                  <th className="py-4 px-6 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {dataKas.map((kas) => (
                  <tr key={kas.id_kas_kecil} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">{new Date(kas.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="py-4 px-6">{kas.keterangan}</td>
                    <td className="py-4 px-6 font-bold">{kas.tipe === "MASUK" ? <span className="text-blue-600">Masuk</span> : <span className="text-red-600">Keluar</span>}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">Rp {Number(kas.jumlah).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB: KINERJA KENDARAAN --- */}
        {activeTab === "kinerja" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Kendaraan</th>
                  <th className="py-4 px-6">Sopir Aktif</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Solar Pakai</th>
                  <th className="py-4 px-6">Total Biaya Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {dataKinerja.map((k) => {
                  const sopir = k.kendaraan_sopir[0]?.sopir?.nama || "-";
                  const totalLiter = k.log_bensin.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0);
                  const biayaBbm = k.log_bensin.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
                  const biayaLain = k.log_lain.reduce((acc, curr) => acc + Number(curr.biaya), 0);
                  const biayaAngin = k.log_angin.reduce((acc, curr) => acc + Number(curr.biaya), 0);
                  const biayaSparepart = k.pembelian_sparepart.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
                  
                  return (
                    <tr key={k.id_kendaraan} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-bold">{k.plat_nomor} <br/><span className="text-xs font-normal text-slate-400">{k.merk}</span></td>
                      <td className="py-4 px-6">{sopir}</td>
                      <td className="py-4 px-6">{k.status === "BAGUS" ? "Aktif" : "Servis"}</td>
                      <td className="py-4 px-6">{totalLiter} L</td>
                      <td className="py-4 px-6 font-bold text-slate-900">Rp {(biayaBbm + biayaLain + biayaAngin + biayaSparepart).toLocaleString("id-ID")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}