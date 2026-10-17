import "./styles.css";
import { verifyTransaction } from "./api";
import { failedVerdict, goodVerdict, mandates } from "./fixtures";
import type { Mandate, VerificationVerdict } from "./types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root is missing");
const root = app;

let currentMandate = mandates[1];
let currentVerdict: VerificationVerdict = goodVerdict;

function truncate(hash: string) { return `${hash.slice(0, 8)}…${hash.slice(-4)}`; }
function explorerUrl(hash: string) { return `https://testnet.bscscan.com/tx/${hash}`; }

function verdictMarkup(verdict: VerificationVerdict) {
  const tone = verdict.pass ? "pass" : "fail";
  return `<section class="result-card ${tone}" aria-live="polite">
    <div class="result-head"><div><p class="kicker">VERIFIER RESULT</p><h1>${verdict.pass ? "Mandate verified" : "Mandate rejected"}</h1><p>${verdict.report}</p></div><span class="verdict ${tone}">${verdict.pass ? "✓ Verified" : "! Rejected"}</span></div>
    <div class="proof-meta"><div><span>Mandate</span><strong>${verdict.mandateId}</strong></div><div><span>Network</span><strong>${verdict.network}</strong></div><div><span>Verified at</span><strong>${verdict.verifiedAt}</strong></div></div>
    <div class="hash-row"><div><span>TRANSACTION HASH</span><strong>${truncate(verdict.transactionHash)}</strong></div><div class="hash-actions"><button data-copy="${verdict.transactionHash}">Copy</button><a href="${explorerUrl(verdict.transactionHash)}" target="_blank" rel="noreferrer">BscScan ↗</a></div></div>
    <div class="check-table"><div class="check-heading"><span>Rule</span><span>Expected</span><span>Actual</span><span>Result</span></div>${verdict.checks.map(check => `<div class="check"><strong>${check.name}</strong><span>${check.expected}</span><span>${check.actual}</span><b class="${check.pass ? "ok" : "no"}">${check.pass ? "Passed" : "Failed"}</b></div>`).join("")}</div>
  </section>`;
}

function mandateRows() {
  return mandates.map(mandate => `<button class="mandate-row ${currentMandate.id === mandate.id ? "selected" : ""}" data-mandate="${mandate.id}"><i class="state ${mandate.status}"></i><span><strong>${mandate.tokenIn} → ${mandate.tokenOut}</strong><small>${mandate.id} · ${mandate.title}</small></span><em>${mandate.maxAmountIn}<small>${mandate.status === "verified" ? "Settled at 14:42" : mandate.status === "failed" ? "Router mismatch" : "Awaiting transaction"}</small></em><b class="badge ${mandate.status}">${mandate.status}</b></button>`).join("");
}

function dashboardMarkup() {
  return `<aside class="sidebar"><div class="logo"><span class="mark">●</span>mandate</div><p>WORKSPACE</p><nav><button class="active">▦ Overview</button><button>▤ Mandates</button><button>◌ Agents</button><button>◷ Activity</button></nav><div class="network"><i></i>BSC Testnet</div><div class="help"><b>?</b><span><strong>Need help?</strong><small>Review how mandates work.</small></span></div></aside>
  <main><header><div class="crumb">Workspace <b>/</b> Overview</div><div><button class="docs">Documentation</button><button id="wallet" class="wallet">○ Connect wallet</button></div></header><div class="page">
    <section class="intro"><div><p class="kicker">MANDATE PROTOCOL</p><h2>Proof before payment.</h2><p>Every executor must prove it followed the buyer’s rules before it can get paid.</p></div><button id="create" class="primary">＋ Create mandate</button></section>
    <section class="metrics"><article><span>Locked in escrow</span><strong>12.50 <small>USDT</small></strong><p>Across 3 active mandates</p></article><article><span>Verified today</span><strong>04 <small>mandates</small></strong><p class="green">100% deterministic checks</p></article><article><span>Agent exposure</span><strong>5.00 <small>USDT</small></strong><p>Daily allowance remaining</p></article><article><span>Verification cost</span><strong>0.04 <small>USDT</small></strong><p>Four on-chain checks</p></article></section>
    <section class="grid"><div class="panel"><div class="panel-title"><div><p class="kicker">ACTIVE WORK</p><h3>Mandates</h3></div><button>View all →</button></div><div class="mandates">${mandateRows()}</div></div><div id="result">${verdictMarkup(currentVerdict)}</div></section>
    <section class="panel timeline"><div class="panel-title"><div><p class="kicker">${currentMandate.id}</p><h3>Execution timeline</h3></div><span>Today · BSC Testnet</span></div><div class="steps">${[["14:38","Mandate funded","Buyer locked 5.00 USDT + executor fee in escrow."],["14:40","Agent accepted","Alpha Executor accepted the bounded buy order."],["14:42","Swap executed","Executor delivered CAKE to the buyer wallet."],["14:42","Proof verified","All deterministic transaction checks passed."],["14:43","Ready to settle","Buyer can now approve payment to the executor."]].map(([time,title,text],index)=>`<article><i class="${index < 4 ? "done" : ""}">${index < 4 ? "✓" : index + 1}</i><time>${time}</time><strong>${title}</strong><p>${text}</p></article>`).join("")}</div></section>
  </div></main><div id="toast" role="status"></div>`;
}

function showToast(message: string) { const toast = document.querySelector<HTMLDivElement>("#toast"); if (!toast) return; toast.textContent = message; toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 2500); }

function render() {
  root.innerHTML = dashboardMarkup();
  document.querySelectorAll<HTMLButtonElement>("[data-mandate]").forEach(button => button.addEventListener("click", async () => {
    currentMandate = mandates.find(mandate => mandate.id === button.dataset.mandate) ?? mandates[1];
    currentVerdict = currentMandate.status === "failed" ? failedVerdict : goodVerdict;
    if (currentMandate.transactionHash) { try { currentVerdict = await verifyTransaction(currentMandate.transactionHash); } catch { showToast("Verifier unavailable. Showing saved verdict."); } }
    render();
  }));
  document.querySelector<HTMLButtonElement>("#wallet")?.addEventListener("click", event => { const button = event.currentTarget as HTMLButtonElement; button.textContent = button.textContent.includes("Connect") ? "● 0x12a4…9E71" : "○ Connect wallet"; showToast("Wallet state updated for demo."); });
  document.querySelector<HTMLButtonElement>("#create")?.addEventListener("click", () => showToast("Mandate builder is the next implementation screen."));
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach(button => button.addEventListener("click", () => { void navigator.clipboard.writeText(button.dataset.copy ?? ""); showToast("Transaction hash copied."); }));
}

render();
