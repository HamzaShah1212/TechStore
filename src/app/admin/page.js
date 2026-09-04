"use client";

import { useEffect, useState } from "react";

const tabs = ["Products", "Categories", "Users", "Orders", "Contacts"];

export default function AdminPage() {
  const [tab, setTab] = useState("Products");
  const [records, setRecords] = useState([]);

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

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      {/* Tabs list */}
      <div className="flex gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === item ? "bg-slate-900 text-white" : "bg-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {tab === "Orders" ? (
          <div className="min-w-[700px] divide-y divide-slate-100">
            {records.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-5 items-center gap-4 p-4 text-sm"
              >
                <div className="col-span-2 flex items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt="Product"
                      className="h-12 w-12 rounded border object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded bg-slate-100 font-bold text-slate-400">
                      P
                    </div>
                  )}
                  <div>
                    <strong className="block text-slate-900">
                      {item.customer_name}
                    </strong>
                    <span className="text-xs text-slate-500">{item.items}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-slate-400">Total Price</span>
                  <strong className="font-serif text-base">
                    ${Number(item.total_amount || 0).toLocaleString()}
                  </strong>
                </div>

                <span className="truncate text-xs text-slate-500">
                  {item.shipping_address}
                </span>

                <div>
                  <select
                    value={item.status || "Pending"}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      const res = await fetch("/api/orders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id, status: newStatus }),
                      });
                      if (res.ok) {
                        setRecords(
                          records.map((r) =>
                            r.id === item.id ? { ...r, status: newStatus } : r
                          )
                        );
                      }
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      item.status === "Confirmed"
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-yellow-300 bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-slate-500">Select a valid tab</div>
        )}
      </div>
    </section>
  );
}