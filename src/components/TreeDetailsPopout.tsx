"use client";
import { useState } from "react";

export type TreeSchema = {
  address: string;
  adopter_email: string;
  adopter_name: string;
  adopter_phone: string;
  common_name: string;
  created_at: string;
  date_planted: string;
  ecoslo_num: number;
  funder: string;
  id: number;
  is_public: boolean;
  latitude: number;
  longitude: number;
  next_mulching_date: string | null;
  notes: string | null;
  species_name: string;
  status: string;
  weekly_watering_status: string | null;
};

type treeDetailsPopoutProps = {
  tree?: TreeSchema;
  admin: boolean;
};

type BasicInfoWidgetProps = {
  header: string;
  body: { title: string; info: string }[];
};

export default function TreeDetailsPopout(props: treeDetailsPopoutProps) {
  if (!props.tree) {
    return <div></div>;
  }
  const tree = props.tree;
  const basicInformation = [
    { title: "Species:", info: tree.species_name },
    { title: "Common Name:", info: tree.common_name },
    { title: "Funder:", info: tree.funder },
    { title: "Date Planted:", info: tree.date_planted },
  ];
  const location = [
    { title: "Address:", info: tree.address },
    { title: "Coordinates:", info: tree.latitude + ", " + tree.longitude },
  ];
  const treeKeeperInfo = [
    { title: "Name:", info: tree.adopter_name },
    { title: "Phone:", info: tree.adopter_phone },
    { title: "Email:", info: tree.adopter_phone },
  ];
  const maintenance = [
    { title: "Weekly Watering:", info: tree.weekly_watering_status },
    { title: "Next Mulching", info: tree.next_mulching_date },
  ];
  return (
    <div className="flex flex-col items-center h-auto w-[410px] p-[32px] pb-[0px] rounded-2xl rounded-r-none bg-[#fffcf5] drop-shadow-xl transition-transform duration-500 -translate-x-103">
      {/* Header */}
      <div className="flex flex-col items-center">
        <h1 className="text-[32px] font-serif">#{tree.ecoslo_num} Tree Details</h1>
        <div className="flex flex-row gap-[10px]">
          <div className="flex flex-row p-[2px] pr-[10px] pl-[10px] gap-[3px] bg-[#ffd8d8] rounded-2xl w-[150px]">
            <img src="/exclamation-mark.svg"></img>
            <p className="text-sm font-semibold text-[#be4747]">Issue Reported</p>
          </div>
          <div className="p-[2px] pr-[10px] pl-[10px] bg-[#d7e6bd] text-[#7b8c5d] rounded-2xl text-sm font-semibold">
            {tree.status}
          </div>
          <div className="p-[2px] pr-[10px] pl-[10px] bg-[#d7e6bd] text-[#7b8c5d] rounded-2xl text-sm font-semibold">
            {tree.is_public ? "Public" : "Private"}
          </div>
        </div>
      </div>
      {/* Body Container */}
      <div className="flex flex-col items-start justify-items-center gap-[20px] m-[16px] h-[773px] w-fit overflow-y-auto no-scrollbar">
        <div className="w-[364px] h-auto bg-[#F5EADD] rounded-2xl p-[16px]">
          {mapInfo("BASIC INFORMATION", basicInformation)}
        </div>
        <div className="w-[364px] h-auto bg-[#F5EADD] rounded-2xl p-[16px]">{mapInfo("LOCATION", location)}</div>
        <div className="w-[364px] h-auto bg-[#F5EADD] rounded-2xl p-[16px]">
          {mapInfo("TREEKEEPER INFO", treeKeeperInfo)}
        </div>
        <div className="w-[364px] h-auto bg-[#F5EADD] rounded-2xl p-[16px]">{mapInfo("MAINTENANCE", maintenance)}</div>
        <div className="w-[364px] h-auto bg-[#F5EADD] rounded-2xl p-[20px]">
          {mapInfo("NOTES", [{ title: tree.notes, info: "" }])}
        </div>
        {props.admin ? (
          <div className="flex flex-col items-center gap-[16px]">
            <button className="flex justify-center items-center bg-[#758656] w-[364px] h-[32px] rounded-2xl p-[10px] gap-[8px] cursor-pointer">
              <p className="text-[#FFFFFF] font-semibold">Edit Tree</p>
              <img className="w-[20px] h-[20px]" src="/white_edit.png"></img>
            </button>
            <button className="flex flex-row gap-[5px] justify-center items-center bg-[#F5EADD] w-[364px] h-[32px] rounded-2xl p-[10px] gap-[8px] cursor-pointer">
              <p className="text-[#be4747] font-semibold">Delete Tree</p>
              <img className="w-[20px] h-[20px]" src="/hugeicons_delete-02.svg"></img>
            </button>
            <button className="flex justify-center items-center bg-[#F5EADD] w-[364px] h-[32px] rounded-2xl p-[10px] gap-[8px] font-semibold cursor-pointer ">
              Mark as Off-boarded
            </button>
          </div>
        ) : (
          <></>
        )}
      </div>
      {/*Buttons Container */}
    </div>
  );
}

function mapInfo(header: string, body: { title: string | null; info: string | null }[]) {
  return (
    <div>
      <h1 className="font-semibold">{header}</h1>
      <div className="">
        {body.map((entry) => (
          <div className={`flex flex-row ${header == "NOTES" ? "" : "gap-[20px]"}`} key={entry.title}>
            <p className="">{entry.title}</p>
            <p className="ml-auto font-bold">{entry.info}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
