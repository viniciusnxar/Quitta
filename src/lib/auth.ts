import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { Pool } from "pg";
import { cache } from "react";
import { seedSampleData } from "@/features/sample/queries";
import { linkEmail, sendEmail } from "@/lib/email";
import { clientFor } from "@/lib/supabase/jwt";

export const auth = betterAuth({
  baseURL: process.env.SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  // Mesmos ids (uuid) do antigo auth.users: as FKs e o RLS continuam valendo.
  advanced: { database: { generateId: "uuid" } },
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: hashPassword,
      // Senhas migradas do Supabase são bcrypt ($2…); as novas são scrypt.
      verify: ({ hash, password }) =>
        hash.startsWith("$2")
          ? bcrypt.compare(password, hash)
          : verifyPassword({ hash, password }),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: ({ user, url }) =>
      sendEmail(
        user.email,
        "Confirme seu e-mail",
        linkEmail("Confirme seu e-mail no Quitta.", url, "Confirmar e-mail"),
      ),
  },
  user: { changeEmail: { enabled: true } },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  hooks: {
    // Depois de qualquer login (senha, Google, link de e-mail): dados de exemplo.
    after: createAuthMiddleware(async (ctx) => {
      const user = ctx.context.newSession?.user;
      if (user) await seedSampleData(clientFor(user));
    }),
  },
  plugins: [nextCookies()], // precisa ser o último
});

/** Sessão da requisição atual (uma consulta por request). */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
