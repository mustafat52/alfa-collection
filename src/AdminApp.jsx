import React, { useState, useRef } from "react";
import { Store, Users, Tag, ImagePlus, Copy, Check, ChevronLeft, Lock, LogOut, X, Camera, Eye } from "lucide-react";
import {
  THEMES,
  SWATCHES,
  ADMIN_CREDENTIALS,
  loadProducts,
  saveProducts,
  loadCarts,
  isAdminLoggedIn,
  setAdminLoggedIn,
  money,
  cartTotal,
  buildWhatsappMessage,
  fileToResizedDataUrl,
} from "./lib.js";

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setAdminLoggedIn(true);
      onLogin();
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className="alfa-shell" style={{ maxWidth: "380px", minHeight: "500px" }}>
      <div style={{ background: "#241934", padding: "36px 24px 28px", textAlign: "center", paddingTop: "calc(36px + env(safe-area-inset-top))" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#3f2a5c", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <Lock size={18} color="#FBF3F8" />
        </div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#FBF3F8", margin: 0, fontWeight: 600 }}>Alfa Collection</p>
        <p style={{ fontSize: "12px", color: "#D9C3D6", margin: "4px 0 0" }}>Your dashboard, sign in to continue</p>
      </div>
      <form onSubmit={submit} style={{ padding: "26px 22px" }}>
        <label style={{ fontSize: "11.5px", color: "#6B5B73", fontWeight: 500 }}>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", border: "1px solid #E8CFE0", borderRadius: "9px", padding: "10px 12px", fontSize: "13px", margin: "5px 0 14px", background: "#fff", color: "#241934" }} />
        <label style={{ fontSize: "11.5px", color: "#6B5B73", fontWeight: 500 }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", border: "1px solid #E8CFE0", borderRadius: "9px", padding: "10px 12px", fontSize: "13px", margin: "5px 0 6px", background: "#fff", color: "#241934" }} />
        {error && <p style={{ fontSize: "11px", color: "#A3403B", margin: "4px 0 10px" }}>{error}</p>}
        <button type="submit" style={{ width: "100%", background: "#3B1F5E", color: "#FBF3F8", border: "none", borderRadius: "10px", padding: "12px", fontSize: "13.5px", cursor: "pointer", fontWeight: 500, marginTop: "10px" }}>
          Sign in
        </button>
        <p style={{ fontSize: "10.5px", color: "#B3A0BB", textAlign: "center", marginTop: "14px", lineHeight: 1.5 }}>
          Demo login &mdash; username <b>alfa</b>, password <b>alfa2026</b>
        </p>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());
  const [products, setProductsState] = useState(() => loadProducts());
  const [carts, setCartsState] = useState(() => loadCarts());
  const [openCartId, setOpenCartId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", theme: "Floral", price: "", pattern: SWATCHES[0], images: [] });
  const [addError, setAddError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoEditId, setPhotoEditId] = useState(null);
  const newProductFileInput = useRef(null);
  const existingProductFileInput = useRef(null);

  function setProducts(updater) {
    setProductsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveProducts(next);
      return next;
    });
  }

  function refreshCarts() {
    setCartsState(loadCarts());
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  const cartList = Object.entries(carts).sort((a, b) => b[1].createdAt - a[1].createdAt);
  const submittedList = cartList; // every stored cart was, by definition, sent

  function toggleSale(id) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, sale: !p.sale, salePrice: p.salePrice || Math.round(p.price * 0.85) } : p)));
  }

  function editPrice(id, val) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, price: Number(val) || p.price } : p)));
  }

  function addProduct() {
    if (!newProduct.name.trim() || !newProduct.price) {
      setAddError("Add a name and a price first.");
      return;
    }
    const id = Math.max(0, ...products.map((p) => p.id)) + 1;
    setProducts((ps) => [...ps, { id, name: newProduct.name.trim(), theme: newProduct.theme, price: Number(newProduct.price), sale: false, pattern: newProduct.pattern, images: newProduct.images }]);
    setNewProduct({ name: "", theme: "Floral", price: "", pattern: SWATCHES[0], images: [] });
    setAddError("");
    setShowAddForm(false);
  }

  async function handleNewProductFiles(fileList) {
    setUploading(true);
    try {
      const files = Array.from(fileList).slice(0, 6);
      const dataUrls = await Promise.all(files.map((f) => fileToResizedDataUrl(f)));
      setNewProduct((np) => ({ ...np, images: [...np.images, ...dataUrls] }));
    } catch (e) {
      setAddError("Couldn't read that photo, try a different one.");
    } finally {
      setUploading(false);
    }
  }

  function removeNewProductImage(index) {
    setNewProduct((np) => ({ ...np, images: np.images.filter((_, i) => i !== index) }));
  }

  async function handleExistingProductFiles(id, fileList) {
    setUploading(true);
    try {
      const files = Array.from(fileList).slice(0, 6);
      const dataUrls = await Promise.all(files.map((f) => fileToResizedDataUrl(f)));
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, images: [...(p.images || []), ...dataUrls] } : p)));
    } catch (e) {
      // silently ignore a bad file in this demo
    } finally {
      setUploading(false);
    }
  }

  function removeExistingProductImage(id, index) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, images: (p.images || []).filter((_, i) => i !== index) } : p)));
  }

  function copyMessage(id, cart) {
    const text = buildWhatsappMessage(cart);
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {}
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 1500);
  }

  function logout() {
    setAdminLoggedIn(false);
    setLoggedIn(false);
  }

  const openCart = openCartId ? carts[openCartId] : null;

  return (
    <div className="alfa-shell">
      <div style={{ background: "#241934", padding: "20px", paddingTop: "calc(20px + env(safe-area-inset-top))", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "21px", fontWeight: 600, color: "#FBF3F8", margin: 0 }}>Your dashboard</p>
          <p style={{ fontSize: "11px", color: "#D9C3D6", margin: "2px 0 0" }}>{submittedList.length} cart{submittedList.length === 1 ? "" : "s"} sent so far</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => window.open("/", "_blank", "noopener")}
            title="See what customers see"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.28)", color: "#EADCE7", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "6px 10px", borderRadius: "999px", whiteSpace: "nowrap" }}
          >
            <Eye size={13} /> Browse store
          </button>
          <button onClick={logout} style={{ background: "none", border: "none", color: "#D9C3D6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", whiteSpace: "nowrap" }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      {openCart ? (
        <div style={{ padding: "16px 18px" }}>
          <button onClick={() => setOpenCartId(null)} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#3B1F5E", fontSize: "12.5px", cursor: "pointer", padding: 0, marginBottom: "14px" }}>
            <ChevronLeft size={15} /> All carts
          </button>
          <p style={{ fontSize: "11px", color: "#A99BB0", margin: "0 0 2px" }}>Cart ID</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#3B1F5E", margin: "0 0 14px" }}>{openCartId}</p>

          {openCart.customer && (
            <div style={{ background: "#fff", border: "1px solid #F0DCE6", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "12.5px", fontWeight: 500, color: "#241934" }}>{openCart.customer.name}</p>
              <p style={{ margin: "0 0 4px", fontSize: "11.5px", color: "#A99BB0" }}>{openCart.customer.phone}</p>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#A99BB0" }}>{openCart.customer.address}</p>
            </div>
          )}

          {openCart.items.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F7E9F0" }}>
              <span style={{ fontSize: "12px", color: "#241934" }}>{i.name} {i.qty > 1 ? "x" + i.qty : ""}</span>
              <span style={{ fontSize: "12px", color: "#3B1F5E", fontWeight: 500 }}>{money((i.sale ? i.salePrice : i.price) * i.qty)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 600, fontSize: "13px", color: "#241934" }}>
            <span>Total</span>
            <span>{money(cartTotal(openCart))}</span>
          </div>

          {openCart.customer && (
            <>
              <p style={{ fontSize: "11.5px", fontWeight: 500, color: "#6B5B73", margin: "12px 0 6px" }}>WhatsApp message, ready to send</p>
              <div style={{ background: "#fff", border: "1px solid #F0DCE6", borderRadius: "10px", padding: "12px", fontSize: "11.5px", color: "#241934", whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: "10px" }}>
                {buildWhatsappMessage(openCart)}
              </div>
              <button onClick={() => copyMessage(openCartId, openCart)} style={{ width: "100%", background: copiedId === openCartId ? "#F3D9E4" : "#3B1F5E", color: copiedId === openCartId ? "#3B1F5E" : "#FBF3F8", border: "none", borderRadius: "10px", padding: "11px", fontSize: "13px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {copiedId === openCartId ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy message</>}
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 10px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#3B1F5E", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <Users size={13} /> All carts
            </p>
            <button onClick={refreshCarts} style={{ fontSize: "10.5px", color: "#A99BB0", background: "none", border: "none", cursor: "pointer" }}>Refresh</button>
          </div>
          {cartList.length === 0 && <p style={{ fontSize: "12px", color: "#A99BB0" }}>No carts sent yet.</p>}
          {cartList.map(([id, c]) => (
            <button key={id} onClick={() => setOpenCartId(id)} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #F0DCE6", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: "#241934" }}>{id}</p>
                <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#A99BB0" }}>
                  {c.customer?.name} &middot; {c.items.length} item{c.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "999px", background: "#F3D9E4", color: "#3B1F5E", fontWeight: 500 }}>
                {money(cartTotal(c))}
              </span>
            </button>
          ))}

          <p style={{ fontSize: "12px", fontWeight: 600, color: "#3B1F5E", display: "flex", alignItems: "center", gap: "6px", margin: "20px 0 10px" }}>
            <Store size={13} /> Manage collection
          </p>

          {!showAddForm ? (
            <button onClick={() => setShowAddForm(true)} style={{ width: "100%", border: "1px dashed #C9A44C", background: "#F7EFDF", borderRadius: "10px", padding: "10px", fontSize: "12px", color: "#8a6a2e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "12px" }}>
              <ImagePlus size={13} /> Add new arrival
            </button>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #F0DCE6", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
              <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Rida name" style={{ width: "100%", border: "1px solid #E8CFE0", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", marginBottom: "8px", color: "#241934" }} />
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <select value={newProduct.theme} onChange={(e) => setNewProduct({ ...newProduct, theme: e.target.value })} style={{ flex: 1, border: "1px solid #E8CFE0", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#241934" }}>
                  {THEMES.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Price" style={{ width: "80px", border: "1px solid #E8CFE0", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#241934" }} />
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                {SWATCHES.map((s) => (
                  <button key={s} onClick={() => setNewProduct({ ...newProduct, pattern: s })} style={{ width: "22px", height: "22px", borderRadius: "6px", background: s, border: newProduct.pattern === s ? "2px solid #3B1F5E" : "1px solid #E8CFE0", cursor: "pointer" }} />
                ))}
              </div>

              <p style={{ fontSize: "10.5px", color: "#6B5B73", margin: "0 0 6px", fontWeight: 500 }}>Photos</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {newProduct.images.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: "46px", height: "46px", borderRadius: "7px", overflow: "hidden", border: "1px solid #E8CFE0" }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => removeNewProductImage(i)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(36,25,52,0.75)", border: "none", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => newProductFileInput.current?.click()}
                  style={{ width: "46px", height: "46px", borderRadius: "7px", border: "1px dashed #C9A44C", background: "#F7EFDF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <Camera size={16} color="#8a6a2e" />
                </button>
                <input
                  ref={newProductFileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files.length) handleNewProductFiles(e.target.files); e.target.value = ""; }}
                />
              </div>
              {uploading && <p style={{ fontSize: "10.5px", color: "#A99BB0", margin: "0 0 8px" }}>Processing photo...</p>}

              {addError && <p style={{ fontSize: "10.5px", color: "#A3403B", margin: "0 0 8px" }}>{addError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={addProduct} style={{ flex: 1, background: "#3B1F5E", color: "#FBF3F8", border: "none", borderRadius: "8px", padding: "9px", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>Add to collection</button>
                <button onClick={() => { setShowAddForm(false); setAddError(""); }} style={{ background: "#F7E9F0", color: "#6B5B73", border: "none", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="alfa-scroll">
            {products.map((p) => (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #F0DCE6", borderRadius: "10px", padding: "8px 10px", marginBottom: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt="" style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: p.pattern, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "11.5px", fontWeight: 500, color: "#241934", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                      <span style={{ fontSize: "10.5px", color: "#A99BB0" }}>{"\u20b9"}</span>
                      <input value={p.price} onChange={(e) => editPrice(p.id, e.target.value)} style={{ width: "64px", border: "1px solid #E8CFE0", borderRadius: "5px", padding: "3px 6px", color: "#241934" }} />
                    </div>
                  </div>
                  <button onClick={() => setPhotoEditId(photoEditId === p.id ? null : p.id)} style={{ background: photoEditId === p.id ? "#3B1F5E" : "#F3D9E4", border: "none", borderRadius: "7px", padding: "6px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Camera size={12} color={photoEditId === p.id ? "#FBF3F8" : "#3B1F5E"} />
                  </button>
                  <button onClick={() => toggleSale(p.id)} style={{ fontSize: "10px", padding: "5px 8px", borderRadius: "999px", border: "none", cursor: "pointer", background: p.sale ? "#3B1F5E" : "#F3D9E4", color: p.sale ? "#FBF3F8" : "#3B1F5E", display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap" }}>
                    <Tag size={9} /> {p.sale ? "On sale" : "Mark sale"}
                  </button>
                </div>

                {photoEditId === p.id && (
                  <div style={{ marginTop: "9px", paddingTop: "9px", borderTop: "1px solid #F0DCE6" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(p.images || []).map((src, i) => (
                        <div key={i} style={{ position: "relative", width: "42px", height: "42px", borderRadius: "7px", overflow: "hidden", border: "1px solid #E8CFE0" }}>
                          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button onClick={() => removeExistingProductImage(p.id, i)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(36,25,52,0.75)", border: "none", borderRadius: "50%", width: "15px", height: "15px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <X size={9} color="#fff" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => existingProductFileInput.current?.click()}
                        style={{ width: "42px", height: "42px", borderRadius: "7px", border: "1px dashed #C9A44C", background: "#F7EFDF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <ImagePlus size={14} color="#8a6a2e" />
                      </button>
                    </div>
                    {uploading && <p style={{ fontSize: "10px", color: "#A99BB0", margin: "6px 0 0" }}>Processing photo...</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <input
            ref={existingProductFileInput}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => { if (photoEditId && e.target.files.length) handleExistingProductFiles(photoEditId, e.target.files); e.target.value = ""; }}
          />
        </div>
      )}
    </div>
  );
}