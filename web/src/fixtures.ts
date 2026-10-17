import mandateJson from "../../shared/mandate.demo.json";
import failVerdictJson from "../../shared/verdict.fail.json";
import passVerdictJson from "../../shared/verdict.pass.json";
import type { Mandate, SharedMandate, SharedVerdict, VerificationVerdict } from "./types";

export const demoMandate = mandateJson as SharedMandate;

const clock = (unixSeconds: number) => new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
function amountFromEvidence(evidence: string) {
  const raw = evidence.match(/^(\d+(?:\.\d+)?)/)?.[1];
  if (!raw) return "Recorded";
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric.toFixed(4).replace(/\.?(0+)$/, "") : raw;
}

function expectedRule(name: string) {
  const rules: Record<string, string> = {
    transactionSucceeded: "Receipt status = success",
    routerAllowed: "PancakeSwap V2 Testnet",
    selectorAllowed: "swapExactETHForTokens",
    paramsMatch: "tBNB → BUSD to Encik Rahman",
    amountWithinCap: "≤ 0.01 tBNB",
    tokenOutMatches: "BUSD to Encik Rahman",
    executorMatches: "Approved executor",
    beforeDeadline: `Before ${clock(demoMandate.deadline)} MYT`,
    minimumOutputMet: "≥ 0 BUSD"
  };
  return rules[name] ?? "Mandate rule";
}

function readableEvidence(name: string, evidence: string) {
  if (name === "transactionSucceeded") return `Succeeded · BSC Testnet · block ${evidence.match(/block (\d+)/)?.[1] ?? "recorded"}`;
  if (name === "routerAllowed") return "PancakeSwap V2 Testnet";
  if (name === "selectorAllowed") return "swapExactETHForTokens";
  if (name === "paramsMatch") return "tBNB → BUSD · buyer received output";
  if (name === "amountWithinCap") return `${amountFromEvidence(evidence)} tBNB spent`;
  if (name === "tokenOutMatches" || name === "minimumOutputMet") return `${amountFromEvidence(evidence)} BUSD to Encik Rahman`;
  if (name === "executorMatches") return `Executor ${shortAddress(demoMandate.executor)}`;
  if (name === "beforeDeadline") {
    const m = evidence.match(/block time (\d+) (<=|>)/);
    return m ? `${clock(Number(m[1]))} MYT · ${m[2] === "<=" ? "before" : "after"} deadline` : evidence;
  }
  return evidence;
}

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
      expected: expectedRule(check.name),
      actual: readableEvidence(check.name, check.evidence),
      pass: check.pass
    })).sort((a, b) => Number(a.pass) - Number(b.pass))
  };
}

// These are the real deterministic verifier reports shared with /core.
export const goodVerdict = toDisplayVerdict(passVerdictJson as SharedVerdict);
export const failedVerdict = toDisplayVerdict(failVerdictJson as SharedVerdict);

export const mandates: Mandate[] = [
  { id: "M-001", title: "Mandate awaiting execution", tokenIn: "tBNB", tokenOut: "BUSD", maxAmountIn: "0.01 tBNB", allowedRouter: "PancakeSwap V2 Testnet", deadline: "BSC Testnet demo", executor: "0x14e8…9c1f", status: "executing" },
  { id: "M-002", title: "Honest bounded swap", tokenIn: "tBNB", tokenOut: "BUSD", maxAmountIn: "0.01 tBNB", allowedRouter: "PancakeSwap V2 Testnet", deadline: "BSC Testnet demo", executor: "0x14e8…9c1f", status: "verified", transactionHash: goodVerdict.transactionHash },
  { id: "M-003", title: "Overspend attempt", tokenIn: "tBNB", tokenOut: "BUSD", maxAmountIn: "0.01 tBNB", allowedRouter: "PancakeSwap V2 Testnet", deadline: "BSC Testnet demo", executor: "0x14e8…9c1f", status: "failed", transactionHash: failedVerdict.transactionHash }
];
