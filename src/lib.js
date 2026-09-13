export const THEMES = ["All", "Floral", "Festive", "Bridal", "Everyday"];

export const SWATCHES = [
  "linear-gradient(135deg,#f0dcd8,#e2b8ae)",
  "linear-gradient(135deg,#3f5b4f,#7d9c8a)",
  "linear-gradient(135deg,#f7f1e8,#d9c7a8)",
  "linear-gradient(135deg,#e4dcec,#b6a3cf)",
  "linear-gradient(135deg,#5c1f2b,#8a3b46)",
  "linear-gradient(135deg,#dce8f0,#a9c6dc)",
  "linear-gradient(135deg,#e2e8dc,#b7c9a6)",
  "linear-gradient(135deg,#f3e6cc,#d1ab6b)",
];

export const INITIAL_PRODUCTS = [
  { id: 1, name: "Blush Rose Ruffle", theme: "Floral", price: 4200, sale: false, pattern: SWATCHES[0] },
  { id: 2, name: "Emerald Zari Rida", theme: "Festive", price: 6800, sale: true, salePrice: 5600, pattern: SWATCHES[1] },
  { id: 3, name: "Ivory Pearl Georgette", theme: "Bridal", price: 8900, sale: false, pattern: SWATCHES[2] },
  { id: 4, name: "Dusty Lilac Ruffle", theme: "Floral", price: 4500, sale: false, pattern: SWATCHES[3] },
  { id: 5, name: "Wine Velvet Rida", theme: "Festive", price: 7200, sale: false, pattern: SWATCHES[4] },
  { id: 6, name: "Sky Blue Chikankari", theme: "Everyday", price: 3800, sale: true, salePrice: 3200, pattern: SWATCHES[5] },
  { id: 7, name: "Sage Green Aesthetic", theme: "Everyday", price: 3600, sale: false, pattern: SWATCHES[6] },
  { id: 8, name: "Champagne Gold Rida", theme: "Bridal", price: 9600, sale: false, pattern: SWATCHES[7] },
];

// Demo login only. Real deployment must move this behind a real backend
// with hashed passwords and a proper session/token, never a hardcoded
// client-side check like this one.
export const ADMIN_CREDENTIALS = { username: "alfa", password: "alfa2026" };

const PRODUCTS_KEY = "ac_demo_products";
const CARTS_KEY = "ac_demo_carts";
const ADMIN_SESSION_KEY = "ac_demo_admin_session";

export function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  } catch (e) {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {}
}

export function loadCarts() {
  try {
    const raw = localStorage.getItem(CARTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveCarts(carts) {
  try {
    localStorage.setItem(CARTS_KEY, JSON.stringify(carts));
  } catch (e) {}
}

export function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminLoggedIn(value) {
  if (value) sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function fileToResizedDataUrl(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function money(n) {
  return "\u20b9" + Number(n || 0).toLocaleString("en-IN");
}

export function makeCartId(existingIds) {
  let id;
  do {
    id = "AC-" + Math.floor(1000 + Math.random() * 9000);
  } while (existingIds.includes(id));
  return id;
}

export function cartTotal(cart) {
  return cart.items.reduce((sum, i) => sum + (i.sale ? i.salePrice : i.price) * i.qty, 0);
}

export function buildWhatsappMessage(cart) {
  const lines = cart.items.map(
    (i) => `- ${i.name}${i.qty > 1 ? " x" + i.qty : ""} - ${money((i.sale ? i.salePrice : i.price) * i.qty)}`
  );
  return (
    `Assalamualaikum ${cart.customer.name}!\n\n` +
    `Thank you for your picks from Alfa Collection. Here's what you selected:\n\n` +
    lines.join("\n") +
    `\n\nTotal: ${money(cartTotal(cart))}\n\n` +
    `Shipping to: ${cart.customer.address}\n` +
    `Contact: ${cart.customer.phone}\n\n` +
    `I'll confirm sizing and stitching details right here on WhatsApp. JazakAllah Khair!`
  );
}