interface NavbarButtonProps {
  icon: string;
  label: string;
  link: string;
}

export default function SideNavbarButton({ icon, label, link }: NavbarButtonProps) {
  return (
    <a
      href={link}
      className="flex flex-col items-center justify-center gap-2 w-22 h-[75px] rounded-2xl hover:bg-[#6A7B4F] transition-colors duration-200 cursor-pointer"
    >
      <div className="w-[45px] h-[45px] p-[3px] flex flex-col items-center justify-center ">
        <img src={icon} alt={label} className="w-full h-full aspect-square" />
      </div>
      <span className="text-base font-avenir font-normal text-white h-5.5">{label}</span>
    </a>
  );
}
