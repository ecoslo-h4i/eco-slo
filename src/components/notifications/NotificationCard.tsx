import { useState } from "react";
import { Bell, X } from "lucide-react";

export default function NotificationCard({
  timestamp,
  notificationText,
  readProp,
  onDelete,
  onRead,
}: {
  timestamp: string;
  notificationText: string;
  readProp: boolean;
  onDelete: (timestamp: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onRead: (timestamp: string) => void;
}) {
  const [read, setRead] = useState(readProp);
  return (
    <div
      onClick={() => {
        onRead(timestamp);
        setRead(true);
      }}
      className={`w-auto h-[75px] pt-3 pl-4 pb-3 pr-4 rounded-lg gap-1 mt-2.5 mb-0 border-col ${
        read ? "bg-success-bg" : "bg-off-white-2"
      }`}
    >
      <div className="flex flex-row items-center">
        <p className="text-sm font-medium">{timestamp}</p>
        <button
          className="ml-auto p-0.5 cursor-pointer text-text/70 transition-colors hover:text-text"
          aria-label="Delete notification"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(timestamp, event);
          }}
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-row items-center mt-2">
        <Bell aria-hidden="true" className="h-6 w-6 shrink-0 text-text" strokeWidth={2} />
        <p className="ml-1.5 truncate">{notificationText}</p>
      </div>
    </div>
  );
}
