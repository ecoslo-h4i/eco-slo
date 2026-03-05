"use client";
import NotificationsPopout from "@/components/notifications/NotificationsPopout";

import { Notification } from "@/components/notifications/NotificationsPopout";
import { useState } from "react";
import NotificationWidget from "@/components/notifications/NotificationWidget";
import TreeDashboardWidget from "@/components/TreeDashboardWidget";
import { ReminderWidget, VolunteerWidget } from "@/components/SimpleDashboardWidget";

// TODO: This is just for testing/development, remove once backend integration is finished
function createNotificationList() {
  let list: Notification[] = [];
  for (let i = 0; i < 50; i++) {
    list[i] = { notificationText: "notification" + i, timestamp: i + "m", read: i % 2 == 1 ? true : false };
  }
  return list;
}

export default function Dash() {
  const [notifPopout, setNotifPopout] = useState(false);
  return (
    //the whole page div//
    <div className="flex flex-grow bg-[#FBF7EE]">
      <div className="fixed top-3 right-3 h-auto w-auto">
        <NotificationsPopout notificationList={createNotificationList()} trigger={notifPopout}></NotificationsPopout>
      </div>
      {/*main*/}
      <main className="flex-1" onClick={() => setNotifPopout(false)}>
        <div className="px-6 py-10">
          {/*header*/}
          <header className="flex items-center justify-between pt-5">
            <h1 className="flex-1 text-[56px] font-[Constantia] font-semibold leading-none">Welcome Back, User</h1>
            {/*icons*/}
            <div className="flex items-center gap-4">
              {/*bell*/}
              <button
                type="button"
                className={`w-[81px] h-[81px] rounded-full flex items-center justify-center 
                      bg-[#758656] 
                      transition-all duration-200 ease-out 
                      hover:bg-[#6A7B4F] cursor-pointer`}
                aria-label="Notifications"
                onClick={(event) => {
                  event.stopPropagation();
                  setNotifPopout(true);
                }}
              >
                <img src="/assets/icons/bell.svg" alt="" />
              </button>
              {/*notes*/}
              <button
                type="button"
                className={`w-[81px] h-[81px] rounded-full flex items-center justify-center 
                      bg-[#758656] 
                      transition-all duration-200 ease-out 
                      hover:bg-[#6A7B4F] cursor-pointer`}
                aria-label="Notes"
              >
                <img src="/assets/icons/notepad.svg" alt="" />
              </button>
            </div>
          </header>
          {/*widgets*/}
          <div className="mt-10 grid grid-cols-[2fr_1fr_1fr] gap-8">
            {/*notifications*/}
            <NotificationWidget
              onViewAll={(event) => {
                event.stopPropagation();
                setNotifPopout(true);
              }}
            ></NotificationWidget>
            {/*volunteers*/}
            <div className="h-[366px] rounded-3xl border-2 border-black bg-[#EEE0CF]">
              <VolunteerWidget></VolunteerWidget>
            </div>
            {/*reminders*/}
            <div className="h-[366px] rounded-3xl border-2 border-black bg-[#EEE0CF]">
              <ReminderWidget></ReminderWidget>
            </div>
          </div>
          {/*trees*/}
          <TreeDashboardWidget className="mt-8 rounded-3xl border-2 border-[#CDAA7F] bg-[#EEE0CF]" />
        </div>
      </main>
    </div>
  );
}
