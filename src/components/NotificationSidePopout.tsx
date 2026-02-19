"use client";
import { useState } from "react";
import NotificationCard from "./NotificationCard";

export type Notification = {
  notificationText: string;
  timestamp: string;
  read: boolean;
};

export type NotificationList = {
  notificationList: Notification[];
};

export default function NotificationSidePopout(notificationListProp: NotificationList) {
  const [notificationList, setNotificationList] = useState(notificationListProp.notificationList);

  return (
    <div className="h-[832px] w-[503px] p-[32px] border-2 rounded-3xl gap-[16px] bg-[#F5EADD] border-[#756859] rounded-r-none">
      <h1 className="text-[40px] font-serif font-medium">Notifications</h1>
      <hr className="mt-[5px] border-1"></hr>
      <div className="flex flex-row items-center mt-[15px] mb-[10px] gap-[10px]">
        <button className="flex justify-center items-center w-[80px] h-[39px] rounded-3xl p-[10px] gap-[8px] bg-white text-sm font-bold">
          Unread
        </button>
        <button className="flex justify-center items-center w-[80px] h-[39px] rounded-3xl p-[10px] gap-[8px] bg-white text-sm font-bold">
          Read
        </button>
      </div>
      <div className="flex flex-col justify-items-center h-[605px]">
        {mapNotifications(true, notificationList, (timestamp) =>
          setNotificationList(notificationList.filter((notification) => notification.timestamp != timestamp)),
        )}
      </div>
    </div>
  );
}

function mapNotifications(read: boolean, notificationList: Notification[], onDelete: (timestamp: string) => void) {
  return (
    <div className="overflow-y-hidden">
      {notificationList.map((notification) => (
        <NotificationCard
          notificationText={notification.notificationText}
          timestamp={notification.timestamp}
          key={notification.timestamp}
          onDelete={onDelete}
        ></NotificationCard>
      ))}
    </div>
  );
}
