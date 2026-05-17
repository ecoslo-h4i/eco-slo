import SideNavbar from "@/components/navbar/SideNavbar";
import { CurrentMemberProvider } from "@/hooks/useCurrentProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentMemberProvider>
      <div className="flex min-h-screen">
        <SideNavbar />
        {children}
      </div>
    </CurrentMemberProvider>
  );
}
