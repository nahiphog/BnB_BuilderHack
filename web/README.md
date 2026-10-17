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

During local Vite development, the UI automatically calls `http://localhost:8787/api/verify` and sends the shared mandate plus the selected transaction hash. To point at another verifier endpoint, create `web/.env.local` with:

```bash
VITE_VERIFY_URL=https://your-verifier.example/api/verify
```

The client sends `POST` JSON in the format:

```json
{ "mandate": { "...": "shared/mandate.demo.json" }, "transactionHash": "0x..." }
```

## GitHub Pages

The repository workflow at `.github/workflows/deploy-pages.yml` builds this folder and deploys `web/dist` when `main` receives a change under `web/`.

After pushing the workflow, enable **Settings → Pages → Source: GitHub Actions** if it is not already selected. The deployed URL will be:

`https://nahiphog.github.io/BnB_BuilderHack/`
