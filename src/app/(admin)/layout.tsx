import SideNavbar from "@/components/navbar/SideNavbar";
import { CurrentMemberProvider } from "@/hooks/useCurrentProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentMemberProvider>
      <div className="flex h-screen bg-background">
        <div className="flex items-center pl-3">
          <SideNavbar />
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      </div>
    </CurrentMemberProvider>
  );
}
