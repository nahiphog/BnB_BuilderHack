import "./styles.css";
import { isLiveVerifierConfigured, verifyTransaction } from "./api";
import { failedVerdict, goodVerdict, mandates } from "./fixtures";
import type { VerificationVerdict, SharedVerdict } from "./types";
import { demoMandate, toDisplayVerdict } from "./fixtures";
import { verifyLive, type LiveEvent } from "./live/verifyLive";
import type { Mandate as LiveMandate } from "./live/types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root is missing");
const root = app;

let currentMandate = mandates[1];
let currentVerdict: VerificationVerdict = goodVerdict;
let verdictSource: "saved" | "live" = "saved";
let liveHash = goodVerdict.transactionHash;
let liveRunning = false;
let liveLog: string[] = [];
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);

const buyerAddress = "0x4A79814A7006360eCED4454c9cf09fD3E7883FA9";
const executorAddress = "0x14E8c52d84A4c044DC83c8F5Fc2C601c930F9C1f";
const truncate = (value: string) => `${value.slice(0, 8)}…${value.slice(-4)}`;
const transactionUrl = (hash: string) => `https://testnet.bscscan.com/tx/${hash}`;
const addressUrl = (address: string) => `https://testnet.bscscan.com/address/${address}`;

function verdictMarkup(verdict: VerificationVerdict) {
  const tone = verdict.pass ? "pass" : "fail";
  return `<section class="result-card ${tone}" aria-live="polite">
    <div class="result-head"><div><p class="kicker">VERIFIER RESULT</p><h1>${verdict.pass ? "Mandate verified" : "Mandate rejected"}</h1><p>${verdict.report}</p></div><span class="verdict ${tone}">${verdict.pass ? "✓ Verified" : "! Rejected"}</span></div>
    <div class="proof-meta"><div><span>Mandate</span><strong>${verdict.mandateId}</strong></div><div><span>Network</span><strong>${verdict.network}</strong></div><div><span>Verified at</span><strong>${verdict.verifiedAt} MYT</strong></div></div>${verdictSource === "live" ? '<p class="saved-verdict live-source">● Verified live just now: your browser read BSC testnet and ran the 9 checks</p>' : '<p class="saved-verdict">Saved on-chain verdict · use Verify live to re-run it yourself</p>'}
    <div class="hash-row"><div><span>TRANSACTION HASH</span><strong>${truncate(verdict.transactionHash)}</strong></div><div class="hash-actions"><button data-copy="${verdict.transactionHash}">Copy</button><a href="${transactionUrl(verdict.transactionHash)}" target="_blank" rel="noreferrer">BscScan ↗</a></div></div>
    <div class="identity-links"><span><b>Buyer</b> Encik Rahman (demo) · <a href="${addressUrl(buyerAddress)}" target="_blank" rel="noreferrer">${truncate(buyerAddress)} ↗</a></span><span><b>Executor</b> · <a href="${addressUrl(executorAddress)}" target="_blank" rel="noreferrer">${truncate(executorAddress)} ↗</a></span><span><b>Mandate agent</b> · <a href="https://bnbagent-api.bnbchain.world/v1/rt/01M546AFGY9WQY3K6EC28QD649/.well-known/agent-card.json" target="_blank" rel="noreferrer">Agent card ↗</a></span><span><a href="https://testnet.bscscan.com/tx/0x62e5f197526a7ce14bbcad17a53f6c081ff0ae2e49e3f170f6336a85e184493a" target="_blank" rel="noreferrer"><b>ERC-8004 agent #2644</b> ↗</a></span></div>
    <div class="check-table"><div class="check-heading"><span>Rule</span><span>Expected</span><span>On-chain evidence</span><span>Result</span></div>${verdict.checks.map((check) => `<div class="check ${check.pass ? "" : "failed-check"}"><strong>${check.name}</strong><span>${check.expected}</span><span>${check.actual}</span><b class="${check.pass ? "ok" : "no"}">${check.pass ? "Passed" : "Failed"}</b></div>`).join("")}</div>
  </section>`;
}

function mandateRows() {
  return mandates.map((mandate) => `<button class="mandate-row ${currentMandate.id === mandate.id ? "selected" : ""}" data-mandate="${mandate.id}"><i class="state ${mandate.status}"></i><span><strong>${mandate.tokenIn} → ${mandate.tokenOut}</strong><small>${mandate.id} · ${mandate.title}</small></span><em>${mandate.maxAmountIn}<small>${mandate.status === "verified" ? "All 9 rules passed" : mandate.status === "failed" ? "Spend cap exceeded" : "No transaction yet"}</small></em><b class="badge ${mandate.status}">${mandate.status}</b></button>`).join("");
}

