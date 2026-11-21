"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, SumberBensin, SumberDana } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export type OpFormState = {
  error?: string;
  success?: string;
};

const REVALIDATE_PATHS = [
  "/dashboard/input-operasional",
  "/dashboard",
  "/dashboard/kendaraan",
  "/dashboard/kas-kecil",
  "/dashboard/laporan",
];

function refreshAll() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function requireUser() {
  const me = await getCurrentUser();
  if (!me) throw new Error("Sesi berakhir. Silakan login kembali.");
  return me;
}

function parseSumberBensin(val: FormDataEntryValue | null): SumberBensin {
  const raw = String(val ?? "");
  if (raw === "TANGKI" || raw === "PERTAMINA" || raw === "ECERAN") return raw;
  return "PERTAMINA";
}

function parseSumberDana(val: FormDataEntryValue | null): SumberDana {
  return String(val ?? "") === "PETTY_CASH" ? "PETTY_CASH" : "KAS_BESAR";
}

// 1. SIMPAN LOG BENSIN (LogBensin)
export async function simpanLogBbm(_prev: OpFormState, formData: FormData): Promise<OpFormState> {
  const me = await requireUser();

  const id_kendaraan = String(formData.get("id_kendaraan") ?? "").trim();
  const id_sopir = String(formData.get("id_sopir") ?? "").trim() || null;
  const tanggalStr = String(formData.get("tanggal") ?? "");
  const sumber = parseSumberBensin(formData.get("sumber"));
  const tempat_beli = String(formData.get("tempat_beli") ?? "").trim() || null;
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null;
  const pakaiPettyCash = formData.get("pakai_petty_cash") === "on";

  const km_sebelum = Number(formData.get("km_sebelum") ?? 0);
  const km_saat_isi = Number(formData.get("km_saat_isi") ?? 0);
  const jumlah_liter = Number(formData.get("jumlah_liter") ?? 0);
  const harga_per_liter = Number(formData.get("harga_per_liter") ?? 0);

  if (!id_kendaraan || !tanggalStr) {
    return { error: "Kendaraan dan tanggal pengisian wajib diisi." };
  }
  if (km_saat_isi < km_sebelum) {
    return { error: "KM saat isi tidak boleh lebih kecil dari KM sebelumnya." };
  }
  if (jumlah_liter <= 0 || harga_per_liter <= 0) {
    return { error: "Jumlah liter dan harga per liter harus lebih dari 0." };
  }

  const jarak_tempuh = km_saat_isi - km_sebelum;
  const total_harga = Math.round(jumlah_liter * harga_per_liter);
  const tanggal = new Date(tanggalStr);

  await prisma.$transaction(async (tx) => {
    const created = await tx.logBensin.create({
      data: {
        id_kendaraan,
        id_sopir,
        id_user_input: me.id_user,
        tanggal,
        sumber,
        tempat_beli,
        harga_per_liter,
        total_harga,
        jumlah_liter,
        jarak_tempuh,
        km_saat_isi,
        keterangan,
      },
    });

    const kendaraan = await tx.kendaraan.findUnique({ where: { id_kendaraan } });
    if (kendaraan && km_saat_isi > Number(kendaraan.km_terakhir)) {
      await tx.kendaraan.update({
        where: { id_kendaraan },
        data: { km_terakhir: km_saat_isi },
      });
    }

    if (pakaiPettyCash && sumber !== "TANGKI") {
      await tx.kasKecil.create({
        data: {
          tanggal,
          tipe: "KELUAR",
          kategori: "BBM",
          keterangan: `BBM ${kendaraan?.plat_nomor ?? ""} (${jumlah_liter} L - ${sumber})`,
          jumlah: total_harga,
          id_user_input: me.id_user,
          id_log_bensin: created.id_bbm,
        },
      });
    }

    await tx.audit.create({
      data: {
        tabel: "log_bensin",
        aksi: "CREATE",
        data_baru: {
          id_bbm: created.id_bbm,
          id_kendaraan,
          sumber,
          jumlah_liter,
          total_harga,
        } as Prisma.InputJsonValue,
        id_user_pelaku: me.id_user,
      },
    });
  });

  refreshAll();
  return { success: "Log pengisian BBM berhasil disimpan." };
}

