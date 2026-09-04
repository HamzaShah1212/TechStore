import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  await ensureSchema();
  const result = await db().execute("SELECT id, name, email, subject, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const { name, email, subject = "", message } = await request.json();
  if (!name || !email || !message) return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
  await ensureSchema();
  const result = await db().execute({ sql: "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)", args: [name, email, subject, message] });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}
