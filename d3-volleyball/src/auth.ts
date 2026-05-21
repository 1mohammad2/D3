import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ✅ Fix CSRF error in production (Vercel)
  trustHost: true,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            fullName: true,
            password: true,
            role: true,
            isApproved: true,
            isBanned: true,
            skillLevel: true,
            rankingScore: true,
            profilePhoto: true,
          },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        if (user.isBanned) throw new Error("BANNED");

        if (!user.isApproved && user.role !== "ADMIN") {
          throw new Error("PENDING_APPROVAL");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.profilePhoto ?? null,
          role: user.role,
          skillLevel: user.skillLevel,
          rankingScore: user.rankingScore,
          isApproved: user.isApproved,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.skillLevel = user.skillLevel;
        token.rankingScore = user.rankingScore;
        token.isApproved = user.isApproved;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.skillLevel = token.skillLevel;
      session.user.rankingScore = token.rankingScore;
      session.user.isApproved = token.isApproved;
      return session;
    },
  },
});