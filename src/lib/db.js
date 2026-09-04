import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

let client;
export function db() {
  if (!client) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    }
    client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

export async function ensureSchema() {
  await db().batch([
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT CHECK(role IN ('admin', 'customer')) DEFAULT 'customer', address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, price REAL NOT NULL, stock INTEGER NOT NULL DEFAULT 0, category_id INTEGER NOT NULL, image_url TEXT NOT NULL DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT NOT NULL, shipping_address TEXT NOT NULL, total_amount REAL NOT NULL, status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')) DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL)`,
    `CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, product_name TEXT NOT NULL, price REAL NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`,
  ], "write");
  const categoryCount = await db().execute("SELECT COUNT(*) AS count FROM categories");
  if (Number(categoryCount.rows[0].count) === 0) {
    await db().batch([
      { sql: "INSERT INTO categories (name, description) VALUES (?, ?)", args: ["Apple", "iPhone and Apple accessories"] },
      { sql: "INSERT INTO categories (name, description) VALUES (?, ?)", args: ["Samsung", "Galaxy smartphones"] },
      { sql: "INSERT INTO categories (name, description) VALUES (?, ?)", args: ["Google", "Pixel smartphones"] },
      { sql: "INSERT INTO categories (name, description) VALUES (?, ?)", args: ["Nothing", "Minimal, distinctive phones"] },
    ], "write");
  }
  const productCount = await db().execute("SELECT COUNT(*) AS count FROM products");
  if (Number(productCount.rows[0].count) === 0) {
    const categoryRows = await db().execute("SELECT id, name FROM categories");
    const ids = Object.fromEntries(categoryRows.rows.map((row) => [row.name, row.id]));
    await db().batch([
      { sql: "INSERT INTO products (title, price, stock, category_id) VALUES (?, ?, ?, ?)", args: ["iPhone 15 Pro", 999, 12, ids.Apple] },
      { sql: "INSERT INTO products (title, price, stock, category_id) VALUES (?, ?, ?, ?)", args: ["Galaxy S24 Ultra", 1199, 8, ids.Samsung] },
      { sql: "INSERT INTO products (title, price, stock, category_id) VALUES (?, ?, ?, ?)", args: ["Pixel 9 Pro", 899, 16, ids.Google] },
      { sql: "INSERT INTO products (title, price, stock, category_id) VALUES (?, ?, ?, ?)", args: ["Nothing Phone (2)", 649, 5, ids.Nothing] },
    ], "write");
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await db().execute({ sql: "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin') ON CONFLICT(email) DO NOTHING", args: ["Store Admin", process.env.ADMIN_EMAIL, await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)] });
  }
}
