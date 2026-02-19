"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ControlSearchProps {
  searchDelay: number;
  searchFunction: () => void;
}

function ControlSearch(props: ControlSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      props.searchFunction();
    }, props.searchDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, props.searchDelay, props.searchFunction, props]);

  const handleChange = (e: any) => {
    const next = e.target.value;
    setQuery(next);
  };

  return (
    <div className="w-154 h-10.75 rounded-xl outline-1 outline-black bg-[#FFFCF5]">
      <input
        type="text"
        id="query"
        placeholder="Search by Tree #, Species, etc..."
        value={query}
        onChange={handleChange}
        className="w-full px-3 py-2 text-black placeholder:text-black outline-none bg-transparent"
      />
    </div>
  );
}

interface ControlButtonInterface {
  backgroundHex: string;
  hoverHex: string;
  textHex: string;
  text: string;
  iconPath?: string;
  function: () => void;
}

function ControlButton(props: ControlButtonInterface) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="w-30.25 h-8.5 rounded-full outline-1 outline-black cursor-pointer select-none flex items-center justify-center px-4 gap-2"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => props.function()}
      style={{
        backgroundColor: hovering ? props.hoverHex : props.backgroundHex,
        color: props.textHex,
        containerType: "inline-size",
      }}
    >
      {" "}
      <p className="font-medium text-8xl whitespace-nowrap" style={{ fontSize: "clamp(0.5rem, 20cqw, 1rem)" }}>
        {props.text}
      </p>
      {props.iconPath && <Image src={props.iconPath} width={20} height={20} alt="" />}
    </div>
  );
}

interface ControlFilterInterface {
  text: string;
  isInitializedActive: boolean;
  dropDown: string[];
}

function ControlFilter(props: ControlFilterInterface) {
  return <div></div>;
}

export default function ControlPanel() {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-4 px-10 py-8 w-275 h-43 rounded-[40px] bg-[#F1E6D9]">
        <div className="flex justify-between items-start">
          <div className="w-[60%]">
            <ControlSearch searchDelay={500} searchFunction={() => console.log("Searching function called")} />
          </div>

          <div className="grid grid-cols-2 gap-3 py-4 pr-4">
            <ControlButton
              backgroundHex="#D08033"
              hoverHex="#D08033"
              textHex="#FFFFFF"
              text="Edit"
              iconPath="/icons/penciledit.svg"
              function={() => console.log("Edit function called")}
            />
            <ControlButton
              backgroundHex="#E83229"
              hoverHex="#E83229"
              textHex="#FFFFFF"
              text="Delete"
              iconPath="/icons/trash.svg"
              function={() => console.log("Delete function called")}
            />
            <ControlButton
              backgroundHex="#FFFFFF"
              hoverHex="#FFFFFF"
              textHex="#000000"
              text="Export CSV"
              function={() => console.log("Export function called")}
            />
            <ControlButton
              backgroundHex="#8A9573"
              hoverHex="#8A9573"
              textHex="#FFFFFF"
              text="Add Tree"
              iconPath="/icons/plus.svg"
              function={() => console.log("Add function called")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
