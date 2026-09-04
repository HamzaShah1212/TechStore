{tab === "Orders" ? (
  <div className="min-w-[700px] divide-y divide-slate-100">
    {records.map((item) => (
      <div key={item.id} className="grid grid-cols-5 items-center gap-4 p-4 text-sm">
        {/* Product Image & Details */}
        <div className="flex items-center gap-3 col-span-2">
          {item.image_url ? (
            <img src={item.image_url} alt="Product" className="h-12 w-12 rounded object-cover border" />
          ) : (
            <div className="h-12 w-12 rounded bg-slate-100 grid place-items-center font-bold text-slate-400">P</div>
          )}
          <div>
            <strong className="block text-slate-900">{item.customer_name}</strong>
            <span className="text-xs text-slate-500">{item.items}</span>
          </div>
        </div>

        {/* Total Price */}
        <div>
          <span className="block text-xs text-slate-400">Total Price</span>
          <strong className="font-serif text-base">${Number(item.total_amount || 0).toLocaleString()}</strong>
        </div>

        {/* Address */}
        <span className="text-xs text-slate-500 truncate">{item.shipping_address}</span>

        {/* Status Dropdown */}
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
                setRecords(records.map((r) => (r.id === item.id ? { ...r, status: newStatus } : r)));
              }
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              item.status === "Confirmed" ? "border-green-300 bg-green-50 text-green-700" : "border-yellow-300 bg-yellow-50 text-yellow-700"
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
  /* Existing Table mapping for Products, Categories, Users */
  null
)}