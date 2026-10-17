// Usage: npm run verify -- <mandate.json> <txHash>
import { readFileSync } from "node:fs";
import type { Hex } from "viem";
import { verifyMandate } from "./verify.ts";
import type { Mandate } from "./types.ts";

const [mandatePath, hash] = process.argv.slice(2);
if (!mandatePath || !hash?.startsWith("0x")) {
  console.error("Usage: npm run verify -- <mandate.json> <0xTxHash>");
  process.exit(2);
}
const mandate = JSON.parse(readFileSync(mandatePath, "utf8")) as Mandate;
const verdict = await verifyMandate(mandate, hash as Hex);
for (const c of verdict.checks) console.error(`${c.pass ? "PASS" : "FAIL"}  ${c.name.padEnd(22)} ${c.evidence}`);
console.error(`\n${verdict.pass ? "VERDICT: PASS" : "VERDICT: FAIL"}  ${verdict.report}\n`);
console.log(JSON.stringify(verdict, null, 2));
process.exit(verdict.pass ? 0 : 1);
