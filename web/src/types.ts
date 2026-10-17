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

export type SharedMandate = {
  mandateId: string;
  chainId: number;
  buyer: string;
  executor: string;
  tokenIn: string;
  tokenOut: string;
  allowedRouters: string[];
  maxAmountIn: string;
  deadline: number;
  executorFee: string;
};

export type SharedVerdict = {
  mandateId: string;
  transactionHash: string;
  pass: boolean;
  checks: Array<{ name: string; pass: boolean; evidence: string }>;
  report: string;
  verifiedAt: string;
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
