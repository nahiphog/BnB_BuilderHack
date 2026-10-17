export type CheckResult = {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
};

export type VerificationVerdict = {
  mandateId: string;
  transactionHash: string;
  pass: boolean;
  verifiedAt: string;
  network: "BSC Testnet";
  checks: CheckResult[];
  report: string;
};

export type Mandate = {
  id: string;
  title: string;
  tokenIn: string;
  tokenOut: string;
  maxAmountIn: string;
  allowedRouter: string;
  deadline: string;
  executor: string;
  status: "verified" | "executing" | "failed";
  transactionHash?: string;
};
