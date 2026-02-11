interface NavbarButtonProps {
  icon: string;
  label: string;
  link: string;
}

export default function NavbarButton({ icon, label, link }: NavbarButtonProps) {
  return (
    <a href={link} className="flex flex-col items-center justify-center gap-[8px]">
      <div className="w-[45px] h-[45px] p-[3px] flex flex-col items-center justify-center rounded-full bg-[#758656]">
        <img src={icon} alt={label} className="w-full h-full aspect-square" />
      </div>
      <span className="text-base font-avenir font-normal text-white h-[22px]">{label}</span>
    </a>
  );
}
