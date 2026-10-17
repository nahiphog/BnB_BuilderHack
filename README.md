# Mandate: no proof, no pay

Mandate lets a buyer hire a trading agent without trusting its promises: the agent receives payment only after deterministic checks prove that its on-chain trade followed the buyer's rules.
Built at BNB Hack KL, 17 Oct 2026, on BSC testnet (chainId 97) with BNB Agent Studio.

## Who owns what

Each person only edits their own folders, so `git pull --rebase` never conflicts.

```
/agent      Hassan    BNB Agent Studio project (the Mandate verifier agent)
/core       Hassan    verifyMandate(): fixed TypeScript checks, no LLM
/executor   Hassan    honest swap + rule-breaking swap scripts, saved tx hashes
/web        Teammate  4 screens: dashboard, create mandate, mandate detail, verifier result
/pitch      Teammate  slides, architecture diagram, backup video
/shared     Both      mandate + verdict formats and demo fixtures (change only together)
DX-NOTES.md Hassan    developer-experience friction, logged as it happens
```

## Mandate (`shared/mandate.example.json`)

Contract addresses and smallest-unit amounts only. Never identify assets by ticker.

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

## Verdict (`shared/verdict.pass.json`, `shared/verdict.fail.json`)

```json
{
  "mandateId": "m-001",
  "transactionHash": "0x...",
  "pass": true,
  "checks": [
    { "name": "transactionSucceeded", "pass": true, "evidence": "receipt.status=1" },
    { "name": "routerAllowed", "pass": true, "evidence": "0x..." },
    { "name": "selectorAllowed", "pass": true, "evidence": "0x... decoded" },
    { "name": "paramsMatch", "pass": true, "evidence": "tokenIn, tokenOut, recipient, deadline" },
    { "name": "amountWithinCap", "pass": true, "evidence": "4.98 <= 5.00" },
    { "name": "tokenOutMatches", "pass": true, "evidence": "Transfer log from 0x... to buyer" }
  ],
  "report": "The executor completed the approved swap within the spending limit.",
  "verifiedAt": "2026-10-17T00:00:00Z"
}
```

`report` is written by the LLM from the check results. It never decides `pass`.

## API

`POST /api/verify` with body `{ "mandate": { ... }, "transactionHash": "0x..." }`, returns the verdict above.

Frontend builds against the two fixture files first and swaps to the live endpoint when it's ready.

## Explorer links

- Transaction: `https://testnet.bscscan.com/tx/<hash>`
- Address: `https://testnet.bscscan.com/address/<address>`
- Agent identity: 8004scan.io

## Run

```
cd agent && bag doctor && bag dev     # verifier
cd web && npm install && npm run dev  # website
```

## Limitations (honest)

Testnet only. One bounded buy order type. Settlement is manual by the buyer unless the ERC-8183 evaluator flow is confirmed.
