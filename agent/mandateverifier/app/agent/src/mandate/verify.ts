import { createPublicClient, erc20Abi, http, type Address, type Hex, type PublicClient } from "viem";
import { bscTestnet } from "viem/chains";
import { plainReport, runChecks } from "./checks.js";
import { pickRpc } from "./rpc.js";
import type { Mandate, TxEvidence, Verdict } from "./types.js";

let _client: PublicClient | null = null;
async function getClient(): Promise<PublicClient> {
  if (!_client) _client = createPublicClient({ chain: bscTestnet, transport: http(await pickRpc(), { timeout: 15_000, retryCount: 2 }) }) as PublicClient;
  return _client;
}

async function decimalsOf(token: Address): Promise<number> {
  const client = await getClient();
  try {
    return await client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" });
  } catch {
    return 18;
  }
}

/** Fetch everything the checks need for ONE transaction hash. */
export async function fetchEvidence(hash: Hex, m: Mandate): Promise<TxEvidence> {
  const client = await getClient();
  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash }),
    client.getTransactionReceipt({ hash }),
  ]);
  const [block, dIn, dOut] = await Promise.all([
    client.getBlock({ blockNumber: receipt.blockNumber }),
    decimalsOf(m.tokenIn),
    decimalsOf(m.tokenOut),
  ]);
  return {
    hash,
    chainId: tx.chainId ?? (await client.getChainId()),
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
}

/** Optional: let an LLM rewrite the summary. It only sees results; it cannot change pass. */
export type Summarizer = (checks: Verdict["checks"], pass: boolean) => Promise<string>;

export async function verifyMandate(m: Mandate, hash: Hex, summarize?: Summarizer): Promise<Verdict> {
  let checks;
  try {
    checks = runChecks(m, await fetchEvidence(hash, m));
  } catch (err) {
    checks = [
      {
        name: "transactionSucceeded" as const,
        pass: false,
        evidence: `could not load ${hash} from BSC testnet: ${(err as Error).message.split("\n")[0]}`,
      },
    ];
  }
  const pass = checks.every((c) => c.pass);
  let report = plainReport(checks);
  if (summarize) {
    try {
      report = await summarize(checks, pass);
    } catch {
      /* keep the deterministic report */
    }
  }
  return {
    mandateId: m.mandateId,
    transactionHash: hash,
    pass,
    checks,
    report,
    verifiedAt: new Date().toISOString(),
  };
}
