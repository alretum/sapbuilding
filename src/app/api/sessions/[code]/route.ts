import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Delete a challenge (and, by cascade, its players + completions). Admin-gated,
// and requires the caller to confirm the exact company name as a safety check.
export async function DELETE(req: Request, { params }: { params: { code: string } }) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code } = await params; // Promise on Next 15, plain object on Next 14
  const session = await prisma.session.findUnique({ where: { code: code.toUpperCase() } });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  const confirm = typeof body.confirm === "string" ? body.confirm.trim() : "";
  if (confirm.toLowerCase() !== session.name.trim().toLowerCase()) {
    return NextResponse.json({ error: "Company name does not match" }, { status: 400 });
  }

  await prisma.session.delete({ where: { id: session.id } });
  return NextResponse.json({ ok: true });
}
