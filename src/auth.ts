// auth.ts
import authConfig from "@/auth.config";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Role } from "./validaton-schema";
import { findUserById } from "./actions/user";
import { db } from "./db";

export type ExtendedUser = DefaultSession["user"] & {
  role: Role;
  mustChangePassword: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    mustChangePassword?: boolean;
  }
}

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      const existingUser = await findUserById(user.id!);
      if (!existingUser || !existingUser.emailVerified) {
        return false;
      }
      return true;
    },

    async jwt({ token, trigger, session }) {
      // When unstable_update() is called from a server action, trigger === "update".
      // Merge the new values directly into the token so the cookie is rewritten
      // immediately — without needing a full DB round-trip for this specific field.
      if (trigger === "update" && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
        return token;
      }

      // Normal flow: hydrate token from DB on every other jwt invocation
      if (!token.sub) return token;

      const existingUser = await findUserById(token.sub);
      if (!existingUser) return token;

      token.role               = existingUser.role;
      token.mustChangePassword = existingUser.mustChangePassword;

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role;
      }
      if (session.user) {
        session.user.mustChangePassword = token.mustChangePassword ?? false;
      }
      return session;
    },
  },
  ...authConfig,
});