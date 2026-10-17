# Mandate dashboard

Desktop-first TypeScript dashboard for the Mandate BSC Testnet demo.

## Run locally

```bash
npm ci
npm run dev
```

Open the localhost URL printed by Vite, normally `http://127.0.0.1:5173/`.

## Connect the verifier

The dashboard renders the real proof data in `../shared/verdict.pass.json` and `../shared/verdict.fail.json` by default. For live verdicts, start the local verifier in another terminal:

```bash
cd ../core
npm ci
npm run serve
```

The dashboard stays on the saved on-chain verdicts unless a verifier endpoint is explicitly configured. To use a local verifier, run `cd ../core && npm run serve`, then create `web/.env.local` with:

```bash
VITE_VERIFY_URL=http://localhost:8787/api/verify
```

Replace the value with another HTTPS endpoint when one is available.

The client sends `POST` JSON in the format:

```json
{ "mandate": { "...": "shared/mandate.demo.json" }, "transactionHash": "0x..." }
```

## GitHub Pages

The repository workflow at `.github/workflows/deploy-pages.yml` builds this folder and deploys `web/dist` when `main` receives a change under `web/`.

After pushing the workflow, enable **Settings → Pages → Source: GitHub Actions** if it is not already selected. The deployed URL will be:

`https://nahiphog.github.io/BnB_BuilderHack/`
