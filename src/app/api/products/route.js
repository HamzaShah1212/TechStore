import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await ensureSchema();
  const result = await db().execute(
    "SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.created_at DESC"
  );

  const products = result.rows.map((product) => {
    let images = [];
    try {
      images = product.image_urls
        ? JSON.parse(product.image_urls)
        : product.image_url
        ? [product.image_url]
        : [];
    } catch {
      images = product.image_url ? [product.image_url] : [];
    }

    const numericPrice = Number(product.price);

    return {
      ...product,
      price: numericPrice,
      price_pkr: `Rs. ${numericPrice.toLocaleString("en-PK")}`,
      images: images,
    };
  });

  return NextResponse.json(products);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const {
    title,
    description = "",
    price,
    stock = 0,
    category_id,
    category,
    image_urls = [],
    image_url = ""
  } = await request.json();

  if (!title || price == null || (!category_id && !category)) {
    return NextResponse.json(
      { error: "title, price and category are required" },
      { status: 400 }
    );
  }

  await ensureSchema();

  let resolvedCategoryId = category_id;
  if (!resolvedCategoryId) {
    await db().execute({
      sql: "INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING",
      args: [category],
    });
    const categoryResult = await db().execute({
      sql: "SELECT id FROM categories WHERE name = ?",
      args: [category],
    });
    resolvedCategoryId = categoryResult.rows[0].id;
  }

  const finalImages = Array.isArray(image_urls) && image_urls.length > 0
    ? image_urls
    : image_url
    ? [image_url]
    : [];
  
  const imagesJson = JSON.stringify(finalImages);

  const result = await db().execute({
    sql: "INSERT INTO products (title, description, price, stock, category_id, image_urls, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      title,
      description,
      Number(price),
      Number(stock),
      Number(resolvedCategoryId),
      imagesJson,
      finalImages[0] || "",
    ],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}

export async function PUT(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const {
    id,
    title,
    description = "",
    price,
    stock,
    category_id,
    image_urls = [],
    image_url = ""
  } = await request.json();

  if (!id || !title || price == null || stock == null || !category_id) {
    return NextResponse.json({ error: "Product fields are required" }, { status: 400 });
  }

  await ensureSchema();

  const finalImages = Array.isArray(image_urls) && image_urls.length > 0
    ? image_urls
    : image_url
    ? [image_url]
    : [];

  const imagesJson = JSON.stringify(finalImages);

  await db().execute({
    sql: "UPDATE products SET title = ?, description = ?, price = ?, stock = ?, category_id = ?, image_urls = ?, image_url = ? WHERE id = ?",
    args: [
      title,
      description,
      Number(price),
      Number(stock),
      Number(category_id),
      imagesJson,
      finalImages[0] || "",
      Number(id),
    ],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Product id is required" }, { status: 400 });

  await ensureSchema();
  await db().execute({ sql: "DELETE FROM products WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ ok: true });
}