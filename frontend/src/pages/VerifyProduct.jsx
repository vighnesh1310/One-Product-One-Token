import { useState } from "react";
import { api } from "../utils/api";

export default function VerifyProduct() {
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!tokenId.trim()) { setError("Enter a Token ID"); return; }
    setError(""); setResult(null); setLoading(true);
    try {
      const data = await api.verifyProduct(tokenId.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">✅ Verify Product</h1>

      <div className="card">
        <div className="card-title">Enter Token ID or Scan QR</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="form-input"
            placeholder="Token ID (e.g. 1)"
            value={tokenId}
            onChange={e => setTokenId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
            {loading ? <span className="spinner" /> : "Verify"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
          💡 Tip: Scan a product QR code to extract the Token ID, then paste it here.
        </p>
      </div>

      {result && (
        <>
          <div className="card">
            <div className={`verify-result ${result.verified ? "verified-ok" : "verified-fail"}`}>
              <div className="verify-icon">{result.verified ? "✅" : "🚫"}</div>
              <div className="verify-title">{result.verified ? "Authentic Product" : "Verification Failed"}</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                {result.verified
                  ? "This product token is valid and registered on the blockchain."
                  : "This product may be counterfeit or has been flagged."}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Product Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                ["Token ID", `#${result.product?.tokenId}`],
                ["Product Name", result.product?.productName],
                ["Batch Number", result.product?.batchNumber],
                ["Manufacturer", result.product?.manufacturerName],
                ["Origin", result.product?.manufacturerLocation],
                ["Current Owner", result.product?.currentOwner ? `${result.product.currentOwner.slice(0, 16)}...` : "—"],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="stat-label">{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="card-title" style={{ margin: 0 }}>ML Risk Assessment</div>
              <RiskBadge score={result.riskScore} />
            </div>
            <div className="risk-bar-wrap">
              <div className="risk-bar" style={{
                width: `${result.riskScore ?? 0}%`,
                background: result.riskScore >= 70 ? "var(--coral)" : result.riskScore >= 40 ? "var(--amber)" : "var(--green)"
              }} />
            </div>
            {result.riskFlags?.length > 0 ? (
              <div style={{ marginTop: 10 }}>
                {result.riskFlags.map(f => (
                  <div key={f} className="alert alert-error" style={{ marginBottom: 6 }}>⚠ {f}</div>
                ))}
              </div>
            ) : (
              <div className="alert alert-success" style={{ marginTop: 10 }}>No fraud flags detected.</div>
            )}
          </div>

          {result.product?.qrCode && (
            <div className="card">
              <div className="card-title">Product QR Code</div>
              <div className="qr-box">
                <img src={result.product.qrCode} alt="Product QR" width={160} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RiskBadge({ score }) {
  const s = score ?? 0;
  if (s >= 70) return <span className="badge badge-red">{s}% HIGH</span>;
  if (s >= 40) return <span className="badge badge-amber">{s}% MED</span>;
  return <span className="badge badge-green">{s}% LOW</span>;
}
