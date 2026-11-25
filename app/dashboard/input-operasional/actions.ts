// app/dashboard/input-operasional/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SumberBensin, SumberDana } from "@prisma/client";

// Helper untuk mendapatkan ID user yang sedang login
async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }
  if (session?.user?.username) {
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    });
    if (user) return user.id_user;
  }
  const firstUser = await prisma.user.findFirst();
  if (!firstUser) {
    throw new Error("Tidak ada user terdaftar di sistem.");
  }
  return firstUser.id_user;
}

// =========================================================================
// 1. INPUT OPERASIONAL: SOLAR / BBM (LogBensin) Sesuai Diagram LOG_BENSIN
// =========================================================================
export type InputBbmPayload = {
  id_kendaraan: string;
  id_sopir?: string | null;
  tanggal: string; // YYYY-MM-DD
  sumber: SumberBensin;
  tempat_beli?: string;
  harga_per_liter: number;
  jumlah_liter: number;
  total_harga: number;
  km_saat_isi: number;
  sumber_dana: SumberDana;
  keterangan?: string;
};

export async function simpanLogBbm(payload: InputBbmPayload) {
  try {
    const userId = await getCurrentUserId();

    const kendaraan = await prisma.kendaraan.findUnique({
      where: { id_kendaraan: payload.id_kendaraan },
    });

    if (!kendaraan) {
      return { success: false, error: "Kendaraan tidak ditemukan." };
    }

    const kmSebelumnya = Number(kendaraan.km_terakhir) || 0;
    const jarakTempuh = Math.max(0, payload.km_saat_isi - kmSebelumnya);

    // Database Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Buat record LogBensin
      const bbm = await tx.logBensin.create({
        data: {
          id_kendaraan: payload.id_kendaraan,
          id_sopir: payload.id_sopir || null,
          id_user_input: userId,
          tanggal: new Date(payload.tanggal),
          sumber: payload.sumber,
          tempat_beli: payload.tempat_beli || null,
          harga_per_liter: payload.harga_per_liter,
          jumlah_liter: payload.jumlah_liter,
          total_harga: payload.total_harga,
          jarak_tempuh: jarakTempuh,
          km_saat_isi: payload.km_saat_isi,
          keterangan: payload.keterangan || null,
        },
      });

      // 2. Perbarui KM Terakhir Kendaraan jika KM saat isi lebih tinggi
      if (payload.km_saat_isi > kmSebelumnya) {
        await tx.kendaraan.update({
          where: { id_kendaraan: payload.id_kendaraan },
          data: { km_terakhir: payload.km_saat_isi },
        });
      }

      // 3. Catat Kas Kecil jika sumber dana Petty Cash
      if (payload.sumber_dana === SumberDana.PETTY_CASH) {
        await tx.kasKecil.create({
          data: {
            tanggal: new Date(payload.tanggal),
            tipe: "KELUAR",
            kategori: "BBM",
            keterangan:
              payload.keterangan ||
              `BBM ${kendaraan.plat_nomor} (${payload.jumlah_liter}L @ Rp ${payload.harga_per_liter.toLocaleString("id-ID")})`,
            jumlah: payload.total_harga,
            id_user_input: userId,
            id_log_bensin: bbm.id_bbm,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kendaraan");
    revalidatePath("/dashboard/input-operasional");

    return {
      success: true,
      message: `Data BBM untuk ${kendaraan.plat_nomor} berhasil disimpan!`,
    };
  } catch (error: any) {
    console.error("Error simpanLogBbm:", error);
    return {
      success: false,
      error: error?.message || "Gagal menyimpan data BBM.",
    };
  }
}

// =========================================================================
// 2. INPUT OPERASIONAL: SPAREPART Sesuai Diagram PEMBELIAN_SPAREPART
// =========================================================================
export type ItemSparepartInput = {
  nama: string;
  kategori: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
};

export type InputSparepartPayload = {
  id_kendaraan: string;
  id_sopir?: string | null;
  tanggal_beli: string;
  tanggal_pasang?: string | null;
  km_saat_ganti: number;
  tempat_beli?: string;
  sumber_dana: SumberDana;
  keterangan?: string;
  items: ItemSparepartInput[];
};

export async function simpanLogSparepart(payload: InputSparepartPayload) {
  try {
    const userId = await getCurrentUserId();

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Minimal harus ada 1 item sparepart." };
    }

    const kendaraan = await prisma.kendaraan.findUnique({
      where: { id_kendaraan: payload.id_kendaraan },
    });

    if (!kendaraan) {
      return { success: false, error: "Kendaraan tidak ditemukan." };
    }

    const kmSebelumnya = Number(kendaraan.km_terakhir) || 0;
    const totalHarga = payload.items.reduce((acc, curr) => acc + curr.subtotal, 0);

    await prisma.$transaction(async (tx) => {
      // 1. Buat record PembelianSparepart beserta ItemSparepart
      const pembelian = await tx.pembelianSparepart.create({
        data: {
          id_kendaraan: payload.id_kendaraan,
          id_user_input: userId,
          tanggal_beli: new Date(payload.tanggal_beli),
          tanggal_pasang: payload.tanggal_pasang ? new Date(payload.tanggal_pasang) : null,
          km_saat_ganti: payload.km_saat_ganti,
          sumber_dana: payload.sumber_dana,
          total_harga: totalHarga,
          tempat_beli: payload.tempat_beli || null,
          keterangan: payload.keterangan || null,
          item_sparepart: {
            create: payload.items.map((item) => ({
              nama: item.nama,
              kategori: item.kategori,
              jumlah: item.jumlah,
              harga_satuan: item.harga_satuan,
              subtotal: item.subtotal,
            })),
          },
        },
      });

      // 2. Perbarui KM Terakhir Kendaraan jika KM saat ganti lebih tinggi
      if (payload.km_saat_ganti > kmSebelumnya) {
        await tx.kendaraan.update({
          where: { id_kendaraan: payload.id_kendaraan },
          data: { km_terakhir: payload.km_saat_ganti },
        });
      }

      // 3. Catat Kas Kecil jika sumber dana Petty Cash
      if (payload.sumber_dana === SumberDana.PETTY_CASH) {
        const itemNames = payload.items.map((i) => i.nama).join(", ");
        await tx.kasKecil.create({
          data: {
            tanggal: new Date(payload.tanggal_beli),
            tipe: "KELUAR",
            kategori: "Sparepart",
            keterangan:
              payload.keterangan ||
              `Sparepart ${kendaraan.plat_nomor} (${itemNames})`,
            jumlah: totalHarga,
            id_user_input: userId,
            id_pembelian_sparepart: pembelian.id_nota_sparepart,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kendaraan");
    revalidatePath("/dashboard/input-operasional");

    return {
      success: true,
      message: `Data Sparepart untuk ${kendaraan.plat_nomor} berhasil disimpan!`,
    };
  } catch (error: any) {
    console.error("Error simpanLogSparepart:", error);
    return {
      success: false,
      error: error?.message || "Gagal menyimpan data Sparepart.",
    };
  }
}

// =========================================================================
// 3. INPUT OPERASIONAL: ISI ANGIN Sesuai Diagram LOG_ANGIN
// =========================================================================
export type InputAnginPayload = {
  id_kendaraan: string;
  id_sopir?: string | null;
  tanggal: string;
  biaya: number;
  sumber_dana: SumberDana;
  keterangan?: string;
};

export async function simpanLogAngin(payload: InputAnginPayload) {
  try {
    const userId = await getCurrentUserId();

    const kendaraan = await prisma.kendaraan.findUnique({
      where: { id_kendaraan: payload.id_kendaraan },
    });

    if (!kendaraan) {
      return { success: false, error: "Kendaraan tidak ditemukan." };
    }

    await prisma.$transaction(async (tx) => {
      const logAngin = await tx.logAngin.create({
        data: {
          id_kendaraan: payload.id_kendaraan,
          id_sopir: payload.id_sopir || null,
          id_user_input: userId,
          tanggal: new Date(payload.tanggal),
          biaya: payload.biaya,
          sumber_dana: payload.sumber_dana,
          keterangan: payload.keterangan || null,
        },
      });

      if (payload.sumber_dana === SumberDana.PETTY_CASH) {
        await tx.kasKecil.create({
          data: {
            tanggal: new Date(payload.tanggal),
            tipe: "KELUAR",
            kategori: "Isi Angin",
            keterangan:
              payload.keterangan ||
              `Isi Angin ${kendaraan.plat_nomor}`,
            jumlah: payload.biaya,
            id_user_input: userId,
            id_log_angin: logAngin.id_angin,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kendaraan");
    revalidatePath("/dashboard/input-operasional");

    return {
      success: true,
      message: `Data Log Angin untuk ${kendaraan.plat_nomor} berhasil disimpan!`,
    };
  } catch (error: any) {
    console.error("Error simpanLogAngin:", error);
    return {
      success: false,
      error: error?.message || "Gagal menyimpan data Log Angin.",
    };
  }
}

// =========================================================================
// 4. INPUT OPERASIONAL: LOG LAIN Sesuai Diagram LOG_LAIN
// =========================================================================
export type InputLainPayload = {
  id_kendaraan: string;
  id_sopir?: string | null;
  tanggal: string;
  kategori: string;
  biaya: number;
  sumber_dana: SumberDana;
  keterangan?: string;
};

export async function simpanLogLain(payload: InputLainPayload) {
  try {
    const userId = await getCurrentUserId();

    const kendaraan = await prisma.kendaraan.findUnique({
      where: { id_kendaraan: payload.id_kendaraan },
    });

    if (!kendaraan) {
      return { success: false, error: "Kendaraan tidak ditemukan." };
    }

    await prisma.$transaction(async (tx) => {
      const logLain = await tx.logLain.create({
        data: {
          id_kendaraan: payload.id_kendaraan,
          id_sopir: payload.id_sopir || null,
          id_user_input: userId,
          tanggal: new Date(payload.tanggal),
          kategori: payload.kategori || "Log Lain",
          biaya: payload.biaya,
          sumber_dana: payload.sumber_dana,
          keterangan: payload.keterangan || null,
        },
      });

      if (payload.sumber_dana === SumberDana.PETTY_CASH) {
        await tx.kasKecil.create({
          data: {
            tanggal: new Date(payload.tanggal),
            tipe: "KELUAR",
            kategori: payload.kategori || "Log Lain",
            keterangan:
              payload.keterangan ||
              `${payload.kategori || "Log Lain"} ${kendaraan.plat_nomor}`,
            jumlah: payload.biaya,
            id_user_input: userId,
            id_log_lain: logLain.id_lain,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kendaraan");
    revalidatePath("/dashboard/input-operasional");

    return {
      success: true,
      message: `Data Log Lain (${payload.kategori}) untuk ${kendaraan.plat_nomor} berhasil disimpan!`,
    };
  } catch (error: any) {
    console.error("Error simpanLogLain:", error);
    return {
      success: false,
      error: error?.message || "Gagal menyimpan data Log Lain.",
    };
  }
}
