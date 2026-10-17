import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeFunctionData, pad, toHex, type Address, type Hex } from "viem";
import { runChecks, plainReport } from "../src/checks.ts";
import { PANCAKE_V2_ROUTER_TESTNET, routerAbi, SELECTORS, TRANSFER_TOPIC, WBNB_TESTNET } from "../src/pancakeV2.ts";
import type { Mandate, TxEvidence } from "../src/types.ts";

const BUYER = "0x1111111111111111111111111111111111111111" as Address;
const EXEC = "0x2222222222222222222222222222222222222222" as Address;
const TOKEN_IN = "0x3333333333333333333333333333333333333333" as Address;
const TOKEN_OUT = "0x4444444444444444444444444444444444444444" as Address;
const PAIR = "0x5555555555555555555555555555555555555555" as Address;
const EVIL_ROUTER = "0x6666666666666666666666666666666666666666" as Address;
const E18 = 10n ** 18n;

const mandate: Mandate = {
  mandateId: "m-001",
  buyer: BUYER,
  executor: EXEC,
  jobId: "0",
  chainId: 97,
  action: "buy",
  tokenIn: TOKEN_IN,
  tokenOut: TOKEN_OUT,
  recipient: BUYER,
  allowedRouters: [PANCAKE_V2_ROUTER_TESTNET],
  allowedSelectors: [SELECTORS.swapExactTokensForTokens],
  maxAmountIn: (5n * E18).toString(),
  minimumAmountOut: "0",
  deadline: 1_800_000_000,
  executorFee: (E18 / 4n).toString(),
};

const transfer = (token: Address, from: Address, to: Address, amount: bigint) => ({
  address: token,
  topics: [TRANSFER_TOPIC, pad(from), pad(to)] as Hex[],
  data: toHex(amount, { size: 32 }),
});

function evidence(over: { amountIn?: bigint; to?: Address; recipient?: Address; tokenOut?: Address; status?: "success" | "reverted" } = {}): TxEvidence {
  const amountIn = over.amountIn ?? 4n * E18;
  const recipient = over.recipient ?? BUYER;
  const tokenOut = over.tokenOut ?? TOKEN_OUT;
  return {
    hash: `0x${"ab".repeat(32)}`,
    chainId: 97,
    from: EXEC,
    to: over.to ?? PANCAKE_V2_ROUTER_TESTNET,
    input: encodeFunctionData({
      abi: routerAbi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, 0n, [TOKEN_IN, tokenOut], recipient, 1_799_999_000n],
    }),
    value: 0n,
    status: over.status ?? "success",
    blockNumber: 100n,
    blockTimestamp: 1_799_000_000n,
    logs: [transfer(TOKEN_IN, EXEC, PAIR, amountIn), transfer(tokenOut, PAIR, recipient, 3n * E18)],
    decimals: { tokenIn: 18, tokenOut: 18 },
  };
}

const failed = (m: Mandate, ev: TxEvidence) => runChecks(m, ev).filter((c) => !c.pass).map((c) => c.name);

test("honest swap passes every check", () => {
  const checks = runChecks(mandate, evidence());
  assert.deepEqual(checks.filter((c) => !c.pass), []);
  assert.match(plainReport(checks), /All 9 checks passed/);
});

test("overspend fails amountWithinCap only", () => {
  assert.deepEqual(failed(mandate, evidence({ amountIn: 7n * E18 })), ["amountWithinCap"]);
});

test("unapproved router fails routerAllowed", () => {
  assert.deepEqual(failed(mandate, evidence({ to: EVIL_ROUTER })), ["routerAllowed"]);
});

test("wrong token fails params and delivery", () => {
  const WRONG = "0x7777777777777777777777777777777777777777" as Address;
  assert.deepEqual(failed(mandate, evidence({ tokenOut: WRONG })), ["paramsMatch", "tokenOutMatches"]);
});

test("output sent to someone else fails", () => {
  const THIEF = "0x8888888888888888888888888888888888888888" as Address;
  assert.deepEqual(failed(mandate, evidence({ recipient: THIEF })), ["paramsMatch", "tokenOutMatches"]);
});

test("reverted tx fails", () => {
  assert.ok(failed(mandate, evidence({ status: "reverted" })).includes("transactionSucceeded"));
});

test("selector not on the allowlist fails", () => {
  const m = { ...mandate, allowedSelectors: [SELECTORS.swapExactETHForTokens] };
  assert.deepEqual(failed(m, evidence()), ["selectorAllowed"]);
});

test("BNB-in swap uses tx.value for the cap", () => {
  const m: Mandate = {
    ...mandate,
    tokenIn: WBNB_TESTNET,
    allowedSelectors: [SELECTORS.swapExactETHForTokens],
    maxAmountIn: (E18 / 100n).toString(),
  };
  const ev: TxEvidence = {
    ...evidence(),
    input: encodeFunctionData({
      abi: routerAbi,
      functionName: "swapExactETHForTokens",
      args: [0n, [WBNB_TESTNET, TOKEN_OUT], BUYER, 1_799_999_000n],
    }),
    value: E18 / 200n,
    logs: [transfer(TOKEN_OUT, PAIR, BUYER, 3n * E18)],
  };
  assert.deepEqual(failed(m, ev), []);
  assert.deepEqual(failed(m, { ...ev, value: E18 }), ["amountWithinCap"]);
});
