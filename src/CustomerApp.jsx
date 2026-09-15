import React, { useState, useMemo, useRef, useEffect } from "react";
import { ShoppingBag, Plus, Minus, Search, Check, ChevronLeft, CheckCircle2 } from "lucide-react";
import {
  THEMES,
  loadProductsCached,
  refreshProducts,
  loadCartsCached,
  refreshCarts,
  saveCart,
  money,
  makeCartId,
  cartTotal,
} from "./lib.js";

function Toast({ text }) {
  return (
    <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", background: "#241934", color: "#FBF3F8", padding: "8px 16px", borderRadius: "999px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", zIndex: 20, whiteSpace: "nowrap" }}>
      <CheckCircle2 size={14} /> {text}
    </div>
  );
}

// A tiled, low-opacity brand watermark over product imagery. This is a
// deterrent and a traceability mark, not a screenshot blocker \u2014 no website
// can prevent a screenshot or screen recording, on iOS or Android.
function Watermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        alignContent: "space-evenly",
        transform: "rotate(-18deg) scale(1.3)",
        opacity: 0.16,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} style={{ fontSize: "9px", fontWeight: 600, color: "#241934", whiteSpace: "nowrap", textAlign: "center", fontFamily: "'Playfair Display', serif" }}>
          ALFA
        </span>
      ))}
    </div>
  );
}

