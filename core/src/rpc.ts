/**
 * BSC testnet RPC picker. Venue Wi-Fi often blocks port 8545, so port-443 endpoints come first.
 * Override with BSC_TESTNET_RPC=https://... if you have a better one.
 */
export const RPC_CANDIDATES = [
  "https://bsc-testnet-rpc.publicnode.com",
  "https://bsc-testnet.bnbchain.org",
  "https://bsc-testnet.drpc.org",
  "https://bsc-testnet.public.blastapi.io",
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
];

let picked: string | null = null;

async function answers97(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await res.json()) as { result?: string };
    return json.result === "0x61";
  } catch {
    return false;
  }
}

/** First endpoint that answers chainId 97 within 6 seconds. Cached for the process. */
export async function pickRpc(log = false): Promise<string> {
  if (picked) return picked;
  const list = process.env.BSC_TESTNET_RPC ? [process.env.BSC_TESTNET_RPC, ...RPC_CANDIDATES] : RPC_CANDIDATES;
  for (const url of list) {
    if (await answers97(url, 6000)) {
      if (log) console.log(`Using RPC ${url}`);
      picked = url;
      return url;
    }
    if (log) console.log(`  RPC not reachable: ${url}`);
  }
  throw new Error(
    "No BSC testnet RPC reachable from this network. Try your phone hotspot, or set BSC_TESTNET_RPC to an endpoint a mentor gives you.",
  );
}