function evidenceFlow() {
  if (verdictSource === "live") {
    const t = currentVerdict.verifiedAt;
    const live = [[t, "Connected", "Browser connected to BSC testnet directly."], [t, "Receipt read", "Transaction, receipt and transfer logs read live."], [t, "Nine rules checked", currentVerdict.pass ? "Every rule passed." : `${currentVerdict.checks.filter((c) => !c.pass).map((c) => c.name).join(", ")} failed.`], ["Result", currentVerdict.pass ? "Eligible for payment" : "Payment blocked", currentVerdict.pass ? "All deterministic rules passed." : "Executor does not qualify for payment."]];
    return live.map(([time, title, text], index) => `<article><i class="${index < 3 || currentVerdict.pass ? "done" : ""}">${index < 3 || currentVerdict.pass ? "✓" : index + 1}</i><time>${time}</time><strong>${title}</strong><p>${text}</p></article>`).join("");
  }
  const steps = currentVerdict.pass
    ? [["11:39 AM", "Transaction recorded", "Honest BSC Testnet swap is available for verification."], ["11:39 AM", "Receipt read", "Verifier reads the transaction and its logs."], ["11:39 AM", "Nine rules checked", "Router, cap, recipient, executor and deadline match."], ["Result", "Eligible for payment", "All deterministic rules passed."]]
    : [["11:39 AM", "Transaction recorded", "Overspend test transaction is available for verification."], ["11:39 AM", "Receipt read", "Verifier reads the transaction and its logs."], ["11:39 AM", "Spend cap failed", "0.02 tBNB is greater than the 0.01 tBNB cap."], ["Result", "Payment blocked", "Executor does not qualify for payment."]];
  return steps.map(([time, title, text], index) => `<article><i class="${index < 3 || currentVerdict.pass ? "done" : ""}">${index < 3 || currentVerdict.pass ? "✓" : index + 1}</i><time>${time}</time><strong>${title}</strong><p>${text}</p></article>`).join("");
}

function livePanel() {
  return `<div class="live-panel"><p class="kicker">VERIFY LIVE</p><p class="live-sub">Don't trust our screenshot. Your browser reads BSC testnet directly and runs the same 9 checks. No server, no wallet.</p>
    <div class="live-presets"><button data-preset="${goodVerdict.transactionHash}">Honest swap</button><button data-preset="${failedVerdict.transactionHash}">Overspend swap</button></div>
    <div class="live-input"><input id="live-hash" value="${escapeHtml(liveHash)}" spellcheck="false" aria-label="Transaction hash" placeholder="0x… transaction hash" /><button id="live-run" class="primary" ${liveRunning ? "disabled" : ""}>${liveRunning ? "Verifying…" : "Verify now"}</button></div>
    <p id="live-error" class="live-error" role="alert"></p>
    <ol id="live-log" class="live-log">${liveLog.join("")}</ol></div>`;
}

function logLine(e: LiveEvent): string {
  if (e.kind === "check") return `<li class="${e.check.pass ? "ok" : "no"}"><b>${e.check.pass ? "✓" : "✗"}</b><span><strong>${e.check.name}</strong> ${escapeHtml(e.check.evidence)}</span></li>`;
  if (e.kind === "error") return `<li class="no"><b>!</b><span>${escapeHtml(e.text)}</span></li>`;
  return `<li class="${e.kind === "done" ? "ok" : "pending"}"><b>${e.kind === "done" ? "✓" : "…"}</b><span>${escapeHtml(e.text)}</span></li>`;
}

