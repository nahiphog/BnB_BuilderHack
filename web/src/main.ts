import "./styles.css";
import { verifyTransaction } from "./api";
import { failedVerdict, goodVerdict, mandates } from "./fixtures";
import type { VerificationVerdict } from "./types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root is missing");
const root = app;

let currentMandate = mandates[1];
let currentVerdict: VerificationVerdict = goodVerdict;

const buyerAddress = "0x4A79814A7006360eCED4454c9cf09fD3E7883FA9";
const executorAddress = "0x14E8c52d84A4c044DC83c8F5Fc2C601c930F9C1f";
const truncate = (value: string) => `${value.slice(0, 8)}…${value.slice(-4)}`;
const transactionUrl = (hash: string) => `https://testnet.bscscan.com/tx/${hash}`;
const addressUrl = (address: string) => `https://testnet.bscscan.com/address/${address}`;

function verdictMarkup(verdict: VerificationVerdict) {
  const tone = verdict.pass ? "pass" : "fail";
  return `<section class="result-card ${tone}" aria-live="polite">
    <div class="result-head"><div><p class="kicker">VERIFIER RESULT</p><h1>${verdict.pass ? "Mandate verified" : "Mandate rejected"}</h1><p>${verdict.report}</p></div><span class="verdict ${tone}">${verdict.pass ? "✓ Verified" : "! Rejected"}</span></div>
    <div class="proof-meta"><div><span>Mandate</span><strong>${verdict.mandateId}</strong></div><div><span>Network</span><strong>${verdict.network}</strong></div><div><span>Verified at</span><strong>${verdict.verifiedAt} MYT</strong></div></div>
    <div class="hash-row"><div><span>TRANSACTION HASH</span><strong>${truncate(verdict.transactionHash)}</strong></div><div class="hash-actions"><button data-copy="${verdict.transactionHash}">Copy</button><a href="${transactionUrl(verdict.transactionHash)}" target="_blank" rel="noreferrer">BscScan ↗</a></div></div>
    <div class="identity-links"><span><b>Buyer</b> Encik Rahman (demo) · <a href="${addressUrl(buyerAddress)}" target="_blank" rel="noreferrer">${truncate(buyerAddress)} ↗</a></span><span><b>Executor</b> · <a href="${addressUrl(executorAddress)}" target="_blank" rel="noreferrer">${truncate(executorAddress)} ↗</a></span><span><b>Mandate agent</b> · <a href="https://bnbagent-api.bnbchain.world/v1/rt/01M546AFGY9WQY3K6EC28QD649/.well-known/agent-card.json" target="_blank" rel="noreferrer">Agent card ↗</a></span><span><b>ERC-8004 identity</b> · Pending registration</span></div>
    <div class="check-table"><div class="check-heading"><span>Rule</span><span>Expected</span><span>On-chain evidence</span><span>Result</span></div>${verdict.checks.map((check) => `<div class="check ${check.pass ? "" : "failed-check"}"><strong>${check.name}</strong><span>${check.expected}</span><span>${check.actual}</span><b class="${check.pass ? "ok" : "no"}">${check.pass ? "Passed" : "Failed"}</b></div>`).join("")}</div>
  </section>`;
}

function mandateRows() {
  return mandates.map((mandate) => `<button class="mandate-row ${currentMandate.id === mandate.id ? "selected" : ""}" data-mandate="${mandate.id}"><i class="state ${mandate.status}"></i><span><strong>${mandate.tokenIn} → ${mandate.tokenOut}</strong><small>${mandate.id} · ${mandate.title}</small></span><em>${mandate.maxAmountIn}<small>${mandate.status === "verified" ? "All 9 rules passed" : mandate.status === "failed" ? "Spend cap exceeded" : "No transaction yet"}</small></em><b class="badge ${mandate.status}">${mandate.status}</b></button>`).join("");
}

