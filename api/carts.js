// Shared cart storage, backed by Upstash Redis (via the Vercel Marketplace)
// — this is what makes a cart submitted on a customer's phone visible in
// the admin panel on any other device, instead of only the device that
// created it.
//
// Setup (one-time, in the Vercel dashboard):
//   Project -> Storage -> Marketplace Database Providers -> Upstash ->
//   create a Redis database -> Connect to this project.
// That automatically adds the KV_REST_API_URL / KV_REST_API_TOKEN (or
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, depending on how the
// integration names them) env vars this file needs. Redeploy after
// connecting it. (Vercel's own first-party "KV" product was discontinued
// in Dec 2024 and folded into this Upstash integration — same idea, new
// name, same one-time setup step.)
import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

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