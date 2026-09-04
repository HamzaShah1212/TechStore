import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../../lib/db";

export async function GET() {
  await ensureSchema();
  const result = await db().execute("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}
