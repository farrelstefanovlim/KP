// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        // Tolak kalau user tidak ada ATAU akunnya dinonaktifkan
        if (!user || !user.is_active) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!isValid) return null;

        // Yang di-return di sini akan masuk ke token JWT (lihat callback jwt di bawah)
        return {
          id: user.id_user,
          name: user.nama,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Dipanggil tiap token dibuat/diperbarui — kita selipkan role & allowedModules ke dalamnya
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.allowedModules = (user as any).allowedModules;
      }
      return token;
    },
    // Dipanggil tiap session dibaca di halaman — kita salin dari token ke session.user
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).allowedModules = token.allowedModules;
      }
      return session;
    },
  },
});
