import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        // 1. Validate shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Find user
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

        // 3. Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        // 4. Check ban
        if (user.isBanned) throw new Error("BANNED");

        // 5. Check approval (admin bypasses this)
        if (!user.isApproved && user.role !== "ADMIN") {
          throw new Error("PENDING_APPROVAL");
        }

        // ← Return object must match our extended User interface
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
    // Store custom fields in JWT token
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

    // Pass JWT fields to session
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