# Developer experience notes

## BSC Testnet RPC at the venue

The default BNB Testnet RPC using port `8545` timed out on venue Wi-Fi. Use a public endpoint over HTTPS (port `443`) instead; the PublicNode endpoint worked during the demo.

This is a network-environment issue, not a verifier-rule failure. Keep the verifier's RPC configurable through its existing endpoint selection so the demo can switch endpoints without changing the shared mandate or verdict data.
