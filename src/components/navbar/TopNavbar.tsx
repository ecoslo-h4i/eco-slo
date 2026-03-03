import Image from "next/image";

export default function TopNavbar() {
  return (
    <div className="flex flex-row bg-[#758656] h-29.5 w-full pl-5 pr-5 items-center">
      <div className="w-24.5 h-24.5 flex items-center justify-space-between">
        <Image src="/icons/ecoslo-logo.png" width={98} height={98} alt="EcoSLO Logo" />
      </div>
      <div className="flex flex-row ml-auto items-center justify-center gap-8">
        <button className="flex items-center bg-white text-black rounded-full h-[39px] text-base font-avenir font-normal p-3">
          Log out
        </button>
        <button className="flex flex-row items-center justify-center bg-white text-black rounded-full h-[39px] text-base font-avenir font-normal p-3">
          <Image src="/icons/map.svg" width={18} height={18} alt="Map" className="stroke-black" />
          Back to Map
        </button>
      </div>
    </div>
  );
}
