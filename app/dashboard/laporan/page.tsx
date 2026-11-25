import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import LaporanClient, { type LaporanData } from "./LaporanClient";

export const metadata = {
  title: "Laporan & Analitik - SIMO",
  description: "Laporan BBM, sparepart, kas kecil, dan kinerja kendaraan.",
};

export default async function LaporanPage() {
  const session = await auth();

  const [kendaraanRaw, bbmRaw, sparepartRaw, kasRaw, anginRaw, lainRaw] =
    await Promise.all([
      prisma.kendaraan.findMany({
        where: { deleted_at: null },
        include: {
          kendaraan_sopir: {
            where: { selesai: null, deleted_at: null },
            include: { sopir: { select: { nama: true } } },
            orderBy: { mulai: "desc" },
            take: 1,
          },
        },
        orderBy: { plat_nomor: "asc" },
      }),
      prisma.logBensin.findMany({
        where: { deleted_at: null },
        include: {
          kendaraan: { select: { id_kendaraan: true, plat_nomor: true } },
          sopir: { select: { nama: true } },
          user_input: { select: { nama: true, username: true } },
        },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
      }),
      prisma.pembelianSparepart.findMany({
        where: { deleted_at: null },
        include: {
          kendaraan: { select: { id_kendaraan: true, plat_nomor: true } },
          user_input: { select: { nama: true, username: true } },
          item_sparepart: true,
        },
        orderBy: [{ tanggal_beli: "desc" }, { created_at: "desc" }],
      }),
      prisma.kasKecil.findMany({
        where: { deleted_at: null },
        include: {
          user_input: { select: { nama: true, username: true } },
          log_bensin: {
            select: { kendaraan: { select: { id_kendaraan: true } } },
          },
          log_angin: {
            select: { kendaraan: { select: { id_kendaraan: true } } },
          },
          log_lain: {
            select: { kendaraan: { select: { id_kendaraan: true } } },
          },
          pembelian_sparepart: {
            select: { kendaraan: { select: { id_kendaraan: true } } },
          },
        },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
      }),
      prisma.logAngin.findMany({
        where: { deleted_at: null },
        select: {
          id_kendaraan: true,
          tanggal: true,
          biaya: true,
        },
      }),
      prisma.logLain.findMany({
        where: { deleted_at: null },
        select: {
          id_kendaraan: true,
          tanggal: true,
          biaya: true,
        },
      }),
    ]);

  const data: LaporanData = {
    kendaraan: kendaraanRaw.map((kendaraan) => ({
      id: kendaraan.id_kendaraan,
      plat: kendaraan.plat_nomor,
      merk: kendaraan.merk,
      status: kendaraan.status,
      kmTerakhir: Number(kendaraan.km_terakhir),
      sopirAktif: kendaraan.kendaraan_sopir[0]?.sopir.nama ?? "-",
    })),
    bbm: bbmRaw.map((log) => ({
      id: log.id_bbm,
      tanggal: log.tanggal.toISOString(),
      kendaraanId: log.id_kendaraan,
      plat: log.kendaraan.plat_nomor,
      sopir: log.sopir?.nama ?? "-",
      hargaPerLiter: Number(log.harga_per_liter),
      liter: Number(log.jumlah_liter),
      kmSebelum: Number(log.km_saat_isi) - Number(log.jarak_tempuh),
      kmSaatIsi: Number(log.km_saat_isi),
      jarak: Number(log.jarak_tempuh),
      total: Number(log.total_harga),
      diinput: log.user_input.nama || log.user_input.username,
    })),
    sparepart: sparepartRaw.flatMap((pembelian) =>
      pembelian.item_sparepart.length > 0
        ? pembelian.item_sparepart.map((item) => ({
            id: item.id_item_sparepart,
            tanggal: pembelian.tanggal_beli.toISOString(),
            kendaraanId: pembelian.id_kendaraan,
            plat: pembelian.kendaraan.plat_nomor,
            nama: item.nama,
            kategori: item.kategori,
            jumlah: Number(item.jumlah),
            hargaSatuan: Number(item.harga_satuan),
            total: Number(item.subtotal),
            diinput:
              pembelian.user_input.nama || pembelian.user_input.username,
          }))
        : [
            {
              id: pembelian.id_nota_sparepart,
              tanggal: pembelian.tanggal_beli.toISOString(),
              kendaraanId: pembelian.id_kendaraan,
              plat: pembelian.kendaraan.plat_nomor,
              nama: pembelian.keterangan || "Pembelian sparepart",
              kategori: "-",
              jumlah: 1,
              hargaSatuan: Number(pembelian.total_harga),
              total: Number(pembelian.total_harga),
              diinput:
                pembelian.user_input.nama || pembelian.user_input.username,
            },
          ],
    ),
    kasKecil: kasRaw.map((transaksi) => ({
      id: transaksi.id_kas_kecil,
      tanggal: transaksi.tanggal.toISOString(),
      tipe: transaksi.tipe,
      keterangan: transaksi.keterangan || transaksi.kategori,
      kategori: transaksi.kategori,
      jumlah: Number(transaksi.jumlah),
      diinput: transaksi.user_input.nama || transaksi.user_input.username,
      kendaraanId:
        transaksi.log_bensin?.kendaraan.id_kendaraan ??
        transaksi.log_angin?.kendaraan.id_kendaraan ??
        transaksi.log_lain?.kendaraan.id_kendaraan ??
        transaksi.pembelian_sparepart?.kendaraan.id_kendaraan ??
        null,
      createdAt: transaksi.created_at.toISOString(),
    })),
    angin: anginRaw.map((log) => ({
      kendaraanId: log.id_kendaraan,
      tanggal: log.tanggal.toISOString(),
      biaya: Number(log.biaya),
    })),
    biayaLain: lainRaw.map((log) => ({
      kendaraanId: log.id_kendaraan,
      tanggal: log.tanggal.toISOString(),
      biaya: Number(log.biaya),
    })),
  };

  return (
    <LaporanClient
      data={data}
      userRole={session?.user?.role || "Super Admin"}
    />
  );
}
