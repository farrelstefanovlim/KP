"use client";

import { useActionState, useState } from "react";
import {
  simpanLogBbm,
  simpanLogLain,
  simpanLogAngin,
  simpanSparepart,
  type OpFormState,
} from "./actions";

type KendaraanOption = {
  id_kendaraan: string;
  plat_nomor: string;
  merk: string;
  km_terakhir: number;
  id_sopir_aktif: string;
};

type SopirOption = {
  id_sopir: string;
  nama: string;
};

type RiwayatRow = {
  id: string;
  tanggal: string;
  jenis: string;
  kendaraan: string;
  detail: string;
  nominal: number;
  oleh: string;
};

type SparepartDraft = {
  nama: string;
  kategori: string;
  jumlah: number;
  harga_satuan: number;
};

type TabKey = "bbm" | "lain" | "angin" | "sparepart";

const inputCls =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white";

export default function InputOperasionalClient({
  kendaraanList,
  sopirList,
  riwayatTerbaru,
}: {
  kendaraanList: KendaraanOption[];
  sopirList: SopirOption[];
  riwayatTerbaru: RiwayatRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("bbm");
  const hariIni = new Date().toISOString().split("T")[0];

  // State Armada & Sopir Terpilih
  const defaultKendaraan = kendaraanList[0];
  const [selectedKendaraanId, setSelectedKendaraanId] = useState(
    defaultKendaraan?.id_kendaraan ?? ""
  );
  const [selectedSopirId, setSelectedSopirId] = useState(
    defaultKendaraan?.id_sopir_aktif ?? ""
  );

  // State BBM
  const [sumberBbm, setSumberBbm] = useState<"TANGKI" | "PERTAMINA" | "ECERAN">("PERTAMINA");
  const [kmSebelum, setKmSebelum] = useState<number>(defaultKendaraan?.km_terakhir ?? 0);
  const [kmSaatIsi, setKmSaatIsi] = useState<number>(defaultKendaraan?.km_terakhir ?? 0);
  const [jumlahLiter, setJumlahLiter] = useState<number>(0);
  const [hargaPerLiter, setHargaPerLiter] = useState<number>(6800);

  // State Multi-Item Sparepart (sesuai ItemSparepart)
  const [itemsSparepart, setItemsSparepart] = useState<SparepartDraft[]>([
    { nama: "", kategori: "Mesin", jumlah: 1, harga_satuan: 0 },
  ]);

  const [stateBbm, actionBbm, pendingBbm] = useActionState<OpFormState, FormData>(simpanLogBbm, {});
  const [stateLain, actionLain, pendingLain] = useActionState<OpFormState, FormData>(
    simpanLogLain,
    {}
  );
  const [stateAngin, actionAngin, pendingAngin] = useActionState<OpFormState, FormData>(
    simpanLogAngin,
    {}
  );
  const [stateSparepart, actionSparepart, pendingSparepart] = useActionState<
    OpFormState,
    FormData
  >(simpanSparepart, {});

  function handleKendaraanChange(newId: string) {
    setSelectedKendaraanId(newId);
    const found = kendaraanList.find((k) => k.id_kendaraan === newId);
    if (found) {
      setKmSebelum(found.km_terakhir);
      setKmSaatIsi(found.km_terakhir);
      setSelectedSopirId(found.id_sopir_aktif);
    }
  }

  function updateItemSparepart(idx: number, field: keyof SparepartDraft, value: string | number) {
    setItemsSparepart((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function tambahBarisSparepart() {
    setItemsSparepart((prev) => [
      ...prev,
      { nama: "", kategori: "Umum", jumlah: 1, harga_satuan: 0 },
    ]);
  }

  function hapusBarisSparepart(idx: number) {
    if (itemsSparepart.length <= 1) return;
    setItemsSparepart((prev) => prev.filter((_, i) => i !== idx));
  }

  const estimasiJarak = Math.max(0, kmSaatIsi - kmSebelum);
  const estimasiTotalBbm = Math.round(jumlahLiter * hargaPerLiter);
  const estimasiTotalSparepart = itemsSparepart.reduce(
    (sum, it) => sum + Math.round(Number(it.jumlah) * Number(it.harga_satuan)),
    0
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "bbm", label: "Pengisian BBM" },
    { key: "lain", label: "Tol, Parkir & Lainnya" },
    { key: "angin", label: "Tambah Angin" },
    { key: "sparepart", label: "Pembelian Sparepart" },
  ];

  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KARTU FORM */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {/* --- TAB 1: LOG BENSIN --- */}
        {activeTab === "bbm" && (
          <form action={actionBbm} className="space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Catat Pengisian BBM</h2>
              <p className="text-xs text-slate-500">
                Odometer kendaraan otomatis diperbarui jika KM saat isi lebih besar dari KM terakhir.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input type="date" name="tanggal" defaultValue={hariIni} required className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kendaraan <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_kendaraan"
                  value={selectedKendaraanId}
                  onChange={(e) => handleKendaraanChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {kendaraanList.map((k) => (
                    <option key={k.id_kendaraan} value={k.id_kendaraan}>
                      {k.plat_nomor} — {k.merk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sopir</label>
                <select
                  name="id_sopir"
                  value={selectedSopirId}
                  onChange={(e) => setSelectedSopirId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Tanpa Sopir --</option>
                  {sopirList.map((s) => (
                    <option key={s.id_sopir} value={s.id_sopir}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sumber BBM <span className="text-red-500">*</span>
                </label>
                <select
                  name="sumber"
                  value={sumberBbm}
                  onChange={(e) =>
                    setSumberBbm(e.target.value as "TANGKI" | "PERTAMINA" | "ECERAN")
                  }
                  className={inputCls}
                >
                  <option value="PERTAMINA">SPBU / Pertamina</option>
                  <option value="TANGKI">Tangki Kantor</option>
                  <option value="ECERAN">Eceran</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tempat Beli (Opsional)
                </label>
                <input
                  type="text"
                  name="tempat_beli"
                  placeholder="Contoh: SPBU 24.301.xx Palembang"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  KM Sebelum (Hitung Jarak) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="km_sebelum"
                  value={kmSebelum}
                  onChange={(e) => setKmSebelum(Number(e.target.value))}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  KM Saat Isi <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="km_saat_isi"
                  value={kmSaatIsi}
                  onChange={(e) => setKmSaatIsi(Number(e.target.value))}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jumlah (Liter) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  name="jumlah_liter"
                  placeholder="0"
                  onChange={(e) => setJumlahLiter(Number(e.target.value))}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Harga / Liter (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="harga_per_liter"
                  value={hargaPerLiter}
                  onChange={(e) => setHargaPerLiter(Number(e.target.value))}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
              <input
                type="text"
                name="keterangan"
                placeholder="Catatan tambahan pengisian BBM..."
                className={inputCls}
              />
            </div>

            {sumberBbm !== "TANGKI" && (
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="pakai_petty_cash"
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Potong otomatis dari saldo <b>Kas Kecil (Petty Cash)</b>
              </label>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3.5 text-sm">
              <div>
                <span className="text-slate-500">Jarak Tempuh: </span>
                <span className="font-bold text-slate-900">
                  {estimasiJarak.toLocaleString("id-ID")} km
                </span>
              </div>
              <div>
                <span className="text-slate-500">Total Harga: </span>
                <span className="text-lg font-bold text-emerald-600">
                  Rp {estimasiTotalBbm.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <StatusBanner state={stateBbm} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pendingBbm}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-60"
              >
                {pendingBbm ? "Menyimpan..." : "Simpan Log BBM"}
              </button>
            </div>
          </form>
        )}

        {/* --- TAB 2: LOG LAIN --- */}
        {activeTab === "lain" && (
          <form action={actionLain} className="space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Catat Biaya Operasional Lainnya</h2>
              <p className="text-xs text-slate-500">
                Jika sumber dana memilih Petty Cash, pengeluaran otomatis tercatat di Kas Kecil.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input type="date" name="tanggal" defaultValue={hariIni} required className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kendaraan <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_kendaraan"
                  value={selectedKendaraanId}
                  onChange={(e) => handleKendaraanChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {kendaraanList.map((k) => (
                    <option key={k.id_kendaraan} value={k.id_kendaraan}>
                      {k.plat_nomor} — {k.merk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sopir</label>
                <select
                  name="id_sopir"
                  value={selectedSopirId}
                  onChange={(e) => setSelectedSopirId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Tanpa Sopir --</option>
                  {sopirList.map((s) => (
                    <option key={s.id_sopir} value={s.id_sopir}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="kategori"
                  placeholder="Tol & Parkir, Cuci Mobil, Retribusi..."
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Biaya (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="biaya"
                  placeholder="0"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sumber Dana <span className="text-red-500">*</span>
                </label>
                <select name="sumber_dana" defaultValue="PETTY_CASH" className={inputCls}>
                  <option value="PETTY_CASH">Petty Cash (Kas Kecil)</option>
                  <option value="KAS_BESAR">Kas Besar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
              <input
                type="text"
                name="keterangan"
                placeholder="Catatan detail pengeluaran..."
                className={inputCls}
              />
            </div>

            <StatusBanner state={stateLain} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pendingLain}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-60"
              >
                {pendingLain ? "Menyimpan..." : "Simpan Biaya Lainnya"}
              </button>
            </div>
          </form>
        )}

        {/* --- TAB 3: LOG ANGIN --- */}
        {activeTab === "angin" && (
          <form action={actionAngin} className="space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Catat Tambah Angin Ban</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input type="date" name="tanggal" defaultValue={hariIni} required className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kendaraan <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_kendaraan"
                  value={selectedKendaraanId}
                  onChange={(e) => handleKendaraanChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {kendaraanList.map((k) => (
                    <option key={k.id_kendaraan} value={k.id_kendaraan}>
                      {k.plat_nomor} — {k.merk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sopir</label>
                <select
                  name="id_sopir"
                  value={selectedSopirId}
                  onChange={(e) => setSelectedSopirId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Tanpa Sopir --</option>
                  {sopirList.map((s) => (
                    <option key={s.id_sopir} value={s.id_sopir}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Biaya (Rp)</label>
                <input type="number" min="0" name="biaya" defaultValue={0} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sumber Dana <span className="text-red-500">*</span>
                </label>
                <select name="sumber_dana" defaultValue="PETTY_CASH" className={inputCls}>
                  <option value="PETTY_CASH">Petty Cash (Kas Kecil)</option>
                  <option value="KAS_BESAR">Kas Besar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  name="keterangan"
                  placeholder="Contoh: Isi nitrogen 4 ban"
                  className={inputCls}
                />
              </div>
            </div>

            <StatusBanner state={stateAngin} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pendingAngin}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-60"
              >
                {pendingAngin ? "Menyimpan..." : "Simpan Log Angin"}
              </button>
            </div>
          </form>
        )}

        {/* --- TAB 4: NOTA PEMBELIAN SPAREPART (Header + ItemSparepart) --- */}
        {activeTab === "sparepart" && (
          <form action={actionSparepart} className="space-y-5">
            <input type="hidden" name="items_json" value={JSON.stringify(itemsSparepart)} />

            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Catat Nota Pembelian Sparepart</h2>
              <p className="text-xs text-slate-500">
                Satu nota dapat memuat beberapa item suku cadang sekaligus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kendaraan <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_kendaraan"
                  value={selectedKendaraanId}
                  onChange={(e) => handleKendaraanChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {kendaraanList.map((k) => (
                    <option key={k.id_kendaraan} value={k.id_kendaraan}>
                      {k.plat_nomor} — {k.merk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal Beli <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_beli"
                  defaultValue={hariIni}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal Pasang (Opsional)
                </label>
                <input type="date" name="tanggal_pasang" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  KM Saat Ganti <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="km_saat_ganti"
                  defaultValue={kmSebelum}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sumber Dana <span className="text-red-500">*</span>
                </label>
                <select name="sumber_dana" defaultValue="KAS_BESAR" className={inputCls}>
                  <option value="KAS_BESAR">Kas Besar</option>
                  <option value="PETTY_CASH">Petty Cash (Kas Kecil)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tempat Beli / Toko
                </label>
                <input
                  type="text"
                  name="tempat_beli"
                  placeholder="Nama toko onderdil / bengkel"
                  className={inputCls}
                />
              </div>
            </div>

            {/* DAFTAR ITEM SPAREPART */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800">Rincian Item Sparepart</label>
                <button
                  type="button"
                  onClick={tambahBarisSparepart}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  + Tambah Baris Item
                </button>
              </div>

              {itemsSparepart.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Nama sparepart"
                      value={item.nama}
                      onChange={(e) => updateItemSparepart(idx, "nama", e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Kategori (Oli, Ban, Rem...)"
                      value={item.kategori}
                      onChange={(e) => updateItemSparepart(idx, "kategori", e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="Qty"
                      value={item.jumlah}
                      onChange={(e) => updateItemSparepart(idx, "jumlah", Number(e.target.value))}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Harga satuan"
                      value={item.harga_satuan || ""}
                      onChange={(e) =>
                        updateItemSparepart(idx, "harga_satuan", Number(e.target.value))
                      }
                      required
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    {itemsSparepart.length > 1 && (
                      <button
                        type="button"
                        onClick={() => hapusBarisSparepart(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1"
                        title="Hapus baris"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Nota</label>
              <input
                type="text"
                name="keterangan"
                placeholder="Catatan tambahan nota..."
                className={inputCls}
              />
            </div>

            <div className="flex items-center justify-end rounded-xl bg-slate-50 border border-slate-200 px-5 py-3.5 text-sm">
              <span className="text-slate-500 mr-2">Total Nota:</span>
              <span className="text-lg font-bold text-emerald-600">
                Rp {estimasiTotalSparepart.toLocaleString("id-ID")}
              </span>
            </div>

            <StatusBanner state={stateSparepart} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pendingSparepart}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-60"
              >
                {pendingSparepart ? "Menyimpan..." : "Simpan Nota Sparepart"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* RIWAYAT INPUT TERAKHIR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Riwayat Input Operasional Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6 font-bold">Tanggal</th>
                <th className="py-4 px-6 font-bold">Jenis</th>
                <th className="py-4 px-6 font-bold">Kendaraan</th>
                <th className="py-4 px-6 font-bold">Detail</th>
                <th className="py-4 px-6 font-bold text-right">Total Biaya</th>
                <th className="py-4 px-6 font-bold">Diinput Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {riwayatTerbaru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data operasional yang diinput.
                  </td>
                </tr>
              ) : (
                riwayatTerbaru.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">{row.tanggal}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                        {row.jenis}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{row.kendaraan}</td>
                    <td className="py-4 px-6 text-slate-600">{row.detail}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                      Rp {row.nominal.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{row.oleh}</td>
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

function StatusBanner({ state }: { state: OpFormState }) {
  if (state.error) {
    return (
      <div className="p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
        {state.error}
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded">
        {state.success}
      </div>
    );
  }
  return null;
}