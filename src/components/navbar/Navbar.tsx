import Image from "next/image";
import NavbarButton from "./NavbarButton";

export default function Navbar() {
  return (
    <div className="flex flex-col min-h-screen w-[140px] bg-[#758656] pt-[48px] gap-[60px] h-[846px]">
      <div className="flex flex-col items-center justify-center gap-[20px]">
        <div className="w-[98px] h-[98px] flex items-center justify-center">
          <Image src="/icons/ecoslo-logo.png" width={98} height={98} alt="EcoSLO Logo" />
        </div>
        <button className="bg-white text-black rounded-full w-[80px] h-[39px] text-sm font-avenir font-normal">
          Log out
        </button>
      </div>
      <div className="flex flex-grow flex-col items-center gap-[16px]">
        <NavbarButton icon="/icons/home.svg" label="Dashboard" link="/" />
        <NavbarButton icon="/icons/tree.svg" label="Trees" link="/trees" />
        <NavbarButton icon="/icons/volunteers.svg" label="Volunteers" link="/volunteers" />
        <NavbarButton icon="/icons/analytics.svg" label="Reminders" link="/reminders" />
        <NavbarButton icon="/icons/map.svg" label="Tree Map" link="/map" />
        <NavbarButton icon="/icons/settings.svg" label="Settings" link="/settings" />
      </div>
    </div>
  );
}
