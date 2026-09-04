import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, ensureSchema } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  await ensureSchema();
  const result = await db().execute("SELECT id, username, email, role, address, created_at FROM users ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { username, email, password, role = "customer", address = "" } = await request.json();
  if (!username || !email || !password) return NextResponse.json({ error: "username, email and password are required" }, { status: 400 });
  await ensureSchema();
  const hash = await bcrypt.hash(password, 12);
  const result = await db().execute({ sql: "INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, ?, ?)", args: [username, email, hash, role, address] });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}
