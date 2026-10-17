/**
 * ONE COMMAND demo setup:  cd executor && npm run demo
 *
 * 1. Unlocks your Studio wallet (buyer/verifier) from ~/.studio without you typing any key.
 * 2. Creates a separate executor wallet (encrypted keystore in ~/bnbhack/executor-wallet, 0600).
 * 3. Sends it 0.05 tBNB.
 * 4. Finds a test token with WBNB liquidity on the PancakeSwap testnet router.
 * 5. Writes shared/mandate.demo.json.
 * 6. Makes the honest swap and the overspend swap.
 * 7. Verifies both and writes shared/verdict.pass.json + shared/verdict.fail.json (real data for the website).
 *
 * Safe to re-run: reuses the executor wallet and skips funding if it already has enough.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { Contract, JsonRpcProvider, Wallet, formatEther, parseEther, getAddress } from "ethers";
import { verifyMandate } from "../core/src/verify.ts";
import { pickRpc } from "../core/src/rpc.ts";
import type { Mandate } from "../core/src/types.ts";

const ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const CANDIDATE_TOKENS: Record<string, string> = {
  BUSD: "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7",
  CAKE: "0xFa60D973F7642B748046464e165A65B7323b0DEE",
  USDT: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684",
  DAI: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
  ETH: "0x8BaBbB98678facC7342735486C851ABD7A0d17Ca",
};
const CAP = parseEther("0.01");
const FUND = parseEther("0.05");
const ROOT = resolve(import.meta.dirname, "..");
const SHARED = join(ROOT, "shared");
const STUDIO = process.env.STUDIO_DIR ?? join(homedir(), ".studio");
const EXEC_DIR = join(homedir(), "bnbhack", "executor-wallet");

const step = (n: number, s: string) => console.log(`\n[${n}/7] ${s}`);
const fail = (s: string): never => {
  console.error(`\nSTOPPED: ${s}`);
  process.exit(1);
};

console.log("Finding a reachable BSC testnet RPC...");
let RPC = "";
try {
  RPC = await pickRpc(true);
} catch (e) {
  fail((e as Error).message);
}
const provider = new JsonRpcProvider(RPC, 97, { staticNetwork: true });
const gasPrice = async () => (await provider.getFeeData()).gasPrice ?? 10_000_000_000n;

// 1. Buyer / verifier wallet from Studio
step(1, "Unlocking your Studio wallet");
const envFile = join(STUDIO, ".env.local");
if (!existsSync(envFile)) fail(`No ${envFile}. Run from the Mac where you ran \`bag wallet new\`, or set STUDIO_DIR.`);
const pw = readFileSync(envFile, "utf8").match(/^WALLET_PASSWORD=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!pw) fail(`WALLET_PASSWORD not found in ${envFile}`);
const ksFiles = readdirSync(join(STUDIO, "wallets")).filter((f) => f.endsWith(".json"));
if (ksFiles.length === 0) fail(`No keystore in ${join(STUDIO, "wallets")}`);
const preferred = ksFiles.find((f) => f.toLowerCase().startsWith((process.env.BUYER_ADDRESS ?? "0x4a79").toLowerCase())) ?? ksFiles[0];
let buyer: Wallet;
try {
  buyer = (await Wallet.fromEncryptedJson(readFileSync(join(STUDIO, "wallets", preferred), "utf8"), pw!)).connect(provider) as Wallet;
} catch (e) {
  fail(`Could not unlock ${preferred}: ${(e as Error).message}. Paste this error to Claude.`);
}
const buyerBal = await provider.getBalance(buyer!.address);
console.log(`Buyer/verifier ${buyer!.address}  ${formatEther(buyerBal)} tBNB`);

// 2. Executor wallet
step(2, "Executor wallet");
mkdirSync(EXEC_DIR, { recursive: true });
const execKs = join(EXEC_DIR, "executor.keystore.json");
const execPwFile = join(EXEC_DIR, "PASSWORD");
let executor: Wallet;
if (existsSync(execKs) && existsSync(execPwFile)) {
  executor = (await Wallet.fromEncryptedJson(readFileSync(execKs, "utf8"), readFileSync(execPwFile, "utf8").trim())).connect(provider) as Wallet;
  console.log(`Reusing executor ${executor.address}`);
} else {
  const fresh = Wallet.createRandom();
  const execPw = randomBytes(24).toString("hex");
  writeFileSync(execPwFile, execPw + "\n", { mode: 0o600 });
  writeFileSync(execKs, await fresh.encrypt(execPw), { mode: 0o600 });
  chmodSync(execKs, 0o600);
  executor = new Wallet(fresh.privateKey, provider);
  console.log(`Created executor ${executor.address} (keystore + password in ${EXEC_DIR}, never commit these)`);
}

// 3. Fund executor
step(3, "Funding executor");
let execBal = await provider.getBalance(executor.address);
const needed = CAP * 2n + CAP / 2n + parseEther("0.006");
if (execBal >= needed) {
  console.log(`Executor already has ${formatEther(execBal)} tBNB, skipping`);
} else {
  if (buyerBal < FUND + parseEther("0.002")) fail(`Buyer wallet needs at least 0.052 tBNB, has ${formatEther(buyerBal)}`);
  const tx = await buyer!.sendTransaction({ to: executor.address, value: FUND, gasPrice: await gasPrice(), type: 0 });
  console.log(`Sending 0.05 tBNB: https://testnet.bscscan.com/tx/${tx.hash}`);
  await tx.wait();
  execBal = await provider.getBalance(executor.address);
  console.log(`Executor now has ${formatEther(execBal)} tBNB`);
}

// 4. Find a token with liquidity
step(4, "Finding a test token with WBNB liquidity on PancakeSwap testnet");
const router = new Contract(
  ROUTER,
  [
    "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
    "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)",
  ],
  executor,
);
if ((await provider.getCode(ROUTER)) === "0x") fail(`No contract at router ${ROUTER}. Ask a mentor for the PancakeSwap testnet router.`);
let tokenOut = process.env.TOKEN_OUT ?? "";
if (!tokenOut) {
  for (const [name, addr] of Object.entries(CANDIDATE_TOKENS)) {
    try {
      const amounts: bigint[] = await router.getAmountsOut(CAP, [WBNB, addr]);
      if (amounts[1] > 0n) {
        tokenOut = addr;
        console.log(`Using ${name} ${addr} (0.01 tBNB -> ${amounts[1]} smallest units)`);
        break;
      }
    } catch {
      console.log(`  ${name}: no pool`);
    }
  }
}
if (!tokenOut) fail("No candidate token has a WBNB pool. Ask a mentor for a testnet token with liquidity, then run: TOKEN_OUT=0x... npm run demo");

// 5. Mandate
step(5, "Writing shared/mandate.demo.json");
const deadline = Math.floor(Date.now() / 1000) + 8 * 3600;
const mandate: Mandate = {
  mandateId: "m-001",
  buyer: buyer!.address as `0x${string}`,
  executor: executor.address as `0x${string}`,
  jobId: "0",
  chainId: 97,
  action: "buy",
  tokenIn: getAddress(WBNB) as `0x${string}`,
  tokenOut: getAddress(tokenOut) as `0x${string}`,
  recipient: buyer!.address as `0x${string}`,
  allowedRouters: [getAddress(ROUTER) as `0x${string}`],
  allowedSelectors: ["0x7ff36ab5"],
  maxAmountIn: CAP.toString(),
  minimumAmountOut: "0",
  quotedAmountOut: "0",
  quoteTimestamp: "0",
  maxSlippageBps: 50,
  deadline,
  executorFee: parseEther("0.001").toString(),
};
mkdirSync(SHARED, { recursive: true });
writeFileSync(join(SHARED, "mandate.demo.json"), JSON.stringify(mandate, null, 2) + "\n");
console.log(`Cap 0.01 tBNB, deadline ${new Date(deadline * 1000).toLocaleString()}`);

// 6. Swaps
step(6, "Making the honest swap and the overspend swap");
const hashes: Record<string, { transactionHash: string; expected: "pass" | "fail"; mandateId: string }> = {};
for (const [mode, value] of [["honest", CAP / 2n], ["overspend", CAP * 2n]] as const) {
  const tx = await router.swapExactETHForTokens(0n, [WBNB, tokenOut], buyer!.address, BigInt(deadline), {
    value,
    gasPrice: await gasPrice(),
    type: 0,
  });
  console.log(`  ${mode}: ${formatEther(value)} tBNB  https://testnet.bscscan.com/tx/${tx.hash}`);
  const r = await tx.wait();
  if (r?.status !== 1) fail(`${mode} swap reverted: ${tx.hash}`);
  hashes[mode] = { transactionHash: tx.hash, expected: mode === "honest" ? "pass" : "fail", mandateId: mandate.mandateId };
}
writeFileSync(join(SHARED, "demo-hashes.json"), JSON.stringify(hashes, null, 2) + "\n");

// 7. Verify
step(7, "Verifying both transactions");
let allAsExpected = true;
for (const [mode, h] of Object.entries(hashes)) {
  const v = await verifyMandate(mandate, h.transactionHash as `0x${string}`);
  writeFileSync(join(SHARED, mode === "honest" ? "verdict.pass.json" : "verdict.fail.json"), JSON.stringify(v, null, 2) + "\n");
  const ok = (v.pass ? "pass" : "fail") === h.expected;
  allAsExpected &&= ok;
  console.log(`\n  ${mode.toUpperCase()}: verdict ${v.pass ? "PASS" : "FAIL"} (expected ${h.expected.toUpperCase()}) ${ok ? "OK" : "WRONG"}`);
  for (const c of v.checks) console.log(`    ${c.pass ? "PASS" : "FAIL"}  ${c.name.padEnd(22)} ${c.evidence}`);
  console.log(`    Report: ${v.report}`);
}
console.log(
  allAsExpected
    ? "\nCHECKPOINT MET: good hash passes, bad hash fails. Commit shared/ and tell your teammate the verdict files are real."
    : "\nCHECKPOINT NOT MET: paste this whole output to Claude.",
);
