"use client";

import { useMemo, useState } from "react";

type ReportTab = "bbm" | "sparepart" | "kas-kecil" | "kinerja";
type PeriodFilter = "all" | "month" | "quarter" | "year";

export type LaporanData = {
  kendaraan: {
    id: string;
    plat: string;
    merk: string;
    status: string;
    kmTerakhir: number;
    sopirAktif: string;
  }[];
  bbm: {
    id: string;
    tanggal: string;
    kendaraanId: string;
    plat: string;
    sopir: string;
    hargaPerLiter: number;
    liter: number;
    kmSebelum: number;
    kmSaatIsi: number;
    jarak: number;
    total: number;
    diinput: string;
  }[];
  sparepart: {
    id: string;
    tanggal: string;
    kendaraanId: string;
    plat: string;
    nama: string;
    kategori: string;
    jumlah: number;
    hargaSatuan: number;
    total: number;
    diinput: string;
  }[];
  kasKecil: {
    id: string;
    tanggal: string;
    tipe: "MASUK" | "KELUAR";
    keterangan: string;
    kategori: string;
    jumlah: number;
    diinput: string;
    kendaraanId: string | null;
    createdAt: string;
  }[];
  angin: { kendaraanId: string; tanggal: string; biaya: number }[];
  biayaLain: { kendaraanId: string; tanggal: string; biaya: number }[];
};

type Props = {
  data: LaporanData;
  userRole: string;
};

const tabs: { id: ReportTab; label: string }[] = [
  { id: "bbm", label: "Laporan BBM" },
  { id: "sparepart", label: "Laporan Sparepart" },
  { id: "kas-kecil", label: "Laporan Kas Kecil" },
  { id: "kinerja", label: "Kinerja Kendaraan" },
];

const formatRupiah = (value: number) =>
  `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString("id-ID", { maximumFractionDigits });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

function isWithinPeriod(value: string, period: PeriodFilter) {
  if (period === "all") return true;

  const date = new Date(value);
  const now = new Date();
  let start: Date;

  if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return date >= start && date <= now;
}

function csvCell(value: string | number) {
  const text = String(value);
  const safeText =
    typeof value === "string" && /^[=+\-@\t\r]/.test(text)
      ? `'${text}`
      : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function SummaryCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <p className="mb-2 text-xs font-bold tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`text-2xl font-extrabold tracking-tight ${color}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyTable({ columns }: { columns: number }) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="px-6 py-12 text-center text-sm text-slate-400"
      >
        Belum ada data untuk filter yang dipilih.
      </td>
    </tr>
  );
}

