"use client";

import Image from "next/image";

type Member = {
  id: number;
  firstname: string;
  lastname: string;
};

type Tree = {
  id: number;
  latitude: number;
  longitude: number;
  member: Member | null;
  species_name?: string | null;
  common_name: string;
  address: string;
  status: string;
  date_planted: string;
  notes: string;
  is_public: boolean;
};

type MapPopoutProps = {
  tree: Tree | null;
  onClose: () => void;
};

export default function MapPopout({ tree, onClose }: MapPopoutProps) {
  if (!tree) return null;

  return (
    <aside className="absolute right-0 top-0 z-[3000] h-full w-[400px] overflow-y-auto flex-col bg-[#FFFCF5] px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] leading-none text-black">ECOSLO #{tree.id}</h2>
          <span className="rounded-full bg-[#EEEAE4] px-3 py-1 text-[11px] text-black/50">{tree.status}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-6 w-6 items-center justify-center text-[12px] leading-none text-black/70 cursor-pointer font-semibold transition-all duration-200 hover:text-black/60"
        >
          ✕
        </button>
      </div>
      <div className="space-y-5">
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Species</p>
          <p className="text-[14px] text-black font-semibold">{tree.species_name}</p>
          <p className="text-[12px] mt-1 text-black/70 font-semibold">{tree.common_name}</p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Location</p>
          <p className="text-[14px] text-black font-semibold">{tree.address}</p>
          <p className="text-[12px] mt-1 text-black/70 font-semibold">
            {tree.latitude}, {tree.longitude}
          </p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Tree Keeper</p>
          <p className="text-[14px] text-black font-semibold">
            {tree.member?.firstname} {tree.member?.lastname}
          </p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Visibility</p>
          <p className="text-[14px] text-black font-semibold">{tree.is_public ? "Public" : "Private"}</p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-[#EEEAE4]">
          <p className="mb-1 text-[12px] font-semibold text-black">Notes</p>
          <p className="text-[14px] text-black font-semibold">{tree.notes}</p>
        </div>
      </div>
      <div className="mt-8 border-t border-[#F5EADD] pt-6">
        <button
          type="button"
          className="w-[337px] flex items-center justify-center gap-3 rounded-full bg-[#758656] px-6 py-2 mb-4 text-white cursor-pointer transition-all duration-200 hover:bg-[#6c7d4c]"
        >
          <img src="/icons/report.svg" alt="" className="h-5 w-5" />
          <span>Report an Issue</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-[337px] flex items-center justify-center gap-3 rounded-full bg-[#EDE6DB] px-6 py-2 text-black font-semibold cursor-pointer border border-black/10 transition-all duration-200 hover:bg-[#DED6C6]"
        >
          <span>Close</span>
        </button>
      </div>
    </aside>
  );
}
