import ActiveReminders from "@/components/reminders/ActiveReminders";
import Image from "next/image";

export default function Reminders() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background px-8 py-10">
      <header className="flex flex-row items-center justify-between pt-5">
        <h1 className="text-[56px] font-[Constantia] font-semibold leading-none">Automated Reminders</h1>
        <button className="h-10 w-40 bg-primary rounded-full text-white font-avenir flex flex-row items-center justify-center hover:bg-primary-light transition-colors duration-200 cursor-pointer">
          <span>New Reminder</span>
          <Image src="/icons/plus.svg" alt="Plus Icon" width={20} height={20} className="ml-2" />
        </button>
      </header>
      <div className="mt-10 flex min-h-0 flex-1 flex-row gap-8">
        <div className="min-h-0 basis-1/3">
          <ActiveReminders />
        </div>
        <div className="min-h-0 basis-2/3"></div>
      </div>
    </main>
  );
}
