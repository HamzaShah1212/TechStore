import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth";

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const formData = await request.formData();
  const file = formData.get("image");
  if (!file || typeof file === "string" || !file.type.startsWith("image/")) return NextResponse.json({ error: "A valid image is required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be smaller than 5MB" }, { status: 400 });
  const extension = path.extname(file.name).toLowerCase() || ".jpg";
  const filename = `${randomUUID()}${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
