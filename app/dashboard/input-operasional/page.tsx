import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import InputOperasionalClient, {
  KendaraanData,
  SopirData,
} from "./InputOperasionalClient";

export const metadata = {
  title: "Input Operasional Kendaraan - SIMO",
  description: "Pencatatan data operasional BBM, sparepart, isi angin, dan log lain armada kendaraan.",
};

export default async function InputOperasionalPage() {
  const session = await auth();

  // 1. Ambil seluruh armada kendaraan aktif
  const kendaraanRaw = await prisma.kendaraan.findMany({
    where: { deleted_at: null },
    include: {
      kendaraan_sopir: {
        where: { selesai: null },
        include: { sopir: true },
      },
    },
    orderBy: { plat_nomor: "asc" },
  });

  // 2. Format data kendaraan
  const kendaraanList: KendaraanData[] = kendaraanRaw.map((k) => {
    const sopirAktif = k.kendaraan_sopir[0]?.sopir;
    return {
      id_kendaraan: k.id_kendaraan,
      plat_nomor: k.plat_nomor,
      merk: k.merk,
      tahun: k.tahun,
      status: k.status as "BAGUS" | "BENGKEL",
      km_terakhir: Number(k.km_terakhir) || 0,
      sopirAktifId: sopirAktif?.id_sopir || null,
      sopirAktifNama: sopirAktif?.nama || null,
    };
  });

  // 3. Ambil daftar sopir yang aktif untuk dropdown
  const sopirRaw = await prisma.sopir.findMany({
    where: { deleted_at: null, is_active: true },
    orderBy: { nama: "asc" },
  });

  const sopirList: SopirData[] = sopirRaw.map((s) => ({
    id_sopir: s.id_sopir,
    nama: s.nama,
  }));

  return (
    <InputOperasionalClient
      kendaraanList={kendaraanList}
      sopirList={sopirList}
      userRole={session?.user?.role || "Super Admin"}
    />
  );
}
