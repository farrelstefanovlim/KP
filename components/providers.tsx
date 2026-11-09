// src/components/providers.tsx
// Wrapper wajib supaya signIn()/useSession() dari next-auth/react bisa dipakai
// di komponen client manapun. Dipasang sekali di root layout.
"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
