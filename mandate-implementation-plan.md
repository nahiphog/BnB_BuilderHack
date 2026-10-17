# Mandate: proof before payment for agent-executed trades

## One-sentence pitch

Mandate lets a buyer hire a trading agent without trusting its promises: the agent receives payment only after deterministic checks prove that its on-chain trade followed the buyer's rules.

**Tagline:** No proof, no pay.

## Build target: BSC testnet prototype

We are building for BSC testnet. The demo uses a bounded swap of test assets through one configured PancakeSwap testnet router.

The submission goal is a complete, reliable proof loop: a buyer defines a mandate, an executor performs a testnet trade, and deterministic code verifies whether that exact transaction followed the mandate. We will not add tokenized stocks or a mainnet transaction in this build.

## The user story

Encik Rahman wants an agent to purchase a small amount of an approved asset. He cannot inspect the agent's code and does not want to take the agent's word for it.

He defines a mandate: the exact token, maximum spend, approved router, receiving wallet, and deadline. An executor agent trades from its own wallet. Mandate verifies the trade against the mandate using fixed code. Only a passing trade qualifies the executor for reimbursement and its fee.

## What makes this different from wallet guardrails

Wallet guardrails protect an owner from their own agent before the agent signs. Mandate protects a buyer hiring an agent they do not own by verifying the result before payment.

We should use both layers where possible:

| Layer | Purpose | Evidence |
| --- | --- | --- |
| Executor wallet policy | Limit what the executor can do before it signs | Spend cap, allowlisted contracts, expiry |
| Mandate verifier | Prove the completed transaction matched the buyer's job | Deterministic check results and transaction evidence |

## MVP boundary

Build one task type only: a bounded buy order on BSC testnet.

### In scope

- Buyer creates one mandate for one configured token pair.
- Executor uses its own wallet and funds to perform one swap.
- The asset is delivered to the buyer address as part of the verified execution path.
- Verifier accepts a transaction hash and returns a deterministic pass/fail verdict.
- Website displays the mandate, evidence, verdict, and BscScan links.
- Demonstrate one good transaction and one valid-but-failing transaction.

### Explicitly out of scope

- Sell orders, partial fills, multi-hop routing, multiple assets, disputes, or production custody.
- Automatic escrow settlement until a mentor confirms the ERC-8183 role and settlement flow.
- LLM-based verification or price predictions.
- Tokenized stocks and BSC mainnet deployment.

## Money flow

1. Buyer creates a mandate and funds an escrow in one configured test asset.
2. Executor performs the trade from its own wallet and pays its own gas.
3. Executor submits the trade transaction hash to Mandate.
4. Verifier runs fixed checks against that transaction and stores the verdict.
5. Buyer reviews the proof and settles the job manually unless the mentor confirms that a verified evaluator can safely trigger settlement.

### Important wording

Do not claim that the buyer is "never worse off." Claim only this:

> The buyer's escrow remains protected unless Mandate proves that the execution matched the mandate.

## Mandate data model

Use contract addresses and smallest-unit amounts only. Do not identify assets by ticker or symbol.

```json
{
  "mandateId": "m-001",
  "buyer": "0xBUYER",
  "executor": "0xEXECUTOR",
  "jobId": "0",
  "chainId": 97,
  "action": "buy",
  "tokenIn": "0xTOKEN_IN",
  "tokenOut": "0xTOKEN_OUT",
  "recipient": "0xBUYER",
  "allowedRouters": ["0xPANCAKE_TESTNET_ROUTER"],
  "allowedSelectors": ["0xSELECTOR"],
  "maxAmountIn": "5000000000000000000",
  "minimumAmountOut": "0",
  "quotedAmountOut": "0",
  "quoteTimestamp": "0",
  "maxSlippageBps": 50,
  "deadline": 1792234800,
  "executorFee": "250000000000000000"
}
```

`quotedAmountOut`, `quoteTimestamp`, and slippage are optional in the first milestone. Do not show a slippage check until we have a reproducible quote source and formula.

## Verification contract

The verifier must bind every check to the **same submitted transaction hash**. Checking unrelated token transfers is not enough.

### Must-have checks

1. Transaction exists on the configured BSC network and succeeded.
2. Transaction target is an allowlisted router.
3. Calldata selector is allowlisted and decoded successfully.
4. Decoded swap parameters match the mandate's `tokenIn`, `tokenOut`, recipient, and deadline.
5. Actual input amount is at or below `maxAmountIn`.
6. Event logs show the exact `tokenOut` contract delivered the expected output to the buyer in the same execution path.

### Stretch checks

- Transaction block time is before the mandate deadline.
- Actual output meets `minimumAmountOut`.
- Slippage is within `maxSlippageBps`, calculated from a persisted pre-trade quote.
- Executor identity matches the registered ERC-8004 identity.

### Non-negotiable security rules