async function runLive() {
  const input = document.querySelector<HTMLInputElement>("#live-hash");
  const error = document.querySelector<HTMLParagraphElement>("#live-error");
  const hash = (input?.value ?? "").trim();
  if (!HASH_RE.test(hash)) {
    if (error) error.textContent = "Enter a full transaction hash: 0x followed by 64 hex characters.";
    return;
  }
  liveHash = hash;
  liveRunning = true;
  liveLog = [];
  const log = document.querySelector<HTMLOListElement>("#live-log");
  const button = document.querySelector<HTMLButtonElement>("#live-run");
  if (log) log.innerHTML = "";
  if (button) { button.disabled = true; button.textContent = "Verifying…"; }
  const push = (e: LiveEvent) => {
    const last = liveLog[liveLog.length - 1];
    if (e.kind !== "step" && last?.includes('class="pending"')) {
      liveLog.pop();
      if (e.kind !== "done") liveLog.push(last.replace('class="pending"', 'class="ok"').replace("<b>…</b>", "<b>✓</b>"));
    }
    liveLog.push(logLine(e));
    const el = document.querySelector<HTMLOListElement>("#live-log");
    if (el) { el.innerHTML = liveLog.join(""); el.scrollTop = el.scrollHeight; }
  };
  try {
    const verdict = await verifyLive(demoMandate as unknown as LiveMandate, hash as `0x${string}`, push);
    push({ kind: verdict.pass ? "done" : "error", text: verdict.pass ? "VERDICT: PASS. Executor qualifies for payment." : "VERDICT: FAIL. Payment blocked, buyer protected." });
    currentVerdict = toDisplayVerdict(verdict as unknown as SharedVerdict);
    verdictSource = "live";
    currentMandate = mandates.find((m) => m.transactionHash?.toLowerCase() === hash.toLowerCase()) ?? currentMandate;
  } catch (err) {
    push({ kind: "error", text: `Could not read this transaction from BSC testnet: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}` });
  } finally {
    liveRunning = false;
    render();
  }
}

function dashboardMarkup() {
  return `<aside class="sidebar"><div class="logo"><span class="mark">●</span>mandate</div><div class="side-copy"><p class="kicker">BSC TESTNET DEMO</p><strong>Deterministic proof for agent trades.</strong></div><div class="network"><i></i>BSC Testnet</div></aside>
  <main><header><div class="crumb">Proof of Work <b>/</b> BSC Testnet</div><a class="docs" href="https://github.com/nahiphog/BnB_BuilderHack#readme" target="_blank" rel="noreferrer">GitHub documentation ↗</a></header><div class="page">
    <section class="intro"><div><p class="kicker">MANDATE PROTOCOL</p><h2>Proof before payment.</h2><p>Every executor must prove it followed the buyer’s rules before it can get paid.</p><p class="malaysia">Malaysians lost RM2.68 billion to fake investment schemes (2024 to May 2026). Mandate makes “my trading bot works” provable.</p></div></section>
    <section class="metrics"><article><span>Buyer</span><strong>Encik Rahman</strong><p>Demo buyer · BSC Testnet</p></article><article><span>Mandate cap</span><strong>0.01 <small>tBNB</small></strong><p>No escrow funded in this demo</p></article><article><span>Deterministic proof</span><strong>9 <small>checks</small></strong><p class="green">Every rule is shown below</p></article><article><span>Verification price</span><strong>$0.01</strong><p>Per deterministic check</p></article></section>
    <section class="grid"><div class="panel"><div class="panel-title"><div><p class="kicker">DEMO CASES</p><h3>Verifier scenarios</h3></div></div><div class="mandates">${mandateRows()}</div><div class="how-it-works"><p class="kicker">HOW IT WORKS</p><div><article><b>1</b><span><strong>Mandate</strong><small>Buyer defines a cap, route and recipient.</small></span></article><article><b>2</b><span><strong>Executor trades</strong><small>Agent submits the BSC Testnet transaction.</small></span></article><article><b>3</b><span><strong>Code verifies</strong><small>No proof, no pay.</small></span></article></div></div>${livePanel()}</div><div id="result">${verdictMarkup(currentVerdict)}</div></section>
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
    verdictSource = "saved";
    currentVerdict = selected.status === "failed" ? failedVerdict : goodVerdict;
    render();
    if (!selected.transactionHash || !isLiveVerifierConfigured) return;
    try {
      currentVerdict = await verifyTransaction(selected.transactionHash);
      render();
    } catch {
      showToast("Verifier unavailable. Showing saved on-chain verdict.");
    }
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    const input = document.querySelector<HTMLInputElement>("#live-hash");
    if (input) input.value = button.dataset.preset ?? "";
    liveHash = input?.value ?? liveHash;
    const error = document.querySelector<HTMLParagraphElement>("#live-error");
    if (error) error.textContent = "";
  }));
  document.querySelector<HTMLInputElement>("#live-hash")?.addEventListener("input", (event) => {
    liveHash = (event.currentTarget as HTMLInputElement).value;
    const error = document.querySelector<HTMLParagraphElement>("#live-error");
    if (error) error.textContent = "";
  });
  document.querySelector<HTMLButtonElement>("#live-run")?.addEventListener("click", () => { void runLive(); });
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => button.addEventListener("click", () => {
    void navigator.clipboard.writeText(button.dataset.copy ?? "");
    showToast("Transaction hash copied.");
  }));
}

render();
