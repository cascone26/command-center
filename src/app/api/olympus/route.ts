import { NextResponse } from "next/server";

const OLYMPUS_URL = "http://100.124.234.43:7801";

export async function GET() {
  try {
    const res = await fetch(`${OLYMPUS_URL}/stats`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ ok: true, data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err), fetchedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
