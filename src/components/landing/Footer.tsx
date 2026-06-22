export function Footer() {
  return (
    <footer className="border-t border-white/50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 text-sm text-ink/50 sm:flex-row">
        <p className="flex items-center gap-2 font-display font-bold text-ink/70">
          <span>🚀</span> Cloud Readiness Challenge
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <a href="/landing" className="hover:text-ink">
            For decision-makers
          </a>
          <a href="/leaderboard" className="hover:text-ink">
            Leaderboard
          </a>
          <a href="/map" className="hover:text-ink">
            Map
          </a>
        </nav>
        <p className="text-xs text-ink/40">A friendly first step toward SAP S/4HANA Cloud.</p>
      </div>
    </footer>
  );
}
