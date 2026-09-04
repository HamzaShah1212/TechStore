"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const choose = (admin) => { setOpen(false); window.dispatchEvent(new CustomEvent("mobile-navigation", { detail: { admin } })); };
  return <div className={`mobile-menu ${open ? "is-open" : ""}`}><button className="mobile-menu-trigger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>{open && <div className="mobile-menu-panel"><button onClick={() => choose(false)}>Store</button><button onClick={() => choose(true)}>Admin panel</button></div>}</div>;
}
