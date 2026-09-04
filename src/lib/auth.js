import { jwtVerify } from "jose";

export async function requireAdmin(request) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return payload.role === "admin";
  } catch {
    return false;
  }
}
