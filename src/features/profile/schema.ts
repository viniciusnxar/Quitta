import { z } from "zod";

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Use até 80 caracteres."),
});

export const emailSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem.",
  })
  .refine((v) => v.password !== v.current, {
    path: ["password"],
    message: "Use uma senha diferente da atual.",
  });

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Igual ao file_size_limit do bucket. */
export const AVATAR_MAX_BYTES = 1024 * 1024;

/** "Maria da Silva" → "MS"; vazio → "?". */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts.at(-1)![0] : "";
  return (first + last).toUpperCase();
}
