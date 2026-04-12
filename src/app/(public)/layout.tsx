import TopNavbar from "@/components/navbar/TopNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <TopNavbar />
      {children}
    </div>
  );
}
