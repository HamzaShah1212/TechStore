"use client";

import { useEffect, useState } from "react";

export default function LogoutButton() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => { fetch("/api/auth/session").then((response) => response.json()).then((data) => setAdmin(data.admin === true)).catch(() => {}); }, []);
  if (!admin) return null;
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; };
  return <button className="logout-button " onClick={logout}>Log out</button>;
}