export default function CustomerApp() {
  const [products, setProducts] = useState(() => loadProductsCached());
  const [carts, setCartsState] = useState(() => loadCartsCached());
  const [screen, setScreen] = useState("landing");
  const [activeId, setActiveId] = useState(null); // only set once a cart has actually been sent
  const [items, setItems] = useState([]); // local, unsaved cart while browsing
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [checkingLookup, setCheckingLookup] = useState(false);
  const [theme, setTheme] = useState("All");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [formErrors, setFormErrors] = useState({});
  const toastTimer = useRef(null);
  const protectedAreaRef = useRef(null);

  // Pull the shared, cross-device catalog as soon as the store opens, so
  // whatever the admin last saved (from any device) shows up here too.
  useEffect(() => {
    refreshProducts().then((fresh) => {
      if (fresh) setProducts(fresh);
    });
  }, []);

  // Deterrents against casual screenshotting/saving: disable right-click,
  // long-press save, and text/image selection on the catalog area. This
  // cannot block screenshots or screen recording outright — no website can,
  // on iOS or Android — it just removes the easiest one-tap ways to save.
  useEffect(() => {
    const node = protectedAreaRef.current;
    if (!node) return;
    const blockContextMenu = (e) => e.preventDefault();
    node.addEventListener("contextmenu", blockContextMenu);
    return () => node.removeEventListener("contextmenu", blockContextMenu);
  }, [screen]);

  function showToast(text) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1400);
  }

  function startNewCart() {
    setActiveId(null);
    setItems([]);
    setForm({ name: "", address: "", phone: "" });
    setScreen("catalog");
  }

  async function loadCart() {
    const id = lookupId.trim().toUpperCase();
    if (!id) {
      setLookupError("Enter a cart ID first.");
      return;
    }
    setCheckingLookup(true);
    // Check the shared server copy, not just this device's local cache —
    // the cart may have been created on a different device.
    const fresh = await refreshCarts();
    const source = fresh || carts;
    if (fresh) setCartsState(fresh);
    setCheckingLookup(false);
    if (!source[id]) {
      setLookupError("We couldn't find that cart ID. Check it and try again.");
      return;
    }
    setActiveId(id);
    setItems(source[id].items);
    setForm(source[id].customer || { name: "", address: "", phone: "" });
    setLookupError("");
    setScreen("catalog");
  }

  function addToCart(p) {
    setItems((current) => {
      const existing = current.find((i) => i.id === p.id);
      if (existing) return current.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...current, { ...p, qty: 1 }];
    });
    showToast(p.name + " added");
  }

  function changeQty(id, delta) {
    setItems((current) => current.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  }

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter your name";
    if (!form.address.trim()) errs.address = "Enter a shipping address";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7) errs.phone = "Enter a valid phone number";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submitCart() {
    if (!validateForm()) return;
    // Cart ID is only minted here, at the moment of actually sending —
    // browsing alone never creates one.
    const id = activeId || makeCartId(Object.keys(carts));
    const cart = { items, customer: form, createdAt: carts[id]?.createdAt || Date.now(), submittedAt: Date.now() };
    setCartsState((c) => ({ ...c, [id]: cart }));
    saveCart(id, cart); // fire-and-forget: this is what the admin panel picks up on any device
    setActiveId(id);
    setScreen("done");
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const price = p.sale ? p.salePrice : p.price;
      return (theme === "All" || p.theme === theme) && price <= maxPrice && p.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [products, theme, query, maxPrice]);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  if (screen === "landing") {
    return (
      <div className="alfa-shell">
        <div style={{ background: "#3B1F5E", padding: "36px 24px 28px", textAlign: "center", paddingTop: "calc(36px + env(safe-area-inset-top))" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", color: "#FBF3F8", margin: 0, fontWeight: 600 }}>Alfa Collection</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 500, fontSize: "13.5px", color: "#E3C9DE", margin: "4px 0 0" }}>Your first choice in modest fashion</p>
        </div>
        <div style={{ padding: "28px 22px" }}>
          <button
            onClick={startNewCart}
            style={{ width: "100%", background: "#3B1F5E", color: "#FBF3F8", border: "none", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 500, cursor: "pointer", marginBottom: "18px" }}
          >
            Start browsing
          </button>
          <p style={{ fontSize: "11.5px", color: "#A99BB0", textAlign: "center", margin: "0 0 10px" }}>Already have a cart ID?</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={lookupId}
              onChange={(e) => { setLookupId(e.target.value); setLookupError(""); }}
              placeholder="e.g. AC-4821"
              style={{ flex: 1, border: "1px solid #E8CFE0", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", background: "#fff", color: "#241934" }}
            />
            <button onClick={loadCart} disabled={checkingLookup} style={{ background: "#F3D9E4", color: "#3B1F5E", border: "none", borderRadius: "10px", padding: "0 16px", fontSize: "13px", fontWeight: 500, cursor: checkingLookup ? "default" : "pointer" }}>
              {checkingLookup ? "Checking..." : "Open"}
            </button>
          </div>
          {lookupError && <p style={{ fontSize: "11.5px", color: "#A3403B", margin: "8px 0 0" }}>{lookupError}</p>}
        </div>
      </div>
    );
  }

  if (screen === "done") {
    return (
      <div className="alfa-shell">
        <div style={{ padding: "60px 26px", textAlign: "center", paddingTop: "calc(60px + env(safe-area-inset-top))" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#F3D9E4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={22} color="#3B1F5E" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "19px", color: "#241934", margin: "0 0 8px", fontWeight: 600 }}>Sent to Alfa Collection</p>
          <p style={{ fontSize: "12.5px", color: "#A99BB0", margin: "0 0 20px", lineHeight: 1.6 }}>She'll message you on WhatsApp shortly to confirm sizing and next steps.</p>
          <div style={{ background: "#fff", border: "1px dashed #C9A44C", borderRadius: "10px", padding: "12px", marginBottom: "8px" }}>
            <p style={{ fontSize: "11px", color: "#A99BB0", margin: "0 0 2px" }}>Your cart ID</p>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#3B1F5E", margin: 0, letterSpacing: "1px" }}>{activeId}</p>
          </div>
          <p style={{ fontSize: "11px", color: "#B3A0BB", margin: 0 }}>Save this ID to revisit or edit your cart later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alfa-shell">
      {toast && <Toast text={toast} />}
      <div style={{ background: "#3B1F5E", padding: "18px 20px", paddingTop: "calc(18px + env(safe-area-inset-top))", color: "#FBF3F8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 600, margin: 0 }}>Alfa Collection</p>
            <p style={{ fontSize: "10.5px", opacity: 0.85, margin: "2px 0 0" }}>
              {activeId ? <>Cart ID: {activeId} &middot; editing this cart</> : "Browsing \u2014 you'll get a cart ID once you send your picks"}
            </p>
          </div>
          {screen === "catalog" && (
            <button onClick={() => setScreen("cart")} style={{ background: "#FBF3F8", color: "#3B1F5E", border: "none", borderRadius: "999px", padding: "9px 13px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer", fontWeight: 500 }}>
              <ShoppingBag size={14} />
              {cartCount > 0 ? cartCount : ""}
            </button>
          )}
        </div>
      </div>

      {screen === "catalog" && (
        <>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0DCE6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #E8CFE0", borderRadius: "10px", padding: "8px 12px", marginBottom: "10px" }}>
              <Search size={14} color="#A99BB0" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rida name..." style={{ border: "none", outline: "none", fontSize: "12.5px", flex: 1, background: "transparent", color: "#241934" }} />
            </div>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "10px" }}>
              {THEMES.map((t) => (
                <button key={t} onClick={() => setTheme(t)} style={{ flexShrink: 0, padding: "7px 12px", borderRadius: "999px", border: "1px solid " + (theme === t ? "#3B1F5E" : "#E8CFE0"), background: theme === t ? "#3B1F5E" : "#fff", color: theme === t ? "#FBF3F8" : "#6B5B73", fontSize: "11.5px", cursor: "pointer", fontWeight: 500 }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11.5px", color: "#6B5B73", whiteSpace: "nowrap" }}>Up to {money(maxPrice)}</span>
              <input
                type="range"
                min="3000"
                max="10000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div
            ref={protectedAreaRef}
            className="alfa-catalog-grid"
            style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
          >
            {filtered.map((p) => (
              <div key={p.id} style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #F0DCE6" }}>
                <div
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ height: "100px", background: p.images && p.images.length ? "#000" : p.pattern, position: "relative", overflow: "hidden" }}
                >
                  {p.images && p.images.length > 0 && (
                    <img src={p.images[0]} alt={p.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  )}
                  {p.sale && <span style={{ position: "absolute", top: "6px", left: "6px", background: "#241934", color: "#FBF3F8", fontSize: "9.5px", padding: "2px 7px", borderRadius: "999px", fontWeight: 500, zIndex: 2 }}>Sale</span>}
                  <Watermark />
                </div>
                <div style={{ padding: "9px 10px" }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "#241934", fontFamily: "'Playfair Display', serif" }}>{p.name}</p>
                  <p style={{ margin: "1px 0 6px", fontSize: "10px", color: "#A99BB0" }}>{p.theme}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: p.sale ? "#3B1F5E" : "#241934" }}>{money(p.sale ? p.salePrice : p.price)}</span>
                    <button onClick={() => addToCart(p)} style={{ background: "#F3D9E4", border: "none", borderRadius: "7px", padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Plus size={12} color="#3B1F5E" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p style={{ gridColumn: "1/-1", textAlign: "center", color: "#A99BB0", fontSize: "12.5px", padding: "30px 0" }}>No ridas match these filters.</p>}
          </div>
        </>
      )}

      {screen === "cart" && (
        <div style={{ padding: "16px 18px" }}>
          <button onClick={() => setScreen("catalog")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#3B1F5E", fontSize: "12.5px", cursor: "pointer", padding: 0, marginBottom: "14px" }}>
            <ChevronLeft size={15} /> Back to browsing
          </button>
          {items.length === 0 ? (
            <p style={{ fontSize: "12.5px", color: "#A99BB0", textAlign: "center", marginTop: "40px" }}>No items yet. Go add something you love.</p>
          ) : (
            <>
              {items.map((i) => (
                <div key={i.id} style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "8px", overflow: "hidden", background: i.images && i.images.length ? "#000" : i.pattern, flexShrink: 0, position: "relative" }}>
                    {i.images && i.images.length > 0 && (
                      <img src={i.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 500, color: "#241934" }}>{i.name}</p>
                    <p style={{ margin: "2px 0 6px", fontSize: "11.5px", color: "#3B1F5E", fontWeight: 500 }}>{money(i.sale ? i.salePrice : i.price)}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => changeQty(i.id, -1)} style={{ border: "1px solid #E8CFE0", background: "#fff", borderRadius: "8px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Minus size={12} /></button>
                      <span style={{ fontSize: "12.5px", minWidth: "14px", textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => changeQty(i.id, 1)} style={{ border: "1px solid #E8CFE0", background: "#fff", borderRadius: "8px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Plus size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #F0DCE6", paddingTop: "12px", marginTop: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600, marginBottom: "14px", color: "#241934" }}>
                  <span>Total</span>
                  <span>{money(cartTotal({ items }))}</span>
                </div>
                <button onClick={() => setScreen("form")} style={{ width: "100%", background: "#3B1F5E", color: "#FBF3F8", border: "none", borderRadius: "10px", padding: "12px", fontSize: "13.5px", cursor: "pointer", fontWeight: 500 }}>
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {screen === "form" && (
        <div style={{ padding: "16px 18px" }}>
          <button onClick={() => setScreen("cart")} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#3B1F5E", fontSize: "12.5px", cursor: "pointer", padding: 0, marginBottom: "14px" }}>
            <ChevronLeft size={15} /> Back to cart
          </button>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: 600, color: "#241934", margin: "0 0 14px" }}>Your details</p>

          <label style={{ fontSize: "11.5px", color: "#6B5B73", fontWeight: 500 }}>Full name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={{ width: "100%", border: "1px solid " + (formErrors.name ? "#D06A64" : "#E8CFE0"), borderRadius: "9px", padding: "10px 12px", fontSize: "13px", margin: "5px 0 3px", background: "#fff", color: "#241934" }} />
          {formErrors.name && <p style={{ fontSize: "10.5px", color: "#A3403B", margin: "0 0 10px" }}>{formErrors.name}</p>}

          <label style={{ fontSize: "11.5px", color: "#6B5B73", fontWeight: 500 }}>Shipping address</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address, city, country" rows={3} style={{ width: "100%", border: "1px solid " + (formErrors.address ? "#D06A64" : "#E8CFE0"), borderRadius: "9px", padding: "10px 12px", fontSize: "13px", margin: "5px 0 3px", background: "#fff", color: "#241934", resize: "none", fontFamily: "inherit" }} />
          {formErrors.address && <p style={{ fontSize: "10.5px", color: "#A3403B", margin: "0 0 10px" }}>{formErrors.address}</p>}

          <label style={{ fontSize: "11.5px", color: "#6B5B73", fontWeight: 500 }}>Phone number (WhatsApp)</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 xxxxx xxxxx" style={{ width: "100%", border: "1px solid " + (formErrors.phone ? "#D06A64" : "#E8CFE0"), borderRadius: "9px", padding: "10px 12px", fontSize: "13px", margin: "5px 0 3px", background: "#fff", color: "#241934" }} />
          {formErrors.phone && <p style={{ fontSize: "10.5px", color: "#A3403B", margin: "0 0 10px" }}>{formErrors.phone}</p>}

          <button onClick={submitCart} style={{ width: "100%", background: "#3B1F5E", color: "#FBF3F8", border: "none", borderRadius: "10px", padding: "12px", fontSize: "13.5px", cursor: "pointer", fontWeight: 500, marginTop: "10px" }}>
            Send my picks to Alfa Collection
          </button>
        </div>
      )}
    </div>
  );
}