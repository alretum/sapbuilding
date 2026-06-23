import { peerStoriesFor } from "@/lib/peer-stories";

// Decision-maker peer proof: real-voice quotes from same-industry companies that
// already migrated. (Content is illustrative — see src/lib/peer-stories.ts.)
export function PeerStories({ industry, limit }: { industry?: string | null; limit?: number }) {
  const stories = peerStoriesFor(industry, limit);
  if (stories.length === 0) return null;

  return (
    <div className="card p-5">
      <p className="font-display font-bold">🗣️ From peers who&apos;ve already moved</p>
      <div className="mt-3 space-y-3">
        {stories.map((s, i) => (
          <blockquote key={i} className="border-l-2 border-brand/30 pl-3">
            <p className="text-sm italic text-ink/75">“{s.quote}”</p>
            <p className="mt-1 text-xs text-ink/50">
              — {s.role}, {s.company} · <span className="font-semibold text-ink/60">{s.outcome}</span> ({s.year})
            </p>
          </blockquote>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink/40">
        Illustrative — real, attributed SAP customer references available on request.
      </p>
    </div>
  );
}