function evidenceFlow() {
  const steps = currentVerdict.pass
    ? [["11:39 AM", "Transaction recorded", "Honest BSC Testnet swap is available for verification."], ["11:39 AM", "Receipt read", "Verifier reads the transaction and its logs."], ["11:39 AM", "Nine rules checked", "Router, cap, recipient, executor and deadline match."], ["Result", "Eligible for payment", "All deterministic rules passed."]]
    : [["11:39 AM", "Transaction recorded", "Overspend test transaction is available for verification."], ["11:39 AM", "Receipt read", "Verifier reads the transaction and its logs."], ["11:39 AM", "Spend cap failed", "0.02 tBNB is greater than the 0.01 tBNB cap."], ["Result", "Payment blocked", "Executor does not qualify for payment."]];
  return steps.map(([time, title, text], index) => `<article><i class="${index < 3 || currentVerdict.pass ? "done" : ""}">${index < 3 || currentVerdict.pass ? "✓" : index + 1}</i><time>${time}</time><strong>${title}</strong><p>${text}</p></article>`).join("");
}

function dashboardMarkup() {
  return `<aside class="sidebar"><div class="logo"><span class="mark">●</span>mandate</div><div class="side-copy"><p class="kicker">BSC TESTNET DEMO</p><strong>Deterministic proof for agent trades.</strong></div><div class="network"><i></i>BSC Testnet</div></aside>
  <main><header><div class="crumb">Proof of Work <b>/</b> BSC Testnet</div><a class="docs" href="https://github.com/nahiphog/BnB_BuilderHack#readme" target="_blank" rel="noreferrer">GitHub documentation ↗</a></header><div class="page">
    <section class="intro"><div><p class="kicker">MANDATE PROTOCOL</p><h2>Proof before payment.</h2><p>Every executor must prove it followed the buyer’s rules before it can get paid.</p><p class="malaysia">Malaysians lost RM2.68 billion to fake investment schemes (2024 to May 2026). Mandate makes “my trading bot works” provable.</p></div></section>
    <section class="metrics"><article><span>Buyer</span><strong>Encik Rahman</strong><p>Demo buyer · BSC Testnet</p></article><article><span>Mandate cap</span><strong>0.01 <small>tBNB</small></strong><p>No escrow funded in this demo</p></article><article><span>Deterministic proof</span><strong>9 <small>checks</small></strong><p class="green">Every rule is shown below</p></article><article><span>Verification price</span><strong>$0.01</strong><p>Per deterministic check</p></article></section>
    <section class="grid"><div class="panel"><div class="panel-title"><div><p class="kicker">DEMO CASES</p><h3>Verifier scenarios</h3></div></div><div class="mandates">${mandateRows()}</div></div><div id="result">${verdictMarkup(currentVerdict)}</div></section>
    <section class="panel timeline"><div class="panel-title"><div><p class="kicker">${currentMandate.id}</p><h3>Evidence flow</h3></div><span>Real BSC Testnet evidence</span></div><div class="steps">${evidenceFlow()}</div></section>
  </div></main><div id="toast" role="status"></div>`;
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLDivElement>("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2500);
}

function render() {
  root.innerHTML = dashboardMarkup();
  document.querySelectorAll<HTMLButtonElement>("[data-mandate]").forEach((button) => button.addEventListener("click", async () => {
    const selected = mandates.find((mandate) => mandate.id === button.dataset.mandate) ?? mandates[1];
    currentMandate = selected;
    currentVerdict = selected.status === "failed" ? failedVerdict : goodVerdict;
    render();
    if (!selected.transactionHash) return;
    try {
      currentVerdict = await verifyTransaction(selected.transactionHash);
      render();
    } catch {
      showToast("Verifier unavailable. Showing saved on-chain verdict.");
    }
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => button.addEventListener("click", () => {
    void navigator.clipboard.writeText(button.dataset.copy ?? "");
    showToast("Transaction hash copied.");
  }));
}

render();
