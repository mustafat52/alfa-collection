// Shared cart storage, backed by Vercel KV — this is what makes a cart
// submitted on a customer's phone visible in the admin panel on any other
// device, instead of only the device that created it.
//
// Setup (one-time, in the Vercel dashboard):
//   Project -> Storage -> Create Database -> KV -> Connect to this project.
// That automatically adds the KV_REST_API_URL / KV_REST_API_TOKEN env vars
// this file needs. Redeploy after connecting it.
import { kv } from "@vercel/kv";

const KEY = "ac_carts";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const carts = (await kv.get(KEY)) || {};
    return res.status(200).json(carts);
  }

  if (req.method === "POST") {
    const { id, cart } = req.body || {};
    if (!id || !cart) {
      return res.status(400).json({ error: "Expected { id, cart } in the request body." });
    }
    const carts = (await kv.get(KEY)) || {};
    carts[id] = cart;
    await kv.set(KEY, carts);
    return res.status(200).json(carts);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
