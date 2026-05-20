import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";

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
      onClick={(event) => {
        onRead(timestamp);
        () => setRead(true);
      }}
      className={`w-auto h-[75px] pt-3 pl-4 pb-3 pr-4 rounded-lg gap-1 bg-success-bg mt-2.5 mb-0 border-col`}
    >
      <div className="flex flex-row items-center">
        <p className="text-sm font-medium">{timestamp}</p>
        <button
          className="ml-auto font-medium text-sm font-avenir p-0.5 cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(timestamp, event);
          }}
        >
          X
        </button>
      </div>
      <div className="flex flex-row items-center mt-2">
        <Image src="/small_bell.png" width={24} height={25} alt="A small notification bell"></Image>
        <p className="ml-1.5 truncate">{notificationText}</p>
      </div>
    </div>
  );
}
