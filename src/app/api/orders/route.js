import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  await ensureSchema();
  const result = await db().execute(`SELECT o.*, GROUP_CONCAT(oi.product_name || ' x' || oi.quantity, ', ') || ' · Phone: ' || o.customer_phone AS items FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id ORDER BY o.created_at DESC`);
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const { user_id = null, customer_name, customer_email, customer_phone, shipping_address, product_id, quantity = 1 } = await request.json();
  if (!customer_name || !customer_email || !customer_phone || !shipping_address || !product_id) return NextResponse.json({ error: "Customer and product details are required" }, { status: 400 });
  await ensureSchema();
  const product = await db().execute({ sql: "SELECT id, title, price, stock FROM products WHERE id = ?", args: [Number(product_id)] });
  const item = product.rows[0];
  if (!item) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (Number(item.stock) < Number(quantity)) return NextResponse.json({ error: "Product is out of stock" }, { status: 409 });
  const order = await db().execute({ sql: "INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount) VALUES (?, ?, ?, ?, ?, ?)", args: [user_id, customer_name, customer_email, customer_phone, shipping_address, Number(item.price) * Number(quantity)] });
  const orderId = Number(order.lastInsertRowid);
  await db().batch([{ sql: "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)", args: [orderId, Number(item.id), item.title, item.price, Number(quantity)] }, { sql: "UPDATE products SET stock = stock - ? WHERE id = ?", args: [Number(quantity), Number(item.id)] }], "write");
  return NextResponse.json({ id: orderId }, { status: 201 });
}
