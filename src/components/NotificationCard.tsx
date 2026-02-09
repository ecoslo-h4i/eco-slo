import Image from "next/image";

export default function NotificationCard() {
  return (
    <div className="w-auto h-[75px] pt-[12px] pl-[16px] pb-[12px] pr-[16px] rounded-lg gap-[4px] bg-[#AFC18F] mt-[10px] mb-[0px]">
      <div className="flex flex-row items-center">
        <p className="text-sm font-medium">7m</p>
        <button className="ml-auto font-medium text-sm font-Avenir">X</button>
      </div>
      <div className="flex flex-row items-center mt-[8px]">
        <Image src="/small_bell.png" width={24} height={25} alt="A small notification bell"></Image>
        <p className="ml-[5px]">Notification text goes here</p>
      </div>
    </div>
  );
}
