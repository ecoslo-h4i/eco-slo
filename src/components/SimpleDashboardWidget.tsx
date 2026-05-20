"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardWidgetButton {
  name: string;
  handler: () => void;
}

export interface DashboardWidgetProps {
  name: string;
  iconPath: string;
  pageRoute: string;
  buttons: DashboardWidgetButton[] | null;
}

export function SimpleDashboardWidget(props: DashboardWidgetProps) {
  const buttonsArray = Array.isArray(props.buttons) ? props.buttons : props.buttons ? [props.buttons] : [];
  const hasButtons = buttonsArray.length > 0;

  return (
    <div className="flex flex-col h-full w-full p-8 justify-between">
      <div className="flex flex-col justify-center flex-grow">
        <div
          className={`flex items-end justify-between border-b-2 border-border-strong pt-4 pb-4 ${hasButtons ? "mb-10" : "mb-0"}`}
        >
          <Link href={props.pageRoute}>
            <h2 className="text-4xl font-avenir text-black leading-none">{props.name}</h2>
          </Link>
          <img src={props.iconPath} alt="" className="w-12 h-12 object-contain select-none pointer-events-none" />
        </div>

        <div className="flex flex-col gap-6 mt-0 mb-px">
          {buttonsArray.map((button, index) => (
            <button
              key={index}
              onClick={button.handler}
              className={`bg-primary hover:bg-primary-hover text-white px-4 rounded-2xl text-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                index === buttonsArray.length - 1 ? "py-7" : "py-5"
              }`}
            >
              <p className="font-avenir">{button.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReminderWidget() {
  const router = useRouter();
  const props: DashboardWidgetProps = {
    name: "Reminders",
    iconPath: "/icons/reminder.svg",
    pageRoute: "/reminders",
    buttons: [
      { name: "Open Dashboard →", handler: () => router.push("/reminders") },
      { name: "Set New Reminder", handler: () => console.log("Tried to send message") },
    ],
  };
  return (
    <div>
      <SimpleDashboardWidget {...props}></SimpleDashboardWidget>
    </div>
  );
}

export function VolunteerWidget() {
  const router = useRouter();
  const props: DashboardWidgetProps = {
    name: "Volunteers",
    iconPath: "/icons/people.svg",
    pageRoute: "/volunteers",
    buttons: [
      { name: "Open Dashboard →", handler: () => router.push("/volunteers") },
      { name: "Send Message", handler: () => console.log("Tried to send message") },
    ],
  };
  return (
    <div>
      <SimpleDashboardWidget {...props}></SimpleDashboardWidget>
    </div>
  );
}
