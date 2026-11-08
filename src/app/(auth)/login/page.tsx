"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import { login } from "@/features/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/auth/field";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  const [state, action, pending] = useActionState(login, {});
  const linkError =
    use(searchParams).erro === "link"
      ? "Link inválido ou expirado. Entre ou cadastre-se de novo."
      : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-xl font-medium">Entrar</h2>
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      <FormMessage error={state.error ?? linkError} />
      <SubmitButton pending={pending}>Entrar</SubmitButton>
      <p className="text-center text-sm">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
