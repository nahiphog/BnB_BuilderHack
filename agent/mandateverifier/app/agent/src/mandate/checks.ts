import { decodeFunctionData, formatUnits, getAddress, type Address, type Hex } from "viem";
import { routerAbi, TRANSFER_TOPIC } from "./pancakeV2.js";
import type { Check, Mandate, TxEvidence } from "./types.js";

const eq = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const topicToAddress = (t?: Hex): Address | null => (t && t.length === 66 ? getAddress(`0x${t.slice(26)}`) : null);

interface DecodedSwap {
  fn: string;
  amountIn: bigint | null; // null for ETH variants (amount comes from tx.value)
  amountOutMin: bigint;
  path: Address[];
  to: Address;
  deadline: bigint;
  payable: boolean;
}

export function decodeSwap(input: Hex): DecodedSwap | null {
  try {
    const { functionName, args } = decodeFunctionData({ abi: routerAbi, data: input });
    const a = args as readonly unknown[];
    if (functionName.startsWith("swapExactETH")) {
      return {
        fn: functionName,
        amountIn: null,
        amountOutMin: a[0] as bigint,
        path: [...(a[1] as Address[])],
        to: a[2] as Address,
        deadline: a[3] as bigint,
        payable: true,
      };
    }
    return {
      fn: functionName,
      amountIn: a[0] as bigint,
      amountOutMin: a[1] as bigint,
      path: [...(a[2] as Address[])],
      to: a[3] as Address,
      deadline: a[4] as bigint,
      payable: false,
    };
  } catch {
    return null;
  }
}

/** Sum of ERC-20 Transfer amounts in THIS transaction's logs, filtered by token and optional from/to. */
function sumTransfers(ev: TxEvidence, token: Address, opts: { from?: Address; to?: Address }): bigint {
  let total = 0n;
  for (const log of ev.logs) {
    if (!eq(log.address, token) || !eq(log.topics[0], TRANSFER_TOPIC)) continue;
    const from = topicToAddress(log.topics[1]);
    const to = topicToAddress(log.topics[2]);
    if (opts.from && !eq(from, opts.from)) continue;
    if (opts.to && !eq(to, opts.to)) continue;
    total += BigInt(log.data === "0x" ? 0 : log.data);
  }
  return total;
}

/**
 * Deterministic verdict. No network, no LLM. Every check reads the SAME transaction's data.
 * Overall pass = every check passes.
 */
