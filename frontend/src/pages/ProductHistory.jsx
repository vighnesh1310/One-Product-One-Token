import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function ProductHistory() {
  const [tokenId, setTokenId] = useState("");
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProducts().then(d => setProducts(d.products || [])).catch(() => {});
  }, []);

  const handleLoad = async () => {
    if (!tokenId.trim()) { setError("Enter a Token ID"); return; }
    setError(""); setProduct(null); setLoading(true);
    try {
      const data = await api.getProduct(tokenId.trim());
      setProduct(data.product);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const roleColors = {
    Manufacturer: "var(--teal)",
    Distributor: "var(--purple)",
    Retailer: "var(--blue)",
    Customer: "var(--green)",
    Transfer: "var(--amber)",
  };

  return (
    <div>
      <h1 className="page-title">📋 Product History</h1>

      <div className="card">
        <div className="card-title">Select Product</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          {products.length > 0 ? (
            <select className="form-select" style={{ flex: 1 }} value={tokenId} onChange={e => setTokenId(e.target.value)}>
              <option value="">-- Select product --</option>
              {products.map(p => (
                <option key={p.tokenId} value={p.tokenId}>#{p.tokenId} – {p.productName}</option>
              ))}
            </select>
          ) : (
            <input className="form-input" style={{ flex: 1 }} placeholder="Token ID" value={tokenId} onChange={e => setTokenId(e.target.value)} />
          )}
          <button className="btn btn-primary" onClick={handleLoad} disabled={loading}>
            {loading ? <span className="spinner" /> : "Load History"}
          </button>
        </div>
      </div>

      {product && (
        <>
          <div className="card">
            <div className="card-title">Product Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                ["Token ID", `#${product.tokenId}`, "var(--teal)"],
                ["Product", product.productName, "var(--text)"],
                ["Batch", product.batchNumber, "var(--text)"],
                ["Manufacturer", product.manufacturerName, "var(--text)"],
                ["Origin", product.manufacturerLocation, "var(--text)"],
                ["Transfers", product.transferHistory?.length ?? 0, "var(--purple)"],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div className="stat-label">{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color, marginTop: 3 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="card-title" style={{ margin: 0 }}>Transfer Timeline</div>
              <span className={`badge ${product.isAuthentic ? "badge-green" : "badge-red"}`}>
                {product.isAuthentic ? "Authentic" : "Flagged"}
              </span>
            </div>
            <div className="timeline">
              {(product.transferHistory || []).map((t, i) => {
                const role = t.role || "Transfer";
                const ts = t.timestamp ? new Date(Number(t.timestamp)).toLocaleString() : "—";
                return (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-dot" style={{ background: roleColors[role] || "var(--teal)" }} />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-role" style={{ color: roleColors[role] || "var(--teal)" }}>
                          {role}
                        </span>
                        <span className="timeline-time">{ts}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                        <span>From: </span>
                        <code style={{ fontSize: 11 }}>{t.from?.slice(0, 14) || "Genesis"}...{t.from?.slice(-6) || ""}</code>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        <span>To: </span>
                        <code style={{ fontSize: 11 }}>{t.to?.slice(0, 14) || ""}...{t.to?.slice(-6) || ""}</code>
                      </div>
                      {t.location && <div className="timeline-location">📍 {t.location}</div>}
                      {t.notes && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, fontStyle: "italic" }}>{t.notes}</div>}
                      {t.txHash && (
                        <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>
                          Tx: <code>{t.txHash.slice(0, 20)}...</code>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {product.riskScore > 0 && (
            <div className="card">
              <div className="card-title">ML Risk Assessment</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>Risk Score</span>
                <strong style={{ color: product.riskScore >= 70 ? "var(--coral)" : product.riskScore >= 40 ? "var(--amber)" : "var(--green)" }}>
                  {product.riskScore}%
                </strong>
              </div>
              <div className="risk-bar-wrap">
                <div className="risk-bar" style={{
                  width: `${product.riskScore}%`,
                  background: product.riskScore >= 70 ? "var(--coral)" : product.riskScore >= 40 ? "var(--amber)" : "var(--green)"
                }} />
              </div>
              {product.riskFlags?.map(f => (
                <div key={f} className="alert alert-error" style={{ marginTop: 8 }}>⚠ {f}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
