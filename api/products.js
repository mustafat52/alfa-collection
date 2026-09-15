// Shared product catalog storage, backed by Vercel KV. Without this, a
// price change or a new arrival added on one device never shows up on
// another — same root cause as the carts issue. See api/carts.js for the
// one-time Vercel KV setup step.
import { kv } from "@vercel/kv";

const KEY = "ac_products";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // null (not [] ) means "nothing saved yet" — the client seeds this
    // with its built-in starter catalog the first time.
    const products = await kv.get(KEY);
    return res.status(200).json(products);
  }

  if (req.method === "POST") {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Expected an array of products in the request body." });
    }
    await kv.set(KEY, products);
    return res.status(200).json(products);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
