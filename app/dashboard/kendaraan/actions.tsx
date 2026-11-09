// app/dashboard/kendaraan/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Fungsi Tambah Kendaraan
export async function tambahKendaraan(formData: FormData) {
  const plat_nomor = formData.get("plat_nomor") as string;
  const merk = formData.get("merk") as string;
  const tahun = parseInt(formData.get("tahun") as string) || new Date().getFullYear();
  const km_terakhir = parseFloat(formData.get("km_terakhir") as string) || 0;
  const status = formData.get("status") as string === "Aktif" ? "BAGUS" : "BENGKEL";

  await prisma.kendaraan.create({
    data: {
      plat_nomor,
      merk,
      tahun,
      km_terakhir,
      status,
    },
  });

  revalidatePath("/dashboard/kendaraan");
  redirect("/dashboard/kendaraan");
}

// Fungsi Edit Kendaraan
export async function editKendaraan(id_kendaraan: string, formData: FormData) {
  const plat_nomor = formData.get("plat_nomor") as string;
  const merk = formData.get("merk") as string;
  const tahun = parseInt(formData.get("tahun") as string) || new Date().getFullYear();
  const km_terakhir = parseFloat(formData.get("km_terakhir") as string) || 0;
  const status = formData.get("status") as string === "Aktif" ? "BAGUS" : "BENGKEL";

  await prisma.kendaraan.update({
    where: { id_kendaraan },
    data: {
      plat_nomor,
      merk,
      tahun,
      km_terakhir,
      status,
    },
  });

  revalidatePath("/dashboard/kendaraan");
  redirect("/dashboard/kendaraan");
}