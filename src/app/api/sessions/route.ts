import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { generateCode } from "@/lib/code";

// Create a session (the "host" / facilitator action). Returns a join code.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const content = getContent();

  const involvedRoles =
    Array.isArray(body.involvedRoles) && body.involvedRoles.length > 0
      ? (body.involvedRoles as string[])
      : content.roles.map((r) => r.id);

  // Generate a unique join code (retry a few times on the rare collision).
  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.session.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
  }

  const session = await prisma.session.create({
    data: {
      code,
      name: typeof body.name === "string" && body.name.trim() ? body.name : "Cloud Readiness Challenge",
      involvedRoles,
      status: "active",
      startedAt: new Date(),
      strictGate: Boolean(body.strictGate),
      leaderboardPublic: body.leaderboardPublic === undefined ? true : Boolean(body.leaderboardPublic),
    },
  });

  return NextResponse.json({ id: session.id, code: session.code });
}
