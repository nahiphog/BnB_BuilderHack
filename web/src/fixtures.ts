import type { Mandate, VerificationVerdict } from "./types";

// Temporary local fixtures. Replace these imports with /shared fixtures once Hassan commits them.
export const mandates: Mandate[] = [
  { id: "M-204", title: "Bounded CAKE buy", tokenIn: "USDT", tokenOut: "CAKE", maxAmountIn: "5.00 USDT", allowedRouter: "PancakeSwap Testnet", deadline: "Today, 15:00", executor: "Alpha Executor", status: "executing" },
  { id: "M-203", title: "Verified CAKE buy", tokenIn: "USDT", tokenOut: "CAKE", maxAmountIn: "5.00 USDT", allowedRouter: "PancakeSwap Testnet", deadline: "Today, 14:45", executor: "Alpha Executor", status: "verified", transactionHash: "0xa8c1a9fa58b13f923f92" },
  { id: "M-202", title: "Rejected test swap", tokenIn: "USDT", tokenOut: "TEST", maxAmountIn: "5.00 USDT", allowedRouter: "PancakeSwap Testnet", deadline: "Today, 14:30", executor: "Test Runner", status: "failed", transactionHash: "0xbad4c31e55d90fa998e2" }
];

export const goodVerdict: VerificationVerdict = {
  mandateId: "M-203",
  transactionHash: "0xa8c1a9fa58b13f923f92",
  pass: true,
  verifiedAt: "14:42:16",
  network: "BSC Testnet",
  report: "The executor completed the approved swap within the amount cap using the mandated router.",
  checks: [
    { name: "Transaction succeeded", expected: "Receipt status = 1", actual: "Receipt status = 1", pass: true },
    { name: "Approved router", expected: "PancakeSwap Testnet", actual: "PancakeSwap Testnet", pass: true },
    { name: "Asset received", expected: "CAKE to buyer wallet", actual: "CAKE to buyer wallet", pass: true },
    { name: "Spend cap respected", expected: "≤ 5.00 USDT", actual: "4.98 USDT", pass: true }
  ]
};

export const failedVerdict: VerificationVerdict = {
  mandateId: "M-202",
  transactionHash: "0xbad4c31e55d90fa998e2",
  pass: false,
  verifiedAt: "14:31:05",
  network: "BSC Testnet",
  report: "Mandate rejected this swap. The transaction used a router outside the buyer's allowed list.",
  checks: [
    { name: "Transaction succeeded", expected: "Receipt status = 1", actual: "Receipt status = 1", pass: true },
    { name: "Approved router", expected: "PancakeSwap Testnet", actual: "Unknown router", pass: false },
    { name: "Asset received", expected: "TEST to buyer wallet", actual: "TEST to buyer wallet", pass: true },
    { name: "Spend cap respected", expected: "≤ 5.00 USDT", actual: "4.90 USDT", pass: true }
  ]
};