// 2. SIMPAN BIAYA LAINNYA (LogLain)
export async function simpanLogLain(_prev: OpFormState, formData: FormData): Promise<OpFormState> {
  const me = await requireUser();

  const id_kendaraan = String(formData.get("id_kendaraan") ?? "").trim();
  const id_sopir = String(formData.get("id_sopir") ?? "").trim() || null;
  const tanggalStr = String(formData.get("tanggal") ?? "");
  const kategori = String(formData.get("kategori") ?? "").trim();
  const biaya = Number(formData.get("biaya") ?? 0);
  const sumber_dana = parseSumberDana(formData.get("sumber_dana"));
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null;

  if (!id_kendaraan || !tanggalStr || !kategori) {
    return { error: "Kendaraan, tanggal, dan kategori biaya wajib diisi." };
  }
  if (biaya <= 0) {
    return { error: "Nominal biaya harus lebih dari 0." };
  }

  const tanggal = new Date(tanggalStr);

  await prisma.$transaction(async (tx) => {
    const created = await tx.logLain.create({
      data: {
        id_kendaraan,
        id_sopir,
        id_user_input: me.id_user,
        tanggal,
        kategori,
        biaya,
        sumber_dana,
        keterangan,
      },
    });

    if (sumber_dana === "PETTY_CASH") {
      await tx.kasKecil.create({
        data: {
          tanggal,
          tipe: "KELUAR",
          kategori,
          keterangan: keterangan || `Biaya ${kategori}`,
          jumlah: biaya,
          id_user_input: me.id_user,
          id_log_lain: created.id_lain,
        },
      });
    }

    await tx.audit.create({
      data: {
        tabel: "log_lain",
        aksi: "CREATE",
        data_baru: {
          id_lain: created.id_lain,
          id_kendaraan,
          kategori,
          biaya,
          sumber_dana,
        } as Prisma.InputJsonValue,
        id_user_pelaku: me.id_user,
      },
    });
  });

  refreshAll();
  return { success: "Biaya operasional lainnya berhasil disimpan." };
}

// 3. SIMPAN LOG TAMBAH ANGIN (LogAngin)
export async function simpanLogAngin(_prev: OpFormState, formData: FormData): Promise<OpFormState> {
  const me = await requireUser();

  const id_kendaraan = String(formData.get("id_kendaraan") ?? "").trim();
  const id_sopir = String(formData.get("id_sopir") ?? "").trim() || null;
  const tanggalStr = String(formData.get("tanggal") ?? "");
  const biaya = Number(formData.get("biaya") ?? 0);
  const sumber_dana = parseSumberDana(formData.get("sumber_dana"));
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null;

  if (!id_kendaraan || !tanggalStr) {
    return { error: "Kendaraan dan tanggal wajib diisi." };
  }
  if (biaya < 0) {
    return { error: "Biaya tidak boleh negatif." };
  }

  const tanggal = new Date(tanggalStr);

  await prisma.$transaction(async (tx) => {
    const created = await tx.logAngin.create({
      data: {
        id_kendaraan,
        id_sopir,
        id_user_input: me.id_user,
        tanggal,
        biaya,
        sumber_dana,
        keterangan,
      },
    });

    if (sumber_dana === "PETTY_CASH" && biaya > 0) {
      await tx.kasKecil.create({
        data: {
          tanggal,
          tipe: "KELUAR",
          kategori: "Tambah Angin",
          keterangan: keterangan || "Biaya tambah angin ban",
          jumlah: biaya,
          id_user_input: me.id_user,
          id_log_angin: created.id_angin,
        },
      });
    }

    await tx.audit.create({
      data: {
        tabel: "log_angin",
        aksi: "CREATE",
        data_baru: {
          id_angin: created.id_angin,
          id_kendaraan,
          biaya,
          sumber_dana,
        } as Prisma.InputJsonValue,
        id_user_pelaku: me.id_user,
      },
    });
  });

  refreshAll();
  return { success: "Log tambah angin berhasil disimpan." };
}

