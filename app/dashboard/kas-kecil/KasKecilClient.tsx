"use client";

import { useState, useMemo } from "react";
import ModalInputKasKecil from "./components/ModalInputKasKecil";

export type TransaksiKasKecilItem = {
  id_kas_kecil: string;
  tanggal: string; // ISO string
  tipe: "MASUK" | "KELUAR";
  kategori: string;
  keterangan: string | null;
  jumlah: number;
  id_user_input: string;
  namaUser: string;
  // Relasi opsional jika berasal dari operasional
  id_log_bensin?: string | null;
  id_log_angin?: string | null;
  id_log_lain?: string | null;
  id_pembelian_sparepart?: string | null;
  created_at: string;
};

type Props = {
  transaksiList: TransaksiKasKecilItem[];
  userRole?: string;
};

export default function KasKecilClient({
  transaksiList,
  userRole = "Super Admin",
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipe, setFilterTipe] = useState<"SEMUA" | "MASUK" | "KELUAR">("SEMUA");

  // 1. Hitung running saldo secara kronologis (dari transaksi terlama ke terbaru)
  const transaksiWithSaldo = useMemo(() => {
    // Urutkan kronologis dari tanggal terlama ke terbaru
    const sortedChronological = [...transaksiList].sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let runningSaldo = 0;
    const withSaldo = sortedChronological.map((t) => {
      if (t.tipe === "MASUK") {
        runningSaldo += Number(t.jumlah);
      } else {
        runningSaldo -= Number(t.jumlah);
      }
      return {
        ...t,
        saldoBerjalan: runningSaldo,
      };
    });

    // Balik kembali agar transaksi terbaru berada di paling atas tabel
    return withSaldo.reverse();
  }, [transaksiList]);

  // 2. Hitung Statistik Ringkasan Kartu Atas
  const totalPemasukan = useMemo(() => {
    return transaksiList
      .filter((t) => t.tipe === "MASUK")
      .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  }, [transaksiList]);

  const totalPengeluaran = useMemo(() => {
    return transaksiList
      .filter((t) => t.tipe === "KELUAR")
      .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  }, [transaksiList]);

  const saldoSaatIni = totalPemasukan - totalPengeluaran;

  const countPemasukan = useMemo(() => {
    return transaksiList.filter((t) => t.tipe === "MASUK").length;
  }, [transaksiList]);

  const countPengeluaran = useMemo(() => {
    return transaksiList.filter((t) => t.tipe === "KELUAR").length;
  }, [transaksiList]);

  // 3. Filter data berdasarkan pencarian dan tipe
  const filteredData = useMemo(() => {
    return transaksiWithSaldo.filter((t) => {
      const matchTipe = filterTipe === "SEMUA" || t.tipe === filterTipe;
      const query = searchQuery.toLowerCase();
      const matchQuery =
        !query ||
        (t.keterangan && t.keterangan.toLowerCase().includes(query)) ||
        (t.kategori && t.kategori.toLowerCase().includes(query)) ||
        t.namaUser.toLowerCase().includes(query);
      return matchTipe && matchQuery;
    });
  }, [transaksiWithSaldo, filterTipe, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER HALAMAN PERSIS SEPERTI DI FOTO */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kas Kecil
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {userRole.toLowerCase().includes("super")
              ? "Super Admin"
              : userRole}
          </span>
        </div>
      </div>

      {/* NOTIFIKASI SUKSES */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 KARTU RINGKASAN ATAS PERSIS FOTO 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Saldo Saat Ini */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            SALDO SAAT INI
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
            Rp {saldoSaatIni.toLocaleString("id-ID")}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Per hari ini</p>
        </div>

        {/* 2. Total Pemasukan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL PEMASUKAN
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
            Rp {totalPemasukan.toLocaleString("id-ID")}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {countPemasukan} transaksi
          </p>
        </div>

        {/* 3. Total Pengeluaran */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            TOTAL PENGELUARAN
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
            Rp {totalPengeluaran.toLocaleString("id-ID")}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {countPengeluaran} transaksi
          </p>
        </div>
      </div>

      {/* SECTION RIWAYAT TRANSAKSI DENGAN TOMBOL + INPUT TRANSAKSI */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Riwayat Transaksi
            </h2>
            <p className="text-xs text-slate-500">
              Daftar seluruh arus kas masuk dan kas keluar petty cash
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tipe */}
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value as any)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="SEMUA">Semua Tipe</option>
              <option value="KELUAR">Pengeluaran (Keluar)</option>
              <option value="MASUK">Pemasukan (Masuk)</option>
            </select>

            {/* Input Pencarian */}
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none w-40 sm:w-48 text-slate-800"
            />

            {/* Tombol + Input Transaksi persis di Foto */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>+</span>
              <span>Input Transaksi</span>
            </button>
          </div>
        </div>

        {/* TABEL TRANSAKSI KAS KECIL PERSIS FOTO 1 & 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">TANGGAL</th>
                <th className="py-4 px-6">KETERANGAN</th>
                <th className="py-4 px-6">KATEGORI</th>
                <th className="py-4 px-6 text-center">TIPE</th>
                <th className="py-4 px-6 text-right">JUMLAH</th>
                <th className="py-4 px-6 text-right">SALDO</th>
                <th className="py-4 px-6">DIINPUT OLEH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat transaksi kas kecil yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredData.map((t) => {
                  const isKeluar = t.tipe === "KELUAR";
                  const tglFormatted = new Date(t.tanggal).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  );

                  return (
                    <tr
                      key={t.id_kas_kecil}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Tanggal */}
                      <td className="py-4 px-6 font-medium text-slate-700 whitespace-nowrap">
                        {tglFormatted}
                      </td>

                      {/* Keterangan */}
                      <td className="py-4 px-6 text-slate-800 max-w-xs">
                        <p className="font-normal truncate">{t.keterangan || "-"}</p>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg inline-block whitespace-nowrap">
                          {t.kategori}
                        </span>
                      </td>

                      {/* Tipe Badge */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        {isKeluar ? (
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                            <span>↓</span>
                            <span>Keluar</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                            <span>↑</span>
                            <span>Masuk</span>
                          </span>
                        )}
                      </td>

                      {/* Jumlah Nominal */}
                      <td
                        className={`py-4 px-6 text-right font-bold whitespace-nowrap ${
                          isKeluar ? "text-rose-600" : "text-blue-600"
                        }`}
                      >
                        {isKeluar ? "-" : "+"}Rp {Number(t.jumlah).toLocaleString("id-ID")}
                      </td>

                      {/* Saldo Berjalan */}
                      <td className="py-4 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp {t.saldoBerjalan.toLocaleString("id-ID")}
                      </td>

                      {/* Diinput Oleh */}
                      <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                        {t.namaUser}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL INPUT TRANSAKSI */}
      <ModalInputKasKecil
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
    </div>
  );
}
