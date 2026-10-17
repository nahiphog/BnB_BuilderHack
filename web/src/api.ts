import { goodVerdict } from "./fixtures";
import type { VerificationVerdict } from "./types";

const verifierUrl = import.meta.env.VITE_VERIFY_URL as string | undefined;

export async function verifyTransaction(transactionHash: string): Promise<VerificationVerdict> {
  if (!verifierUrl) return { ...goodVerdict, transactionHash };

  const response = await fetch(verifierUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transactionHash })
  });
  if (!response.ok) throw new Error("Verifier returned an error");
  return response.json() as Promise<VerificationVerdict>;
}
