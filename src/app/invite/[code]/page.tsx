import { prisma } from "@/lib/prisma";
import { Screen } from "@/components/ui";

export const dynamic = "force-dynamic";

// Standalone "simulated inbox" — the invite an employee receives to participate.
// The CTA deep-links to /join/[code] (skips the code step); the code is also
// shown so they can enter it manually at the join page. No real email is sent.
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await prisma.session.findUnique({ where: { code: code.toUpperCase() } });

  if (!session) {
    return (
      <Screen>
        <p className="py-20 text-center text-ink/50">This invite link isn&apos;t valid.</p>
      </Screen>
    );
  }

  return (
    <Screen className="max-w-xl space-y-4">
      <p className="text-center text-xs text-ink/40">
        📭 Simulated inbox — the invite an employee receives (no real email is sent)
      </p>

      <div className="card overflow-hidden p-0">
        {/* Email header */}
        <div className="flex items-center gap-3 border-b border-black/5 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-lg">🚀</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Cloud Readiness Challenge</p>
            <p className="truncate text-xs text-ink/45">to the {session.name} team · you&apos;re invited</p>
          </div>
          <p className="shrink-0 text-xs text-ink/40">now</p>
        </div>

        {/* Email body */}
        <div className="space-y-4 p-6">
          <h1 className="font-display text-xl font-bold">You&apos;re invited to your team&apos;s cloud challenge 🎉</h1>
          <p className="text-sm text-ink/75">Hi team,</p>
          <p className="text-sm text-ink/75">
            <strong>{session.name}</strong>{" "}is taking a quick, playful look at moving to SAP S/4HANA Cloud — and
            every department plays a part. It&apos;s a couple of two-minute games, and your answers help build the
            company&apos;s picture. Jump in:
          </p>
          <a href={`/join/${session.code}`} className="btn-primary inline-flex">
            Join now →
          </a>
          <div className="rounded-2xl bg-brand/5 p-4 text-center">
            <p className="text-xs text-ink/50">Prefer to type it? Your join code is</p>
            <p className="font-display text-2xl font-extrabold tracking-widest text-brand">{session.code}</p>
            <p className="mt-1 text-xs text-ink/45">Enter it at the join page.</p>
          </div>
        </div>
      </div>

      <a href={`/join/${session.code}`} className="block text-center text-xs text-ink/40 underline">
        (skip the email — go straight to joining)
      </a>
    </Screen>
  );
}
