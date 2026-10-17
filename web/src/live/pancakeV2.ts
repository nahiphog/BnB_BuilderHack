import { parseAbi, toFunctionSelector } from "viem";

/**
 * PancakeSwap v2 router on BSC testnet (chainId 97).
 * CONFIRM WITH A MENTOR before the demo. If they give a different router, change it in the mandate,
 * not here: the mandate's allowedRouters is what the checks enforce.
 */
export const PANCAKE_V2_ROUTER_TESTNET = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" as const;
export const WBNB_TESTNET = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as const;

export const routerAbi = parseAbi([
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)",
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable",
]);

export const SELECTORS = {
  swapExactTokensForTokens: toFunctionSelector(
    "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
  ),
  swapExactTokensForTokensSupportingFeeOnTransferTokens: toFunctionSelector(
    "swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)",
  ),
  swapExactETHForTokens: toFunctionSelector("swapExactETHForTokens(uint256,address[],address,uint256)"),
  swapExactETHForTokensSupportingFeeOnTransferTokens: toFunctionSelector(
    "swapExactETHForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256)",
  ),
} as const;

/** ERC-20 Transfer(address indexed from, address indexed to, uint256 value) */
export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;
