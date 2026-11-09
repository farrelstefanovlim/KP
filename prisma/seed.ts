import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Konfigurasi koneksi menggunakan node-postgres (pg) dan adapter Prisma
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Hash password menggunakan bcrypt
  const hashedPassword = await bcrypt.hash('masteradmin123', 10);

  // Buat akun superadmin baru dengan schema yang sudah direvisi
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password_hash: hashedPassword,
      nama: 'Super Admin', // <-- Menyesuaikan kolom baru di ERD (sebelumnya full_name)
      role: 'SUPERADMIN',
      is_active: true,
    },
  });

  console.log('🌱 Seeding selesai! Superadmin berhasil dibuat:', superadmin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });