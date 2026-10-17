import mandateJson from "../../shared/mandate.demo.json";
import failVerdictJson from "../../shared/verdict.fail.json";
import passVerdictJson from "../../shared/verdict.pass.json";
import type { Mandate, SharedMandate, SharedVerdict, VerificationVerdict } from "./types";

export const demoMandate = mandateJson as SharedMandate;

const labels: Record<string, string> = {
  transactionSucceeded: "Transaction succeeded",
  routerAllowed: "Approved router",
  selectorAllowed: "Approved swap method",
  paramsMatch: "Mandate parameters match",
  amountWithinCap: "Spend cap respected",
  tokenOutMatches: "Asset received",
  executorMatches: "Approved executor",
  beforeDeadline: "Before deadline",
  minimumOutputMet: "Minimum output met"
};

export function toDisplayVerdict(verdict: SharedVerdict): VerificationVerdict {
  return {
    mandateId: verdict.mandateId,
    transactionHash: verdict.transactionHash,
    pass: verdict.pass,
    verifiedAt: new Date(verdict.verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    network: "BSC Testnet",
    report: verdict.report,
    checks: verdict.checks.map((check) => ({
      name: labels[check.name] ?? check.name,
      expected: "Rule must pass",
      actual: check.evidence,
      pass: check.pass
    }))
  };
}

// These are the real deterministic verifier reports shared with /core.
export const goodVerdict = toDisplayVerdict(passVerdictJson as SharedVerdict);
export const failedVerdict = toDisplayVerdict(failVerdictJson as SharedVerdict);

export const mandates: Mandate[] = [
  { id: "M-001", title: "Mandate awaiting execution", tokenIn: "tBNB", tokenOut: "BUSD", maxAmountIn: "0.01 tBNB", allowedRouter: "PancakeSwap V2 Testnet", deadline: "BSC Testnet demo", executor: "0x14e8…9c1f", status: "executing" },
  { id: "M-001", title: "Honest bounded swap", tokenIn: "tBNB", tokenOut: "BUSD", maxAmountIn: "0.01 tBNB", allowedRouter: "PancakeSwap V2 Testnet", deadline: "BSC Testnet demo", executor: "0x14e8…9c1f", status: "verified", transactionHash: goodVerdict.transactionHash },
  { id: "M-001", title: "Overspend attempt", tokenIn: "tBNB", tokenOut: "BUSD", maxAmountIn: "0.01 tBNB", allowedRouter: "PancakeSwap V2 Testnet", deadline: "BSC Testnet demo", executor: "0x14e8…9c1f", status: "failed", transactionHash: failedVerdict.transactionHash }
];