export default function LaporanClient({ data, userRole }: Props) {
  const [activeTab, setActiveTab] = useState<ReportTab>("bbm");
  const [kendaraanId, setKendaraanId] = useState("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const bbmRows = useMemo(
    () =>
      data.bbm.filter(
        (row) =>
          (kendaraanId === "all" || row.kendaraanId === kendaraanId) &&
          isWithinPeriod(row.tanggal, period),
      ),
    [data.bbm, kendaraanId, period],
  );

  const sparepartRows = useMemo(
    () =>
      data.sparepart.filter(
        (row) =>
          (kendaraanId === "all" || row.kendaraanId === kendaraanId) &&
          isWithinPeriod(row.tanggal, period),
      ),
    [data.sparepart, kendaraanId, period],
  );

  const cashRows = useMemo(() => {
    const scopedRows = data.kasKecil
      .filter(
        (row) =>
          kendaraanId === "all" || row.kendaraanId === kendaraanId,
      )
      .sort(
        (a, b) =>
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime() ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    const saldoHistory = scopedRows.reduce<{
      saldo: number;
      rows: (LaporanData["kasKecil"][number] & { saldo: number })[];
    }>(
      (history, row) => {
        const saldo =
          history.saldo + (row.tipe === "MASUK" ? row.jumlah : -row.jumlah);
        return {
          saldo,
          rows: [...history.rows, { ...row, saldo }],
        };
      },
      { saldo: 0, rows: [] },
    );

    return {
      rows: saldoHistory.rows
        .filter((row) => isWithinPeriod(row.tanggal, period))
        .reverse(),
      saldoAkhir: saldoHistory.saldo,
    };
  }, [data.kasKecil, kendaraanId, period]);

  const kinerjaRows = useMemo(
    () =>
      data.kendaraan
        .filter(
          (kendaraan) =>
            kendaraanId === "all" || kendaraan.id === kendaraanId,
        )
        .map((kendaraan) => {
          const bbm = data.bbm.filter(
            (row) =>
              row.kendaraanId === kendaraan.id &&
              isWithinPeriod(row.tanggal, period),
          );
          const sparepart = data.sparepart
            .filter(
              (row) =>
                row.kendaraanId === kendaraan.id &&
                isWithinPeriod(row.tanggal, period),
            )
            .reduce((total, row) => total + row.total, 0);
          const angin = data.angin
            .filter(
              (row) =>
                row.kendaraanId === kendaraan.id &&
                isWithinPeriod(row.tanggal, period),
            )
            .reduce((total, row) => total + row.biaya, 0);
          const lainnya = data.biayaLain
            .filter(
              (row) =>
                row.kendaraanId === kendaraan.id &&
                isWithinPeriod(row.tanggal, period),
            )
            .reduce((total, row) => total + row.biaya, 0);
          const totalLiter = bbm.reduce((total, row) => total + row.liter, 0);
          const totalJarak = bbm.reduce((total, row) => total + row.jarak, 0);

          return {
            ...kendaraan,
            totalLiter,
            totalJarak,
            efisiensi: totalLiter > 0 ? totalJarak / totalLiter : 0,
            biayaBbm: bbm.reduce((total, row) => total + row.total, 0),
            biayaSparepart: sparepart,
            biayaLainnya: angin + lainnya,
          };
        }),
    [data, kendaraanId, period],
  );

  const cashSummary = useMemo(() => {
    const masuk = cashRows.rows
      .filter((row) => row.tipe === "MASUK")
      .reduce((total, row) => total + row.jumlah, 0);
    const keluar = cashRows.rows
      .filter((row) => row.tipe === "KELUAR")
      .reduce((total, row) => total + row.jumlah, 0);

    return { masuk, keluar };
  }, [cashRows.rows]);

  const exportRows = () => {
    let headers: string[];
    let rows: (string | number)[][];

    if (activeTab === "bbm") {
      headers = [
        "Tanggal",
        "Kendaraan",
        "Sopir",
        "Harga/L",
        "Jumlah (L)",
        "KM Sebelum",
        "KM Saat Isi",
        "Jarak (km)",
        "Total",
        "Diinput",
      ];
      rows = bbmRows.map((row) => [
        formatDate(row.tanggal),
        row.plat,
        row.sopir,
        row.hargaPerLiter,
        row.liter,
        row.kmSebelum,
        row.kmSaatIsi,
        row.jarak,
        row.total,
        row.diinput,
      ]);
    } else if (activeTab === "sparepart") {
      headers = [
        "Tanggal",
        "Kendaraan",
        "Nama Sparepart",
        "Kategori",
        "Jumlah",
        "Harga Satuan",
        "Total",
        "Diinput",
      ];
      rows = sparepartRows.map((row) => [
        formatDate(row.tanggal),
        row.plat,
        row.nama,
        row.kategori,
        row.jumlah,
        row.hargaSatuan,
        row.total,
        row.diinput,
      ]);
    } else if (activeTab === "kas-kecil") {
      headers = [
        "Tanggal",
        "Keterangan",
        "Kategori",
        "Tipe",
        "Jumlah",
        "Saldo",
        "Diinput",
      ];
      rows = cashRows.rows.map((row) => [
        formatDate(row.tanggal),
        row.keterangan,
        row.kategori,
        row.tipe === "MASUK" ? "Masuk" : "Keluar",
        row.tipe === "MASUK" ? row.jumlah : -row.jumlah,
        row.saldo,
        row.diinput,
      ]);
    } else {
      headers = [
        "Kendaraan",
        "Sopir",
        "Status",
        "KM Terakhir",
        "Total KM Tempuh",
        "Solar Dipakai (L)",
        "Efisiensi (km/L)",
        "Biaya BBM",
        "Biaya Sparepart",
        "Biaya Lainnya",
      ];
      rows = kinerjaRows.map((row) => [
        row.plat,
        row.sopirAktif,
        row.status === "BAGUS" ? "Aktif" : "Servis",
        row.kmTerakhir,
        row.totalJarak,
        row.totalLiter,
        row.efisiensi,
        row.biayaBbm,
        row.biayaSparepart,
        row.biayaLainnya,
      ]);
    }

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-${activeTab}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const roleLabel = userRole.toLowerCase().includes("super")
    ? "Super Admin"
    : userRole;

  return (
    <div className="min-w-0 space-y-6">
      <header className="-mx-8 -mt-8 flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan &amp; Analitik
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {roleLabel}
        </span>
      </header>

      <div className="min-w-0 space-y-5">
        <div
          aria-label="Jenis laporan"
          className="flex min-w-0 gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`flex-1 whitespace-nowrap rounded-xl px-3 py-3 text-sm font-semibold transition sm:text-base ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0">Kendaraan:</span>
            <select
              value={kendaraanId}
              onChange={(event) => setKendaraanId(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:min-w-48"
            >
              <option value="all">Semua Kendaraan</option>
              {data.kendaraan.map((kendaraan) => (
                <option key={kendaraan.id} value={kendaraan.id}>
                  {kendaraan.plat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0">Periode:</span>
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as PeriodFilter)
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:min-w-44"
            >
              <option value="all">Semua Waktu</option>
              <option value="month">Bulan Ini</option>
              <option value="quarter">3 Bulan Terakhir</option>
              <option value="year">Tahun Ini</option>
            </select>
          </label>

          <button
            type="button"
            onClick={exportRows}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
            >
              <path
                d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ekspor Excel
          </button>
        </div>

        {activeTab === "bbm" && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                label="TOTAL BIAYA BBM"
                value={formatRupiah(
                  bbmRows.reduce((total, row) => total + row.total, 0),
                )}
              />
              <SummaryCard
                label="TOTAL SOLAR"
                value={`${formatNumber(
                  bbmRows.reduce((total, row) => total + row.liter, 0),
                  2,
                )} Liter`}
              />
              <SummaryCard
                label="RATA-RATA PER PENGISIAN"
                value={formatRupiah(
                  bbmRows.length
                    ? bbmRows.reduce((total, row) => total + row.total, 0) /
                        bbmRows.length
                    : 0,
                )}
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      {[
                        "Tanggal",
                        "Kendaraan",
                        "Sopir",
                        "Harga/L",
                        "Jumlah (L)",
                        "KM Sebelum",
                        "KM Saat Isi",
                        "Jarak",
                        "Total",
                        "Diinput",
                      ].map((heading) => (
                        <th key={heading} className="border-b border-slate-200 px-4 py-4">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {bbmRows.length === 0 ? (
                      <EmptyTable columns={10} />
                    ) : (
                      bbmRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-5">{formatDate(row.tanggal)}</td>
                          <td className="whitespace-nowrap px-4 py-5 font-semibold text-slate-800">{row.plat}</td>
                          <td className="px-4 py-5">{row.sopir}</td>
                          <td className="whitespace-nowrap px-4 py-5">{formatRupiah(row.hargaPerLiter)}</td>
                          <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.liter, 2)} L</td>
                          <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.kmSebelum)}</td>
                          <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.kmSaatIsi)}</td>
                          <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.jarak)} km</td>
                          <td className="whitespace-nowrap px-4 py-5 font-bold text-slate-800">{formatRupiah(row.total)}</td>
                          <td className="px-4 py-5">{row.diinput}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "sparepart" && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SummaryCard
                label="TOTAL BIAYA SPAREPART"
                value={formatRupiah(
                  sparepartRows.reduce((total, row) => total + row.total, 0),
                )}
              />
              <SummaryCard
                label="JUMLAH TRANSAKSI"
                value={`${formatNumber(sparepartRows.length)} item`}
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      {["Tanggal", "Kendaraan", "Nama Sparepart", "Kategori", "Jumlah", "Harga Satuan", "Total", "Diinput"].map((heading) => (
                        <th key={heading} className="border-b border-slate-200 px-4 py-4">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {sparepartRows.length === 0 ? (
                      <EmptyTable columns={8} />
                    ) : (
                      sparepartRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-5">{formatDate(row.tanggal)}</td>
                          <td className="whitespace-nowrap px-4 py-5 font-semibold text-slate-800">{row.plat}</td>
                          <td className="px-4 py-5 font-medium text-slate-700">{row.nama}</td>
                          <td className="px-4 py-5"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs">{row.kategori}</span></td>
                          <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.jumlah, 2)} pcs</td>
                          <td className="whitespace-nowrap px-4 py-5">{formatRupiah(row.hargaSatuan)}</td>
                          <td className="whitespace-nowrap px-4 py-5 font-bold text-slate-800">{formatRupiah(row.total)}</td>
                          <td className="px-4 py-5">{row.diinput}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "kas-kecil" && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                label="SALDO AKHIR"
                value={formatRupiah(cashRows.saldoAkhir)}
                color="text-emerald-600"
              />
              <SummaryCard
                label="TOTAL MASUK"
                value={formatRupiah(cashSummary.masuk)}
                color="text-blue-600"
              />
              <SummaryCard
                label="TOTAL KELUAR"
                value={formatRupiah(cashSummary.keluar)}
                color="text-rose-500"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      {["Tanggal", "Keterangan", "Kategori", "Tipe", "Jumlah", "Saldo", "Diinput"].map((heading) => (
                        <th key={heading} className="border-b border-slate-200 px-4 py-4">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {cashRows.rows.length === 0 ? (
                      <EmptyTable columns={7} />
                    ) : (
                      cashRows.rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-5">{formatDate(row.tanggal)}</td>
                          <td className="max-w-56 px-4 py-5 font-medium text-slate-700">{row.keterangan}</td>
                          <td className="px-4 py-5"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs">{row.kategori}</span></td>
                          <td className="px-4 py-5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${row.tipe === "MASUK" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                              {row.tipe === "MASUK" ? "↑ Masuk" : "↓ Keluar"}
                            </span>
                          </td>
                          <td className={`whitespace-nowrap px-4 py-5 font-semibold ${row.tipe === "MASUK" ? "text-emerald-600" : "text-rose-600"}`}>
                            {row.tipe === "KELUAR" ? "-" : "+"}{formatRupiah(row.jumlah)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-5 font-bold text-slate-800">{formatRupiah(row.saldo)}</td>
                          <td className="px-4 py-5">{row.diinput}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "kinerja" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Rekap Kinerja per Kendaraan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Data konsumsi BBM, biaya pemeliharaan, dan penugasan
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Kendaraan", "Sopir", "Status", "KM Terakhir", "Total KM Tempuh", "Solar Dipakai", "Efisiensi (km/L)", "Biaya BBM", "Biaya Sparepart", "Biaya Lainnya"].map((heading) => (
                      <th key={heading} className="border-b border-slate-200 px-4 py-4">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {kinerjaRows.length === 0 ? (
                    <EmptyTable columns={10} />
                  ) : (
                    kinerjaRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-5">
                          <p className="font-semibold text-slate-800">{row.plat}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{row.merk}</p>
                        </td>
                        <td className="px-4 py-5">{row.sopirAktif}</td>
                        <td className="px-4 py-5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === "BAGUS" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {row.status === "BAGUS" ? "Aktif" : "Servis"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.kmTerakhir)} km</td>
                        <td className="whitespace-nowrap px-4 py-5 font-medium text-slate-700">{formatNumber(row.totalJarak)} km</td>
                        <td className="whitespace-nowrap px-4 py-5">{formatNumber(row.totalLiter, 2)} L</td>
                        <td className={`whitespace-nowrap px-4 py-5 font-semibold ${row.efisiensi >= 6 ? "text-emerald-600" : row.efisiensi > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {row.efisiensi > 0 ? `${formatNumber(row.efisiensi, 2)} km/L` : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-5">{formatRupiah(row.biayaBbm)}</td>
                        <td className="whitespace-nowrap px-4 py-5">{formatRupiah(row.biayaSparepart)}</td>
                        <td className="whitespace-nowrap px-4 py-5">{formatRupiah(row.biayaLainnya)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
