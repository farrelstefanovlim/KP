"use client";

import { useState } from "react";
import { simpanTransaksiKasKecil } from "../actions";
import { TipeKasKecil } from "@prisma/client";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export default function ModalInputKasKecil({
  isOpen,
  onClose,
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states persis seperti di foto modal
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tipe, setTipe] = useState<TipeKasKecil>(TipeKasKecil.KELUAR);
  const [keterangan, setKeterangan] = useState<string>("");
  const [kategori, setKategori] = useState<string>("");
  const [jumlah, setJumlah] = useState<number | "">("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!keterangan.trim()) {
      setErrorMsg("Keterangan transaksi wajib diisi.");
      return;
    }

    if (jumlah === "" || Number(jumlah) <= 0) {
      setErrorMsg("Jumlah nominal wajib diisi lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await simpanTransaksiKasKecil({
        tanggal,
        tipe,
        keterangan: keterangan.trim(),
        kategori: kategori.trim() || (tipe === TipeKasKecil.MASUK ? "Top-up" : "Operasional"),
        jumlah: Number(jumlah),
      });

      if (res.success) {
        // Reset form
        setKeterangan("");
        setKategori("");
        setJumlah("");
        onSuccess(res.message || "Transaksi berhasil disimpan!");
        onClose();
      } else {
        setErrorMsg(res.error || "Gagal menyimpan transaksi.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Input Transaksi Kas Kecil
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form Modal persis seperti di Foto 3 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal * */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Tipe * */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipe <span className="text-red-500">*</span>
              </label>
              <select
                value={tipe}
                onChange={(e) => setTipe(e.target.value as TipeKasKecil)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
              >
                <option value={TipeKasKecil.KELUAR}>Pengeluaran</option>
                <option value={TipeKasKecil.MASUK}>Pemasukan</option>
              </select>
            </div>
          </div>

          {/* Keterangan * */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Deskripsi transaksi..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategori
              </label>
              <input
                type="text"
                placeholder="Konsumsi, ATK, Parkir..."
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Jumlah (Rp) * */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jumlah (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="0"
                value={jumlah}
                onChange={(e) =>
                  setJumlah(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Action Buttons persis di Foto 3 */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
