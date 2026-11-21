import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function KasKecilPage() {
  // 1. Ambil semua transaksi diurutkan dari yang paling lama (untuk menghitung saldo berjalan)
  const riwayatKas = await prisma.kasKecil.findMany({
    orderBy: { tanggal: "asc" },
    include: {
      user_input: true,
    },
  });

  // 2. Kalkulasi statistik menggunakan filter & reduce (Murni tanpa efek samping)
  const transaksiMasuk = riwayatKas.filter((t) => t.tipe === "MASUK");
  const transaksiKeluar = riwayatKas.filter((t) => t.tipe === "KELUAR");

  const totalPemasukan = transaksiMasuk.reduce((sum, t) => sum + Number(t.jumlah), 0);
  const totalPengeluaran = transaksiKeluar.reduce((sum, t) => sum + Number(t.jumlah), 0);
  
  const jumlahTransaksiMasuk = transaksiMasuk.length;
  const jumlahTransaksiKeluar = transaksiKeluar.length;
  const saldoTotalSaatIni = totalPemasukan - totalPengeluaran;

  // 3. Kalkulasi saldo berjalan (snapshot) per baris transaksi
  // Mendefinisikan tipe data khusus agar TypeScript tidak protes saat kita menyisipkan 'saldoSnapshot'
  type TransaksiDenganSaldo = typeof riwayatKas[0] & { saldoSnapshot: number };
  
  const transaksiDenganSaldo = riwayatKas.reduce<TransaksiDenganSaldo[]>((acc, transaksi) => {
    const nilai = Number(transaksi.jumlah);
    const saldoSebelumnya = acc.length > 0 ? acc[acc.length - 1].saldoSnapshot : 0;
    
    const saldoSnapshot = transaksi.tipe === "MASUK" 
      ? saldoSebelumnya + nilai 
      : saldoSebelumnya - nilai;

    acc.push({ ...transaksi, saldoSnapshot });
    return acc;
  }, []);

  // 4. Balik urutan array agar transaksi paling baru muncul paling atas di tabel
  const riwayatTerbaruDiAtas = transaksiDenganSaldo.reverse();

  return (
    <div className="space-y-6">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kas Kecil</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kartu Saldo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Saat Ini</p>
          <h3 className="text-3xl font-bold text-emerald-600">Rp {saldoTotalSaatIni.toLocaleString("id-ID")}</h3>
          <p className="text-xs text-slate-500 mt-2">Per hari ini</p>
        </div>

        {/* Kartu Pemasukan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pemasukan</p>
          <h3 className="text-3xl font-bold text-blue-600">Rp {totalPemasukan.toLocaleString("id-ID")}</h3>
          <p className="text-xs text-slate-500 mt-2">{jumlahTransaksiMasuk} transaksi</p>
        </div>

        {/* Kartu Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pengeluaran</p>
          <h3 className="text-3xl font-bold text-red-600">Rp {totalPengeluaran.toLocaleString("id-ID")}</h3>
          <p className="text-xs text-slate-500 mt-2">{jumlahTransaksiKeluar} transaksi</p>
        </div>
      </div>

      {/* TABEL RIWAYAT TRANSAKSI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Riwayat Transaksi</h3>
          <Link
            href="/dashboard/kas-kecil/tambah"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            <span>+</span> Input Transaksi
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6 font-bold">Tanggal</th>
                <th className="py-4 px-6 font-bold">Keterangan</th>
                <th className="py-4 px-6 font-bold">Kategori</th>
                <th className="py-4 px-6 font-bold">Tipe</th>
                <th className="py-4 px-6 font-bold text-right">Jumlah</th>
                <th className="py-4 px-6 font-bold text-right">Saldo</th>
                <th className="py-4 px-6 font-bold">Diinput Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {riwayatTerbaruDiAtas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Belum ada transaksi kas kecil.</td>
                </tr>
              ) : (
                riwayatTerbaruDiAtas.map((tx) => {
                  const isMasuk = tx.tipe === "MASUK";
                  return (
                    <tr key={tx.id_kas_kecil} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">{tx.keterangan}</td>
                      <td className="py-4 px-6 text-slate-500">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs">{tx.kategori || "-"}</span>
                      </td>
                      <td className="py-4 px-6">
                        {isMasuk ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                            ↑ Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                            ↓ Keluar
                          </span>
                        )}
                      </td>
                      <td className={`py-4 px-6 text-right font-bold whitespace-nowrap ${isMasuk ? "text-blue-600" : "text-red-500"}`}>
                        {isMasuk ? "+" : "-"}Rp {Number(tx.jumlah).toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp {tx.saldoSnapshot.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-6 text-slate-500">{tx.user_input?.nama || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}