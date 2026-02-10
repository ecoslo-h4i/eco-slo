"use client";
import { useState } from "react";
import NotificationCard from "./NotificationCard";

export default function NotificationWidget() {
  const [notifAmount, setNotifAmount] = useState(100);

  return (
    <div className="w-[460px] h-[366px] p-[32px] border-2 rounded-3xl gap-[16px] bg-[#F5EADD] border-[#756859]">
      <div className="flex flex-row items-center mb-[5px]">
        <span className="font-bold inline-block border-b-2 border-black pb-1.5">
          {notifAmount > 99 ? "99+" : notifAmount} new
        </span>
        <button className="flex justify-center items-center ml-auto bg-[#756859] p-[10px] rounded-lg gap-[8px] w-[132px] h-[42px]">
          <p className="text-white">View All →</p>
        </button>
      </div>
      <div className="flex flex-col justify-items-center w-357px;">
        <NotificationCard timestamp="7m" notificationText="Notification Text goes here"></NotificationCard>
        <NotificationCard
          timestamp="7m"
          notificationText="NotificatieNotificatiNotificatiNotificatiNotificatiNotificatiNotificati"
        ></NotificationCard>
        <NotificationCard timestamp="7m" notificationText="Notification Text goes here"></NotificationCard>
      </div>
    </div>
  );
}
