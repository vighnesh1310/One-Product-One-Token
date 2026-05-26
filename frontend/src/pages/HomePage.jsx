export default function HomePage({ onGetStarted, theme, toggleTheme }) {
  return (
    <div className="home-page">
      {/* Hero */}
      <header className="home-header">
        <div className="home-logo"><span>⬡</span> OneToken</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="theme-toggle" onClick={toggleTheme} style={{ marginLeft: 0 }}>
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
          <button className="btn btn-secondary" onClick={onGetStarted}>Login / Register</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-badge">🏆 Blockchain + AI Supply Chain</div>
        <h1 className="hero-title">One Product.<br /><span className="hero-accent">One Token.</span><br />Full Transparency.</h1>
        <p className="hero-sub">Track every product from farm to customer on the Ethereum blockchain. ML-powered fraud detection flags suspicious transfers in real-time.</p>
        <div className="hero-btns">
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Get Started →</button>
          <a href="#features" className="btn btn-secondary btn-lg">Learn More</a>
        </div>
        <div className="hero-stats">
          {[["NFT Tokens", "Per Product"], ["Smart Contracts", "On-Chain"], ["ML Fraud", "Detection"], ["100%", "Transparent"]].map(([v, l]) => (
            <div className="hero-stat" key={l}><div className="hero-stat-val">{v}</div><div className="hero-stat-lbl">{l}</div></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <h2 className="section-title">Why OneToken?</h2>
        <div className="features-grid">
          {[
            { icon: "🔗", title: "Blockchain Immutability", desc: "Every product transfer is recorded permanently on Ethereum. No one can alter the history — not even us." },
            { icon: "🤖", title: "ML Fraud Detection", desc: "Isolation Forest model analyzes each transfer for suspicious patterns — location jumps, timing anomalies, duplicate attempts." },
            { icon: "📱", title: "QR Code Verification", desc: "Scan any product's QR code to instantly verify its blockchain authenticity and full journey history." },
            { icon: "🔐", title: "Smart Contracts", desc: "Solidity contracts enforce rules automatically: only the current owner can transfer, all history is immutable." },
            { icon: "📊", title: "Real-Time Dashboard", desc: "Live risk scores, transfer timelines, admin controls, and ML analytics in one unified interface." },
            { icon: "🌾", title: "Agriculture Use Case", desc: "Perfect for mango boxes, grain batches, dairy products — trace from farmer to consumer with zero trust issues." },
          ].map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className="flow-section">
        <h2 className="section-title">How It Works</h2>
        <div className="flow-steps">
          {[
            { n: "1", title: "Manufacturer Registers", desc: "Creates a unique blockchain token for each product batch with metadata." },
            { n: "2", title: "QR Code Generated", desc: "A scannable QR code is created linking to the immutable blockchain token." },
            { n: "3", title: "Supply Chain Transfers", desc: "Each handoff from distributor → retailer is recorded on-chain." },
            { n: "4", title: "ML Fraud Check", desc: "Every transfer triggers an AI risk assessment (0-100% fraud score)." },
            { n: "5", title: "Customer Verifies", desc: "Scan QR → instant authenticity verification from blockchain." },
          ].map((s, i) => (
            <div className="flow-step" key={s.n}>
              <div className="flow-num">{s.n}</div>
              <div className="flow-content">
                <div className="flow-title">{s.title}</div>
                <div className="flow-desc">{s.desc}</div>
              </div>
              {i < 4 && <div className="flow-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to secure your supply chain?</h2>
        <p>Join manufacturers, distributors, and retailers using blockchain-verified product tracking.</p>
        <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Start for Free →</button>
      </section>

      <footer className="home-footer">
        <span>⬡ OneToken Supply Chain</span>
        <span style={{ color: "var(--text2)", fontSize: 12 }}>Built with Ethereum · Solidity · React · Python ML</span>
      </footer>
    </div>
  );
}
