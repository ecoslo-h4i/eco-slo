import Image from "next/image";
import NavbarButton from "./SideNavbarButton";

export default function SideNavbar() {
  return (
    <div className="flex h-full min-h-0 w-35 shrink-0 flex-col gap-15 bg-[#758656] pt-12">
      <div className="flex flex-col items-center justify-center gap-5">
        <div className="w-24.5 h-24.5 flex items-center justify-center">
          <Image src="/icons/ecoslo-logo.png" width={98} height={98} alt="EcoSLO Logo" />
        </div>
        <a
          href="/login"
          className="flex items-center justify-center bg-white text-black rounded-full w-20 h-[39px] text-sm font-avenir font-normal hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
        >
          <span>Log out</span>
        </a>
      </div>
      <div className="flex flex-grow flex-col items-center gap-6">
        <NavbarButton icon="/icons/home.svg" label="Dashboard" link="/dashboard" />
        <NavbarButton icon="/icons/tree.svg" label="Trees" link="/trees" />
        <NavbarButton icon="/icons/volunteers.svg" label="Volunteers" link="/volunteers" />
        <NavbarButton icon="/icons/analytics.svg" label="Reminders" link="/reminders" />
        <NavbarButton icon="/icons/map.svg" label="Tree Map" link="/map" />
        <NavbarButton icon="/icons/settings.svg" label="Settings" link="/settings" />
      </div>
    </div>
  );
}
