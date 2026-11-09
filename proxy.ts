// src/middleware.ts
// Melindungi semua halaman di bawah /dashboard — kalau belum login, otomatis
// diarahkan ke /login (perilaku default NextAuth ketika auth() dipakai sebagai middleware).
export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};
