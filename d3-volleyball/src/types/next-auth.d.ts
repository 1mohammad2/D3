import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/**
 * Extend NextAuth built-in types to include our custom D3 fields.
 * We must extend THREE interfaces:
 * 1. Session.user — what the frontend sees
 * 2. User — what the authorize() function returns
 * 3. JWT — what's stored in the token
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      skillLevel: string;
      rankingScore: number;
      isApproved: boolean;
    } & DefaultSession["user"];
  }

  // ← Fix: extend User so jwt() callback knows about our custom fields
  interface User extends DefaultUser {
    id: string;
    role: string;
    skillLevel: string;
    rankingScore: number;
    isApproved: boolean;
  }
}

// ← Fix: extend JWT so session() callback knows about token fields
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    skillLevel: string;
    rankingScore: number;
    isApproved: boolean;
  }
}