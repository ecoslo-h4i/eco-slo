export default function Dash() {
  return (
    <div className="flex min-h-screen bg-[#FBF7EE]">
      <aside className="w-[140px] bg-[#758656] shrink0"></aside>
      <main className="flex-1 p-7">
        <header className="flex items-center justify-between pt-5">
          <h1 className="flex-1 text-[56px] font-[Constantia] font-semibold leading-none">Welcome Back, User</h1>
          <div className="flex items-center gap-4">
            <div className="bell"></div>
            <div className="notepad"></div>
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
