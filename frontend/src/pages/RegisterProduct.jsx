import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function RegisterProduct({ onNavigate }) {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    productName: "", batchNumber: "", manufacturerName: "",
    manufacturerLocation: "", harvestDate: "", fromAddress: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAccounts().then(d => {
      setAccounts(d.accounts || []);
      if (d.accounts?.length) setForm(f => ({ ...f, fromAddress: d.accounts[0] }));
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(""); setResult(null);
    if (!form.productName || !form.batchNumber || !form.manufacturerName || !form.manufacturerLocation || !form.fromAddress) {
      setError("Please fill all required fields."); return;
    }
    setLoading(true);
    try {
      const data = await api.createProduct(form);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <h1 className="page-title">Register Product</h1>
        <div className="card">
          <div className="alert alert-success">✅ Product token created on blockchain!</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <div className="stat-label">Token ID</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--teal)" }}>#{result.tokenId}</div>
            </div>
            <div>
              <div className="stat-label">Tx Hash</div>
              <div style={{ fontSize: 11, color: "var(--text2)", wordBreak: "break-all" }}>{result.txHash}</div>
            </div>
          </div>
          {result.product?.qrCode && (
            <div className="qr-box">
              <div className="stat-label" style={{ marginBottom: 12 }}>QR Code (scan to verify)</div>
              <img src={result.product.qrCode} alt="QR Code" width={180} />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => { setResult(null); setForm({ productName: "", batchNumber: "", manufacturerName: "", manufacturerLocation: "", harvestDate: "", fromAddress: accounts[0] || "" }); }}>
              Register Another
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate("dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">📦 Register New Product</h1>
      <div className="card">
        <div className="card-title">Product Details</div>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" placeholder="e.g. Alphonso Mango Box" value={form.productName} onChange={e => set("productName", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Batch Number *</label>
            <input className="form-input" placeholder="e.g. BATCH-2024-001" value={form.batchNumber} onChange={e => set("batchNumber", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer Name *</label>
            <input className="form-input" placeholder="e.g. Kolhapur Farms Ltd" value={form.manufacturerName} onChange={e => set("manufacturerName", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer Location *</label>
            <input className="form-input" placeholder="e.g. Kolhapur, Maharashtra" value={form.manufacturerLocation} onChange={e => set("manufacturerLocation", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Harvest / Production Date</label>
            <input className="form-input" type="date" value={form.harvestDate} onChange={e => set("harvestDate", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer Wallet Address *</label>
            {accounts.length > 0 ? (
              <select className="form-select" value={form.fromAddress} onChange={e => set("fromAddress", e.target.value)}>
                {accounts.map(a => <option key={a} value={a}>{a.slice(0, 20)}...{a.slice(-6)}</option>)}
              </select>
            ) : (
              <input className="form-input" placeholder="0x..." value={form.fromAddress} onChange={e => set("fromAddress", e.target.value)} />
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <><span className="spinner" /> Minting Token...</> : "⬡ Mint Product Token"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">What happens when you register?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["1", "A unique NFT-like token is created on the Ethereum blockchain", "var(--teal)"],
            ["2", "Product metadata is stored immutably in the smart contract", "var(--purple)"],
            ["3", "A QR code is generated linking to this token", "var(--blue)"],
            ["4", "Product is saved in MongoDB for ML analysis", "var(--amber)"],
          ].map(([n, t, c]) => (
            <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: c, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", paddingTop: 3 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
