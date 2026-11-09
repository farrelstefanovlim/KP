-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "JenisKendaraanEntry" AS ENUM ('BBM', 'SPAREPART', 'ISI_ANGIN', 'CUCI');

-- CreateEnum
CREATE TYPE "TipeFuelStock" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "StatusPerintahKerja" AS ENUM ('DIBUAT', 'DIKERJAKAN', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusAbsensi" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPHA');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "allowed_modules" JSONB,
    "gaji_pokok" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "plat_nomor" VARCHAR(20) NOT NULL,
    "nama_sopir" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_entries" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis" "JenisKendaraanEntry" NOT NULL,
    "liter" DECIMAL(6,2),
    "harga_per_liter" DECIMAL(10,2) DEFAULT 6800,
    "km" INTEGER,
    "biaya" DECIMAL(12,2) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_stock_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "tipe" "TipeFuelStock" NOT NULL,
    "liter" DECIMAL(6,2) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_stock_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "vehicle_id" UUID,
    "judul" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "status" "StatusPerintahKerja" NOT NULL DEFAULT 'DIBUAT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "jumlah" DECIMAL(12,2) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "bukti_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "petty_cash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_masuk" TIME,
    "jam_keluar" TIME,
    "status" "StatusAbsensi" NOT NULL DEFAULT 'HADIR',
    "menit_terlambat" INTEGER NOT NULL DEFAULT 0,
    "denda_keterlambatan" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plat_nomor_key" ON "vehicles"("plat_nomor");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_user_id_tanggal_key" ON "attendance"("user_id", "tanggal");

-- AddForeignKey
ALTER TABLE "vehicle_entries" ADD CONSTRAINT "vehicle_entries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_entries" ADD CONSTRAINT "vehicle_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_stock_logs" ADD CONSTRAINT "fuel_stock_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
