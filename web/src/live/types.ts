import type { Address, Hex } from "viem";

/** Matches /shared/mandate.example.json. Amounts are wei strings. */
export interface Mandate {
  mandateId: string;
  buyer: Address;
  executor: Address;
  jobId: string;
  chainId: number;
  action: "buy";
  tokenIn: Address;
  tokenOut: Address;
  recipient: Address;
  allowedRouters: Address[];
  allowedSelectors: Hex[];
  maxAmountIn: string;
  minimumAmountOut: string;
  quotedAmountOut?: string;
  quoteTimestamp?: string;
  maxSlippageBps?: number;
  /** Unix seconds */
  deadline: number;
  executorFee: string;
}

export interface Check {
  name: CheckName;
  pass: boolean;
  evidence: string;
}

export type CheckName =
  | "transactionSucceeded"
  | "routerAllowed"
  | "selectorAllowed"
  | "paramsMatch"
  | "amountWithinCap"
  | "tokenOutMatches"
  | "executorMatches"
  | "beforeDeadline"
  | "minimumOutputMet";

/** Matches /shared/verdict.*.json */
export interface Verdict {
  mandateId: string;
  transactionHash: Hex;
  pass: boolean;
  checks: Check[];
  report: string;
  verifiedAt: string;
}

/** Everything the checks need, already fetched from the chain. Pure data, so it's easy to test. */
export interface TxEvidence {
  hash: Hex;
  chainId: number;
  from: Address;
  to: Address | null;
  input: Hex;
  value: bigint;
  status: "success" | "reverted";
  blockNumber: bigint;
  blockTimestamp: bigint;
  logs: { address: Address; topics: Hex[]; data: Hex }[];
  decimals: { tokenIn: number; tokenOut: number };
}
