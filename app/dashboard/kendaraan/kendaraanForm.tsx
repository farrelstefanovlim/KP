"use client";

import Link from "next/link";
import { Kendaraan } from "@prisma/client";
import { tambahKendaraan, editKendaraan } from "./actions";

type KendaraanFormProps = {
  initialData?: Kendaraan;
};

export default function KendaraanForm({ initialData }: KendaraanFormProps) {
  const isEdit = !!initialData;

  const handleSubmit = async (formData: FormData) => {
    if (isEdit && initialData) {
      await editKendaraan(initialData.id_kendaraan, formData);
    } else {
      await tambahKendaraan(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {isEdit ? "Edit Kendaraan" : "Tambah Kendaraan"}
          </h2>
          <Link
            href="/dashboard/kendaraan"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
          >
            ✕
          </Link>
        </div>

        <form action={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Plat Nomor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plat Nomor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plat_nomor"
                defaultValue={initialData?.plat_nomor || ""}
                placeholder="B 1234 XY"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Merek / Model (Misal: Toyota Hiace Minibus) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Merek / Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="merk"
                defaultValue={initialData?.merk || ""}
                placeholder="Toyota Hiace Minibus"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Tahun */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tahun
              </label>
              <input
                type="number"
                name="tahun"
                defaultValue={initialData?.tahun || new Date().getFullYear()}
                placeholder="2026"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Sopir Utama (Readonly/Info) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sopir Utama
              </label>
              <input
                type="text"
                placeholder="Ditentukan di menu Sopir"
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* KM Odometer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                KM Odometer Saat Ini
              </label>
              <input
                type="number"
                name="km_terakhir"
                defaultValue={initialData ? Number(initialData.km_terakhir) : 0}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                defaultValue={initialData?.status === "BENGKEL" ? "Servis" : "Aktif"}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Servis">Servis / Bengkel</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Link
              href="/dashboard/kendaraan"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah Kendaraan"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}