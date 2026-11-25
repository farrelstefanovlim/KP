import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import KasKecilClient, { TransaksiKasKecilItem } from "./KasKecilClient";

export const metadata = {
  title: "Kas Kecil (Petty Cash) - SIMO",
  description: "Manajemen pencatatan arus kas masuk dan kas keluar kas kecil operasional.",
};

export default async function KasKecilPage() {
  const session = await auth();

  // 1. Ambil seluruh riwayat transaksi kas kecil beserta relasi user
  const transaksiRaw = await prisma.kasKecil.findMany({
    where: { deleted_at: null },
    include: {
      user_input: true,
      log_bensin: {
        include: { kendaraan: true },
      },
      pembelian_sparepart: {
        include: { kendaraan: true },
      },
      log_angin: {
        include: { kendaraan: true },
      },
      log_lain: {
        include: { kendaraan: true },
      },
    },
    orderBy: [
      { tanggal: "desc" },
      { created_at: "desc" },
    ],
  });

  // 2. Format data ke bentuk yang serializeable
  const transaksiList: TransaksiKasKecilItem[] = transaksiRaw.map((t) => {
    // Jika transaksi berasal dari operasional dan tidak ada keterangan manual, buat keterangan deskriptif
    let deskripsi = t.keterangan || "";
    if (!deskripsi) {
      if (t.log_bensin) {
        deskripsi = `BBM ${t.log_bensin.kendaraan.plat_nomor}`;
      } else if (t.pembelian_sparepart) {
        deskripsi = `Sparepart ${t.pembelian_sparepart.kendaraan.plat_nomor}`;
      } else if (t.log_angin) {
        deskripsi = `Isi Angin ${t.log_angin.kendaraan.plat_nomor}`;
      } else if (t.log_lain) {
        deskripsi = `${t.log_lain.kategori} ${t.log_lain.kendaraan.plat_nomor}`;
      } else {
        deskripsi = t.kategori;
      }
    }

    return {
      id_kas_kecil: t.id_kas_kecil,
      tanggal: t.tanggal.toISOString(),
      tipe: t.tipe as "MASUK" | "KELUAR",
      kategori: t.kategori,
      keterangan: deskripsi,
      jumlah: Number(t.jumlah),
      id_user_input: t.id_user_input,
      namaUser: t.user_input?.nama || t.user_input?.username || "Admin",
      id_log_bensin: t.id_log_bensin,
      id_log_angin: t.id_log_angin,
      id_log_lain: t.id_log_lain,
      id_pembelian_sparepart: t.id_pembelian_sparepart,
      created_at: t.created_at.toISOString(),
    };
  });

  return (
    <KasKecilClient
      transaksiList={transaksiList}
      userRole={session?.user?.role || "Super Admin"}
    />
  );
}
