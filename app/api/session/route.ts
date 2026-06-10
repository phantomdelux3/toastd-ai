import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/agent";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = body.userId || `web-${crypto.randomUUID()}`;
    const sessionId = await createSession(userId);
    return NextResponse.json({ sessionId, userId });
  } catch (err: any) {
    console.error("session error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
