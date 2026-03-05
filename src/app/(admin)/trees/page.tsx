import TreePageTableWidget from "@/components/TreePageTableWidget";
import ControlPanel from "@/components/ControlPanel";

export default function Trees() {
  return (
    <main className="flex-1 min-w-0 bg-[#FBF7EE]">
      <div className="px-6 py-10">
        {/* header */}
        <header className="flex items-center justify-between pt-5">
          <h1 className="flex-1 text-[56px] font-[Constantia] font-semibold leading-none">Tree</h1>
        </header>
        {/* control panel placeholder */}
        <div className="mt-10 rounded-3xl border-2 border-[#CDAA7F] bg-[#EEE0CF] p-3">
          <ControlPanel />
        </div>
        {/* trees table placeholder */}
        <TreePageTableWidget className="mt-8 w-full max-w-full" />
      </div>
    </main>
  );
}
