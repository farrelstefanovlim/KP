// app/dashboard/kas-kecil/tambah/page.tsx
"use client";

import Link from "next/link";
import { tambahKasKecil } from "../actions";

export default function TambahKasKecilPage() {
  const hariIni = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Input Transaksi Kas Kecil</h2>
          <Link href="/dashboard/kas-kecil" className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg">
            ✕
          </Link>
        </div>

        {/* Form */}
        <form action={tambahKasKecil} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Tanggal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal"
                defaultValue={hariIni}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Tipe Transaksi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipe <span className="text-red-500">*</span>
              </label>
              <select
                name="tipe"
                required
                defaultValue="KELUAR"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
              >
                <option value="KELUAR">Pengeluaran</option>
                <option value="MASUK">Pemasukan</option>
              </select>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="keterangan"
              placeholder="Deskripsi transaksi..."
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategori
              </label>
              <input
                type="text"
                name="kategori"
                placeholder="Konsumsi, ATK, Parkir..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Jumlah (Rp) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jumlah (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="jumlah"
                placeholder="0"
                min="0"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Aksi Tombol */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Link
              href="/dashboard/kas-kecil"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all"
            >
              Simpan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}