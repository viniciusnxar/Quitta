"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/features/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/auth/field";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-xl font-medium">Criar conta</h2>
      <Field label="Nome" name="full_name" autoComplete="name" />
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
        autoComplete="new-password"
        minLength={8}
      />
      <FormMessage error={state.error} message={state.message} />
      <SubmitButton pending={pending}>Criar conta</SubmitButton>
      <p className="text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
