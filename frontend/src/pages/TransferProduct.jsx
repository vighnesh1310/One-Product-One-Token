import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function TransferProduct({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ tokenId: "", toAddress: "", location: "", notes: "", fromAddress: "", recipientRole: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAccounts().then(d => {
      const accs = d.accounts || [];
      setAccounts(accs);
    }).catch(() => { });
    api.getProducts().then(d => setProducts(d.products || [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (user?.walletAddress) {
      setForm(f => ({ ...f, fromAddress: user.walletAddress }));
    }
  }, [user]);

  const ownedProducts = products.filter(p => p.currentOwner?.toLowerCase() === user?.walletAddress?.toLowerCase());

  const getNextRole = () => {
    const r = user?.role?.toLowerCase();
    if (r === "manufacturer") return "distributor";
    if (r === "distributor") return "retailer";
    if (r === "retailer") return "customer";
    return "";
  };

  useEffect(() => {
    const next = getNextRole();
    if (next) set("recipientRole", next);
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.tokenId) {
      const product = products.find(p => String(p.tokenId) === String(form.tokenId));
      if (product && product.currentOwner) {
        set("fromAddress", product.currentOwner);
      }
    }
  }, [form.tokenId, products]);

  const handleSubmit = async () => {
    setError(""); setResult(null);
    if (!form.tokenId || !form.toAddress || !form.location || !form.fromAddress || !form.recipientRole)
      return setError("Token ID, From Address, To Address, Location, and Recipient Role are required.");
    if (form.fromAddress.toLowerCase() === form.toAddress.toLowerCase())
      return setError("From and To addresses cannot be the same.");
    setLoading(true);
    try {
      const data = await api.transferProduct(form.tokenId, {
        toAddress: form.toAddress,
        location: form.location,
        notes: form.notes,
        fromAddress: form.fromAddress,
        recipientRole: form.recipientRole
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const level = result.riskScore >= 70 ? "HIGH" : result.riskScore >= 40 ? "MEDIUM" : "LOW";
    const color = result.riskScore >= 70 ? "var(--coral)" : result.riskScore >= 40 ? "var(--amber)" : "var(--green)";
    return (
      <div>
        <h1 className="page-title">🔄 Transfer Ownership</h1>
        <div className="card">
          <div className="alert alert-success">✅ Ownership transferred on blockchain!</div>
          <div style={{ marginBottom: 14 }}>
            <div className="stat-label">Transaction Hash</div>
            <code style={{ fontSize: 12, color: "var(--teal)", wordBreak: "break-all" }}>{result.txHash}</code>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="stat-label">ML Risk Score</span>
              <strong style={{ color, fontSize: 13 }}>{result.riskScore}% – {level}</strong>
            </div>
            <div className="risk-bar-wrap">
              <div className="risk-bar" style={{ width: `${result.riskScore}%`, background: color }} />
            </div>
          </div>
          {result.riskFlags?.length > 0 && result.riskFlags.map(f => (
            <div key={f} className="alert alert-error" style={{ marginTop: 8 }}>⚠ {f}</div>
          ))}
          {!result.riskFlags?.length && <div className="alert alert-success" style={{ marginTop: 8 }}>No fraud flags detected.</div>}
          <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => { setResult(null); }}>Transfer Another</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">🔄 Transfer Ownership</h1>

      <div className="card">
        <div className="card-title">Transfer Details</div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Product Token * {ownedProducts.length > 0 ? `(Showing ${ownedProducts.length} items you own)` : "(No products owned)"}</label>
          {ownedProducts.length > 0 ? (
            <select className="form-select" value={form.tokenId} onChange={e => set("tokenId", e.target.value)}>
              <option value="">-- Select product --</option>
              {ownedProducts.map(p => <option key={p.tokenId} value={p.tokenId}>#{p.tokenId} – {p.productName} ({p.batchNumber})</option>)}
            </select>
          ) : (
            <div className="alert alert-error" style={{ fontSize: 12 }}>You do not currently own any products to transfer.</div>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">From Address (Your Wallet) *</label>
            <input className="form-input" value={form.fromAddress} readOnly style={{ background: "rgba(255,255,255,0.05)", cursor: "not-allowed" }} />
          </div>
          <div className="form-group">
            <label className="form-label">To Address (New Owner) *</label>
            {accounts.length > 1 ? (
              <select className="form-select" value={form.toAddress} onChange={e => set("toAddress", e.target.value)}>
                <option value="">-- Select recipient --</option>
                {accounts.filter(a => a.toLowerCase() !== form.fromAddress.toLowerCase()).map(a => (
                  <option key={a} value={a}>{a.slice(0, 20)}...{a.slice(-6)}</option>
                ))}
              </select>
            ) : (
              <input className="form-input" placeholder="0x..." value={form.toAddress} onChange={e => set("toAddress", e.target.value)} />
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Current Location *</label>
            <input className="form-input" placeholder="e.g. Mumbai Warehouse" value={form.location} onChange={e => set("location", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes <span style={{ color: "var(--text2)", fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" placeholder="e.g. Cold chain maintained, quality checked" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Recipient Role *</label>
            <input className="form-input" value={form.recipientRole || "N/A"} readOnly style={{ textTransform: "capitalize", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>Locked based on your role: {user?.role}</div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <><span className="spinner" /> Processing + ML Check...</> : "🔄 Transfer & Run Fraud Check"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">🤖 How ML Fraud Detection Works</div>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>Every transfer is scored 0–100% by our Isolation Forest model:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["🕒", "Time Gap Analysis", "Flags transfers under 1 hour apart"],
            ["🌍", "Location Jump", "Flags 5000+ km jumps (e.g. Pune → USA in 2hrs)"],
            ["👥", "Owner Count", "Flags too many unique owners"],
            ["🔁", "Loop Detection", "Flags same location used multiple times"],
          ].map(([ic, t, d]) => (
            <div key={t} style={{ background: "var(--bg3)", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{ic}</span>
              <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
