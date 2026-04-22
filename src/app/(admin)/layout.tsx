import SideNavbar from "@/components/navbar/SideNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideNavbar />
      {children}
    </div>
  );
}
