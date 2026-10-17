import { demoMandate, toDisplayVerdict } from "./fixtures";
import type { SharedVerdict, VerificationVerdict } from "./types";

const verifierUrl = import.meta.env.VITE_VERIFY_URL as string | undefined;

export const isLiveVerifierConfigured = Boolean(verifierUrl);

export async function verifyTransaction(transactionHash: string): Promise<VerificationVerdict> {
  if (!verifierUrl) throw new Error("Live verifier is not configured");

  const response = await fetch(verifierUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mandate: demoMandate, transactionHash })
  });
  if (!response.ok) throw new Error("Verifier returned an error");
  return toDisplayVerdict(await response.json() as SharedVerdict);
}
