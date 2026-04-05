"use client";

type Tree = {
  id: number;
  latitude: number;
  longitude: number;
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
    <aside className="absolute right-0 top-0 z-[3000] flex h-full w-[400px] flex-col bg-[#FFFCF5] px-8 py-10">
      <div className="mb-10 font-Constantia">
        <h2 className="text-[28px] leading-none text-black">EcoSLO [{tree.id}]</h2>
      </div>
      <div className="space-y-10">
        <div>
          <p className="mb-1 text-[14px] font-semibold text-black underline underline-offset-4">Status</p>
          <p className="text-[18px] text-black">{tree.status}</p>
          <p className="text-[14px] mt-1 text-black/70 font-semibold">{tree.date_planted}</p>
        </div>
        <div>
          <p className="mb-1 text-[14px] font-semibold text-black underline underline-offset-4">Species</p>
          <p className="text-[18px] text-black">{tree.species_name}</p>
          <p className="text-[14px] mt-1 text-black/70 font-semibold">{tree.common_name}</p>
        </div>
        <div>
          <p className="mb-1 text-[14px] font-semibold text-black underline underline-offset-4">Location</p>
          <p className="text-[18px] text-black">{tree.address}</p>
          <p className="text-[14px] mt-1 text-black/70 font-semibold">
            {tree.latitude}, {tree.longitude}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[14px] font-semibold text-black underline underline-offset-4">Public/Private</p>
          <p className="text-[18px] text-black">{tree.is_public ? "Public" : "Private"}</p>
        </div>
        <div>
          <p className="mb-1 text-[14px] font-semibold text-black underline underline-offset-4">Notes</p>
          <p className="text-[18px] text-black">{tree.notes}</p>
        </div>
      </div>
      <div className="mt-8 border-t border-[#F5EADD] pt-6">
        <button
          type="button"
          className="flex items-center justify-center gap-3 rounded-full bg-[#758656] px-6 py-2 text-white"
        >
          <img src="/icons/report.svg" alt="" className="h-5 w-5" />
          <span>Report an Issue</span>
        </button>
      </div>
    </aside>
  );
}
