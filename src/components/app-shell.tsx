import SideNavbar from "@/components/navbar/SideNavbar";
import MobileNavbar from "@/components/navbar/MobileNavbar";
import { CurrentMemberProvider } from "@/hooks/useCurrentProvider";

// Shared chrome for the public and admin route groups: desktop keeps the
// fixed sidebar rail; below md it collapses into a top bar + drawer. dvh (not
// vh) so mobile browser UI never pushes content off-screen.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CurrentMemberProvider>
      <div className="flex h-dvh flex-col bg-background md:flex-row">
        <MobileNavbar className="md:hidden" />
        <div className="hidden items-center pl-3 md:flex">
          <SideNavbar />
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      </div>
    </CurrentMemberProvider>
  );
}
