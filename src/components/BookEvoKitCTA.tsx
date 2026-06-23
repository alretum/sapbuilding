// The next step the funnel exists for: turn curiosity into a booked session +
// a pre-filled brief, instead of ending in confetti.
export function BookEvoKitCTA({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#161a3e] p-8 text-center text-white shadow-pop rounded-xl2 border border-[#6d5df6]/30 ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#6d5df6]/15 blur-2xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-[#ffb23e]/10 blur-2xl pointer-events-none" />
      
      <div className="relative space-y-4">
        <p className="text-3xl animate-bounce">🎯</p>
        <h3 className="font-display text-xl font-bold text-white">Ready for the real thing?</h3>
        <p className="mx-auto max-w-md text-sm text-white/85">
          Turn this into a working session with an SAP expert — they&apos;ll arrive already briefed on where you stand,
          what your teams flagged, and your likely path.
        </p>
        <div className="pt-2">
          <a href={`/brief/${code}`} className="inline-block rounded-2xl bg-[#6d5df6] hover:bg-[#5546d6] px-6 py-3 text-sm font-bold text-white hover:scale-105 active:scale-95 transition shadow-sm">
            📄 See the challenge brief
          </a>
        </div>
      </div>
    </div>
  );
}
