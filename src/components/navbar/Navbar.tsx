"use client";
import SideNavbar from "./SideNavbar";
import TopNavbar from "./TopNavbar";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathName = usePathname();

  const showTopNavbar = () => {
    const topNavbarPaths = ["/login", "/map"];
    return true;
    return topNavbarPaths.includes(pathName);
  };

  return <>{showTopNavbar() ? <TopNavbar /> : <SideNavbar />}</>;
}
