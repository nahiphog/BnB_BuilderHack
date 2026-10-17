# Mandate: no proof, no pay

**A trading agent only gets paid after code proves, on BNB Chain, that its trade followed the buyer's rules.**

Malaysians lost RM5.37 billion to online scams between 2024 and May 2026, and half of it, RM2.68 billion, came from fake investment schemes ([Home Ministry figures via The Vibes](https://www.thevibes.com/articles/news/125048/non-existent-investment-scams-account-for-half-of-malaysias-rm5.37-billion-online-fraud-losses)). Many are "AI trading bots" that ask you to trust them. Mandate replaces trust with proof.

Built in one day at BNB Hack KL (17 Oct 2026) with BNB Agent Studio, on BSC testnet.

## Live links

| What | Link |
| --- | --- |
| Website (demo dashboard) | https://nahiphog.github.io/BnB_BuilderHack/ |
| Mandate agent, deployed on BNB Agent Studio | [agent card](https://bnbagent-api.bnbchain.world/v1/rt/01M546AFGY9WQY3K6EC28QD649/.well-known/agent-card.json) |
| On-chain identity | ERC-8004 agent **#2644** on BSC testnet, registry `0x8004A818BFB912233c491871b3d84c89A494BD9e`, [registration tx](https://testnet.bscscan.com/tx/0x62e5f197526a7ce14bbcad17a53f6c081ff0ae2e49e3f170f6336a85e184493a) |
| Honest trade (verdict: PASS, 9/9) | [0x5a7a…134a](https://testnet.bscscan.com/tx/0x5a7ac86a1c102f90981345319b6f1c3c657c37ec38e70d0f0fae06535ca1134a) |
| Overspend trade (verdict: FAIL, spend cap) | [0xe00f…9113](https://testnet.bscscan.com/tx/0xe00ff4e7021048ce670b5d8b9dcedc8fa0efbe4c67be7f11f50ffa84766a9113) |
| Buyer / Mandate agent wallet | [0x4A79…3FA9](https://testnet.bscscan.com/address/0x4A79814A7006360eCED4454c9cf09fD3E7883FA9) |
| Executor wallet | [0x14E8…9C1f](https://testnet.bscscan.com/address/0x14E8c52d84A4c044DC83c8F5Fc2C601c930F9C1f) |

## How it works

1. **Buyer sets a mandate:** which token, max spend, approved router, recipient, deadline (`shared/mandate.demo.json`).
2. **An executor agent trades** from its own wallet and sends the token to the buyer.
3. **Mandate verifies that exact transaction** with 9 fixed checks: succeeded on BSC testnet, allowlisted router, allowlisted swap function, decoded params match (tokenIn, tokenOut, recipient, deadline), spend within cap, the right token delivered to the buyer in the same transaction's logs, approved executor, before deadline, minimum output.
4. **Pass → the executor qualifies for payment. Fail → the buyer's escrow stays protected,** and the report names the exact rule that broke.

## Why you can trust the verdict

- **Code decides, not the AI.** Pass/fail is deterministic TypeScript (`core/src/checks.ts`). The LLM only rewrites the one-line summary from finished results and can never change `pass`.
- **Checks are bound to one transaction hash.** Router, calldata, amounts and token transfers all come from the same receipt. Tokens are matched by contract address, never by name.
- **Anyone can re-run it.** Same mandate + same tx hash = same verdict.
- **Guardrails vs Mandate:** wallet guardrails protect you from your *own* agent before it signs. Mandate protects you when you hire *someone else's* agent, by proving the result before payment.

## BNB Agent Studio usage

- Scaffolded with `bag init` (A2A + X402 faces, ERC-8183 commerce rail, evm-local wallet).
- Every paid job (ERC-8183 delivery or x402) runs the verifier: `agent/mandateverifier/app/agent/src/mandateWork.ts`.
- Deployed with `bag deploy --provider bnb` to the managed AgentCore trial.
- Registered on ERC-8004 with `bag deploy verify` (agent #2644).
- Signing stays in Studio's fixed `signing.ts`; the LLM has read-only tools.

## Repo map

```
core/        verifyMandate(): the 9 deterministic checks + tests + CLI + free HTTP API
agent/       the Mandate agent (BNB Agent Studio project), wraps core for paid jobs
executor/    demo executor: honest and rule-breaking swaps on PancakeSwap testnet
shared/      mandate, saved tx hashes, real pass/fail verdicts
web/         dashboard (GitHub Pages)
DX-NOTES.md  developer-experience notes from building this
```

## Run it

```
bash run-demo.sh                        # fund executor, make both swaps, verify both
cd core && npm test                     # 8 unit tests on synthetic swaps
cd core && npm run verify -- ../shared/mandate.demo.json <txHash>
cd core && npm run serve                # POST localhost:8787/api/verify
cd agent/mandateverifier && bag dev     # the Studio agent locally (A2A on :9000, POST /api/verify)
cd web && npm ci && npm run dev         # dashboard
```

Never commit `.studio/`, `.env*` or wallet files (already gitignored).

## Honest limitations

- BSC testnet only; one bounded buy order type (BNB → token via PancakeSwap v2).
- Escrow settlement is manual by the buyer in this build; an ERC-8183 evaluator role would let Mandate trigger settlement.
- x402 rail is configured but not live on the trial deploy (B402 credentials not provisioned).
- No slippage check yet: it needs a persisted pre-trade quote.

## Next

Mainnet, sell orders, then any ERC-8183 job: Mandate as the verification layer for BNB's agent marketplace. The checks are chain-agnostic; we start on BNB Chain because that's where most ERC-8004 agents live.
