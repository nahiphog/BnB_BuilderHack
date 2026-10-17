# Mandate: who does what

Two people, one rule: **each person only edits their own folders.** Shared formats in `/shared` change only when both agree.

| | Hassan (Engineer A) | Teammate (Engineer B) |
| --- | --- | --- |
| Role | Everything on-chain | Website and story |
| Folders | `/agent`, `/core`, `/executor`, `DX-NOTES.md` | `/web`, `/pitch` |
| Shared | `/shared` (mandate + verdict formats, demo fixtures, saved tx hashes) | same |

One change from the plan: the executor swaps move to Hassan. The 12:30 checkpoint needs those two transaction hashes, and they're chain work, so the website isn't blocked and the verifier isn't waiting.

## Hassan: verifier, agent, executor

| Time | Task | Done when |
| --- | --- | --- |
| 10:55–11:15 | Ask mentors the 3 questions (below). Get tBNB + U for the executor and verifier wallets. | Funds in both wallets, answers written in `/shared/decisions.md` |
| 11:15–11:45 | `/executor`: one honest swap on PancakeSwap testnet, one valid swap that breaks a rule (over the cap or a different router) | Both hashes saved in `/shared/demo-hashes.json` |
| 11:45–12:30 | `/core`: first 4 checks (succeeded, router, tokenOut, amount cap) | **Checkpoint: good hash passes, bad hash fails** |
| 12:30–14:30 | Add selector + params-decode checks. Wrap them in the Studio agent. Expose `POST /api/verify` | Teammate's site gets a real verdict from the endpoint |
| 14:30–16:00 | LLM summary, ERC-8004 identity, deploy. Escrow flow only if a mentor confirms ERC-8183 evaluator support | Agent visible on 8004scan |
| 16:00–16:45 | Rehearse twice, fix bugs only, finish `DX-NOTES.md` and the README setup guide | Submission ready |

## Teammate: website, pitch, video

| Time | Task | Done when |
| --- | --- | --- |
| 10:55–11:15 | Commit README + `/shared` fixtures. Scaffold `/web` | Repo has the formats, site runs locally |
| 11:15–12:30 | **Verifier result screen** first, then Create mandate, both on fixture data | Result screen readable in under 10 seconds |
| 12:30–14:30 | Mandate detail, then Dashboard. Plug in the real endpoint and BscScan links | **Checkpoint 14:30: real verdict + all explorer links render** |
| 14:30–16:00 | Preloaded demo scenario, architecture diagram, slides (5 max), backup video | **Checkpoint 16:00: rehearsal done, video recorded** |
| 16:00–16:45 | Rehearse the 3-minute pitch with a timer. Submission form | Submit by **16:45** |

If time runs short, cut the Dashboard first. Never cut the result screen.

## Handoffs (the only times you need each other)

| When | From → To | What |
| --- | --- | --- |
| 11:15 | Teammate → Hassan | Fixtures committed in `/shared` |
| 11:45 | Hassan → Teammate | Good + bad tx hashes in `/shared/demo-hashes.json` |
| 14:00 | Hassan → Teammate | Live `POST /api/verify` URL |
| 15:30 | Hassan → Teammate | ERC-8004 agent link for the slides |

## Mentor questions (Hassan, first thing)

1. Can a Studio agent act as an ERC-8183 evaluator, or must the buyer settle manually?
2. Which PancakeSwap testnet router, swap function and test token pair should we use?
3. Can we register an ERC-8004 identity on testnet and show it in the demo?

## DX notes already logged (Hassan)

1. `bag wallet new` fails without `--generate-password`; only the error message mentions the flag.
2. `bag wallet fund` fails outside a project ("No studio.toml found"), yet `bag wallet new` says to run it next.
3. The official faucet requires 0.002 mainnet BNB, while the workshop slide promises zero-friction testnet. The Telegram bot didn't reply.

## Kill rule

If the verifier can't classify the two saved hashes by **12:30**, cut escrow and ship Mandate as a verification service plus the proof website. Never cut the deterministic verifier.

## Git habits

- Commit small and often to `main`.
- `git pull --rebase` before every push.
- Never commit `.studio/`, `.env*`, wallet files or passwords.
