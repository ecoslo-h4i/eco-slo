"use client";
import { useState } from "react";
import NotificationCard from "./NotificationCard";

export default function NotificationWidget({
  onViewAll,
}: {
  onViewAll: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [notifAmount] = useState(100);
  return (
    <div className="min-w-[460px] h-[366px] p-8 border-2 rounded-3xl gap-4 bg-muted-card-bg border-border-strong">
      <div className="flex flex-row items-center mb-1.5">
        <span className="font-bold inline-block border-b-2 border-text pb-1.5">
          {notifAmount > 99 ? "99+" : notifAmount} new
        </span>
        <button
          onClick={onViewAll}
          className="flex justify-center items-center ml-auto bg-dark-brown p-2.5 rounded-lg gap-2 w-[132px] h-[42px] cursor-pointer hover:bg-brown"
        >
          <p className="text-on-primary">View All →</p>
        </button>
      </div>
      <div className="flex flex-col justify-items-center w-357px;">
        <NotificationCard
          timestamp="7m"
          notificationText="Notification Text goes here"
          readProp={false}
          onDelete={(timestamp) => console.log(timestamp)}
          onRead={(timestamp) => console.log(timestamp)}
        ></NotificationCard>
        <NotificationCard
          timestamp="7m"
          notificationText="NotificatieNotificatiNotificatiNotificatiNotificatiNotificatiNotificati"
          readProp={false}
          onDelete={(timestamp) => console.log(timestamp)}
          onRead={(timestamp) => console.log(timestamp)}
        ></NotificationCard>
        <NotificationCard
          timestamp="7m"
          notificationText="Notification Text goes here"
          readProp={false}
          onDelete={(timestamp) => console.log(timestamp)}
          onRead={(timestamp) => console.log(timestamp)}
        ></NotificationCard>
      </div>
    </div>
  );
}
