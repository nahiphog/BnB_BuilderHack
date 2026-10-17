// POST /api/verify  { mandate, transactionHash }  ->  Verdict
// Run: npm run serve   (PORT defaults to 8787)
import { createServer } from "node:http";
import type { Hex } from "viem";
import { verifyMandate } from "./verify.ts";
import type { Mandate } from "./types.ts";

const PORT = Number(process.env.PORT ?? 8787);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

createServer(async (req, res) => {
  if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
  if (req.method === "GET" && req.url === "/health") return res.writeHead(200, cors).end("ok");
  if (req.method !== "POST" || req.url !== "/api/verify") return res.writeHead(404, cors).end();
  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    const { mandate, transactionHash } = JSON.parse(body) as { mandate: Mandate; transactionHash: Hex };
    if (!mandate || !/^0x[0-9a-fA-F]{64}$/.test(transactionHash ?? "")) throw new Error("need { mandate, transactionHash }");
    const verdict = await verifyMandate(mandate, transactionHash);
    res.writeHead(200, { ...cors, "content-type": "application/json" }).end(JSON.stringify(verdict));
  } catch (err) {
    res.writeHead(400, { ...cors, "content-type": "application/json" }).end(JSON.stringify({ error: (err as Error).message }));
  }
}).listen(PORT, () => console.log(`Mandate verifier on http://localhost:${PORT}/api/verify`));
