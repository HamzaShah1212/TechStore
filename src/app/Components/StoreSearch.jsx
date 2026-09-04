"use client";

import { useEffect, useState } from "react";

export default function StoreSearch() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  useEffect(() => { fetch("/api/products").then((response) => response.ok ? response.json() : []).then(setProducts).catch(() => {}); }, []);
  const results = products.filter((product) => product.title.toLowerCase().includes(query.toLowerCase()) && (!category || product.category === category));
  return <div className="relative"><button aria-label="Open search" onClick={() => setOpen(!open)} className="rounded-full border border-slate-300 bg-white p-2 text-lg leading-none hover:bg-lime-100">⌕</button>{open && <div className="absolute right-0 top-12 z-30 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl"><div className="flex gap-2"><input autoFocus placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-lime-500" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-32 rounded border border-slate-300 px-2 text-xs"><option value="">All categories</option><option>Apple</option><option>Samsung</option><option>Google</option><option>Nothing</option></select></div>{(query || category) && <div className="mt-2 divide-y divide-slate-100">{results.length ? results.map((product) => <a className="flex items-center justify-between py-2 text-sm hover:text-lime-700" href={`/product/${product.id}`} key={product.id}><span><small className="mr-2 text-slate-400">{product.category}</small>{product.title}</span><b>${Number(product.price).toLocaleString()}</b></a>) : <p className="py-3 text-xs text-slate-500">No products found</p>}</div>}</div>}</div>;
}
