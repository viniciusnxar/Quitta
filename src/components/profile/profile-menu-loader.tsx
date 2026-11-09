import { getProfile } from "@/features/profile/queries";
import { ProfileMenu } from "./profile-menu";

/** Busca o perfil no servidor. Envolver em <Suspense>. */
export async function ProfileMenuLoader() {
  const profile = await getProfile();
  return profile ? <ProfileMenu profile={profile} /> : null;
}
