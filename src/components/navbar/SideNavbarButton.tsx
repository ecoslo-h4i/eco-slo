import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface NavbarButtonProps {
  icon: LucideIcon;
  label: string;
  link?: string;
  adminOnly?: boolean;
  onClick?: () => void;
}

export default function SideNavbarButton({ icon: Icon, label, link, onClick }: NavbarButtonProps) {
  const className =
    "flex flex-col items-center justify-center gap-2 w-24 h-22 p-2 rounded-2xl hover:bg-primary-extra-light/50 transition-colors duration-200 cursor-pointer";

  const inner = (
    <>
      <div className="w-[45px] h-[45px] p-[3px] flex flex-col items-center justify-center ">
        <Icon aria-hidden="true" className="h-full w-full text-white" strokeWidth={1.5} />
      </div>
      <span className="text-sm font-lato font-normal text-white h-5.5">{label}</span>
    </>
  );

  if (link) {
    return (
      <Link href={link} className={className} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {inner}
    </button>
  );
}
