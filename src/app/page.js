"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((s) => setIsAdmin(s.admin === true))
        .catch(() => setIsAdmin(false)),
    ]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    });
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    window.location.reload();
  };

  const visible = products.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) &&
      (!category || item.category === category)
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / 30));
  const pageProducts = visible.slice((page - 1) * 30, page * 30);

  return (
    <main className="min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-lime-300">
              M
            </span>
            Mobi<span className="text-lime-700">Kiosk</span>
          </a>

          {/* Desktop Search & Filter */}
          <div className="hidden items-center gap-2 md:flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <nav className="hidden items-center gap-4 text-sm md:flex">
            <a href="/" className="border-b-2 border-slate-900 py-1 font-bold">
              Store
            </a>
            <a href="/admin" className="py-1 text-slate-500 transition-all hover:text-slate-900">
              Admin
            </a>
            {isAdmin && (
              <button
                onClick={logout}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition"
              >
                Log out
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <span className="text-xl font-bold">✕</span>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-stone-50 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                <div className="flex gap-4">
                  <a href="/" className="font-bold text-slate-900">Store</a>
                  <a href="/admin" className="text-slate-500">Admin</a>
                </div>
                {isAdmin && (
                  <button
                    onClick={logout}
                    className="rounded bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600"
                  >
                    Log out
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <Store products={pageProducts} page={page} pageCount={pageCount} setPage={setPage} />

      <Footer />
    </main>
  );
}

function Store({ products, page, pageCount, setPage }) {
  return (
    <>
      <section className="bg-lime-100 px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-800">
            The smarter way to shop
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-6xl leading-none md:text-8xl">
            Technology,<br />
            <em className="text-lime-700">beautifully</em> chosen.
          </h1>
          <p className="mt-6 max-w-md text-slate-600">
            Premium devices, honest advice, and delivery that keeps up.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-700">
          Curated for you
        </p>
        <h2 className="mt-3 font-serif text-4xl">Popular right now</h2>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <a
              href={`/product/${product.id}`}
              key={product.id}
              className="border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid aspect-square place-items-center overflow-hidden bg-slate-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="font-serif text-6xl text-slate-400">
                    {product.title ? product.title[0] : "P"}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs text-slate-500">{product.category}</p>
              <h3 className="font-semibold">{product.title}</h3>
              <div className="mt-4 flex items-center justify-between">
                <strong className="font-serif text-lg text-slate-900">
                  Rs. {Number(product.price || 0).toLocaleString("en-PK")}
                </strong>
                <span className="text-xs text-lime-700">
                  {product.stock} in stock
                </span>
              </div>
              <span className="mt-4 block bg-slate-900 px-4 py-3 text-center text-xs font-bold text-white">
                View and buy
              </span>
            </a>
          ))}
        </div>

        {pageCount > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => setPage(page + 1)}
              className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-slate-500 sm:flex-row">
        <strong className="text-slate-900">
          Mobi<span className="text-lime-700">Kiosk</span>
        </strong>
        <span>Premium devices, honestly chosen.</span>
        <span>© 2026 MobiKiosk</span>
      </div>
    </footer>
  );
}