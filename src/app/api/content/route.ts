import { NextResponse } from "next/server";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

// Client components fetch the content (roles + actions) from here.
export async function GET() {
  return NextResponse.json(getContent());
}
