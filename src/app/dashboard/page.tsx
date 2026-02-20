export default function Dash() {
  return (
    //the whole page div//
    <div className="flex flex-grow bg-[#FBF7EE]">
      {/*main*/}
      <main className="flex-1">
        <div className="px-6 py-10">
          {/*header*/}
          <header className="flex items-center justify-between pt-5">
            <h1 className="flex-1 text-[56px] font-[Constantia] font-semibold leading-none">Welcome Back, User</h1>
            {/*icons*/}
            <div className="flex items-center gap-4">
              {/*bell*/}
              <button
                type="button"
                className={`w-[81px] h-[81px] rounded-full flex items-center justify-center 
                      bg-[#758656] 
                      transition-all duration-200 ease-out 
                      hover:bg-[#6A7B4F] cursor-pointer`}
                aria-label="Notifications"
              >
                <img src="/assets/icons/bell.svg" alt="" />
              </button>
              {/*notes*/}
              <button
                type="button"
                className={`w-[81px] h-[81px] rounded-full flex items-center justify-center 
                      bg-[#758656] 
                      transition-all duration-200 ease-out 
                      hover:bg-[#6A7B4F] cursor-pointer`}
                aria-label="Notes"
              >
                <img src="/assets/icons/notepad.svg" alt="" />
              </button>
            </div>
          </header>
          {/*widgets*/}
          <div className="mt-10 grid grid-cols-[2fr_1fr_1fr] gap-8">
            {/*notifications*/}
            <div className="h-[366px] rounded-3xl border-2 border-[#CDAA7F] bg-[#EEE0CF]"></div>
            {/*volunteers*/}
            <div className="h-[366px] rounded-3xl border-2 border-[#CDAA7F] bg-[#EEE0CF]"></div>
            {/*reminders*/}
            <div className="h-[366px] rounded-3xl border-2 border-[#CDAA7F] bg-[#EEE0CF]"></div>
          </div>
          {/*trees*/}
          <div className="mt-8 rounded-3xl border-2 border-[#CDAA7F] h-[400px] bg-[#EEE0CF]"></div>
        </div>
      </main>
    </div>
  );
}
