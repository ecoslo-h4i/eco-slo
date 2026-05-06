export interface NavbarButtonProps {
  icon: string;
  label: string;
  link: string;
}

export default function SideNavbarButton({ icon, label, link }: NavbarButtonProps) {
  return (
    <a
      href={link}
      className="flex h-[clamp(3.75rem,9.5dvh,5.5rem)] min-h-0 w-full max-w-24 shrink cursor-pointer flex-col items-center justify-center gap-[clamp(0.125rem,0.8dvh,0.5rem)] rounded-2xl p-[clamp(0.25rem,1dvh,0.5rem)] transition-colors duration-200 hover:bg-primary-extra-light/50"
    >
      <div className="flex size-[clamp(1.875rem,5dvh,2.8125rem)] flex-col items-center justify-center p-[3px]">
        <img src={icon} alt={label} className="w-full h-full aspect-square" />
      </div>
      <span className="h-[clamp(1rem,2.25dvh,1.375rem)] font-avenir text-[clamp(0.625rem,1.6dvh,0.875rem)] font-normal text-white">
        {label}
      </span>
    </a>
  );
}
