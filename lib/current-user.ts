import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Ambil user yang sedang login langsung dari database (bukan hanya dari token)
export async function getCurrentUser() {
  const session = await auth();
  const username = (session?.user as { username?: string } | undefined)?.username;
  if (!username) return null;

  const user = await prisma.user.findUnique({ where: { username } });
  return user && user.is_active && !user.deleted_at ? user : null;
}