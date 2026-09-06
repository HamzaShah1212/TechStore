"use client";

import { useEffect, useState } from "react";

const tabs = ["Products", "Categories", "Users", "Orders", "Contacts"];

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    try {
      const [p, c, u] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/categories", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/users", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setProducts(p);
      setCategories(c);
      setUsers(u);
    } catch (error) {
      console.error("Failed to refresh admin data:", error);
    }
  };

  const notify = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2400);
  };

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((session) => {
        setAuthorized(session.admin === true);
        if (session.admin) refresh();
      })
      .catch(() => setAuthorized(false));
  }, []);

  const login = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (response.ok) {
      setAuthorized(true);
      setLoginOpen(false);
      refresh();
    } else {
      setNotice("Invalid admin credentials");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthorized(false);
    notify("Logged out");
  };

  if (authorized === null) {
    return <main className="grid min-h-screen place-items-center bg-stone-50">Checking admin session...</main>;
  }

  if (!authorized || loginOpen) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 p-5">
        <form onSubmit={login} className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-700">Private workspace</p>
          <h1 className="mt-3 font-serif text-4xl">Admin sign in</h1>
          <input name="email" required type="email" placeholder="Email" className="mt-8 w-full rounded border border-slate-300 p-3" />
          <input name="password" required type="password" placeholder="Password" className="mt-3 w-full rounded border border-slate-300 p-3" />
          <button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white rounded">Sign in</button>
          <a href="/" className="mt-4 block text-center text-sm text-slate-500">Back to store</a>
        </form>
        {notice && <p className="fixed bottom-5 right-5 rounded bg-slate-900 px-4 py-3 text-white shadow-lg">{notice}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <Admin products={products} categories={categories} users={users} logout={logout} notify={notify} refresh={refresh} />
      {notice && <p className="fixed bottom-5 right-5 z-50 rounded bg-slate-900 px-4 py-3 text-white shadow-lg">{notice}</p>}
    </main>
  );
}

