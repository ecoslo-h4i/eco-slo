"use client";
import { useState } from "react";
import NotificationCard from "./NotificationCard";

export type Notification = {
  notificationText: string;
  timestamp: string;
  read: boolean;
};

export type NotificationPopoutProps = {
  notificationList: Notification[];
  trigger: boolean;
};

export default function NotificationsPopout(props: NotificationPopoutProps) {
  const [notificationList, setNotificationList] = useState(props.notificationList);
  // 0 is all, 1 is unread, 2 is read
  const [readFilter, setReadFilter] = useState(0);
  return props.trigger ? (
    <div className="h-[835px] w-[457px] p-[32px]  gap-[16px] bg-[#fffcf5] filter drop-shadow-xl">
      <h1 className="text-[40px] font-serif font-medium">Notifications</h1>
      <hr className="mt-[5px] border-1"></hr>
      <div className="flex flex-row items-center mt-[15px] mb-[10px] gap-[10px]">
        <button
          onClick={() => setReadFilter(0)}
          className={`${readFilter != 0 ? "bg-[#f5eadd]" : "bg-[#756859] text-white"} flex justify-center items-center w-[80px] h-[39px] rounded-3xl p-[10px] gap-[8px] text-sm cursor-pointer`}
        >
          All
        </button>
        <button
          onClick={() => setReadFilter(1)}
          className={`${readFilter != 1 ? "bg-[#f5eadd]" : "bg-[#756859] text-white"} flex justify-center items-center w-[80px] h-[39px] rounded-3xl p-[10px] gap-[8px] text-sm cursor-pointer`}
        >
          Unread
        </button>
        <button
          onClick={() => setReadFilter(2)}
          className={`${readFilter != 2 ? "bg-[#f5eadd]" : "bg-[#756859] text-white"} flex justify-center items-center w-[80px] h-[39px] rounded-3xl p-[10px] gap-[8px] text-sm cursor-pointer`}
        >
          Read
        </button>
      </div>
      <div className="flex flex-col justify-items-center h-[605px]">
        {mapNotifications(
          readFilter,
          notificationList,
          (timestamp) =>
            setNotificationList(notificationList.filter((notification) => notification.timestamp != timestamp)),
          (timestamp) =>
            setNotificationList(
              notificationList.map((notification) =>
                notification.timestamp == timestamp
                  ? { notificationText: notification.notificationText, timestamp: notification.timestamp, read: true }
                  : notification,
              ),
            ),
        )}
      </div>
    </div>
  ) : (
    ""
  );
}

function mapNotifications(
  read: Number,
  notificationList: Notification[],
  onDelete: (timestamp: string) => void,
  onRead: (timestamp: string) => void,
) {
  return (
    <div className="overflow-y-scroll no-scrollbar">
      {(read == 0
        ? notificationList
        : notificationList.filter((notification) => notification.read == (read == 1 ? false : true))
      ).map((notification) => (
        <NotificationCard
          notificationText={notification.notificationText}
          timestamp={notification.timestamp}
          readProp={notification.read}
          key={notification.timestamp}
          onDelete={onDelete}
          onRead={onRead}
        ></NotificationCard>
      ))}
    </div>
  );
}
