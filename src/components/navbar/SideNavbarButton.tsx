export interface NavbarButtonProps {
  icon: string;
  label: string;
  link?: string;
  adminOnly?: boolean;
  onClick?: () => void;
}

export default function SideNavbarButton({ icon, label, link, onClick }: NavbarButtonProps) {
  return (
    <a
      href={link}
      className="flex flex-col items-center justify-center gap-2 w-24 h-22 p-2 rounded-2xl hover:bg-primary-extra-light/50 transition-colors duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="w-[45px] h-[45px] p-[3px] flex flex-col items-center justify-center ">
        <img src={icon} alt={label} className="w-full h-full aspect-square" />
      </div>
      <span className="text-sm font-avenir font-normal text-white h-5.5">{label}</span>
    </a>
  );
}
