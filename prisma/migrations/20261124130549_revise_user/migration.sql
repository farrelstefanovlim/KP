/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `allowed_modules` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `gaji_pokok` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fuel_stock_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `petty_cash` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_orders` table. If the table is not empty, all the data it contains will be lost.
  - The required column `id_user` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `modified_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleUser" AS ENUM ('SUPERADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "AksiAudit" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "StatusKendaraan" AS ENUM ('BAGUS', 'BENGKEL');

-- CreateEnum
CREATE TYPE "SumberBensin" AS ENUM ('TANGKI', 'PERTAMINA', 'ECERAN');

-- CreateEnum
CREATE TYPE "SumberDana" AS ENUM ('KAS_BESAR', 'PETTY_CASH');

-- CreateEnum
CREATE TYPE "TipeMutasiTangki" AS ENUM ('MASUK', 'KELUAR', 'PENYESUAIAN');

-- CreateEnum
CREATE TYPE "TipeKasKecil" AS ENUM ('MASUK', 'KELUAR');

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_user_id_fkey";

-- DropForeignKey
ALTER TABLE "fuel_stock_logs" DROP CONSTRAINT "fuel_stock_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_entries" DROP CONSTRAINT "vehicle_entries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_entries" DROP CONSTRAINT "vehicle_entries_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_created_by_fkey";

-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "allowed_modules",
DROP COLUMN "full_name",
DROP COLUMN "gaji_pokok",
DROP COLUMN "id",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "id_user" UUID NOT NULL,
ADD COLUMN     "id_user_pembuat" UUID,
ADD COLUMN     "modified_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nama" VARCHAR(100) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "RoleUser" NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id_user");

-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "fuel_stock_logs";

-- DropTable
DROP TABLE "petty_cash";

-- DropTable
DROP TABLE "vehicle_entries";

-- DropTable
DROP TABLE "vehicles";

-- DropTable
DROP TABLE "work_orders";

-- DropEnum
DROP TYPE "JenisKendaraanEntry";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "StatusAbsensi";

-- DropEnum
DROP TYPE "StatusPerintahKerja";

-- DropEnum
DROP TYPE "TipeFuelStock";

-- CreateTable
CREATE TABLE "audit" (
    "id_audit" UUID NOT NULL,
    "tabel" VARCHAR(50) NOT NULL,
    "aksi" "AksiAudit" NOT NULL,
    "data_lama" JSONB,
    "data_baru" JSONB,
    "id_user_pelaku" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_pkey" PRIMARY KEY ("id_audit")
);

-- CreateTable
CREATE TABLE "kendaraan" (
    "id_kendaraan" UUID NOT NULL,
    "plat_nomor" VARCHAR(20) NOT NULL,
    "merk" VARCHAR(50) NOT NULL,
    "tahun" INTEGER NOT NULL,
    "status" "StatusKendaraan" NOT NULL DEFAULT 'BAGUS',
    "km_terakhir" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kendaraan_pkey" PRIMARY KEY ("id_kendaraan")
);

-- CreateTable
CREATE TABLE "sopir" (
    "id_sopir" UUID NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tanggal_masuk" DATE NOT NULL,
    "tanggal_keluar" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sopir_pkey" PRIMARY KEY ("id_sopir")
);

-- CreateTable
CREATE TABLE "kendaraan_sopir" (
    "id_vehicle_sopir" UUID NOT NULL,
    "id_kendaraan" UUID NOT NULL,
    "id_sopir" UUID NOT NULL,
    "id_user_input" UUID NOT NULL,
    "mulai" DATE NOT NULL,
    "selesai" DATE,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kendaraan_sopir_pkey" PRIMARY KEY ("id_vehicle_sopir")
);

-- CreateTable
CREATE TABLE "pengaturan_app" (
    "key_app" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_app_pkey" PRIMARY KEY ("key_app")
);

