"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function tambahKasKecil(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Anda harus login untuk melakukan aksi ini.");
  }

  const tanggal = new Date(formData.get("tanggal") as string);
  const tipe = formData.get("tipe") as "MASUK" | "KELUAR";
  const keterangan = formData.get("keterangan") as string;
  const kategori = formData.get("kategori") as string;
  const jumlah = parseFloat(formData.get("jumlah") as string) || 0;

  await prisma.kasKecil.create({
    data: {
      tanggal,
      tipe,
      keterangan,
      kategori,
      jumlah,
      id_user_input: session.user.id, // Diambil otomatis dari sesi login
    },
  });

  revalidatePath("/dashboard/kas-kecil");
  redirect("/dashboard/kas-kecil");
}