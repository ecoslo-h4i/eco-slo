"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function TopNavbar() {
  const pathname = usePathname();

  const navButton = () => {
    return pathname === "/login" ? (
      <a
        href="/map"
        className="flex flex-row items-center bg-white text-black rounded-full h-[39px] text-sm font-avenir font-normal p-3 gap-2"
      >
        <Image src="/icons/black-map.svg" width={18} height={18} alt="Map" />
        <span>Back to Map</span>
      </a>
    ) : (
      <a
        href="/login"
        className="flex items-center bg-white text-black rounded-full h-[39px] text-sm font-avenir font-normal p-3"
      >
        Login
      </a>
    );
  };

  return (
    <div className="flex flex-row bg-[#758656] h-29.5 w-full pl-5 pr-5 items-center">
      <div className="w-24.5 h-24.5 flex items-center justify-space-between">
        <Image src="/icons/ecoslo-logo.png" width={98} height={98} alt="EcoSLO Logo" />
      </div>
      <div className="flex flex-row ml-auto items-center justify-center gap-8">{navButton()}</div>
    </div>
  );
}