// 4. SIMPAN NOTA PEMBELIAN SPAREPART (PembelianSparepart + ItemSparepart)
type RawSparepartItem = {
  nama: string;
  kategori: string;
  jumlah: number;
  harga_satuan: number;
};

export async function simpanSparepart(_prev: OpFormState, formData: FormData): Promise<OpFormState> {
  const me = await requireUser();

  const id_kendaraan = String(formData.get("id_kendaraan") ?? "").trim();
  const tanggalBeliStr = String(formData.get("tanggal_beli") ?? "");
  const tanggalPasangStr = String(formData.get("tanggal_pasang") ?? "").trim();
  const km_saat_ganti = Number(formData.get("km_saat_ganti") ?? 0);
  const sumber_dana = parseSumberDana(formData.get("sumber_dana"));
  const tempat_beli = String(formData.get("tempat_beli") ?? "").trim() || null;
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null;
  const itemsJson = String(formData.get("items_json") ?? "[]");

  if (!id_kendaraan || !tanggalBeliStr) {
    return { error: "Kendaraan dan tanggal beli wajib diisi." };
  }

  let parsedItems: RawSparepartItem[] = [];
  try {
    parsedItems = JSON.parse(itemsJson) as RawSparepartItem[];
  } catch {
    return { error: "Format daftar item sparepart tidak valid." };
  }

  const validItems = parsedItems
    .filter((it) => it.nama.trim() !== "" && Number(it.jumlah) > 0 && Number(it.harga_satuan) > 0)
    .map((it) => {
      const jumlah = Number(it.jumlah);
      const harga_satuan = Number(it.harga_satuan);
      return {
        nama: it.nama.trim(),
        kategori: it.kategori.trim() || "Umum",
        jumlah,
        harga_satuan,
        subtotal: Math.round(jumlah * harga_satuan),
      };
    });

  if (validItems.length === 0) {
    return { error: "Minimal isi 1 item sparepart dengan jumlah dan harga yang valid." };
  }

  const total_harga = validItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tanggal_beli = new Date(tanggalBeliStr);
  const tanggal_pasang = tanggalPasangStr ? new Date(tanggalPasangStr) : null;

  await prisma.$transaction(async (tx) => {
    const created = await tx.pembelianSparepart.create({
      data: {
        id_kendaraan,
        id_user_input: me.id_user,
        tanggal_beli,
        tanggal_pasang,
        km_saat_ganti,
        sumber_dana,
        total_harga,
        tempat_beli,
        keterangan,
        item_sparepart: {
          create: validItems,
        },
      },
    });

    if (sumber_dana === "PETTY_CASH") {
      await tx.kasKecil.create({
        data: {
          tanggal: tanggal_beli,
          tipe: "KELUAR",
          kategori: "Sparepart",
          keterangan: `Nota Sparepart (${validItems.map((i) => i.nama).join(", ")})`,
          jumlah: total_harga,
          id_user_input: me.id_user,
          id_pembelian_sparepart: created.id_nota_sparepart,
        },
      });
    }

    await tx.audit.create({
      data: {
        tabel: "pembelian_sparepart",
        aksi: "CREATE",
        data_baru: {
          id_nota_sparepart: created.id_nota_sparepart,
          id_kendaraan,
          total_harga,
          jumlah_item: validItems.length,
        } as Prisma.InputJsonValue,
        id_user_pelaku: me.id_user,
      },
    });
  });

  refreshAll();
  return { success: "Nota pembelian sparepart berhasil disimpan." };
}