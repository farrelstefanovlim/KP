"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import BbmForm from "./components/BbmForm";
import SparepartForm from "./components/SparepartForm";
import AnginForm from "./components/AnginForm";
import LogLainForm from "./components/LogLainForm";

export type KendaraanData = {
  id_kendaraan: string;
  plat_nomor: string;
  merk: string;
  tahun: number;
  status: "BAGUS" | "BENGKEL";
  km_terakhir: number;
  sopirAktifId?: string | null;
  sopirAktifNama?: string | null;
};

export type SopirData = {
  id_sopir: string;
  nama: string;
};

type Props = {
  kendaraanList: KendaraanData[];
  sopirList: SopirData[];
  userRole?: string;
};

export type JenisInput = "bbm" | "sparepart" | "angin" | "lain";

export default function InputOperasionalClient({
  kendaraanList,
  sopirList,
  userRole = "Super Admin",
}: Props) {
  // Alur Langkah baru sesuai instruksi:
  // 1 = Pilih Operasional (Jenis Input)
  // 2 = Pilih Kendaraan
  // 3 = Isi Form Input
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedJenis, setSelectedJenis] = useState<JenisInput | null>(null);
  const [selectedKendaraanId, setSelectedKendaraanId] = useState<string | null>(null);

  // Search filter kendaraan
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback notifikasi sukses
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedKendaraan = useMemo(
    () => kendaraanList.find((k) => k.id_kendaraan === selectedKendaraanId) || null,
    [kendaraanList, selectedKendaraanId]
  );

  const filteredKendaraan = useMemo(() => {
    if (!searchQuery.trim()) return kendaraanList;
    const q = searchQuery.toLowerCase();
    return kendaraanList.filter(
      (k) =>
        k.plat_nomor.toLowerCase().includes(q) ||
        k.merk.toLowerCase().includes(q) ||
        (k.sopirAktifNama && k.sopirAktifNama.toLowerCase().includes(q))
    );
  }, [kendaraanList, searchQuery]);

  // Transisi tahapan
  const handleSelectJenis = (jenis: JenisInput) => {
    setSelectedJenis(jenis);
    setSuccessMessage(null);
    setStep(2); // Menuju Pilih Kendaraan
  };

  const handleSelectKendaraan = (k: KendaraanData) => {
    setSelectedKendaraanId(k.id_kendaraan);
    setSuccessMessage(null);
    setStep(3); // Menuju Form Input
  };

  const handleBackToStep1 = () => {
    setStep(1); // Balik ke Pilih Jenis Input
    setSuccessMessage(null);
  };

  const handleBackToStep2 = () => {
    setStep(2); // Balik ke Pilih Kendaraan
    setSuccessMessage(null);
  };

  const handleSuccess = (msg: string) => {
    setSuccessMessage(msg);
  };

  const handleResetForNewInput = () => {
    setSuccessMessage(null);
    setStep(1); // Balik ke awal
    setSelectedKendaraanId(null);
    setSelectedJenis(null);
  };

  // Label nama kategori yang dipilih
  const jenisLabel = useMemo(() => {
    switch (selectedJenis) {
      case "bbm":
        return "Solar / BBM";
      case "sparepart":
        return "Sparepart";
      case "angin":
        return "Isi Angin";
      case "lain":
        return "Log Lain";
      default:
        return "";
    }
  }, [selectedJenis]);

  return (
    <div className="space-y-6">
      {/* HEADER HALAMAN PERSIS SEPERTI DI FOTO */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Input Operasional Kendaraan
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {userRole.toLowerCase().includes("super")
              ? "Super Admin"
              : userRole}
          </span>
        </div>
      </div>

      {/* NOTIFIKASI SUKSES */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-950">
                Pencatatan Berhasil Disimpan!
              </h4>
              <p className="text-sm text-emerald-700">{successMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetForNewInput}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              + Input Data Baru
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-emerald-300 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-100/60 transition-colors"
            >
              Ke Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LANGKAH 1: PILIH JENIS OPERASIONAL DULUAN (Persis Foto 1) */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pilih Jenis Input</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Pilih kategori data yang akan diinput
            </p>
          </div>

          {/* 4 Kartu Kategori Sesuai Foto 1 (Dengan Cuci Kendaraan diubah jadi Log Lain) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* 1. Solar / BBM */}
            <div
              onClick={() => handleSelectJenis("bbm")}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Icon Kotak Hijau Muda */}
                <div className="w-12 h-12 rounded-xl bg-[#dcfce7] flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Solar / BBM
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Catat pengisian bahan bakar
                </p>
              </div>
            </div>

            {/* 2. Sparepart */}
            <div
              onClick={() => handleSelectJenis("sparepart")}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Icon Kotak Ungu Muda */}
                <div className="w-12 h-12 rounded-xl bg-[#f3e8ff] flex items-center justify-center text-purple-600 mb-4 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Sparepart
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Ganti / beli suku cadang
                </p>
              </div>
            </div>

            {/* 3. Isi Angin */}
            <div
              onClick={() => handleSelectJenis("angin")}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-sky-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Icon Kotak Biru Muda */}
                <div className="w-12 h-12 rounded-xl bg-[#e0f2fe] flex items-center justify-center text-sky-600 mb-4 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Isi Angin
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Catat biaya isi angin ban
                </p>
              </div>
            </div>

            {/* 4. Log Lain (Sesuai instruksi: diubah dari Cuci Kendaraan menjadi Log Lain) */}
            <div
              onClick={() => handleSelectJenis("lain")}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Icon Kotak Cyan / Teal Muda */}
                <div className="w-12 h-12 rounded-xl bg-[#ccfbf1] flex items-center justify-center text-teal-600 mb-4 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                  Log Lain
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Catat pengeluaran operasional lainnya
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LANGKAH 2: PILIH KENDARAAN (Persis Foto 4) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {/* Tombol Back < dan Judul Pilih Kendaraan persis Foto 4 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="text-slate-400 hover:text-slate-800 transition-colors text-xl font-bold cursor-pointer pr-1"
                  title="Kembali ke Pilih Jenis Input"
                >
                  ‹
                </button>
                <h2 className="text-lg font-bold text-slate-900">
                  Pilih Kendaraan
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 ml-4 sm:ml-5">
                Pilih kendaraan yang akan diinput datanya (Kategori:{" "}
                <span className="font-semibold text-emerald-600">
                  {jenisLabel}
                </span>
                )
              </p>
            </div>

            {/* Kolom Pencarian */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari plat nomor / merk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* List Kartu Kendaraan Persis Tampilan Foto 4 */}
          <div className="space-y-3.5 pt-2">
            {filteredKendaraan.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                Tidak ada kendaraan yang ditemukan.
              </div>
            ) : (
              filteredKendaraan.map((k) => {
                const isAktif = k.status === "BAGUS";
                const isSelected = selectedKendaraanId === k.id_kendaraan;

                return (
                  <div
                    key={k.id_kendaraan}
                    onClick={() => handleSelectKendaraan(k)}
                    className={`bg-white rounded-2xl p-6 border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? "border-2 border-emerald-500 shadow-sm"
                        : "border-slate-200/90 hover:border-emerald-500 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Plat Nomor */}
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {k.plat_nomor}
                      </h3>

                      {/* Merk dan Model */}
                      <p className="text-sm text-slate-500 mb-2">
                        {k.merk} {k.tahun ? `· ${k.tahun}` : ""}
                        {k.sopirAktifNama && (
                          <span className="text-slate-400">
                            {" "}
                            (Sopir: {k.sopirAktifNama})
                          </span>
                        )}
                      </p>

                      {/* KM Terakhir */}
                      <p className="text-sm text-slate-400">
                        KM Terakhir:{" "}
                        <span className="text-slate-600 font-medium">
                          {k.km_terakhir.toLocaleString("id-ID")}
                        </span>
                      </p>
                    </div>

                    {/* Badge Status persis Foto 4 */}
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isAktif
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-amber-50 text-amber-600 border border-amber-200"
                        }`}
                      >
                        {isAktif ? "aktif" : "servis"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LANGKAH 3: ISI FORM INPUT (Persis Foto 3 & Diagram ERD) */}
      {/* ========================================================================= */}
      {step === 3 && selectedKendaraan && selectedJenis && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Navigasi Kembali ke Pilih Kendaraan */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToStep2}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span className="text-lg">‹</span>
              <span>Ganti Kendaraan</span>
            </button>

            <div className="text-xs text-slate-500">
              Input:{" "}
              <strong className="text-emerald-600 font-bold">
                {jenisLabel}
              </strong>{" "}
              ({selectedKendaraan.plat_nomor})
            </div>
          </div>

          {/* Form masing-masing kategori sesuai diagram ERD */}
          {selectedJenis === "bbm" && (
            <BbmForm
              kendaraan={selectedKendaraan}
              sopirList={sopirList}
              onSuccess={handleSuccess}
              onCancel={handleBackToStep2}
            />
          )}

          {selectedJenis === "sparepart" && (
            <SparepartForm
              kendaraan={selectedKendaraan}
              sopirList={sopirList}
              onSuccess={handleSuccess}
              onCancel={handleBackToStep2}
            />
          )}

          {selectedJenis === "angin" && (
            <AnginForm
              kendaraan={selectedKendaraan}
              sopirList={sopirList}
              onSuccess={handleSuccess}
              onCancel={handleBackToStep2}
            />
          )}

          {selectedJenis === "lain" && (
            <LogLainForm
              kendaraan={selectedKendaraan}
              sopirList={sopirList}
              onSuccess={handleSuccess}
              onCancel={handleBackToStep2}
            />
          )}
        </div>
      )}
    </div>
  );
}
