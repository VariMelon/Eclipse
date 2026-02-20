import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validateUserInput } from "@/lib/inputValidation";

function authFailure(reason: string, username?: string) {
  const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
  const safeUsername = normalizedUsername ? `${normalizedUsername.slice(0, 2)}***` : "unknown";
  console.warn(`[auth][credentials] failed reason=${reason} username=${safeUsername}`);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          authFailure("missing_credentials");
          return null;
        }

        const validation = validateUserInput(credentials);
        if (!validation.ok) {
          authFailure("invalid_input", credentials.username);
          return null;
        }

        const username = credentials.username.trim();

        try {
          const users = await prisma.user.findMany({
            where: {
              name: {
                equals: username,
                mode: "insensitive",
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              emailVerified: true,
            },
          }) as Array<{
            id: string;
            name: string | null;
            email: string;
            password: string;
            emailVerified: Date | null;
          }>;

          if (users.length === 0) {
            authFailure("invalid_credentials", username);
            return null;
          }

          for (const user of users) {
            const passwordMatch = await bcrypt.compare(credentials.password, user.password);
            if (!passwordMatch) {
              continue;
            }

            if (!user.emailVerified) {
              authFailure("email_not_verified", username);
              throw new Error("email_not_verified");
            }

            return { id: user.id, name: user.name || user.email, email: user.email };
          }

          authFailure("invalid_credentials", username);
          return null;
        } catch (error) {
          if (error instanceof Error && error.message === "email_not_verified") {
            throw error;
          }
          authFailure("internal_error", username);
          console.error("[auth][credentials] authorize exception", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as { id?: string }).id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as { id?: string })?.id && session.user) {
        (session.user as { id?: string }).id = (token as { id?: string }).id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
