"use client";

import { useState } from "react";
import { simpanLogSparepart } from "../actions";
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

type SparepartFormProps = {
  kendaraan: KendaraanInfo;
  sopirList: SopirItem[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
};

type ItemFormRow = {
  nama: string;
  kategori: string;
  jumlah: number | "";
  harga_satuan: number | "";
  subtotal: number;
};

const KATEGORI_SPAREPART_OPTIONS = [
  "Oli & Pelumas",
  "Filter (Oli / Udara / BBM)",
  "Mesin",
  "Sistem Rem",
  "Ban & Kaki-kaki",
  "Kelistrikan & Aki",
  "Transmisi & Kopling",
  "Body & Eksterior",
  "Lain-lain",
];

export default function SparepartForm({
  kendaraan,
  sopirList,
  onSuccess,
  onCancel,
}: SparepartFormProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states sesuai diagram PEMBELIAN_SPAREPART
  const [tanggalBeli, setTanggalBeli] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tanggalPasang, setTanggalPasang] = useState<string>("");
  const [idSopir, setIdSopir] = useState<string>(kendaraan.sopirAktifId || "");
  const [kmSaatGanti, setKmSaatGanti] = useState<number | "">("");
  const [tempatBeli, setTempatBeli] = useState<string>("");
  const [sumberDana, setSumberDana] = useState<SumberDana>(SumberDana.PETTY_CASH);
  const [keterangan, setKeterangan] = useState<string>("");

  // Items sparepart: kategori pilihan (select), harga satuan manual (tidak langsung 0)
  const [items, setItems] = useState<ItemFormRow[]>([
    {
      nama: "",
      kategori: "Oli & Pelumas",
      jumlah: 1,
      harga_satuan: "",
      subtotal: 0,
    },
  ]);

  const handleItemChange = (
    index: number,
    field: keyof ItemFormRow,
    val: any
  ) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };

    if (field === "jumlah" || field === "harga_satuan") {
      const jml =
        field === "jumlah"
          ? val === "" ? 0 : Number(val)
          : current.jumlah === "" ? 0 : Number(current.jumlah);

      const hrg =
        field === "harga_satuan"
          ? val === "" ? 0 : Number(val)
          : current.harga_satuan === "" ? 0 : Number(current.harga_satuan);

      current.subtotal = jml * hrg;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        nama: "",
        kategori: "Mesin",
        jumlah: 1,
        harga_satuan: "",
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalHarga = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (kmSaatGanti === "" || kmSaatGanti < 0) {
      setErrorMsg("KM Odometer saat ganti sparepart wajib diisi.");
      return;
    }

    const hasEmptyName = items.some((it) => !it.nama.trim());
    if (hasEmptyName) {
      setErrorMsg("Semua nama item sparepart harus diisi.");
      return;
    }

    const hasInvalidPrice = items.some(
      (it) =>
        it.jumlah === "" ||
        Number(it.jumlah) <= 0 ||
        it.harga_satuan === "" ||
        Number(it.harga_satuan) < 0
    );
    if (hasInvalidPrice) {
      setErrorMsg("Jumlah dan harga satuan item wajib diisi angka yang valid.");
      return;
    }

    setLoading(true);
    try {
      const formattedItems = items.map((it) => ({
        nama: it.nama.trim(),
        kategori: it.kategori.trim() || "Sparepart",
        jumlah: Number(it.jumlah),
        harga_satuan: Number(it.harga_satuan),
        subtotal: it.subtotal,
      }));

      const res = await simpanLogSparepart({
        id_kendaraan: kendaraan.id_kendaraan,
        id_sopir: idSopir || null,
        tanggal_beli: tanggalBeli,
        tanggal_pasang: tanggalPasang || null,
        km_saat_ganti: Number(kmSaatGanti),
        tempat_beli: tempatBeli.trim() || undefined,
        sumber_dana: sumberDana,
        keterangan: keterangan.trim() || undefined,
        items: formattedItems,
      });

      if (res.success) {
        onSuccess(res.message || "Data Sparepart berhasil disimpan!");
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
      {/* Banner Info KM Odometer Sebelumnya */}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tanggal Beli * */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal Beli *
            </label>
            <input
              type="date"
              required
              value={tanggalBeli}
              onChange={(e) => setTanggalBeli(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Tanggal Pasang */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal Pasang (opsional)
            </label>
            <input
              type="date"
              value={tanggalPasang}
              onChange={(e) => setTanggalPasang(e.target.value)}
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

          {/* KM Odometer Saat Ganti * */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              KM Odometer Saat Ganti *
            </label>
            <input
              type="number"
              required
              min={0}
              placeholder={`Min. ${kendaraan.km_terakhir.toLocaleString("id-ID")}`}
              value={kmSaatGanti}
              onChange={(e) =>
                setKmSaatGanti(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Toko / Bengkel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tempat Beli / Bengkel
            </label>
            <input
              type="text"
              placeholder="Contoh: Toko Sparepart Maju Jaya"
              value={tempatBeli}
              onChange={(e) => setTempatBeli(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Sumber Dana */}
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
        </div>

        {/* DAFTAR ITEM SPAREPART */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Rincian Item Sparepart
              </h4>
              <p className="text-xs text-slate-500">
                Kategori dan harga satuan dapat diketik secara manual
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              + Tambah Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Nama Barang */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nama Barang *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Oli Mesin"
                      value={item.nama}
                      onChange={(e) =>
                        handleItemChange(idx, "nama", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>

                  {/* Kategori Dropdown Pilihan */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Kategori *
                    </label>
                    <select
                      value={item.kategori}
                      onChange={(e) =>
                        handleItemChange(idx, "kategori", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                    >
                      {KATEGORI_SPAREPART_OPTIONS.map((kat) => (
                        <option key={kat} value={kat}>
                          {kat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Qty */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="1"
                      value={item.jumlah}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "jumlah",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>

                  {/* Harga Satuan Manual Input (Tidak Langsung 0) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Harga Satuan (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="Ketik harga..."
                      value={item.harga_satuan}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "harga_satuan",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>

                  {/* Hapus Item */}
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="flex justify-end text-xs text-slate-500">
                  Subtotal:{" "}
                  <strong className="text-slate-900 ml-1">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Total Keseluruhan:</span>
            <strong className="text-emerald-700 font-bold text-base">
              Rp {totalHarga.toLocaleString("id-ID")}
            </strong>
          </div>
        </div>

        {/* Keterangan */}
        <div>
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
              "Simpan Data Sparepart"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
