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
    <div className="h-10.75 rounded-xl outline-1 outline-black bg-[#FFFCF5]">
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
      <p className="font-medium text-8xl whitespace-nowrap" style={{ fontSize: "clamp(0.5rem, 20cqw, 1rem)" }}>
        {props.text}
      </p>
      {props.iconPath && <Image src={props.iconPath} width={16} height={16} alt="" />}
    </div>
  );
}

interface ControlStatusPillsInterface {
  text: string;
  options: string[];
  delay: number;
  delayFunction: (status: string) => void;
  activeBackgroundHex: string;
  activeTextHex: string;
}

function ControlStatusPills(props: ControlStatusPillsInterface) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || pendingIndex === null) return;

    if (countdown <= 0) {
      props.delayFunction(props.options[pendingIndex]);
      setCountdown(null);
      setPendingIndex(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, pendingIndex, props]);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    setPendingIndex(index);
    setCountdown(props.delay);
  };

  return (
    <div className="flex flex-col gap-1 select-none">
      <h2 className="text-sm font-medium text-black">{props.text}</h2>
      <div className="flex gap-2">
        {props.options.map((option, index) => (
          <div
            key={index}
            className="h-8 rounded-xl cursor-pointer outline-1 outline-black flex items-center justify-center px-4 transition-colors"
            onClick={() => handleSelect(index)}
            style={{
              backgroundColor: index === activeIndex ? props.activeBackgroundHex : "#FFFCF5",
              color: index === activeIndex ? props.activeTextHex : "#000000",
            }}
          >
            <p className="font-medium text-sm whitespace-nowrap">{option}</p>
          </div>
        ))}
      </div>
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
  const [activeIndex, setActiveIndex] = useState(0);
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
    <div className="flex flex-col gap-1 relative select-none">
      <h2 className="text-sm font-medium text-black">{props.text}</h2>
      <div
        className="h-8 min-w-20 rounded-full cursor-pointer bg-[#FFFCF5] outline-1 outline-black"
        onMouseDown={() => setIsOpen(!isOpen)}
      >
        <p className="font-medium flex items-center justify-between gap-2 px-3 h-full text-sm">
          {props.dropDown[activeIndex]}
          <Image
            src="/icons/dropdown.svg"
            width={14}
            height={14}
            alt=""
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </p>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 bg-white rounded-xl z-10 shadow-md outline-1 outline-black/10 min-w-full overflow-hidden">
          {props.dropDown.map((item, index) => (
            <div
              key={index}
              className={`px-3 py-2 cursor-pointer text-sm font-medium hover:bg-[#F1E6D9] transition-colors ${
                index === activeIndex ? "bg-[#F1E6D9]" : ""
              }`}
              onClick={() => {
                setActiveIndex(index);
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
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full">
              <ControlSearch searchDelay={500} searchFunction={() => console.log("Searching function called")} />
            </div>

            <div className="flex gap-6 items-start">
              <ControlStatusPills
                text="Status"
                options={["All", "Active", "Graduated"]}
                delay={500}
                delayFunction={(status: string) => console.log(`Status: ${status}`)}
                activeBackgroundHex="#78855b"
                activeTextHex="#FFFFFF"
              />
              <ControlFilterDropdown
                text="Condition"
                dropDown={["All", "Good", "Fair", "Poor"]}
                delay={500}
                delayFunction={(filter: string) => console.log(`Condition: ${filter}`)}
              />
              <ControlFilterDropdown
                text="Visibility"
                dropDown={["All", "Public", "Private"]}
                delay={500}
                delayFunction={(filter: string) => console.log(`Visibility: ${filter}`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0">
            <ControlButton
              backgroundHex="#D08033"
              hoverHex="#C07028"
              textHex="#FFFFFF"
              text="Edit"
              iconPath="/icons/penciledit.svg"
              function={() => console.log("Edit function called")}
            />
            <ControlButton
              backgroundHex="#E83229"
              hoverHex="#D02820"
              textHex="#FFFFFF"
              text="Delete"
              iconPath="/icons/trash.svg"
              function={() => console.log("Delete function called")}
            />
            <ControlButton
              backgroundHex="#FFFFFF"
              hoverHex="#F5F5F5"
              textHex="#000000"
              text="Export CSV"
              function={() => console.log("Export function called")}
            />
            <ControlButton
              backgroundHex="#8A9573"
              hoverHex="#7A8563"
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
