import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("App root is missing");

app.innerHTML = `
  <main class="about-shell">
    <nav class="about-nav" aria-label="Primary navigation">
      <a class="about-brand" href="../"><span class="mark">●</span>Trident</a>
      <a class="about-back" href="../">← Back to dashboard</a>
    </nav>
    <section class="about-card" aria-labelledby="about-title">
      <p class="kicker">ABOUT TRIDENT</p>
      <h1 id="about-title">Proof, made clear.</h1>
      <p>Trident is a hackathon project built to make agent-executed trades easier to inspect and verify.</p>
      <div class="about-people" aria-label="Project builders">
        <article><span>BUILT BY</span><strong>Goh Pi Han</strong></article>
        <article><span>BUILT BY</span><strong>Hassan Abni</strong></article>
      </div>
      <p>This site was created for the <a class="about-hackathon" href="https://luma.com/ldp3i5kn" target="_blank" rel="noreferrer">hackathon ↗</a> and built with the assistance of ChatGPT, Claude, and Gemini.</p>
    </section>
  </main>
`;
