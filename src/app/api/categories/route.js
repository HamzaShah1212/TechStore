import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export async function GET() { await ensureSchema(); const result = await db().execute("SELECT * FROM categories ORDER BY name"); return NextResponse.json(result.rows); }
export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { name, description = "" } = await request.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  await ensureSchema();
  const result = await db().execute({ sql: "INSERT INTO categories (name, description) VALUES (?, ?)", args: [name, description] });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PUT(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id, name, description = "" } = await request.json();
  if (!id || !name) return NextResponse.json({ error: "Category fields are required" }, { status: 400 });
  await ensureSchema();
  await db().execute({ sql: "UPDATE categories SET name = ?, description = ? WHERE id = ?", args: [name, description, Number(id)] });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Category id is required" }, { status: 400 });
  await ensureSchema();
  await db().execute({ sql: "DELETE FROM categories WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ ok: true });
}
