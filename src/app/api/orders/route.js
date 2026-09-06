import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await ensureSchema();

    const result = await db().execute(`
      SELECT 
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.shipping_address,
        o.total_amount,
        o.status,
        o.created_at,
        MAX(p.image_url) AS image_url,
        GROUP_CONCAT(oi.product_name) AS items,
        SUM(oi.quantity) AS total_quantity
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 });
    }

    await ensureSchema();

    // Convert status to lowercase to satisfy DB CHECK constraint
    const normalizedStatus = String(status).toLowerCase();

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    await db().execute({
      sql: "UPDATE orders SET status = ? WHERE id = ?",
      args: [normalizedStatus, Number(id)],
    });

    return NextResponse.json({ success: true, id, status: normalizedStatus });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      user_id = null,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      product_id,
      quantity = 1,
    } = await request.json();

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !product_id) {
      return NextResponse.json({ error: "Customer and product details are required" }, { status: 400 });
    }

    await ensureSchema();
    const product = await db().execute({
      sql: "SELECT id, title, price, stock FROM products WHERE id = ?",
      args: [Number(product_id)],
    });
    const item = product.rows[0];

    if (!item) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (Number(item.stock) < Number(quantity)) return NextResponse.json({ error: "Product is out of stock" }, { status: 409 });

    const totalAmount = Number(item.price) * Number(quantity);

    const order = await db().execute({
      sql: "INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      args: [user_id, customer_name, customer_email, customer_phone, shipping_address, totalAmount],
    });

    const orderId = Number(order.lastInsertRowid);

    await db().batch(
      [
        {
          sql: "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
          args: [orderId, Number(item.id), item.title, item.price, Number(quantity)],
        },
        {
          sql: "UPDATE products SET stock = stock - ? WHERE id = ?",
          args: [Number(quantity), Number(item.id)],
        },
      ],
      "write"
    );

    return NextResponse.json({ id: orderId }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}