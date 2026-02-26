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
      className="w-30.25 h-8.5 rounded-full outline-1 outline-black cursor-pointer select-none flex items-center justify-center px-4 gap-2 bg-[#FFFCF5]"
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

interface ControlFilterDropdownInterface {
  text: string;
  dropDown: string[];
  delay: number;
  delayFunction: (filter: string) => void;
}

function ControlFilterDropdown(props: ControlFilterDropdownInterface) {
  const [activeIndex, setAciveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      props.delayFunction(props.dropDown[activeIndex]);
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeIndex, countdown, props]);

  return (
    <div className="flex flex-col relative select-none">
      <h2>{props.text}</h2>
      <div className={`h-8 w-22 rounded-full pt-2 cursor-pointer bg-[#FFFCF5]`} onMouseDown={() => setIsOpen(!isOpen)}>
        <div>
          <p className="font-medium flex items-center justify-between gap-1 pl-4 pb-4 pr-4">
            {props.dropDown[activeIndex]}
            <Image src={"/icons/dropdown.svg"} width={20} height={20} alt="" />
          </p>
        </div>
      </div>

      {isOpen && (
        <div className="absolute mt-1 bg-white rounded-xl z-10">
          {props.dropDown.map((item, index) => (
            <div
              key={index}
              className="p-2 cursor-pointer hover:bg-gray-100 font-medium rounded-lg"
              onClick={() => {
                setAciveIndex(index);
                setIsOpen(false);
                setCountdown(props.delay);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ControlPanel() {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col justify-center px-10 py-8 w-275 h-43 rounded-[40px] bg-[#F1E6D9]">
        <div className="flex justify-between items-center w-full gap-10">
          <div className="flex flex-col gap-6 w-full">
            <div className="w-full">
              <ControlSearch searchDelay={500} searchFunction={() => console.log("Searching function called")} />
            </div>

            <div className="flex gap-12">
              <ControlFilterDropdown
                text="Condition"
                dropDown={["All", "Public", "Private"]}
                delay={500}
                delayFunction={(filter: string) => console.log(`${filter} on`)}
              ></ControlFilterDropdown>
              <ControlFilterDropdown
                text="Visibility"
                dropDown={["All", "Good", "Fair", "Poor"]}
                delay={500}
                delayFunction={(filter: string) => console.log(`${filter} on`)}
              ></ControlFilterDropdown>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0">
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
