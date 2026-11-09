"use client";

import { CameraIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changeEmail,
  changePassword,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "@/features/profile/actions";
import type { Profile } from "@/features/profile/queries";
import { AVATAR_TYPES } from "@/features/profile/schema";
import { ProfileAvatar } from "./profile-avatar";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

/** Recorta no centro e reduz para 256×256 JPEG (fica bem abaixo de 1 MB). */
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  canvas
    .getContext("2d")!
    .drawImage(
      img,
      (img.width - side) / 2,
      (img.height - side) / 2,
      side,
      side,
      0,
      0,
      256,
      256,
    );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
      "image/jpeg",
      0.85,
    ),
  );
}

export function EditProfileForm({
  profile,
  onDone,
}: {
  profile: Profile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(profile.full_name);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const { error } = await fn();
      if (error) return void toast.error(error);
      toast.success(ok);
    });

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          name={name}
          url={profile.avatar_url}
          className="size-20 text-xl"
        />
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <CameraIcon /> {profile.avatar_url ? "Trocar foto" : "Enviar foto"}
          </Button>
          {profile.avatar_url && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-destructive"
              disabled={pending}
              onClick={() => run(removeAvatar, "Foto removida.")}
            >
              Remover foto
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          aria-label="Foto de perfil"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            run(async () => {
              const fd = new FormData();
              try {
                fd.set("avatar", await shrink(file), "avatar.jpg");
              } catch {
                return { error: "Não foi possível ler a imagem." };
              }
              return uploadAvatar(fd);
            }, "Foto atualizada.");
          }}
        />
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const { error } = await updateProfile({ full_name: name });
            setError(error);
            if (error) return;
            toast.success("Perfil atualizado.");
            onDone();
          });
        }}
      >
        <label className={labelClass}>
          Nome
          <Input
            className="h-11 text-base"
            autoComplete="name"
            value={name}
            aria-invalid={!!error}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldError message={error} />
        </label>
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}

export function ChangeEmailForm({
  profile,
  onDone,
}: {
  profile: Profile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-4 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await changeEmail({ email });
          setError(r.error);
          if (r.error) return;
          toast.success(r.message);
          onDone();
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        E-mail atual: <span className="text-foreground">{profile.email}</span>
      </p>
      <label className={labelClass}>
        Novo e-mail
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          className="h-11 text-base"
          value={email}
          aria-invalid={!!error}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldError message={error} />
      </label>
      <p className="text-xs text-muted-foreground">
        Vamos enviar um link de confirmação. O e-mail só muda depois que você
        clicar nele.
      </p>
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Enviando..." : "Alterar e-mail"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState({
    current: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string>();
  const field = (name: keyof typeof values, label: string, auto: string) => (
    <label className={labelClass}>
      {label}
      <Input
        type="password"
        autoComplete={auto}
        className="h-11 text-base"
        value={values[name]}
        onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
      />
    </label>
  );

  return (
    <form
      className="flex flex-col gap-4 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await changePassword(values);
          setError(r.error);
          if (r.error) return;
          toast.success(r.message);
          onDone();
        });
      }}
    >
      {field("current", "Senha atual", "current-password")}
      {field("password", "Nova senha", "new-password")}
      {field("confirm", "Repita a nova senha", "new-password")}
      <FieldError message={error} />
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
