"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { use, useEffect, useState } from "react";

export default function ProductDetails({ params }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => {
        const found = items.find((item) => String(item.id) === String(id));
        if (found) {
          setProduct(found);
          // Multiple image array parsing or single image fallback
          const imagesList =
            found.images && Array.isArray(found.images) && found.images.length > 0
              ? found.images
              : found.image_urls && Array.isArray(found.image_urls) && found.image_urls.length > 0
              ? found.image_urls
              : found.image_url
              ? [found.image_url]
              : [];
          setSelectedImage(imagesList[0] || "");
        } else {
          setProduct(null);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!product) return;
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, product_id: product.id, quantity }),
    });
    setStatus(response.ok ? "Order placed successfully" : "Could not place order");
  };

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 text-slate-600">
        Loading product...
      </main>
    );

  if (!product)
    return (
      <main className="min-h-screen bg-stone-50 px-5 py-10">
        <a href="/" className="text-sm text-lime-700 font-semibold">
          ← Back to store
        </a>
        <h1 className="mt-14 font-serif text-5xl">Product not found</h1>
      </main>
    );

  // Array normalization for multi-image support
  const images =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
      ? [product.image_url]
      : [];

  return (
    <main className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="font-bold">
            Mobi<span className="text-lime-700">Kiosk</span>
          </a>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Back to store
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        {/* Images Gallery Container */}
        <div className="flex flex-col gap-4">
          <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.title}
                className="h-full w-full object-contain p-8"
              />
            ) : (
              <span className="font-serif text-8xl text-slate-400">
                {product.title ? product.title.slice(0, 1) : "P"}
              </span>
            )}
          </div>

          {/* Multiple Images Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-2">
              {images.map((imgUrl, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                    selectedImage === imgUrl ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Order Form */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-700">
            {product.category || "Mobile phone"}
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-tight md:text-6xl">
            {product.title}
          </h1>

          {/* PKR Currency Formatting */}
          <p className="mt-5 font-serif text-3xl text-slate-900">
            Rs. {Number(product.price).toLocaleString("en-PK")}
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Premium device, carefully selected for everyday life. Ships fast from MobiKiosk.
          </p>
          <p className="mt-4 text-sm font-semibold text-lime-700">
            {product.stock} units available
          </p>

          <form
            onSubmit={placeOrder}
            className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-serif text-2xl">Place your order</h2>
            <label className="text-xs text-slate-500">
              Quantity
              <input
                required
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.min(product.stock, Math.max(1, Number(event.target.value)))
                  )
                }
                className="mt-1 w-full rounded border border-slate-300 p-3 text-sm"
              />
            </label>
            <input
              required
              placeholder="Full name"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="rounded border border-slate-300 p-3 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className="rounded border border-slate-300 p-3 text-sm"
            />
            <input
              required
              placeholder="Phone"
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="rounded border border-slate-300 p-3 text-sm"
            />
            <textarea
              required
              placeholder="Shipping address"
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              className="min-h-24 rounded border border-slate-300 p-3 text-sm"
            />
            <button className="bg-slate-900 p-3 text-sm font-bold text-white rounded">
              Place order · Rs. {Number(product.price * quantity).toLocaleString("en-PK")}
            </button>
            {status && <p className="text-sm font-semibold text-lime-700">{status}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}