# Developer experience notes

Real friction we hit building Mandate with BNB Agent Studio (`@bnbagent/studio-cli` 0.0.15) on 16–17 Oct 2026, in the order it happened.

| # | Where | What happened | Suggestion |
| --- | --- | --- | --- |
| 1 | `bag wallet new` | Fails with "WALLET_PASSWORD env var is required". The `--generate-password` flag is only mentioned in the error. | Prompt for or generate the password by default in an interactive terminal. |
| 2 | `bag wallet fund` | Fails outside a project ("No studio.toml found"), but `bag wallet new` tells you to run it next. | Let it work from any folder given an address, or change the hint. |
| 3 | Testnet faucet | The official faucet requires 0.002 mainnet BNB; Chainstack needs 0.08 mainnet ETH. The Telegram bot did not reply the first night. | The workshop said "zero-friction testnet". The platform login auto-funding (0.1 tBNB + 5 U) was the best path; mention it first. |
| 4 | Skills | `/bnbagent-studio` was "Unknown command" in Claude Code until `bag skills install` and a restart. | Have `npm i -g` print the skills step prominently. |
| 5 | RPC at the venue | The default BSC testnet RPC on port 8545 timed out on venue Wi-Fi. PublicNode on 443 worked. | Default to a port-443 RPC, or fall back automatically. |
| 6 | `bag deploy --provider bnb` | Hung for 60+ minutes after printing only the plan line when run from an agent's shell. It was waiting on a hidden "type yes to accept trial terms" prompt; `--yes` did not skip it. In a normal terminal it deployed in about 1 minute. | Fail fast when stdin isn't a TTY, or let `--yes` / `--accept-trial-terms` cover it. |
| 7 | Agent sandboxes | Claude Code's sandbox blocked cloudflared (port 7844) and probably the deploy's network calls. | Document that deploys should run in a normal terminal. |
| 8 | x402 after deploy | The deploy summary reports x402 "UNVERIFIED, HTTP 404" because B402 credentials aren't provisioned for the trial. Not explained before deploying. | Say up front whether x402 works on the trial. |
| 9 | ERC-8004 via `bag deploy verify` | MegaFuel relay accepted the tx but RPC never saw it in 30 s; the CLI re-signed it as self-paid automatically and it confirmed. Nice recovery. The record kept the default name "studio-agent". | Ask for the agent name/description during `bag init` and use them at registration. |
| 10 | What worked well | `bag init` flags, `bag doctor`, fixed `signing.ts` with the LLM kept out of money, and the one-file work hook made wrapping a deterministic verifier straightforward. | |
