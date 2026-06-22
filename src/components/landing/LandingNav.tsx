"use client";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span>🚀</span>
          <span className="hidden sm:inline">Cloud Readiness Challenge</span>
          <span className="sm:hidden">Readiness</span>
        </a>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <a href="/landing" className="hidden rounded-full px-3 py-2 text-ink/60 hover:text-ink sm:inline">
            For decision-makers
          </a>
          <button onClick={() => scrollTo("join")} className="btn-primary px-4 py-2 text-sm">
            Join
          </button>
        </nav>
      </div>
    </header>
  );
}