function Admin({ products, categories, users, logout, notify, refresh }) {
  const [tab, setTab] = useState("Products");
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null);

  const fetchTabRecords = async () => {
    const endpoint =
      tab === "Orders"
        ? "/api/orders"
        : tab === "Contacts"
        ? "/api/contact"
        : null;
    if (endpoint) {
      try {
        const r = await fetch(endpoint, { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          setRecords(data);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Error fetching tab records:", err);
      }
    }
  };

  useEffect(() => {
    fetchTabRecords();
  }, [tab]);

  const remove = async (type, id) => {
    if (!window.confirm(`Delete this item?`)) return;
    const response = await fetch(`/api/${type}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      await refresh();
      await fetchTabRecords();
      notify("Item deleted successfully");
    } else {
      notify("Failed to delete item");
    }
  };

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
          <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-700">Private workspace</p>
          <h1 className="mt-2 font-serif text-5xl">Admin panel</h1>
        </div>
        <button onClick={logout} className="rounded bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600">
          Log out
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
        {tab === "Products" && (
          <button onClick={() => setCreating("product")} className="ml-auto rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white hover:bg-lime-700">
            + Add product
          </button>
        )}
        {tab === "Categories" && (
          <button onClick={() => setCreating("category")} className="ml-auto rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white hover:bg-lime-700">
            + Add category
          </button>
        )}
        {tab === "Users" && (
          <button onClick={() => setCreating("user")} className="ml-auto rounded-lg bg-lime-600 px-4 py-2 text-sm font-bold text-white hover:bg-lime-700">
            + Add user
          </button>
        )}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {tab === "Orders" ? (
          <div className="min-w-[700px] divide-y divide-slate-100">
            {records.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No orders found.</p>
            ) : (
              records.map((item) => {
                const currentStatus = item.status ? item.status.toLowerCase() : "pending";
                return (
                  <div key={item.id} className="grid grid-cols-5 items-center gap-4 p-4 text-sm">
                    <div className="col-span-2 flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt="Product" className="h-12 w-12 rounded border object-cover bg-slate-50" />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded bg-slate-100 font-bold text-slate-400">P</div>
                      )}
                      <div>
                        <strong className="block text-slate-900">{item.customer_name}</strong>
                        <span className="text-xs text-slate-500">{item.items}</span>
                        <span className="block text-[11px] text-slate-400">Ph: {item.customer_phone}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs text-slate-400">Total Price</span>
                      <strong className="font-serif text-base text-slate-900">
                        Rs. {Number(item.total_amount || 0).toLocaleString("en-PK")}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-xs text-slate-400">Address</span>
                      <p className="truncate text-xs text-slate-600">{item.shipping_address}</p>
                    </div>

                    <div>
                      <select
                        value={currentStatus}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const res = await fetch("/api/orders", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: item.id, status: newStatus }),
                          });
                          if (res.ok) {
                            setRecords((prev) =>
                              prev.map((r) => (r.id === item.id ? { ...r, status: newStatus } : r))
                            );
                            notify("Order status updated");
                          } else {
                            notify("Failed to update status");
                          }
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition capitalize ${
                          currentStatus === "completed"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : currentStatus === "processing"
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : currentStatus === "cancelled"
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-yellow-300 bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="min-w-[620px] divide-y divide-slate-100">
            {data.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No records found.</p>
            ) : (
              data.map((item) => (
                <div key={item.id} className="grid grid-cols-4 items-center gap-4 p-4 text-sm">
                  <strong className="text-slate-900 truncate">
                    {item.title || item.name || item.username || item.customer_name}
                  </strong>
                  <span className="truncate text-slate-500">
                    {item.email || item.category || item.items || item.subject || item.description}
                  </span>
                  <span className="text-slate-500 truncate">
                    {item.role ||
                      item.status ||
                      item.customer_phone ||
                      (item.price != null
                        ? item.price_pkr || `Rs. ${Number(item.price).toLocaleString("en-PK")}`
                        : null) ||
                      item.message}
                  </span>
                  <span className="flex justify-end gap-3 font-semibold">
                    {tab === "Products" && (
                      <>
                        <button onClick={() => setEditing({ type: "product", item })} className="text-lime-700 hover:underline">Edit</button>
                        <button onClick={() => remove("products", item.id)} className="text-red-600 hover:underline">Delete</button>
                      </>
                    )}
                    {tab === "Categories" && (
                      <>
                        <button onClick={() => setEditing({ type: "category", item })} className="text-lime-700 hover:underline">Edit</button>
                        <button onClick={() => remove("categories", item.id)} className="text-red-600 hover:underline">Delete</button>
                      </>
                    )}
                    {tab === "Users" && (
                      <button onClick={() => remove("users", item.id)} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {creating && <CreateModal type={creating} categories={categories} close={() => setCreating(null)} refresh={refresh} notify={notify} />}
      {editing && <EditModal data={editing} categories={categories} close={() => setEditing(null)} refresh={refresh} notify={notify} />}
    </section>
  );
}

function CreateModal({ type, categories, close, refresh, notify }) {
  const [form, setForm] = useState(
    type === "product"
      ? { title: "", price: "", stock: 0, category_id: categories[0]?.id || "", images: [] }
      : type === "category"
      ? { name: "", description: "" }
      : { username: "", email: "", password: "", address: "" }
  );

  const save = async (event) => {
    event.preventDefault();
    let payload = { ...form };

    if (type === "product" && form.images?.length > 0) {
      const uploadedUrls = [];
      for (const file of form.images) {
        const data = new FormData();
        data.append("image", file);
        const upload = await fetch("/api/uploads", { method: "POST", body: data });
        if (upload.ok) {
          const res = await upload.json();
          uploadedUrls.push(res.url);
        }
      }
      payload.image_urls = uploadedUrls;
      delete payload.images;
    }

    const endpoint = type === "product" ? "/api/products" : type === "category" ? "/api/categories" : "/api/users";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      await refresh();
      close();
      notify(`${type} added`);
    } else notify("Could not save record");
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/60 p-5">
      <form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl">Add {type}</h2>
          <button type="button" onClick={close} className="text-2xl">×</button>
        </div>
        {type === "product" && (
          <>
            <input required placeholder="Product name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-6 w-full rounded border p-3 text-sm" />
            <input required type="number" placeholder="Price (PKR)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
            <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm">
              {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Select Product Images
              <input type="file" accept="image/*" multiple onChange={(e) => setForm({ ...form, images: Array.from(e.target.files) })} className="mt-1 w-full rounded border p-3 text-sm" />
            </label>
          </>
        )}
        {type === "category" && (
          <>
            <input required placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-6 w-full rounded border p-3 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-3 min-h-24 w-full rounded border p-3 text-sm" />
          </>
        )}
        {type === "user" && (
          <>
            <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-6 w-full rounded border p-3 text-sm" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
            <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
          </>
        )}
        <button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white rounded">Save</button>
      </form>
    </div>
  );
}

function EditModal({ data, categories, close, refresh, notify }) {
  const isProduct = data.type === "product";
  const [form, setForm] = useState(
    isProduct
      ? {
          title: data.item.title,
          price: data.item.price,
          stock: data.item.stock,
          category_id: categories.find((item) => item.name === data.item.category)?.id || "",
          existing_urls: data.item.images || (data.item.image_url ? [data.item.image_url] : []),
          new_images: [],
        }
      : { name: data.item.name, description: data.item.description || "" }
  );

  const save = async (event) => {
    event.preventDefault();
    let finalUrls = [...(form.existing_urls || [])];

    if (isProduct && form.new_images?.length > 0) {
      for (const file of form.new_images) {
        const uploadData = new FormData();
        uploadData.append("image", file);
        const upload = await fetch("/api/uploads", { method: "POST", body: uploadData });
        if (upload.ok) {
          const res = await upload.json();
          finalUrls.push(res.url);
        }
      }
    }

    const payload = isProduct
      ? {
          id: data.item.id,
          title: form.title,
          price: form.price,
          stock: form.stock,
          category_id: form.category_id,
          image_urls: finalUrls,
        }
      : { id: data.item.id, ...form };

    const response = await fetch(isProduct ? "/api/products" : "/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      await refresh();
      close();
      notify("Record updated");
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/60 p-5">
      <form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl">Edit {isProduct ? "product" : "category"}</h2>
          <button type="button" onClick={close} className="text-2xl">×</button>
        </div>
        {isProduct ? (
          <>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-6 w-full rounded border p-3 text-sm" />
            
            {form.existing_urls?.length > 0 && (
              <div className="mt-3">
                <span className="block text-xs font-semibold text-slate-500">Current Images:</span>
                <div className="mt-1 flex gap-2 overflow-x-auto py-1">
                  {form.existing_urls.map((url, i) => (
                    <img key={i} src={url} alt="Current" className="h-16 w-16 rounded border object-cover" />
                  ))}
                </div>
              </div>
            )}

            <label className="mt-3 block text-xs font-semibold text-slate-500">
              Add More Images
              <input type="file" accept="image/*" multiple onChange={(e) => setForm({ ...form, new_images: Array.from(e.target.files) })} className="mt-1 w-full rounded border p-3 text-sm" />
            </label>

            <input required type="number" placeholder="Price in PKR" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
            <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm" />
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-3 w-full rounded border p-3 text-sm">
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </>
        ) : (
          <>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-6 w-full rounded border p-3 text-sm" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-3 min-h-24 w-full rounded border p-3 text-sm" />
          </>
        )}
        <button className="mt-5 w-full bg-slate-900 p-3 font-bold text-white rounded">Save changes</button>
      </form>
    </div>
  );
}