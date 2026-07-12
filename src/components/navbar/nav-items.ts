import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  MapPin,
  TreeDeciduous,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

// All possible feature nav entries, shared by the desktop sidebar and the
// mobile drawer so the two never drift apart. `adminOnly` flags entries hidden
// from Tree Keepers because RLS prevents them from doing meaningful work on
// those pages (Reminders are admin-only; Members would just show their own row).
export type FeatureNavItem = {
  icon: LucideIcon;
  label: string;
  link: string;
  adminOnly?: boolean;
};

export const featureNavItems: FeatureNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", link: "/dashboard" },
  { icon: TreeDeciduous, label: "Trees", link: "/trees" },
  { icon: UsersRound, label: "Members", link: "/members", adminOnly: true },
  { icon: Calendar, label: "Reminders", link: "/reminders", adminOnly: true },
  { icon: ListChecks, label: "Tasks", link: "/tasks" },
  { icon: ClipboardList, label: "Surveys", link: "/surveys" },
  { icon: MapPin, label: "Map", link: "/map" },
];

export function getVisibleNavItems(isLoggedIn: boolean, isAdmin: boolean): FeatureNavItem[] {
  if (!isLoggedIn) return [];
  return featureNavItems.filter((item) => !item.adminOnly || isAdmin);
}
