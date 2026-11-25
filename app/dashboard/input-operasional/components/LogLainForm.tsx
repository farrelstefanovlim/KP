"use client";

import { useState } from "react";
import { simpanLogLain } from "../actions";
import { SumberDana } from "@prisma/client";

type KendaraanInfo = {
  id_kendaraan: string;
  plat_nomor: string;
  merk: string;
  km_terakhir: number;
  sopirAktifId?: string | null;
  sopirAktifNama?: string | null;
};

type SopirItem = {
  id_sopir: string;
  nama: string;
};

type LogLainFormProps = {
  kendaraan: KendaraanInfo;
  sopirList: SopirItem[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
};

export default function LogLainForm({
  kendaraan,
  sopirList,
  onSuccess,
  onCancel,
}: LogLainFormProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states sesuai diagram LOG_LAIN
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [idSopir, setIdSopir] = useState<string>(kendaraan.sopirAktifId || "");
  const [kategori, setKategori] = useState<string>("");
  const [biaya, setBiaya] = useState<number | "">("");
  const [sumberDana, setSumberDana] = useState<SumberDana>(SumberDana.PETTY_CASH);
  const [keterangan, setKeterangan] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!kategori.trim()) {
      setErrorMsg("Kategori pengeluaran operasional wajib diisi.");
      return;
    }

    if (biaya === "" || Number(biaya) <= 0) {
      setErrorMsg("Biaya operasional wajib diisi lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await simpanLogLain({
        id_kendaraan: kendaraan.id_kendaraan,
        id_sopir: idSopir || null,
        tanggal,
        kategori: kategori.trim(),
        biaya: Number(biaya),
        sumber_dana: sumberDana,
        keterangan: keterangan.trim() || undefined,
      });

      if (res.success) {
        onSuccess(
          res.message || `Data Log Lain (${kategori.trim()}) berhasil disimpan!`
        );
      } else {
        setErrorMsg(res.error || "Gagal menyimpan data.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
      {/* Banner Ringkas Info Kendaraan */}
      <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 text-sm text-slate-700 flex items-center gap-2 mb-6">
        <svg
          className="w-4 h-4 text-slate-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>
          Kendaraan:{" "}
          <strong className="font-semibold text-slate-900">
            {kendaraan.plat_nomor}
          </strong>{" "}
          • {kendaraan.merk} • KM Terakhir:{" "}
          <strong className="font-semibold text-slate-900">
            {kendaraan.km_terakhir.toLocaleString("id-ID")} km
          </strong>
        </span>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tanggal */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
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

          {/* Nama Sopir */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Sopir
            </label>
            <select
              value={idSopir}
              onChange={(e) => setIdSopir(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
            >
              <option value="">-- Pilih Sopir (Opsional) --</option>
              {sopirList.map((s) => (
                <option key={s.id_sopir} value={s.id_sopir}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Pengeluaran Manual Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Kategori Log Lain <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ketik kategori (misal: Cuci Kendaraan, Tol & Parkir, Tambal Ban)..."
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Biaya (Rp) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Biaya (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="Ketik biaya..."
              value={biaya}
              onChange={(e) =>
                setBiaya(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Sumber Dana */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sumber Dana *
            </label>
            <select
              value={sumberDana}
              onChange={(e) => setSumberDana(e.target.value as SumberDana)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
            >
              <option value={SumberDana.PETTY_CASH}>Kas Kecil (Petty Cash)</option>
              <option value={SumberDana.KAS_BESAR}>Kas Besar / Transfer</option>
            </select>
          </div>

          {/* Keterangan */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Keterangan (opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 resize-none"
            />
          </div>
        </div>

        {/* Action Button sesuai Foto */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⏳</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              "Simpan Data Log Lain"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
