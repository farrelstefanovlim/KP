import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DataKendaraanPage() {
  // Ambil data kendaraan dari database beserta relasi sopir aktif dan log terkait
  const kendaraanList = await prisma.kendaraan.findMany({
    where: { deleted_at: null },
    include: {
      kendaraan_sopir: {
        where: { selesai: null }, // Mengambil sopir yang sedang aktif memegang kendaraan
        include: { sopir: true },
      },
      log_bensin: true,
      pembelian_sparepart: true,
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Kendaraan</h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <Link
            href="/dashboard/kendaraan/tambah"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all"
          >
            <span>+</span> Tambah Kendaraan
          </Link>
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
            Super Admin
          </span>
        </div>
      </div>

      {/* COUNTER JUMLAH KENDARAAN */}
      <p className="text-sm text-slate-500 font-medium">
        {kendaraanList.length} kendaraan terdaftar
      </p>

      {/* GRID KARTU KENDARAAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kendaraanList.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-400">
            Belum ada data kendaraan terdaftar. Klik tombol Tambah Kendaraan di atas untuk memasukkan armada baru.
          </div>
        ) : (
          kendaraanList.map((k) => {
            const sopirAktif = k.kendaraan_sopir[0]?.sopir?.nama || "-";
            const totalLiter = k.log_bensin.reduce(
              (acc, curr) => acc + Number(curr.jumlah_liter),
              0
            );
            const totalBiayaBbm = k.log_bensin.reduce(
              (acc, curr) => acc + Number(curr.total_harga),
              0
            );
            const totalSparepart = k.pembelian_sparepart.reduce(
              (acc, curr) => acc + Number(curr.total_harga),
              0
            );
            const isAktif = k.status === "BAGUS";

            return (
              <div
                key={k.id_kendaraan}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Header Kartu: Plat Nomor & Status Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-slate-900">
                          {k.plat_nomor}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAktif
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {isAktif ? "Aktif" : "Servis"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {k.merk} {k.tahun}
                      </p>
                    </div>

                    {/* Tombol Aksi Edit */}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Link
                        href={`/dashboard/kendaraan/edit/${k.id_kendaraan}`}
                        className="p-1 hover:text-slate-600 transition-colors"
                        title="Edit Kendaraan"
                      >
                        ✏️
                      </Link>
                    </div>
                  </div>

                  {/* Informasi Sopir & KM Terakhir */}
                  <div className="space-y-1.5 my-4 text-sm text-slate-600 border-y border-slate-100 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">👤</span>
                      <span>Sopir: <strong className="text-slate-800">{sopirAktif}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">📖</span>
                      <span>KM Terakhir: <strong className="text-slate-800">{Number(k.km_terakhir).toLocaleString("id-ID")} km</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Kartu: Statistik Solar, Biaya BBM, & Sparepart (Dihitung Otomatis) */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Solar</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{totalLiter} L</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Biaya BBM</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">Rp {totalBiayaBbm.toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Sparepart</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">Rp {totalSparepart.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}