export function runChecks(m: Mandate, ev: TxEvidence): Check[] {
  const checks: Check[] = [];
  const fmtIn = (x: bigint) => formatUnits(x, ev.decimals.tokenIn);
  const fmtOut = (x: bigint) => formatUnits(x, ev.decimals.tokenOut);

  // 1. Succeeded on the configured network
  const okChain = ev.chainId === m.chainId;
  checks.push({
    name: "transactionSucceeded",
    pass: ev.status === "success" && okChain,
    evidence: `receipt.status=${ev.status === "success" ? 1 : 0}, chainId=${ev.chainId}${okChain ? "" : ` (expected ${m.chainId})`}, block ${ev.blockNumber}`,
  });

  // 2. Called an allowlisted router
  const routerOk = m.allowedRouters.some((r) => eq(r, ev.to));
  checks.push({
    name: "routerAllowed",
    pass: routerOk,
    evidence: routerOk ? `${ev.to}` : `called ${ev.to ?? "contract creation"}, allowed: ${m.allowedRouters.join(", ")}`,
  });

  // 3. Allowlisted function, decoded
  const selector = ev.input.slice(0, 10) as Hex;
  const selectorOk = m.allowedSelectors.some((s) => eq(s, selector));
  const swap = decodeSwap(ev.input);
  checks.push({
    name: "selectorAllowed",
    pass: selectorOk && !!swap,
    evidence: swap
      ? `${selector} ${swap.fn}${selectorOk ? "" : " (selector not allowlisted)"}`
      : `${selector} could not be decoded as a supported swap`,
  });

  // 4. Decoded params match the mandate
  if (swap) {
    const problems: string[] = [];
    if (!eq(swap.path[0], m.tokenIn)) problems.push(`tokenIn ${swap.path[0]} != ${m.tokenIn}`);
    if (!eq(swap.path[swap.path.length - 1], m.tokenOut))
      problems.push(`tokenOut ${swap.path[swap.path.length - 1]} != ${m.tokenOut}`);
    if (!eq(swap.to, m.recipient)) problems.push(`recipient ${swap.to} != ${m.recipient}`);
    if (swap.deadline > BigInt(m.deadline)) problems.push(`swap deadline ${swap.deadline} > mandate ${m.deadline}`);
    checks.push({
      name: "paramsMatch",
      pass: problems.length === 0,
      evidence: problems.length ? problems.join("; ") : `tokenIn, tokenOut, recipient, deadline match (path ${swap.path.length} hops)`,
    });
  } else {
    checks.push({ name: "paramsMatch", pass: false, evidence: "no decoded swap to compare" });
  }

  // 5. Actual input within cap. Prefer what actually moved on-chain over what the calldata claims.
  const cap = BigInt(m.maxAmountIn);
  let spent: bigint | null = null;
  let source = "";
  if (swap?.payable) {
    spent = ev.value;
    source = "tx.value";
  } else if (swap) {
    const moved = sumTransfers(ev, m.tokenIn, { from: ev.from });
    spent = moved > 0n ? moved : swap.amountIn;
    source = moved > 0n ? "Transfer logs from executor" : "decoded amountIn";
  }
  checks.push({
    name: "amountWithinCap",
    pass: spent !== null && spent <= cap,
    evidence: spent === null ? "input amount unknown" : `${fmtIn(spent)} <= ${fmtIn(cap)} (${source})`.replace("<=", spent <= cap ? "<=" : ">"),
  });

  // 6. Exact tokenOut contract delivered to the recipient in THIS transaction
  const received = sumTransfers(ev, m.tokenOut, { to: m.recipient });
  checks.push({
    name: "tokenOutMatches",
    pass: received > 0n,
    evidence: received > 0n ? `${fmtOut(received)} of ${m.tokenOut} to ${m.recipient}` : `no Transfer of ${m.tokenOut} to ${m.recipient} in this tx`,
  });

  // Stretch checks (cheap and deterministic, so included)
  checks.push({
    name: "executorMatches",
    pass: eq(ev.from, m.executor),
    evidence: eq(ev.from, m.executor) ? `${ev.from}` : `sent by ${ev.from}, mandate executor ${m.executor}`,
  });
  checks.push({
    name: "beforeDeadline",
    pass: ev.blockTimestamp <= BigInt(m.deadline),
    evidence: `block time ${ev.blockTimestamp} ${ev.blockTimestamp <= BigInt(m.deadline) ? "<=" : ">"} ${m.deadline}`,
  });
  const minOut = BigInt(m.minimumAmountOut || "0");
  checks.push({
    name: "minimumOutputMet",
    pass: received >= minOut,
    evidence: `${fmtOut(received)} ${received >= minOut ? ">=" : "<"} ${fmtOut(minOut)}`,
  });

  return checks;
}

const LABELS: Record<Check["name"], string> = {
  transactionSucceeded: "the transaction did not succeed on BSC testnet",
  routerAllowed: "it used a router that was not approved",
  selectorAllowed: "it called a swap function that was not approved",
  paramsMatch: "the swap settings did not match the mandate",
  amountWithinCap: "it spent more than the cap",
  tokenOutMatches: "the approved token was not delivered to the buyer",
  executorMatches: "it was sent by a different executor",
  beforeDeadline: "it happened after the deadline",
  minimumOutputMet: "the buyer received less than the minimum",
};

/** Plain-English fallback report, used when no LLM is available. Never decides pass/fail. */
export function plainReport(checks: Check[]): string {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length === 0)
    return `All ${checks.length} checks passed. The executor completed the approved swap within the buyer's rules and qualifies for payment.`;
  const reasons = failed.map((c) => LABELS[c.name]);
  return `This trade broke ${failed.length} of ${checks.length} rules: ${reasons.join("; ")}. The executor does not qualify for payment and the buyer's escrow stays protected.`;
}
