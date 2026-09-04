import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export async function GET() {
  await ensureSchema();
  const result = await db().execute("SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.created_at DESC");
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { title, description = "", price, stock = 0, category_id, category, image_url = "" } = await request.json();
  if (!title || price == null || (!category_id && !category)) return NextResponse.json({ error: "title, price and category are required" }, { status: 400 });
  await ensureSchema();
  let resolvedCategoryId = category_id;
  if (!resolvedCategoryId) { await db().execute({ sql: "INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING", args: [category] }); const categoryResult = await db().execute({ sql: "SELECT id FROM categories WHERE name = ?", args: [category] }); resolvedCategoryId = categoryResult.rows[0].id; }
  const result = await db().execute({ sql: "INSERT INTO products (title, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)", args: [title, description, Number(price), Number(stock), Number(resolvedCategoryId), image_url] });
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PUT(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id, title, description = "", price, stock, category_id, image_url = "" } = await request.json();
  if (!id || !title || price == null || stock == null || !category_id) return NextResponse.json({ error: "Product fields are required" }, { status: 400 });
  await ensureSchema();
  await db().execute({ sql: "UPDATE products SET title = ?, description = ?, price = ?, stock = ?, category_id = ?, image_url = ? WHERE id = ?", args: [title, description, Number(price), Number(stock), Number(category_id), image_url, Number(id)] });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  await ensureSchema();
  await db().execute({ sql: "DELETE FROM products WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ ok: true });
}
