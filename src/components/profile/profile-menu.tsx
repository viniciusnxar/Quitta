"use client";

import {
  EllipsisIcon,
  KeyRoundIcon,
  LogOutIcon,
  MailIcon,
  UserPenIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/features/auth/actions";
import type { Profile } from "@/features/profile/queries";
import { ProfileAvatar } from "./profile-avatar";
import {
  ChangeEmailForm,
  ChangePasswordForm,
  EditProfileForm,
} from "./profile-forms";

const TITLES = {
  perfil: "Editar perfil",
  email: "Alterar e-mail",
  senha: "Alterar senha",
} as const;
type Dialog = keyof typeof TITLES;

/** Avatar no topo: abre o menu do perfil (editar, e-mail, senha, mais, sair). */
export function ProfileMenu({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => setDialog(null);
  const name = profile.full_name || profile.email;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Menu do perfil"
          className="flex h-11 items-center gap-2 rounded-md px-1.5 hover:bg-accent md:px-2"
        >
          <ProfileAvatar name={name} url={profile.avatar_url} />
          <span className="hidden max-w-36 truncate text-sm font-medium md:block">
            {profile.full_name || "Perfil"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center gap-3 px-1.5 py-2">
            <ProfileAvatar
              name={name}
              url={profile.avatar_url}
              className="size-10"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {profile.full_name || "Sem nome"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {profile.email}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="h-11"
              onClick={() => setDialog("perfil")}
            >
              <UserPenIcon /> Editar perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-11"
              onClick={() => setDialog("email")}
            >
              <MailIcon /> Alterar e-mail
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-11"
              onClick={() => setDialog("senha")}
            >
              <KeyRoundIcon /> Alterar senha
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-11"
              onClick={() => router.push("/mais")}
            >
              <EllipsisIcon /> Mais configurações
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="h-11"
            disabled={pending}
            onClick={() => startTransition(() => logout())}
          >
            <LogOutIcon /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && close()}
        title={dialog ? TITLES[dialog] : ""}
      >
        {dialog === "perfil" && (
          <EditProfileForm profile={profile} onDone={close} />
        )}
        {dialog === "email" && (
          <ChangeEmailForm profile={profile} onDone={close} />
        )}
        {dialog === "senha" && <ChangePasswordForm onDone={close} />}
      </ResponsiveDialog>
    </>
  );
}
