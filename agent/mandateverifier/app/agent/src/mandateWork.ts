/**
 * Mandate work hook. Replaces free-form LLM work with deterministic verification.
 *
 * Every paid path (ERC-8183 delivery and x402) calls runWork(prompt). We pull
 * { mandate, transactionHash } out of the prompt, run the fixed checks in
 * ./mandate/checks.ts, and return the verdict as JSON. The LLM is only asked to
 * rewrite the plain-English `report` from the finished check results; it can
 * never change `pass` or any check. If the LLM fails, the deterministic report stays.
 */
import type { Hex } from "viem";
import type { RunWork } from "./sellerCore.js";
import { verifyMandate, type Summarizer } from "./mandate/verify.js";
import type { Mandate, Verdict } from "./mandate/types.js";

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

interface MandateRequest {
  mandate: Mandate;
  transactionHash: Hex;
}

function tryParse(text: unknown): unknown {
  if (typeof text !== "string") return text;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Depth-limited search for an object carrying both `mandate` and `transactionHash`. */
function findRequest(value: unknown, depth = 0): MandateRequest | null {
  if (depth > 5 || value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return findRequest(tryParse(trimmed), depth + 1);
    return null;
  }
  if (typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const mandate = typeof obj.mandate === "string" ? tryParse(obj.mandate) : obj.mandate;
  const hash = obj.transactionHash ?? obj.txHash ?? obj.transaction_hash;
  if (mandate && typeof mandate === "object" && typeof hash === "string" && HASH_RE.test(hash)) {
    return { mandate: mandate as Mandate, transactionHash: hash as Hex };
  }
  for (const v of Object.values(obj)) {
    const found = findRequest(v, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Extract the request from a raw prompt (x402 body) or the ERC-8183 "JOB CONTEXT:" prompt. */
export function extractMandateRequest(prompt: string): MandateRequest | null {
  const direct = findRequest(prompt);
  if (direct) return direct;
  const marker = prompt.indexOf("JOB CONTEXT:");
  if (marker >= 0) return findRequest(prompt.slice(marker + "JOB CONTEXT:".length));
  const brace = prompt.indexOf("{");
  return brace >= 0 ? findRequest(prompt.slice(brace)) : null;
}

/** Wrap the scaffold's LLM runWork so it only ever writes the summary. */
export function buildMandateRunWork(llm: RunWork | null): RunWork {
  return async (prompt, opts) => {
    const req = extractMandateRequest(prompt);
    if (!req) {
      return JSON.stringify({
        error:
          'Mandate expects JSON {"mandate": {...}, "transactionHash": "0x..."}. ' +
          "See shared/mandate.demo.json in the repo for the mandate format.",
      });
    }
    const summarize: Summarizer | undefined = llm
      ? async (checks, pass) => {
          const text = await llm(
            "Write a 1-2 sentence plain-English summary for a non-technical buyer of this " +
              "trade-verification result. Do not change the verdict. Do not add facts. " +
              `Verdict: ${pass ? "PASS" : "FAIL"}. Checks: ${JSON.stringify(checks)}`,
            opts,
          );
          if (!text || text.length > 600) throw new Error("unusable summary");
          return text;
        }
      : undefined;
    const verdict: Verdict = await verifyMandate(req.mandate, req.transactionHash, summarize);
    return JSON.stringify(verdict);
  };
}

/** Free verification (no LLM, no payment) for the website's live demo route. */
export async function verifyFree(body: unknown): Promise<Verdict> {
  const req = findRequest(body);
  if (!req) throw new Error('need {"mandate": {...}, "transactionHash": "0x..."}');
  return verifyMandate(req.mandate, req.transactionHash);
}
