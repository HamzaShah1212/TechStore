"use client";

import { useEffect, useState } from "react";
import { Admin } from "../page";

export default function AdminRoute() {
  const [authorized, setAuthorized] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState("");
  const refresh = async () => { const [p, c, u] = await Promise.all([fetch("/api/products").then((r) => r.json()), fetch("/api/categories").then((r) => r.json()), fetch("/api/users").then((r) => r.ok ? r.json() : [])]); setProducts(p); setCategories(c); setUsers(u); };
  const notify = (text) => { setNotice(text); window.setTimeout(() => setNotice(""), 2400); };
  useEffect(() => { fetch("/api/auth/session").then((r) => r.json()).then((session) => { setAuthorized(session.admin === true); if (session.admin) refresh(); }); }, []);
  const login = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }); if (response.ok) { setAuthorized(true); setLoginOpen(false); refresh(); } else setNotice("Invalid admin credentials"); };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setAuthorized(false); notify("Logged out"); };
  if (authorized === null) return <main className="grid min-h-screen place-items-center bg-stone-50">Checking admin session...</main>;
  if (!authorized || loginOpen) return <main className="grid min-h-screen place-items-center bg-stone-50 p-5"><form onSubmit={login} className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl"><p className="text-xs font-bold uppercase tracking-[.25em] text-lime-700">Private workspace</p><h1 className="mt-3 font-serif text-4xl">Admin sign in</h1><input name="email" required type="email" placeholder="Email" className="mt-8 w-full rounded border border-slate-300 p-3" /><input name="password" required type="password" placeholder="Password" className="mt-3 w-full rounded border border-slate-300 p-3" /><button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white">Sign in</button><a href="/" className="mt-4 block text-center text-sm text-slate-500">Back to store</a></form>{notice && <p className="fixed bottom-5 right-5 bg-slate-900 px-4 py-3 text-white">{notice}</p>}</main>;
  return <main className="min-h-screen bg-stone-50"><Admin products={products} categories={categories} users={users} logout={logout} notify={notify} refresh={refresh} /></main>;
}
