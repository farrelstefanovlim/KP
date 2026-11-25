// app/dashboard/kas-kecil/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TipeKasKecil } from "@prisma/client";

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

export type InputKasKecilPayload = {
  tanggal: string; // YYYY-MM-DD
  tipe: TipeKasKecil; // "MASUK" | "KELUAR"
  kategori: string;
  keterangan: string;
  jumlah: number;
};

export async function simpanTransaksiKasKecil(payload: InputKasKecilPayload) {
  try {
    const userId = await getCurrentUserId();

    if (!payload.tanggal) {
      return { success: false, error: "Tanggal transaksi wajib diisi." };
    }

    if (!payload.keterangan || !payload.keterangan.trim()) {
      return { success: false, error: "Keterangan transaksi wajib diisi." };
    }

    if (!payload.jumlah || payload.jumlah <= 0) {
      return { success: false, error: "Jumlah nominal harus lebih dari 0." };
    }

    await prisma.kasKecil.create({
      data: {
        tanggal: new Date(payload.tanggal),
        tipe: payload.tipe,
        kategori: payload.kategori.trim() || (payload.tipe === "MASUK" ? "Top-up" : "Operasional"),
        keterangan: payload.keterangan.trim(),
        jumlah: payload.jumlah,
        id_user_input: userId,
      },
    });

    revalidatePath("/dashboard/kas-kecil");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Transaksi kas kecil ${payload.tipe === "MASUK" ? "pemasukan" : "pengeluaran"} berhasil disimpan!`,
    };
  } catch (error: any) {
    console.error("Error simpanTransaksiKasKecil:", error);
    return {
      success: false,
      error: error?.message || "Gagal menyimpan transaksi kas kecil.",
    };
  }
}

export async function hapusTransaksiKasKecil(id_kas_kecil: string) {
  try {
    await prisma.kasKecil.update({
      where: { id_kas_kecil },
      data: { deleted_at: new Date() },
    });

    revalidatePath("/dashboard/kas-kecil");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Transaksi berhasil dihapus.",
    };
  } catch (error: any) {
    console.error("Error hapusTransaksiKasKecil:", error);
    return {
      success: false,
      error: error?.message || "Gagal menghapus transaksi.",
    };
  }
}
