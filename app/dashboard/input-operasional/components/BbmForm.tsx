"use client";

import { useState } from "react";
import { simpanLogBbm } from "../actions";
import { SumberBensin, SumberDana } from "@prisma/client";

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

type BbmFormProps = {
  kendaraan: KendaraanInfo;
  sopirList: SopirItem[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
};

export default function BbmForm({
  kendaraan,
  sopirList,
  onSuccess,
  onCancel,
}: BbmFormProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states sesuai diagram LOG_BENSIN
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [idSopir, setIdSopir] = useState<string>(kendaraan.sopirAktifId || "");
  const [kmSaatIsi, setKmSaatIsi] = useState<number | "">("");
  const [hargaPerLiter, setHargaPerLiter] = useState<number | "">(6800);
  const [jumlahLiter, setJumlahLiter] = useState<number | "">("");
  const [sumber, setSumber] = useState<SumberBensin>(SumberBensin.PERTAMINA);
  const [sumberDana, setSumberDana] = useState<SumberDana>(SumberDana.PETTY_CASH);
  const [tempatBeli, setTempatBeli] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");

  // Perhitungan otomatis
  const literVal = typeof jumlahLiter === "number" ? jumlahLiter : 0;
  const hrgVal = typeof hargaPerLiter === "number" ? hargaPerLiter : 0;
  const totalHarga = Math.round(hrgVal * literVal);

  const kmVal = typeof kmSaatIsi === "number" ? kmSaatIsi : 0;
  const jarakTempuh = kmSaatIsi !== "" ? Math.max(0, kmVal - kendaraan.km_terakhir) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (kmSaatIsi === "" || kmSaatIsi < 0) {
      setErrorMsg("KM Odometer saat isi wajib diisi dengan benar.");
      return;
    }

    if (jumlahLiter === "" || jumlahLiter <= 0) {
      setErrorMsg("Jumlah liter wajib diisi lebih dari 0.");
      return;
    }

    if (hargaPerLiter === "" || hargaPerLiter <= 0) {
      setErrorMsg("Harga per liter wajib diisi lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await simpanLogBbm({
        id_kendaraan: kendaraan.id_kendaraan,
        id_sopir: idSopir || null,
        tanggal,
        sumber,
        tempat_beli: tempatBeli.trim() || undefined,
        harga_per_liter: Number(hargaPerLiter),
        jumlah_liter: Number(jumlahLiter),
        total_harga: totalHarga,
        km_saat_isi: Number(kmSaatIsi),
        sumber_dana: sumberDana,
        keterangan: keterangan.trim() || undefined,
      });

      if (res.success) {
        onSuccess(res.message || "Data BBM berhasil disimpan!");
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
      {/* Banner Info KM Odometer Sebelumnya persis seperti di foto */}
      <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 text-sm text-slate-700 flex items-center gap-2.5 mb-6">
        <svg
          className="w-5 h-5 text-slate-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>
          KM Odometer sebelumnya:{" "}
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
          {/* Tanggal * */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal *
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
              <option value="">-- Pilih Sopir --</option>
              {sopirList.map((s) => (
                <option key={s.id_sopir} value={s.id_sopir}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          {/* KM Odometer Saat Isi * */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              KM Odometer Saat Isi *
            </label>
            <input
              type="number"
              required
              min={0}
              placeholder={`Min. ${kendaraan.km_terakhir.toLocaleString("id-ID")}`}
              value={kmSaatIsi}
              onChange={(e) =>
                setKmSaatIsi(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
            {kmSaatIsi !== "" && kmSaatIsi < kendaraan.km_terakhir && (
              <p className="text-xs text-amber-600 mt-1">
                Catatan: KM ini lebih kecil dari KM sebelumnya ({kendaraan.km_terakhir.toLocaleString("id-ID")} km).
              </p>
            )}
            {kmSaatIsi !== "" && kmSaatIsi >= kendaraan.km_terakhir && (
              <p className="text-xs text-emerald-600 mt-1">
                Estimasi jarak tempuh: +{jarakTempuh.toLocaleString("id-ID")} km
              </p>
            )}
          </div>

          {/* Harga per Liter (Rp) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Harga per Liter (Rp)
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="6800"
              value={hargaPerLiter}
              onChange={(e) =>
                setHargaPerLiter(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Jumlah Liter * */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jumlah Liter *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min={0.01}
              placeholder="0.0"
              value={jumlahLiter}
              onChange={(e) =>
                setJumlahLiter(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Sumber BBM & Sumber Dana (Sesuai Diagram) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sumber BBM *
            </label>
            <select
              value={sumber}
              onChange={(e) => setSumber(e.target.value as SumberBensin)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
            >
              <option value={SumberBensin.PERTAMINA}>SPBU Pertamina</option>
              <option value={SumberBensin.TANGKI}>Tangki BBM Internal</option>
              <option value={SumberBensin.ECERAN}>Eceran / Lainnya</option>
            </select>
          </div>

          <div>
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

          {/* Tempat Beli / SPBU */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tempat Pengisian / SPBU (opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: SPBU Pertamina Daan Mogot"
              value={tempatBeli}
              onChange={(e) => setTempatBeli(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Keterangan (opsional) */}
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

        {/* Ringkasan Biaya */}
        {literVal > 0 && (
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Total ({literVal} L × Rp {hargaPerLiter.toLocaleString("id-ID")}):
            </span>
            <strong className="text-emerald-700 font-bold text-base">
              Rp {totalHarga.toLocaleString("id-ID")}
            </strong>
          </div>
        )}

        {/* Tombol Simpan persis sesuai Foto 3 */}
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
              "Simpan Data BBM"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
