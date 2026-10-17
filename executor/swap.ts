/**
 * Executor: performs one BNB -> token swap on PancakeSwap v2 (BSC testnet) and records the hash.
 *
 *   npm run swap -- honest      spends AMOUNT_BNB            (should PASS)
 *   npm run swap -- overspend   spends 2 x the mandate cap    (valid tx that should FAIL amountWithinCap)
 *   npm run swap -- wrongto     sends output to the executor  (valid tx that should FAIL paramsMatch/tokenOutMatches)
 *
 * Signs with a Studio keystore, so no raw private key is ever typed or committed:
 *   EXECUTOR_KEYSTORE=~/.studio/wallets/0xEXEC....json   (file made by `bag wallet new`)
 *   EXECUTOR_PASSWORD=...                                 (WALLET_PASSWORD from that wallet's .studio/.env.local)
 * Put both in executor/.env (gitignored) and run:  set -a; source .env; set +a; npm run swap -- honest
 *
 * Also needs: MANDATE=../shared/mandate.demo.json (buyer, tokenOut, router, cap, deadline come from it).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { Contract, JsonRpcProvider, Wallet, formatEther } from "ethers";

const mode = (process.argv[2] ?? "honest") as "honest" | "overspend" | "wrongto";
import { pickRpc } from "../core/src/rpc.ts";
const RPC = await pickRpc(true);
const expand = (p: string) => p.replace(/^~/, homedir());

const ksPath = expand(process.env.EXECUTOR_KEYSTORE ?? "");
const password = process.env.EXECUTOR_PASSWORD ?? "";
const mandatePath = expand(process.env.MANDATE ?? "../shared/mandate.demo.json");
if (!existsSync(ksPath) || !password) {
  console.error("Set EXECUTOR_KEYSTORE (path to keystore json) and EXECUTOR_PASSWORD. See the header of swap.ts.");
  process.exit(2);
}

const m = JSON.parse(readFileSync(mandatePath, "utf8"));
const provider = new JsonRpcProvider(RPC, 97, { staticNetwork: true });
const wallet = (await Wallet.fromEncryptedJson(readFileSync(ksPath, "utf8"), password)).connect(provider);

if (wallet.address.toLowerCase() !== String(m.executor).toLowerCase()) {
  console.warn(`Warning: keystore address ${wallet.address} is not the mandate executor ${m.executor}`);
}

const router = new Contract(
  m.allowedRouters[0],
  ["function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)"],
  wallet,
);

const cap = BigInt(m.maxAmountIn);
const value = mode === "overspend" ? cap * 2n : cap / 2n;
const to = mode === "wrongto" ? wallet.address : m.recipient;
const deadline = BigInt(Math.min(m.deadline, Math.floor(Date.now() / 1000) + 600));

const balance = await provider.getBalance(wallet.address);
console.log(`Executor ${wallet.address}  balance ${formatEther(balance)} tBNB`);
console.log(`Mode ${mode}: spending ${formatEther(value)} tBNB (cap ${formatEther(cap)}), output to ${to}`);
if (balance < value) {
  console.error("Not enough tBNB for this swap plus gas. Fund the executor wallet first.");
  process.exit(1);
}

const tx = await router.swapExactETHForTokens(0n, [m.tokenIn, m.tokenOut], to, deadline, { value });
console.log(`Sent ${tx.hash}  https://testnet.bscscan.com/tx/${tx.hash}`);
const receipt = await tx.wait();
console.log(`Mined in block ${receipt?.blockNumber}, status ${receipt?.status === 1 ? "success" : "reverted"}`);

const out = "../shared/demo-hashes.json";
const saved = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : {};
saved[mode] = { transactionHash: tx.hash, expected: mode === "honest" ? "pass" : "fail", mandateId: m.mandateId };
writeFileSync(out, JSON.stringify(saved, null, 2) + "\n");
console.log(`Saved to ${out}`);
