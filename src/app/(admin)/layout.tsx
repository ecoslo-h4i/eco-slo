import SideNavbar from "@/components/navbar/SideNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SideNavbar />
      {children}
    </div>
  );
}
