import SideNavbar from "@/components/navbar/SideNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SideNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
