// The next step the funnel exists for: turn curiosity into a booked session +
// a pre-filled brief, instead of ending in confetti.
export function BookEvoKitCTA({ code }: { code: string }) {
  return (
    <div className="card space-y-3 p-6 text-center">
      <p className="text-3xl">🎯</p>
      <h3 className="font-display text-xl font-bold">Ready for the real thing?</h3>
      <p className="mx-auto max-w-md text-sm text-ink/60">
        Turn this into a working session with an SAP expert — they&apos;ll arrive already briefed on where you stand,
        what your teams flagged, and your likely path.
      </p>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <a href={`/book/${code}`} className="btn-primary">
          📅 Book your EvoKit session →
        </a>
        <a href={`/brief/${code}`} className="btn-ghost">
          📄 See the challenge brief
        </a>
      </div>
    </div>
  );
}
