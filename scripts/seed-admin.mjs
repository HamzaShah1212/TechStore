import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const required = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
await client.batch([
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT CHECK(role IN ('admin', 'customer')) DEFAULT 'customer', address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, price REAL NOT NULL, stock INTEGER NOT NULL DEFAULT 0, category_id INTEGER NOT NULL, image_url TEXT NOT NULL DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  { sql: "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin') ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = 'admin'", args: ["Store Admin", process.env.ADMIN_EMAIL, await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)] },
  { sql: "INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, 'customer', ?) ON CONFLICT(email) DO NOTHING", args: ["Ayesha Khan", "ayesha@example.com", await bcrypt.hash("Customer@123", 12), "Lahore, Pakistan"] },
  { sql: "INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, 'customer', ?) ON CONFLICT(email) DO NOTHING", args: ["Omar Ali", "omar@example.com", await bcrypt.hash("Customer@123", 12), "Karachi, Pakistan"] },
  { sql: "INSERT INTO categories (name, description) VALUES (?, ?) ON CONFLICT(name) DO NOTHING", args: ["Apple", "iPhone and Apple accessories"] },
  { sql: "INSERT INTO categories (name, description) VALUES (?, ?) ON CONFLICT(name) DO NOTHING", args: ["Samsung", "Galaxy smartphones"] },
  { sql: "INSERT INTO categories (name, description) VALUES (?, ?) ON CONFLICT(name) DO NOTHING", args: ["Google", "Pixel smartphones"] },
  { sql: "INSERT INTO categories (name, description) VALUES (?, ?) ON CONFLICT(name) DO NOTHING", args: ["Nothing", "Minimal, distinctive phones"] },
], "write");
const categories = await client.execute("SELECT id, name FROM categories");
const categoryId = Object.fromEntries(categories.rows.map((row) => [row.name, row.id]));
for (const product of [["iPhone 15 Pro", 999, 12, "Apple"], ["Galaxy S24 Ultra", 1199, 8, "Samsung"], ["Pixel 9 Pro", 899, 16, "Google"], ["Nothing Phone (2)", 649, 5, "Nothing"]]) {
  await client.execute({ sql: "INSERT INTO products (title, price, stock, category_id, image_url) SELECT ?, ?, ?, ?, '' WHERE NOT EXISTS (SELECT 1 FROM products WHERE title = ?)", args: [product[0], product[1], product[2], categoryId[product[3]], product[0]] });
}
console.log(`Admin user ready: ${process.env.ADMIN_EMAIL}`);
console.log("Seeded demo users, categories, and products.");
