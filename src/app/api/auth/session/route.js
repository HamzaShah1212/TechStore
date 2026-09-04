import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(request) {
  return NextResponse.json({ admin: await requireAdmin(request) });
}
