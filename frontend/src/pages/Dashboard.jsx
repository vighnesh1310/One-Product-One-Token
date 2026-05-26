import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function Dashboard({ onNavigate, user }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mlStatus, setMlStatus] = useState("checking");
  const [wallet, setWallet] = useState(user?.walletAddress || "");
  const [accounts, setAccounts] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getStats().then(d => { setStats(d.stats); setRecent(d.recent || []); }),
      api.mlHealth().then(d => setMlStatus(d.status)).catch(() => setMlStatus("unavailable")),
      api.getAccounts().then(d => setAccounts(d.accounts || []))
    ]).finally(() => setLoading(false));
  }, []);

  const handleUpdateWallet = async () => {
    if (!wallet) return;
    setIsUpdating(true);
    try {
      const res = await api.updateWallet({ userId: user.id || user._id, walletAddress: wallet });
      if (res.success) {
        const newUser = { ...user, walletAddress: wallet };
        localStorage.setItem("sc_user", JSON.stringify(newUser));
        window.location.reload();
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 64 }}><span className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Welcome, {user?.name || "User"} 👋</h1>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
            Role: <span className={`badge badge-${user?.role === "admin" ? "purple" : "blue"}`}>{user?.role}</span>
          </div>
        </div>
        <span className={`badge ${mlStatus === "ok" ? "badge-green" : "badge-red"}`} style={{ padding: "6px 14px" }}>
          {mlStatus === "ok" ? "● ML Online" : "● ML Offline"}
        </span>
      </div>
      
      {!user?.walletAddress && (
        <div className="card" style={{ border: "1px solid var(--amber)", background: "rgba(255, 191, 0, 0.05)", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 24 }}>🔑</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "var(--amber)" }}>Wallet Connection Required</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Please link a blockchain wallet to perform transfers and sales.</div>
            </div>
            <select className="form-select" style={{ width: 250, marginBottom: 0 }} value={wallet} onChange={e => setWallet(e.target.value)}>
              <option value="">-- Select Wallet --</option>
              {accounts.map(a => <option key={a} value={a}>{a.slice(0, 15)}...{a.slice(-6)}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleUpdateWallet} disabled={!wallet || isUpdating}>
              {isUpdating ? "Linking..." : "Link Wallet"}
            </button>
          </div>
        </div>
      )}

      {user?.walletAddress && (
        <div className="card" style={{ padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid var(--teal)" }}>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>Linked Wallet: <code style={{ color: "var(--teal)", fontWeight: 600 }}>{user.walletAddress}</code></div>
          <button className="btn-text" style={{ fontSize: 11 }} onClick={() => {
             const u = {...user, walletAddress: ""};
             localStorage.setItem("sc_user", JSON.stringify(u));
             window.location.reload();
          }}>Change</button>
        </div>
      )}

      <div className="stats-grid">
        {[["Total Products", stats?.total??0, "teal"], ["Authenticated", stats?.authentic??0, "green"], ["Flagged", stats?.flagged??0, "coral"], ["High Risk", stats?.highRisk??0, "amber"]].map(([l,v,c]) => (
          <div className="stat-card" key={l}><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Recent Products</div>
        {recent.length === 0 ? (
          <div style={{ color: "var(--text2)", textAlign: "center", padding: 28 }}>
            No products yet.{" "}
            <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={() => onNavigate("register")}>Register first product →</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Token ID</th><th>Product</th><th>Manufacturer</th><th>Transfers</th><th>Risk</th><th>Status</th></tr></thead>
              <tbody>{recent.map(p => (
                <tr key={p.tokenId}>
                  <td><code style={{ color: "var(--teal)", fontSize: 12 }}>#{p.tokenId}</code></td>
                  <td><div style={{ fontWeight: 500 }}>{p.productName}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>{p.batchNumber}</div></td>
                  <td>{p.manufacturerName}</td>
                  <td style={{ textAlign: "center" }}>{(p.transferHistory||[]).length}</td>
                  <td><RiskBadge score={p.riskScore} /></td>
                  <td><span className={`badge ${p.isAuthentic ? "badge-green" : "badge-red"}`}>{p.isAuthentic ? "Authentic" : "Flagged"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Register New Product", page: "register", icon: "📦", color: "var(--teal)", desc: "Mint a new blockchain token" },
          { label: "My Inventory", page: "inventory", icon: "🎒", color: "var(--blue)", desc: "View products you own" },
          { label: "Transfer Ownership", page: "transfer", icon: "🔄", color: "var(--purple)", desc: "Transfer with ML fraud check" },
          { label: "Marketplace", page: "market", icon: "🛒", color: "var(--amber)", desc: "Buy and Sell Products" },
          { label: "Verify / Scan QR", page: "verify", icon: "✅", color: "var(--green)", desc: "Verify product authenticity" },
          { label: "Product History", page: "history", icon: "📋", color: "var(--blue)", desc: "View full transfer timeline" },
          { label: "Reports", page: "reports", icon: "📊", color: "var(--coral)", desc: "6 detailed analytics reports" },
        ].map(({ label, page, icon, color, desc }) => (
          <div key={page} className="card" style={{ cursor: "pointer", textAlign: "center" }} onClick={() => onNavigate(page)}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ score }) {
  const s = score ?? 0;
  if (s >= 70) return <span className="badge badge-red">{s}% HIGH</span>;
  if (s >= 40) return <span className="badge badge-amber">{s}% MED</span>;
  return <span className="badge badge-green">{s}% LOW</span>;
}