- Fixed TypeScript checks decide pass or fail. The LLM receives the result only to write a summary.
- Verify token **addresses**, not names or symbols.
- Do not accept a router address as proof by itself. Decode the specific allowed function and validate its parameters.
- Never use a production wallet in the managed testnet trial.
- Do not expose private keys, wallet passwords, or environment secrets in the repository, prompts, or demo.

## Verdict format

```json
{
  "mandateId": "m-001",
  "transactionHash": "0x...",
  "pass": true,
  "checks": [
    { "name": "transactionSucceeded", "pass": true, "evidence": "receipt.status=1" },
    { "name": "routerAllowed", "pass": true, "evidence": "0x..." },
    { "name": "tokenOutMatches", "pass": true, "evidence": "0x..." },
    { "name": "amountWithinCap", "pass": true, "evidence": "4.98 <= 5.00" }
  ],
  "report": "The executor completed the approved swap within the spending limit.",
  "verifiedAt": "2026-10-17T00:00:00Z"
}
```

## Website MVP

Build four desktop-first screens.

1. **Dashboard** — active mandates, locked funds, recent verdicts, and a small agent activity timeline.
2. **Create mandate** — plain-English form paired with the generated machine-readable policy.
3. **Mandate detail** — status timeline, BscScan links, decoded transaction evidence, and a table of required versus actual results.
4. **Verifier result** — a focused pass/fail page that makes every check readable in under ten seconds.

Use a preloaded demo scenario. A judge should be able to see a verified transaction even if the testnet or Wi-Fi is slow.

## Demo script: three minutes

1. **Problem, 20 seconds:** Malaysian consumers see agents that claim they can trade, but cannot prove whether they followed the buyer's rules.
2. **Mandate, 30 seconds:** Rahman creates a bounded buy order: one asset, a maximum amount, one approved router, and a deadline.
3. **Good execution, 45 seconds:** Show the executor's transaction, then Mandate's green verification evidence and payment eligibility.
4. **Failure case, 45 seconds:** Show a separate successful transaction that violates one fixed rule, such as an unapproved router or amount over cap. Mandate rejects it and shows the exact failing proof.
5. **Trust boundary, 20 seconds:** Explain that code decides the verdict, not the LLM; the wallet policy limits the executor, and Mandate protects the buyer.
6. **Close, 20 seconds:** "No proof, no pay. Today, Mandate verifies bounded swaps. Tomorrow, it can verify any hired agent task."

Record a backup video of the good and failed verifier flows before presenting.

## Build order and ownership

### First 15 minutes: shared decisions

- Confirm network, token pair, router address, router function selector, and escrow asset.
- Get testnet funds for executor and verifier wallets.
- Confirm the ERC-8183 settlement flow with a mentor.
- Freeze the mandate JSON format and commit it to the repository.

### Engineer A: verifier and agent

1. Scaffold the Studio seller/verifier agent.
2. Implement the four earliest checks: transaction success, router, token output, and amount cap.
3. Test it against saved good and bad transaction hashes.
4. Return a structured verdict from the agent endpoint.
5. Add an LLM summary only after deterministic verification works.

### Engineer B: executor and website

1. Create one honest testnet swap and save its hash.
2. Create one separate valid transaction that violates an agreed rule and save its hash.
3. Build the mandate form and result page around mocked verdict data.
4. Replace mocked data with the verifier endpoint.
5. Add BscScan links and the demo scenario.

### Checkpoints

| Time | Required result |
| --- | --- |
| 12:30 | Verifier passes the good hash and fails the bad hash locally |
| 14:30 | Website renders the real structured verdict and all explorer links |
| 16:00 | One end-to-end rehearsal and backup video recorded |
| 16:45 | Submission materials finalized |

### Kill rule

If the verifier cannot correctly classify the two saved transaction hashes by the first checkpoint, cut escrow integration and ship Mandate as a paid/verifiable transaction-checking service with the proof website. Do not cut the deterministic verifier.

## Mentor questions

1. Can a Studio agent act as an ERC-8183 evaluator, or must the buyer manually approve, reject, or settle after receiving the verdict?
2. Which testnet PancakeSwap router, exact swap function, and test token pair should we use today?
3. Can we register an ERC-8004 identity on the chosen testnet path and show it in the demo?

## Submission checklist

- [ ] Public repository with a short setup guide.
- [ ] Working desktop web demo or a reliable local-start command.
- [ ] One good and one failed transaction hash documented.
- [ ] Backup video under four minutes.
- [ ] Architecture diagram: buyer → escrow → executor → verifier → verdict → settlement.
- [ ] Honest limitations section: testnet-only, manual settlement if applicable, one bounded buy order.
- [ ] Developer Experience notes: setup friction, documentation gaps, error messages, and what worked.

## Sources to retain

- BNB Agent Studio quickstart: https://docs.bnbchain.org/developer-kit/bnbchain-studio/quickstart/
- BNB Agent Studio workshop deck supplied for this event
- Malaysia scam-loss reporting: https://www.thevibes.com/articles/news/125048/non-existent-investment-scams-account-for-half-of-malaysias-rm5.37-billion-online-fraud-losses
