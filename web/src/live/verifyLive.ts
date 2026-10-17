/**
 * Live verification in the browser. Same 9 deterministic checks as /core, reading
 * BSC testnet directly. Read-only: no wallet, no signing, no server.
 */
import { createPublicClient, erc20Abi, fallback, http, type Address, type Hex, type PublicClient } from "viem";
import { bscTestnet } from "viem/chains";
import { plainReport, runChecks } from "./checks";
import type { Check, Mandate, TxEvidence, Verdict } from "./types";

const RPCS = [
  "https://bsc-testnet-rpc.publicnode.com",
  "https://bsc-testnet.bnbchain.org",
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
];

let client: PublicClient | null = null;
function getClient(): PublicClient {
  client ??= createPublicClient({
    chain: bscTestnet,
    transport: fallback(RPCS.map((url) => http(url, { timeout: 10_000, retryCount: 1 }))),
  }) as PublicClient;
  return client;
}

export type LiveEvent =
  | { kind: "step"; text: string }
  | { kind: "done"; text: string }
  | { kind: "check"; check: Check }
  | { kind: "error"; text: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function decimalsOf(c: PublicClient, token: Address): Promise<number> {
  try {
    return await c.readContract({ address: token, abi: erc20Abi, functionName: "decimals" });
  } catch {
    return 18;
  }
}

export async function verifyLive(m: Mandate, hash: Hex, emit: (e: LiveEvent) => void): Promise<Verdict> {
  const c = getClient();

  emit({ kind: "step", text: "Connecting to BSC testnet…" });
  const chainId = await c.getChainId();
  emit({ kind: "done", text: `Connected to BSC testnet (chainId ${chainId})` });

  emit({ kind: "step", text: "Reading the transaction…" });
  const tx = await c.getTransaction({ hash });
  emit({ kind: "done", text: `Transaction found: sent by ${tx.from.slice(0, 8)}… to ${tx.to?.slice(0, 8) ?? "?"}…` });

  emit({ kind: "step", text: "Reading the receipt and token transfer logs…" });
  const receipt = await c.getTransactionReceipt({ hash });
  const [block, dIn, dOut] = await Promise.all([
    c.getBlock({ blockNumber: receipt.blockNumber }),
    decimalsOf(c, m.tokenIn),
    decimalsOf(c, m.tokenOut),
  ]);
  emit({ kind: "done", text: `Receipt read: block ${receipt.blockNumber}, ${receipt.logs.length} log entries` });

  const ev: TxEvidence = {
    hash,
    chainId: tx.chainId ?? chainId,
    from: tx.from,
    to: tx.to ?? null,
    input: tx.input,
    value: tx.value,
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    blockTimestamp: block.timestamp,
    logs: receipt.logs.map((l) => ({ address: l.address, topics: [...l.topics] as Hex[], data: l.data })),
    decimals: { tokenIn: dIn, tokenOut: dOut },
  };

  emit({ kind: "step", text: "Running the 9 fixed checks (code decides, not AI)…" });
  const checks = runChecks(m, ev);
  for (const check of checks) {
    await sleep(220);
    emit({ kind: "check", check });
  }
  const pass = checks.every((x) => x.pass);
  return {
    mandateId: m.mandateId,
    transactionHash: hash,
    pass,
    checks,
    report: plainReport(checks),
    verifiedAt: new Date().toISOString(),
  };
}
