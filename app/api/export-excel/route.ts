// app/api/export-excel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "bbm";
  
  let rawData: Record<string, string | number>[] = [];
  let sheetName = "Laporan";

  try {
    if (tab === "bbm") {
      sheetName = "Laporan BBM";
      const bbm = await prisma.logBensin.findMany({
        where: { deleted_at: null },
        include: { kendaraan: true, sopir: true },
        orderBy: { tanggal: "desc" },
      });
      rawData = bbm.map((item) => ({
        Tanggal: new Date(item.tanggal).toLocaleDateString("id-ID"),
        Kendaraan: item.kendaraan?.plat_nomor || "-",
        Sopir: item.sopir?.nama || "-",
        Sumber: item.sumber,
        "Jumlah (Liter)": Number(item.jumlah_liter),
        "Total Biaya (Rp)": Number(item.total_harga),
      }));
      
    } else if (tab === "kas-kecil") {
      sheetName = "Kas Kecil";
      const kas = await prisma.kasKecil.findMany({
        where: {deleted_at: null},
        orderBy: { tanggal: "desc" },
      });
      rawData = kas.map((item) => ({
        Tanggal: new Date(item.tanggal).toLocaleDateString("id-ID"),
        Keterangan: item.keterangan || "-",
        Kategori: item.kategori || "-",
        Tipe: item.tipe,
        "Jumlah (Rp)": Number(item.jumlah),
      }));
      
    } else if (tab === "kinerja") {
      sheetName = "Kinerja Kendaraan";
      const kendaraan = await prisma.kendaraan.findMany({
        where: { deleted_at: null },
        include: {
          log_bensin: { where: { deleted_at: null } },
          log_lain: { where: { deleted_at: null } },
          log_angin: { where: { deleted_at: null } },
          pembelian_sparepart: { where: { deleted_at: null } },
        },
      });
      rawData = kendaraan.map((k) => {
        const totalLiter = k.log_bensin.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0);
        const biayaBbm = k.log_bensin.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
        const biayaLain = k.log_lain.reduce((acc, curr) => acc + Number(curr.biaya), 0);
        const biayaAngin = k.log_angin.reduce((acc, curr) => acc + Number(curr.biaya), 0);
        const biayaSparepart = k.pembelian_sparepart.reduce((acc, curr) => acc + Number(curr.total_harga), 0);

        return {
          "Plat Nomor": k.plat_nomor,
          Merek: k.merk,
          Status: k.status === "BAGUS" ? "Aktif" : "Servis",
          "KM Terakhir": Number(k.km_terakhir),
          "Total Solar (L)": totalLiter,
          "Total Biaya Operasional (Rp)": biayaBbm + biayaLain + biayaAngin + biayaSparepart,
        };
      });
    }

    // Buat Workbook & Worksheet Excel
    const worksheet = XLSX.utils.json_to_sheet(rawData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Konversi ke buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Kirim file ke browser
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_${sheetName.replace(/\s+/g, "_")}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error export excel:", error);
    return NextResponse.json({ error: "Gagal membuat laporan Excel" }, { status: 500 });
  }
}