import { z } from "zod";

const email = z.email("Informe um e-mail válido.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha."),
});

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome."),
  email,
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export type AuthState = { error?: string; message?: string; email?: string };
