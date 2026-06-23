import { BriefView } from "@/components/BriefView";

export const dynamic = "force-dynamic";

// The brief is generated on demand (AI synthesis over the evidence pack, with a
// deterministic fallback) and fetched client-side so we can show an "assembling"
// state — all the work happens server-side in /api/sessions/[code]/brief.
export default async function BriefPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BriefView code={code} />;
}
