# Mandate dashboard

Desktop-first TypeScript dashboard for the Mandate BSC Testnet demo.

## Run locally

```bash
npm ci
npm run dev
```

Open the localhost URL printed by Vite, normally `http://127.0.0.1:5173/`.

## Connect the verifier

The UI uses its local fixture verdicts by default. To use Hassan's live verifier endpoint, create `web/.env.local` with:

```bash
VITE_VERIFY_URL=https://your-verifier.example/api/verify
```

The client sends `POST` JSON in the format:

```json
{ "transactionHash": "0x..." }
```

## GitHub Pages

The repository workflow at `.github/workflows/deploy-pages.yml` builds this folder and deploys `web/dist` when `main` receives a change under `web/`.

After pushing the workflow, enable **Settings → Pages → Source: GitHub Actions** if it is not already selected. The deployed URL will be:

`https://nahiphog.github.io/BnB_BuilderHack/`
