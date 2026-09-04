"use client";

import { useEffect, useState } from "react";

const tabs = ["Products", "Categories", "Users", "Orders", "Contacts"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    });
  }, []);

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
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <nav className="flex items-center gap-4 text-sm"><a href="/" className="border-b-2 border-slate-900 py-1 font-bold">Store</a><a href="/admin" className="py-1 text-slate-500 transition-all hover:text-slate-900">Admin</a></nav>
        </div>
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
              <div className="mt-4 flex justify-between">
                <strong className="font-serif text-xl">
                  ${Number(product.price || 0).toLocaleString()}
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

        {pageCount > 1 && <div className="mt-10 flex items-center justify-center gap-3"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-slate-500">Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage(page + 1)} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40">Next</button></div>}
      </section>
    </>
  );
}

function Footer() { return <footer className="border-t border-slate-200 bg-white px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-slate-500 sm:flex-row"><strong className="text-slate-900">Mobi<span className="text-lime-700">Kiosk</span></strong><span>Premium devices, honestly chosen.</span><span>© 2026 MobiKiosk</span></div></footer>; }

export function Admin({ products, categories, users, logout, notify, refresh }) {
  const [tab, setTab] = useState("Products");
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null);

  const remove = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    const response = await fetch(`/api/${type}s`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) { await refresh(); notify(`${type} deleted`); }
  };

  useEffect(() => {
    const endpoint =
      tab === "Orders"
        ? "/api/orders"
        : tab === "Contacts"
        ? "/api/contact"
        : null;
    if (endpoint)
      fetch(endpoint)
        .then((r) => (r.ok ? r.json() : []))
        .then(setRecords);
  }, [tab]);

  const data =
    tab === "Products"
      ? products
      : tab === "Categories"
      ? categories
      : tab === "Users"
      ? users
      : records;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex items-end justify-between border-b border-slate-200 pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-700">
            Private workspace
          </p>
          <h1 className="mt-2 font-serif text-5xl">Admin panel</h1>
        </div>
        <button
          onClick={logout}
          className="rounded bg-red-500 px-4 py-2 text-sm font-bold text-white"
        >
          Log out
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === item
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {item}
          </button>
        ))}
        {tab === "Products" && <button onClick={() => setCreating("product")} className="ml-auto rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white">+ Add product</button>}
        {tab === "Categories" && <button onClick={() => setCreating("category")} className="ml-auto rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white">+ Add category</button>}
        {tab === "Users" && <button onClick={() => setCreating("user")} className="ml-auto rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white">+ Add user</button>}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[620px] divide-y divide-slate-100">
          {data.map((item) => (
            <div key={item.id} className="grid grid-cols-3 gap-4 p-4 text-sm">
              <strong>
                {item.title || item.name || item.username || item.customer_name}
              </strong>
              <span className="text-slate-500">
                {item.email ||
                  item.category ||
                  item.items ||
                  item.subject ||
                  item.description}
              </span>
              <span className="text-slate-500">
                {item.role ||
                  item.status ||
                  item.customer_phone ||
                  item.price ||
                  item.message}
              </span>
              {tab === "Products" && <span className="flex gap-2"><button onClick={() => setEditing({ type: "product", item })} className="text-lime-700">Edit</button><button onClick={() => remove("product", item.id)} className="text-red-600">Delete</button></span>}
              {tab === "Categories" && <span className="flex gap-2"><button onClick={() => setEditing({ type: "category", item })} className="text-lime-700">Edit</button><button onClick={() => remove("categorie", item.id)} className="text-red-600">Delete</button></span>}
            </div>
          ))}
        </div>
      </div>{creating && <CreateModal type={creating} categories={categories} close={() => setCreating(null)} refresh={refresh} notify={notify} />}{editing && <EditModal data={editing} categories={categories} close={() => setEditing(null)} refresh={refresh} notify={notify} />}
    </section>
  );
}

function Login({ close, success }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) success();
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/60 p-5">
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-3 text-2xl"
        >
          ×
        </button>
        <h2 className="font-serif text-3xl">Admin sign in</h2>
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-6 w-full rounded border p-3"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-3 w-full rounded border p-3"
        />
        <button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}

function CreateModal({ type, categories, close, refresh, notify }) {
  const [form, setForm] = useState(type === "product" ? { title: "", price: "", stock: 0, category_id: categories[0]?.id || "", image: null } : type === "category" ? { name: "", description: "" } : { username: "", email: "", password: "", address: "" });
  const save = async (event) => { event.preventDefault(); let payload = { ...form }; if (type === "product" && form.image) { const data = new FormData(); data.append("image", form.image); const upload = await fetch("/api/uploads", { method: "POST", body: data }); if (!upload.ok) return notify("Image upload failed"); payload.image_url = (await upload.json()).url; delete payload.image; } const endpoint = type === "product" ? "/api/products" : type === "category" ? "/api/categories" : "/api/users"; const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (response.ok) { await refresh(); close(); notify(`${type} added`); } else notify("Could not save record"); };
  return <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/60 p-5"><form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-serif text-3xl">Add {type}</h2><button type="button" onClick={close} className="text-2xl">×</button></div>{type === "product" && <><input required placeholder="Product name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-6 w-full rounded border p-3" /><input required type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-3 w-full rounded border p-3" /><input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-3 w-full rounded border p-3" /><select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-3 w-full rounded border p-3">{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="mt-3 w-full rounded border p-3" /></>}{type === "category" && <><input required placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-6 w-full rounded border p-3" /><textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-3 min-h-24 w-full rounded border p-3" /></>}{type === "user" && <><input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-6 w-full rounded border p-3" /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-3 w-full rounded border p-3" /><input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-3 w-full rounded border p-3" /><input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-3 w-full rounded border p-3" /></>}<button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white">Save</button></form></div>;
}

function EditModal({ data, categories, close, refresh, notify }) {
  const isProduct = data.type === "product";
  const [form, setForm] = useState(isProduct ? { title: data.item.title, price: data.item.price, stock: data.item.stock, category_id: categories.find((item) => item.name === data.item.category)?.id || "", image_url: data.item.image_url || "", image: null } : { name: data.item.name, description: data.item.description || "" });
  const save = async (event) => {
    event.preventDefault();
    let image_url = form.image_url;
    if (isProduct && form.image) { const uploadData = new FormData(); uploadData.append("image", form.image); const upload = await fetch("/api/uploads", { method: "POST", body: uploadData }); if (!upload.ok) { notify("Image upload failed"); return; } image_url = (await upload.json()).url; }
    const payload = isProduct ? { id: data.item.id, ...form, image_url } : { id: data.item.id, ...form };
    const response = await fetch(isProduct ? "/api/products" : "/api/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.ok) { await refresh(); close(); notify("Record updated"); }
  };
  return <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/60 p-5"><form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-serif text-3xl">Edit {isProduct ? "product" : "category"}</h2><button type="button" onClick={close} className="text-2xl">×</button></div>{isProduct ? <><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-6 w-full rounded border p-3" /><label className="mt-3 block text-sm text-slate-500">Product image<input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="mt-1 w-full rounded border p-3 text-sm" /></label>{form.image_url && <img src={form.image_url} alt="Current product" className="mt-3 h-24 w-24 rounded object-cover" />}<input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-3 w-full rounded border p-3" /><input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-3 w-full rounded border p-3" /><select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-3 w-full rounded border p-3">{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></> : <><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-6 w-full rounded border p-3" /><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-3 min-h-24 w-full rounded border p-3" /></>}<button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white">Save changes</button></form></div>;
}