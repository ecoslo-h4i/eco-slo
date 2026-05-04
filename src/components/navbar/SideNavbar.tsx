import Image from "next/image";
import NavbarButton, { NavbarButtonProps } from "./SideNavbarButton";

const buttons: NavbarButtonProps[] = [
  { icon: "/icons/home.svg", label: "Dashboard", link: "/dashboard" },
  { icon: "/icons/tree.svg", label: "Trees", link: "/trees" },
  { icon: "/icons/volunteers.svg", label: "Members", link: "/members" },
  { icon: "/icons/calendar.svg", label: "Reminders", link: "/reminders" },
  { icon: "/icons/analytics.svg", label: "Tasks", link: "/tasks" },
  { icon: "/icons/pen-paper.svg", label: "Surveys", link: "/survey" },
  { icon: "/icons/map.svg", label: "Map", link: "/map" },
];

export default function SideNavbar() {
  return (
    <div className="flex flex-col min-h-screen w-35 bg-primary py-6 px-5 gap-6">
      <div className="flex flex-col items-center justify-center gap-5">
        <div className="w-24.5 h-24.5 flex items-center justify-center">
          <Image src="/icons/ecoslo-logo.png" width={98} height={98} alt="EcoSLO Logo" />
        </div>
        <a
          href="/login"
          className="flex items-center justify-center bg-white text-black rounded-full w-28 h-[39px] px-4 py-2.5 text-sm font-avenir font-normal hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
        >
          <span>Log out</span>
        </a>
      </div>
      {/* TODO: figure out clean scaling with dynamic page height */}
      <div className="flex flex-grow flex-col items-center gap-4">
        {buttons.map((button) => (
          <NavbarButton key={button.label} {...button} />
        ))}
      </div>
    </div>
  );
}
