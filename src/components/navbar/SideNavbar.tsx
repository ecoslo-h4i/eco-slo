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
    <div className="sticky top-0 flex h-dvh w-[clamp(6.5rem,10vw,8.75rem)] min-w-[6.5rem] shrink-0 flex-col gap-[clamp(0.75rem,2.5dvh,1.5rem)] overflow-hidden bg-primary px-[clamp(0.5rem,1.4vw,1.25rem)] py-[clamp(0.75rem,2.5dvh,1.5rem)]">
      <div className="flex flex-col items-center justify-center gap-[clamp(0.625rem,2dvh,1.25rem)]">
        <div className="flex aspect-square w-[clamp(3.5rem,12dvh,6.125rem)] max-w-full items-center justify-center">
          <Image
            src="/icons/ecoslo-logo.png"
            width={98}
            height={98}
            alt="EcoSLO Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <a
          href="/login"
          className="flex h-[clamp(1.75rem,5dvh,2.4375rem)] w-full max-w-28 cursor-pointer text-center items-center justify-center rounded-full bg-white px-[clamp(0.75rem,2dvh,1rem)] py-0 font-avenir text-[clamp(0.75rem,1.8dvh,0.875rem)] font-normal text-black transition-colors duration-200 hover:bg-gray-200"
        >
          <span>Log out</span>
        </a>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-evenly gap-[clamp(0.25rem,1.5dvh,1rem)]">
        {buttons.map((button) => (
          <NavbarButton key={button.label} {...button} />
        ))}
      </div>
    </div>
  );
}
