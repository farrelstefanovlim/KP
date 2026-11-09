import type { DefaultSession } from "next-auth";
import type { Role } from "../generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    username: string;
    allowedModules?: unknown;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      username: string;
      allowedModules?: unknown;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    username: string;
    allowedModules?: unknown;
  }
}