-- CreateTable
CREATE TABLE "riwayat_plat_kendaraan" (
    "id_riwayat_plat" UUID NOT NULL,
    "id_kendaraan" UUID NOT NULL,
    "plat_nomor_lama" VARCHAR(20) NOT NULL,
    "berlaku_sampai" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riwayat_plat_kendaraan_pkey" PRIMARY KEY ("id_riwayat_plat")
);

-- CreateTable
CREATE TABLE "log_bensin" (
    "id_bbm" UUID NOT NULL,
    "id_kendaraan" UUID NOT NULL,
    "id_sopir" UUID,
    "id_user_input" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "sumber" "SumberBensin" NOT NULL,
    "tempat_beli" VARCHAR(100),
    "harga_per_liter" DECIMAL(10,2) NOT NULL,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "jumlah_liter" DECIMAL(6,2) NOT NULL,
    "jarak_tempuh" DECIMAL(10,2) NOT NULL,
    "km_saat_isi" DECIMAL(10,2) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "log_bensin_pkey" PRIMARY KEY ("id_bbm")
);

-- CreateTable
CREATE TABLE "log_angin" (
    "id_angin" UUID NOT NULL,
    "id_kendaraan" UUID NOT NULL,
    "id_sopir" UUID,
    "id_user_input" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "biaya" DECIMAL(12,2) NOT NULL,
    "sumber_dana" "SumberDana" NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "log_angin_pkey" PRIMARY KEY ("id_angin")
);

-- CreateTable
CREATE TABLE "log_lain" (
    "id_lain" UUID NOT NULL,
    "id_kendaraan" UUID NOT NULL,
    "id_sopir" UUID,
    "id_user_input" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "biaya" DECIMAL(12,2) NOT NULL,
    "sumber_dana" "SumberDana" NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "log_lain_pkey" PRIMARY KEY ("id_lain")
);

-- CreateTable
CREATE TABLE "pembelian_sparepart" (
    "id_nota_sparepart" UUID NOT NULL,
    "id_kendaraan" UUID NOT NULL,
    "id_user_input" UUID NOT NULL,
    "tanggal_beli" DATE NOT NULL,
    "tanggal_pasang" DATE,
    "km_saat_ganti" DECIMAL(10,2) NOT NULL,
    "sumber_dana" "SumberDana" NOT NULL,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "tempat_beli" VARCHAR(100),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pembelian_sparepart_pkey" PRIMARY KEY ("id_nota_sparepart")
);

-- CreateTable
CREATE TABLE "item_sparepart" (
    "id_item_sparepart" UUID NOT NULL,
    "id_pembelian_sparepart" UUID NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "kategori" VARCHAR(50) NOT NULL,
    "jumlah" DECIMAL(10,2) NOT NULL,
    "harga_satuan" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_sparepart_pkey" PRIMARY KEY ("id_item_sparepart")
);

-- CreateTable
CREATE TABLE "tangki_bbm" (
    "id_tangki" UUID NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "kapasitas_liter" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tangki_bbm_pkey" PRIMARY KEY ("id_tangki")
);

-- CreateTable
CREATE TABLE "mutasi_tangki" (
    "id_mutasi_tangki" UUID NOT NULL,
    "id_tangki" UUID NOT NULL,
    "id_user_input" UUID NOT NULL,
    "tipe" "TipeMutasiTangki" NOT NULL,
    "liter" DECIMAL(10,2) NOT NULL,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "tanggal_bbm_keluar_tangki" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutasi_tangki_pkey" PRIMARY KEY ("id_mutasi_tangki")
);

-- CreateTable
CREATE TABLE "kas_kecil" (
    "id_kas_kecil" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "tipe" "TipeKasKecil" NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "keterangan" TEXT,
    "jumlah" DECIMAL(12,2) NOT NULL,
    "id_user_input" UUID NOT NULL,
    "id_log_bensin" UUID,
    "id_log_angin" UUID,
    "id_log_lain" UUID,
    "id_pembelian_sparepart" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kas_kecil_pkey" PRIMARY KEY ("id_kas_kecil")
);

