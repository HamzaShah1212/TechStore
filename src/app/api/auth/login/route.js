import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db, ensureSchema } from "../../../../lib/db";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);
export async function POST(request) {
  const { email, password } = await request.json();
  await ensureSchema();
  const result = email ? await db().execute({ sql: "SELECT email, password, role FROM users WHERE email = ? AND role = 'admin' LIMIT 1", args: [email] }) : { rows: [] };
  const databaseAdmin = result.rows[0];
  const databaseLogin = databaseAdmin && await bcrypt.compare(password || "", databaseAdmin.password);
  const bootstrapLogin = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
  if (!databaseLogin && !bootstrapLogin) return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
  const token = await new SignJWT({ email, role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
  const response = NextResponse.json({ ok: true, role: "admin" });
  response.cookies.set("admin_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  return response;
}
