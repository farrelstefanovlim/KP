import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  // 1. Hitung Statistik Kendaraan
  const totalKendaraan = await prisma.kendaraan.count();
  const kendaraanBengkel = await prisma.kendaraan.count({
    where: { status: "BENGKEL" },
  });
  const kendaraanAktif = totalKendaraan - kendaraanBengkel;

  // 2. Ambil Semua Log Terkait untuk Kalkulasi Biaya Otomatis
  const semuaLogBensin = await prisma.logBensin.findMany();
  const semuaLogAngin = await prisma.logAngin.findMany();
  const semuaLogLain = await prisma.logLain.findMany();
  const semuaSparepart = await prisma.pembelianSparepart.findMany();
  const semuaKasKecil = await prisma.kasKecil.findMany();

  // Kalkulasi Total Biaya BBM & Liter
  const totalBiayaBbm = semuaLogBensin.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
  const totalLiterBbm = semuaLogBensin.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0);

  // Kalkulasi Total Biaya Operasional Keseluruhan
  const totalBiayaAngin = semuaLogAngin.reduce((acc, curr) => acc + Number(curr.biaya), 0);
  const totalBiayaLain = semuaLogLain.reduce((acc, curr) => acc + Number(curr.biaya), 0);
  const totalBiayaSparepart = semuaSparepart.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
  const totalBiayaOperasional = totalBiayaBbm + totalBiayaAngin + totalBiayaLain + totalBiayaSparepart;

  // Kalkulasi Saldo Kas Kecil (Pemasukan - Pengeluaran)
  const totalKasMasuk = semuaKasKecil
    .filter(k => k.tipe === "MASUK")
    .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const totalKasKeluar = semuaKasKecil
    .filter(k => k.tipe === "KELUAR")
    .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const saldoKasKecil = totalKasMasuk - totalKasKeluar;

  // 3. Ambil Log BBM Terbaru untuk Tabel Bawah
  const logBensinTerbaru = await prisma.logBensin.findMany({
    take: 5,
    orderBy: { tanggal: "desc" },
    include: {
      kendaraan: true,
      sopir: true,
      user_input: true,
    },
  });

  // 4. Ambil Daftar Kendaraan beserta Relasi Biayanya untuk Tabel Rincian
  const daftarKendaraan = await prisma.kendaraan.findMany({
    include: {
      kendaraan_sopir: {
        where: { selesai: null },
        include: { sopir: true },
      },
      log_bensin: true,
      pembelian_sparepart: true,
      log_lain: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* HEADER INFORMASI */}
      <div className="flex flex-col justify-between sm:flex-row sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
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
            {session?.user?.role || "SUPERADMIN"}
          </span>
        </div>
      </div>

      {/* 4 KARTU STATISTIK ATAS (OTOMATIS DARI DATABASE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Biaya Operasional */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Biaya Operasional</p>
            <h3 className="text-2xl font-extrabold text-slate-900">Rp {totalBiayaOperasional.toLocaleString("id-ID")}</h3>
            <p className="text-xs text-slate-500 mt-2">Akumulasi seluruh pengeluaran</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-lg">
            💵
          </div>
        </div>

        {/* Total Biaya BBM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Biaya BBM</p>
            <h3 className="text-2xl font-extrabold text-slate-900">Rp {totalBiayaBbm.toLocaleString("id-ID")}</h3>
            <p className="text-xs text-slate-500 mt-2">{totalLiterBbm} liter total</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 text-lg">
            ⛽
          </div>
        </div>

        {/* Saldo Kas Kecil */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Kas Kecil</p>
            <h3 className="text-2xl font-extrabold text-slate-900">Rp {saldoKasKecil.toLocaleString("id-ID")}</h3>
            <p className="text-xs text-slate-500 mt-2">Saldo real-time saat ini</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 text-lg">
            💳
          </div>
        </div>

        {/* Kendaraan Aktif */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kendaraan Aktif</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{totalKendaraan} Unit</h3>
            <p className="text-xs text-slate-500 mt-2">{kendaraanBengkel} unit sedang servis</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 text-lg">
            🚚
          </div>
        </div>
      </div>

      {/* TABEL 1: BIAYA OPERASIONAL PER KENDARAAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900">Biaya Operasional per Kendaraan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rincian akumulasi biaya armada secara otomatis</p>
          </div>
          <a href="/dashboard/laporan" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Lihat laporan →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6 font-semibold">Kendaraan</th>
                <th className="py-3.5 px-6 font-semibold">BBM (L)</th>
                <th className="py-3.5 px-6 font-semibold">Biaya BBM</th>
                <th className="py-3.5 px-6 font-semibold">Sparepart</th>
                <th className="py-3.5 px-6 font-semibold">Lainnya</th>
                <th className="py-3.5 px-6 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {daftarKendaraan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada data kendaraan terdaftar.</td>
                </tr>
              ) : (
                daftarKendaraan.map((k) => {
                  const totalLiter = k.log_bensin.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0);
                  const biayaBbm = k.log_bensin.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
                  const biayaSparepart = k.pembelian_sparepart.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
                  const biayaLain = k.log_lain.reduce((acc, curr) => acc + Number(curr.biaya), 0);
                  const totalSemua = biayaBbm + biayaSparepart + biayaLain;
                  const sopirAktif = k.kendaraan_sopir[0]?.sopir?.nama || "Belum ada sopir";

                  return (
                    <tr key={k.id_kendaraan} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{k.plat_nomor}</p>
                        <p className="text-xs text-slate-400">{k.merk} · {sopirAktif}</p>
                      </td>
                      <td className="py-4 px-6">{totalLiter} L</td>
                      <td className="py-4 px-6">Rp {biayaBbm.toLocaleString("id-ID")}</td>
                      <td className="py-4 px-6">Rp {biayaSparepart.toLocaleString("id-ID")}</td>
                      <td className="py-4 px-6">Rp {biayaLain.toLocaleString("id-ID")}</td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900">
                        Rp {totalSemua.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABEL 2: INPUT BBM TERBARU DARI STAFF */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900">Input BBM Terbaru dari Staff</h3>
            <p className="text-xs text-slate-400 mt-0.5">Catatan transaksi bahan bakar terakhir</p>
          </div>
          <a href="/dashboard/input-operasional" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Lihat semua →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6 font-semibold">Tanggal</th>
                <th className="py-3.5 px-6 font-semibold">Kendaraan</th>
                <th className="py-3.5 px-6 font-semibold">Diinput Oleh</th>
                <th className="py-3.5 px-6 font-semibold">Liter</th>
                <th className="py-3.5 px-6 font-semibold">KM Tempuh</th>
                <th className="py-3.5 px-6 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {logBensinTerbaru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada catatan log bensin.</td>
                </tr>
              ) : (
                logBensinTerbaru.map((log) => (
                  <tr key={log.id_bbm} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">{new Date(log.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{log.kendaraan?.plat_nomor}</td>
                    <td className="py-4 px-6">{log.user_input?.nama}</td>
                    <td className="py-4 px-6">{Number(log.jumlah_liter)} L</td>
                    <td className="py-4 px-6">{Number(log.jarak_tempuh)} km</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                      Rp {Number(log.total_harga).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}