-- CreateIndex
CREATE UNIQUE INDEX "kendaraan_plat_nomor_key" ON "kendaraan"("plat_nomor");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_user_pembuat_fkey" FOREIGN KEY ("id_user_pembuat") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit" ADD CONSTRAINT "audit_id_user_pelaku_fkey" FOREIGN KEY ("id_user_pelaku") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kendaraan_sopir" ADD CONSTRAINT "kendaraan_sopir_id_kendaraan_fkey" FOREIGN KEY ("id_kendaraan") REFERENCES "kendaraan"("id_kendaraan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kendaraan_sopir" ADD CONSTRAINT "kendaraan_sopir_id_sopir_fkey" FOREIGN KEY ("id_sopir") REFERENCES "sopir"("id_sopir") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kendaraan_sopir" ADD CONSTRAINT "kendaraan_sopir_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_plat_kendaraan" ADD CONSTRAINT "riwayat_plat_kendaraan_id_kendaraan_fkey" FOREIGN KEY ("id_kendaraan") REFERENCES "kendaraan"("id_kendaraan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_bensin" ADD CONSTRAINT "log_bensin_id_kendaraan_fkey" FOREIGN KEY ("id_kendaraan") REFERENCES "kendaraan"("id_kendaraan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_bensin" ADD CONSTRAINT "log_bensin_id_sopir_fkey" FOREIGN KEY ("id_sopir") REFERENCES "sopir"("id_sopir") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_bensin" ADD CONSTRAINT "log_bensin_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_angin" ADD CONSTRAINT "log_angin_id_kendaraan_fkey" FOREIGN KEY ("id_kendaraan") REFERENCES "kendaraan"("id_kendaraan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_angin" ADD CONSTRAINT "log_angin_id_sopir_fkey" FOREIGN KEY ("id_sopir") REFERENCES "sopir"("id_sopir") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_angin" ADD CONSTRAINT "log_angin_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_lain" ADD CONSTRAINT "log_lain_id_kendaraan_fkey" FOREIGN KEY ("id_kendaraan") REFERENCES "kendaraan"("id_kendaraan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_lain" ADD CONSTRAINT "log_lain_id_sopir_fkey" FOREIGN KEY ("id_sopir") REFERENCES "sopir"("id_sopir") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_lain" ADD CONSTRAINT "log_lain_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembelian_sparepart" ADD CONSTRAINT "pembelian_sparepart_id_kendaraan_fkey" FOREIGN KEY ("id_kendaraan") REFERENCES "kendaraan"("id_kendaraan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembelian_sparepart" ADD CONSTRAINT "pembelian_sparepart_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_sparepart" ADD CONSTRAINT "item_sparepart_id_pembelian_sparepart_fkey" FOREIGN KEY ("id_pembelian_sparepart") REFERENCES "pembelian_sparepart"("id_nota_sparepart") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_tangki" ADD CONSTRAINT "mutasi_tangki_id_tangki_fkey" FOREIGN KEY ("id_tangki") REFERENCES "tangki_bbm"("id_tangki") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_tangki" ADD CONSTRAINT "mutasi_tangki_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_kecil" ADD CONSTRAINT "kas_kecil_id_user_input_fkey" FOREIGN KEY ("id_user_input") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_kecil" ADD CONSTRAINT "kas_kecil_id_log_bensin_fkey" FOREIGN KEY ("id_log_bensin") REFERENCES "log_bensin"("id_bbm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_kecil" ADD CONSTRAINT "kas_kecil_id_log_angin_fkey" FOREIGN KEY ("id_log_angin") REFERENCES "log_angin"("id_angin") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_kecil" ADD CONSTRAINT "kas_kecil_id_log_lain_fkey" FOREIGN KEY ("id_log_lain") REFERENCES "log_lain"("id_lain") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_kecil" ADD CONSTRAINT "kas_kecil_id_pembelian_sparepart_fkey" FOREIGN KEY ("id_pembelian_sparepart") REFERENCES "pembelian_sparepart"("id_nota_sparepart") ON DELETE SET NULL ON UPDATE CASCADE;
