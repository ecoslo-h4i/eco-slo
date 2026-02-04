export default function Dash() {
  return (
    <div className="flex min-h-screen bg-[#FBF7EE]">
      <aside className="w-[140px] bg-[#758656] shrink0"></aside>
      <main className="flex-1 p-7">
        <header className="flex items-center justify-between pt-5">
          <h1 className="flex-1 text-[56px] font-[Constantia] font-semibold leading-none">Welcome Back, User</h1>
          <div className="flex items-center gap-4">
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
            <button
              type="button"
              className={`w-[81px] h-[81px] rounded-full flex items-center justify-center 
                    bg-[#758656] 
                    transition-all duration-200 ease-out 
                    hover:bg-[#6A7B4F] cursor-pointer`}
              aria-label="Tasks"
            >
              <img src="/assets/icons/notepad.svg" alt="" />
            </button>
          </div>
        </header>
        <div className="notifications"></div>
        <div className="volunteers"></div>
        <div className="reminders"></div>
        <div className="trees"></div>
      </main>
    </div>
  );
}
