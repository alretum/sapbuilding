import { prisma } from "@/lib/prisma";
import { Screen } from "@/components/ui";

export const dynamic = "force-dynamic";

// A standalone "simulated inbox" — the email the decision-maker would receive.
// The presenter opens this, then clicks through to /welcome/[token]. No real
// email is ever sent.
export default async function EmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await prisma.session.findUnique({ where: { profileToken: token } });

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
        📭 Simulated inbox — this is what your decision-maker receives (no real email is sent)
      </p>

      <div className="card overflow-hidden p-0">
        {/* Email header */}
        <div className="flex items-center gap-3 border-b border-black/5 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand font-display font-bold text-white">
            S
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">SAP Cloud Readiness</p>
            <p className="truncate text-xs text-ink/45">to {session.name} · your cloud path</p>
          </div>
          <p className="shrink-0 text-xs text-ink/40">now</p>
        </div>

        {/* Email body */}
        <div className="space-y-4 p-6">
          <h1 className="font-display text-xl font-bold">Your cloud-readiness starter is ready 🚀</h1>
          <p className="text-sm text-ink/75">Hi {session.name} team,</p>
          <p className="text-sm text-ink/75">
            We&apos;ve put together a personalized read on your move to SAP S/4HANA Cloud — based on what we already know
            about you. We&apos;ve pre-filled the details; you just confirm or tweak them, and you&apos;ll see your likely
            path, the AI you&apos;d unlock, your timeline, and how peers like you decided.
          </p>
          <p className="text-sm text-ink/75">About a minute, and no commitment.</p>
          <a href={`/welcome/${token}`} className="btn-primary inline-flex">
            Confirm your profile &amp; see your path →
          </a>
          <p className="text-xs text-ink/40">Sent by your SAP contact via the Cloud Readiness Challenge.</p>
        </div>
      </div>

      <a href={`/welcome/${token}`} className="block text-center text-xs text-ink/40 underline">
        (skip the email — open the page directly)
      </a>
    </Screen>
  );
}
