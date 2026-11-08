import {
  BanknoteIcon,
  BriefcaseIcon,
  LandmarkIcon,
  PiggyBankIcon,
  SmartphoneIcon,
  TrendingUpIcon,
  UtensilsIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import type { ACCOUNT_ICONS } from "@/features/accounts/schema";

export const ACCOUNT_ICON_COMPONENTS: Record<
  (typeof ACCOUNT_ICONS)[number],
  LucideIcon
> = {
  landmark: LandmarkIcon,
  wallet: WalletIcon,
  "piggy-bank": PiggyBankIcon,
  banknote: BanknoteIcon,
  smartphone: SmartphoneIcon,
  briefcase: BriefcaseIcon,
  utensils: UtensilsIcon,
  "trending-up": TrendingUpIcon,
};

export function AccountIcon({
  icon,
  color,
}: {
  icon: string | null;
  color: string | null;
}) {
  const Icon =
    ACCOUNT_ICON_COMPONENTS[icon as keyof typeof ACCOUNT_ICON_COMPONENTS] ??
    LandmarkIcon;
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: color ?? "#525252" }}
    >
      <Icon className="size-5" />
    </span>
  );
}
