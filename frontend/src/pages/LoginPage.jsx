import { useState } from "react";
import { api } from "../utils/api";

export default function LoginPage({ onLogin, onBack, theme, toggleTheme }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manufacturer", walletAddress: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    if (mode === "register" && !form.name) { setError("Name is required"); return; }
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await api.login({ email: form.email, password: form.password });
      } else {
        data = await api.register(form);
      }
      localStorage.setItem("sc_token", data.token);
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo login shortcut
  const demoLogin = () => {
    setForm({ ...form, email: "demo@onetoken.io", password: "demo1234" });
  };

  return (
    <div className="login-page">
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>
      <div className="login-left">
        <div className="login-brand">
          <span style={{ fontSize: 32, marginRight: 10 }}>⬡</span>
          <span>OneToken Supply Chain</span>
        </div>
        <h2 className="login-tagline">Blockchain-powered<br />product traceability</h2>
        <div className="login-features">
          {["NFT token per product", "ML fraud detection", "QR code verification", "Full transfer history", "Real-time risk scoring"].map(f => (
            <div key={f} className="login-feature"><span style={{ color: "var(--teal)", marginRight: 8 }}>✓</span>{f}</div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-tabs">
            <button className={`login-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Login</button>
            <button className={`login-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>Register</button>
          </div>

          <h2 className="login-title">{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="login-sub">{mode === "login" ? "Sign in to your supply chain dashboard" : "Join the blockchain supply chain network"}</p>

          {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

          {mode === "register" && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => set("role", e.target.value)}>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="distributor">Distributor</option>
                  <option value="retailer">Retailer</option>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Wallet Address <span style={{ color: "var(--text2)", fontWeight: 400 }}>(optional)</span></label>
              <input className="form-input" placeholder="0x..." value={form.walletAddress} onChange={e => set("walletAddress", e.target.value)} />
            </div>
          )}

          <button className="btn btn-primary" style={{ width: "100%", padding: "11px", fontSize: 14 }} onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> {mode === "login" ? "Signing in..." : "Creating account..."}</> : (mode === "login" ? "Sign In →" : "Create Account →")}
          </button>

          {mode === "login" && (
            <button className="btn btn-secondary" style={{ width: "100%", marginTop: 10 }} onClick={demoLogin}>
              Use Demo Credentials
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--text2)" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", textDecoration: "underline" }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
