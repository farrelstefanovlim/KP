// app/dashboard/manajemen-user/actions.ts
"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { AksiAudit } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export type FormState = { error?: string; success?: boolean };

const PATH = "/dashboard/manajemen-user";

type Ringkas = {
  id_user: string;
  nama: string;
  jabatan: string | null; // ✅ Properti jabatan sudah ditambahkan dengan benar
  username: string;
  role: string;
  is_active: boolean;
};

// Hanya data non-sensitif yang masuk ke tabel audit (tanpa password_hash)
const ringkas = (u: Ringkas) => ({
  id_user: u.id_user,
  nama: u.nama,
  jabatan: u.jabatan, // ✅ Disertakan dalam objek ringkas
  username: u.username,
  role: u.role,
  is_active: u.is_active,
});

async function requireSuperadmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPERADMIN") throw new Error("Tidak punya akses.");
  return me;
}

async function catatAudit(
  id_user_pelaku: string,
  aksi: AksiAudit,
  lama: Ringkas | null,
  baru: Ringkas | null
) {
  await prisma.audit.create({
    data: {
      tabel: "users",
      aksi,
      data_lama: lama ? ringkas(lama) : undefined,
      data_baru: baru ? ringkas(baru) : undefined,
      id_user_pelaku,
    },
  });
}

// Tambah user baru (jika id_user kosong) atau edit user (jika id_user terisi)
export async function simpanUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireSuperadmin();

  const id = String(formData.get("id_user") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const jabatan = String(formData.get("jabatan") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "SUPERADMIN" ? "SUPERADMIN" : "STAFF";

  if (!nama || !username) return { error: "Nama lengkap dan username wajib diisi." };
  if ((!id || password) && password.length < 6) return { error: "Password minimal 6 karakter." };

  const dup = await prisma.user.findFirst({
    where: { username, ...(id ? { NOT: { id_user: id } } : {}) },
  });
  if (dup) return { error: "Username sudah dipakai." };

  if (id) {
    if (id === me.id_user && role !== "SUPERADMIN") {
      return { error: "Anda tidak bisa menurunkan role akun sendiri." };
    }
    const lama = await prisma.user.findUnique({ where: { id_user: id } });
    if (!lama) return { error: "User tidak ditemukan." };

    const baru = await prisma.user.update({
      where: { id_user: id },
      data: {
        nama,
        jabatan: jabatan || null,
        username,
        role,
        ...(password ? { password_hash: await bcrypt.hash(password, 10) } : {}),
      },
    });
    await catatAudit(me.id_user, "UPDATE", lama, baru);
  } else {
    const baru = await prisma.user.create({
      data: {
        nama,
        jabatan: jabatan || null,
        username,
        role,
        password_hash: await bcrypt.hash(password, 10),
        is_active: true,
        id_user_pembuat: me.id_user,
      },
    });
    await catatAudit(me.id_user, "CREATE", null, baru);
  }

  revalidatePath(PATH);
  return { success: true };
}

// Aktifkan / nonaktifkan user
export async function toggleAktif(id_user: string) {
  const me = await requireSuperadmin();
  if (me.id_user === id_user) return; // tidak boleh menonaktifkan diri sendiri

  const lama = await prisma.user.findUnique({ where: { id_user } });
  if (!lama) return;

  const baru = await prisma.user.update({
    where: { id_user },
    data: { is_active: !lama.is_active },
  });
  await catatAudit(me.id_user, "UPDATE", lama, baru);

  revalidatePath(PATH);
}