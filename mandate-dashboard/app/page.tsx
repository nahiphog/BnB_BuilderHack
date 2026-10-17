"use client";

import { useState } from "react";

type MandateStatus = "Verified" | "Executing" | "Needs review";

const mandates: Array<{ id: string; asset: string; task: string; status: MandateStatus; amount: string; agent: string; progress: string }> = [
  { id: "M-204", asset: "USDT → CAKE", task: "Bounded buy order", status: "Executing", amount: "≤ 5.00 USDT", agent: "Alpha Executor", progress: "Awaiting transaction" },
  { id: "M-203", asset: "USDT → CAKE", task: "Testnet swap", status: "Verified", amount: "4.98 USDT", agent: "Alpha Executor", progress: "Settled at 14:42" },
  { id: "M-202", asset: "USDT → TEST", task: "Policy check", status: "Needs review", amount: "≤ 5.00 USDT", agent: "Test Runner", progress: "Router mismatch" },
];

const proofChecks = [["Transaction succeeded", "Receipt status = 1"], ["Approved router", "PancakeSwap testnet router"], ["Asset received", "CAKE delivered to buyer"], ["Spend cap respected", "4.98 USDT ≤ 5.00 USDT"]] as const;

function Icon({ name }: { name: "grid" | "file" | "bot" | "clock" | "plus" | "copy" | "arrow" | "check" | "shield" | "external" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
    bot: <><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/></>,
    clock: <><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    copy: <><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>, check: <path d="m5 12 4 4L19 6"/>,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6zM9 12l2 2 4-4"/>,
    external: <><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview"); const [selected, setSelected] = useState(1); const [walletConnected, setWalletConnected] = useState(false); const [toast, setToast] = useState("");
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><span /></span><span>mandate</span></div><p className="workspace-label">WORKSPACE</p>
      <nav aria-label="Dashboard navigation" className="nav-list">{[["Overview", "grid"], ["Mandates", "file"], ["Agents", "bot"], ["Activity", "clock"]].map(([label, icon]) => <button key={label} className={`nav-link ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}><Icon name={icon as "grid"} />{label}</button>)}</nav>
      <div className="sidebar-bottom"><div className="network-pill"><i /> BSC Testnet</div><div className="help-card"><span className="help-icon">?</span><div><strong>Need help?</strong><p>Review how mandates work.</p></div></div></div>
    </aside>
    <section className="workspace"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div><div className="top-actions"><button className="text-button" onClick={() => showToast("Testnet documentation opened in a new tab.")}>Documentation</button><button className="wallet-button" onClick={() => setWalletConnected(!walletConnected)}><span className={walletConnected ? "wallet-dot connected" : "wallet-dot"} />{walletConnected ? "0x12a4...9E71" : "Connect wallet"}</button></div></header>
      <div className="content"><section className="page-heading"><div><p className="eyebrow">MANDATE PROTOCOL</p><h1>Proof before payment.</h1><p className="subhead">Every executor must prove it followed the buyer’s rules before it can get paid.</p></div><button className="primary-button" onClick={() => showToast("Mandate builder ready. Configure a testnet buy order next.")}><Icon name="plus" /> Create mandate</button></section>
        <section className="metric-grid" aria-label="Mandate metrics"><div className="metric-card"><p>Locked in escrow</p><strong>12.50 <small>USDT</small></strong><span>Across 3 active mandates</span></div><div className="metric-card"><p>Verified today</p><strong>04 <small>mandates</small></strong><span className="success-text">100% deterministic checks</span></div><div className="metric-card"><p>Agent exposure</p><strong>5.00 <small>USDT</small></strong><span>Daily allowance remaining</span></div><div className="metric-card"><p>Verification cost</p><strong>0.04 <small>USDT</small></strong><span>Four on-chain checks</span></div></section>
        <section className="dashboard-grid"><div className="panel mandates-panel"><div className="panel-header"><div><p className="eyebrow">ACTIVE WORK</p><h2>Mandates</h2></div><button className="small-link" onClick={() => setActiveNav("Mandates")}>View all <Icon name="arrow" /></button></div><div className="mandate-list">{mandates.map((mandate, index) => <button className={`mandate-row ${selected === index ? "selected" : ""}`} key={mandate.id} onClick={() => setSelected(index)}><span className={`status-dot ${mandate.status.toLowerCase().replace(" ", "-")}`} /><span className="mandate-copy"><strong>{mandate.asset}</strong><small>{mandate.id} · {mandate.task}</small></span><span className="mandate-amount"><strong>{mandate.amount}</strong><small>{mandate.progress}</small></span><span className={`status-badge ${mandate.status.toLowerCase().replace(" ", "-")}`}>{mandate.status}</span></button>)}</div></div>
          <aside className="panel proof-panel"><div className="panel-header"><div><p className="eyebrow">LIVE PROOF</p><h2>Transaction evidence</h2></div><span className="verified-pill"><Icon name="check" /> Verified</span></div><div className="proof-hero"><span className="proof-shield"><Icon name="shield" /></span><div><strong>Mandate M-203</strong><p>Alpha Executor completed the requested testnet swap.</p></div></div><div className="checks">{proofChecks.map(([name, evidence]) => <div className="check-row" key={name}><span className="checkmark"><Icon name="check" /></span><div><strong>{name}</strong><small>{evidence}</small></div></div>)}</div><div className="tx-box"><div><span>TRANSACTION HASH</span><strong>0xa8c1...3f92</strong></div><button aria-label="Copy transaction hash" onClick={() => showToast("Transaction hash copied.")}><Icon name="copy" /></button></div><button className="outline-button" onClick={() => showToast("BscScan link opened.")}>View on BscScan <Icon name="external" /></button></aside></section>
        <section className="panel activity-panel"><div className="panel-header"><div><p className="eyebrow">MANDATE M-203</p><h2>Execution timeline</h2></div><span className="muted-label">Today · BSC Testnet</span></div><div className="timeline">{[["14:38", "Mandate funded", "Buyer locked 5.00 USDT + executor fee in escrow."], ["14:40", "Agent accepted", "Alpha Executor accepted the bounded buy order."], ["14:42", "Swap executed", "Executor delivered CAKE to the buyer wallet."], ["14:42", "Proof verified", "All deterministic transaction checks passed."], ["14:43", "Ready to settle", "Buyer can now approve payment to the executor."]].map(([time, title, description], index) => <div className="timeline-event" key={title}><span className={`timeline-node ${index < 4 ? "done" : ""}`}>{index < 4 ? <Icon name="check" /> : index + 1}</span><time>{time}</time><div><strong>{title}</strong><p>{description}</p></div></div>)}</div></section>
      </div></section>{toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
