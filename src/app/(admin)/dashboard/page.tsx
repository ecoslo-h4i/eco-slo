"use client";
import NotificationsPopout from "@/components/notifications/NotificationsPopout";

import { Notification } from "@/components/notifications/NotificationsPopout";
import { useState } from "react";
import NotificationWidget from "@/components/notifications/NotificationWidget";
import TreeDashboardWidget from "@/components/TreeDashboardWidget";
import { ReminderWidget, VolunteerWidget } from "@/components/SimpleDashboardWidget";
import { useCurrentMember } from "@/hooks/useCurrentProvider";
import { Bell, NotebookPen } from "lucide-react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AppButton } from "@/components/ui/form-controls";

// TODO: This is just for testing/development, remove once backend integration is finished
function createNotificationList() {
  const list: Notification[] = [];
  for (let i = 0; i < 50; i++) {
    list[i] = { notificationText: "notification" + i, timestamp: i + "m", read: i % 2 == 1 ? true : false };
  }
  return list;
}

export default function Dash() {
  const [notifPopout, setNotifPopout] = useState(false);
  const { member } = useCurrentMember();
  return (
    <AdminPageShell
      title={`Welcome Back, ${member?.firstname ?? ""}`}
      onClick={() => setNotifPopout(false)}
      beforeContent={
        <div className="fixed top-3 -right-100 h-auto w-auto z-30">
          <NotificationsPopout notificationList={createNotificationList()} trigger={notifPopout}></NotificationsPopout>
        </div>
      }
      actions={
        <>
          <AppButton
            icon={<Bell aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2} />}
            iconOnly
            aria-label="Notifications"
            onClick={(event) => {
              event.stopPropagation();
              setNotifPopout(true);
            }}
          >
            Notifications
          </AppButton>
          <AppButton
            icon={<NotebookPen aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2} />}
            iconOnly
            aria-label="Notes"
          >
            Notes
          </AppButton>
        </>
      }
    >
      {/*widgets*/}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-8">
        {/*notifications*/}
        <NotificationWidget
          onViewAll={(event) => {
            event.stopPropagation();
            setNotifPopout(true);
          }}
        ></NotificationWidget>
        {/*volunteers*/}
        <div className="h-[366px] rounded-3xl border border-border bg-muted-card-bg">
          <VolunteerWidget></VolunteerWidget>
        </div>
        {/*reminders*/}
        <div className="h-[366px] rounded-3xl border border-border bg-muted-card-bg">
          <ReminderWidget></ReminderWidget>
        </div>
      </div>
      {/*trees*/}
      <TreeDashboardWidget className="rounded-3xl border border-border bg-muted-card-bg" />
    </AdminPageShell>
  );
}
