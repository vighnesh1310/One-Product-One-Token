import { useState, useEffect } from "react";
import { api } from "../utils/api";

const REPORTS = [
  { id: "inventory", title: "1. Inventory Summary Report", icon: "📦", desc: "Total products, batch breakdown, manufacturer distribution" },
  { id: "transfer",  title: "2. Transfer Activity Report", icon: "🔄", desc: "All ownership transfers with timestamps and locations" },
  { id: "fraud",     title: "3. Fraud & Risk Report",     icon: "🚨", desc: "High-risk transfers, ML flags, suspicious patterns" },
  { id: "auth",      title: "4. Authenticity Report",     icon: "✅", desc: "Authentic vs flagged products, verification rate" },
  { id: "supply",    title: "5. Supply Chain Flow Report", icon: "🌐", desc: "End-to-end route analysis per product token" },
  { id: "ml",        title: "6. ML Analytics Report",     icon: "🤖", desc: "Risk score distribution, flag frequency, model insights" },
];

export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState("inventory");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getStats()])
      .then(([pd, sd]) => { setProducts(pd.products || []); setStats(sd.stats); })
      .finally(() => setLoading(false));
  }, []);

  const downloadCSV = (reportId) => {
    let rows = [], filename = "";
    if (reportId === "inventory") {
      filename = "inventory_report.csv";
      rows = [["TokenID","ProductName","BatchNumber","Manufacturer","Location","Authentic","RiskScore","CreatedAt"],
        ...products.map(p => [p.tokenId, p.productName, p.batchNumber, p.manufacturerName, p.manufacturerLocation, p.isAuthentic, p.riskScore, new Date(p.createdAt).toLocaleDateString()])];
    } else if (reportId === "transfer") {
      filename = "transfer_report.csv";
      rows = [["TokenID","ProductName","From","To","Location","Notes","Role","Timestamp"]];
      products.forEach(p => (p.transferHistory||[]).forEach(t => rows.push([p.tokenId, p.productName, t.from?.slice(0,12)+"...", t.to?.slice(0,12)+"...", t.location, t.notes, t.role, new Date(t.timestamp).toLocaleString()])));
    } else if (reportId === "fraud") {
      filename = "fraud_risk_report.csv";
      const risky = products.filter(p => p.riskScore > 0);
      rows = [["TokenID","ProductName","RiskScore","RiskLevel","Flags"],
        ...risky.map(p => [p.tokenId, p.productName, p.riskScore, p.riskScore>=70?"HIGH":p.riskScore>=40?"MEDIUM":"LOW", (p.riskFlags||[]).join("; ")])];
    } else if (reportId === "auth") {
      filename = "authenticity_report.csv";
      rows = [["TokenID","ProductName","Manufacturer","IsAuthentic","Verified"],
        ...products.map(p => [p.tokenId, p.productName, p.manufacturerName, p.isAuthentic?"Yes":"No", p.isAuthentic?"Authentic":"Flagged"])];
    } else if (reportId === "supply") {
      filename = "supply_chain_flow_report.csv";
      rows = [["TokenID","ProductName","Step","From","To","Location","Timestamp"]];
      products.forEach(p => (p.transferHistory||[]).forEach((t,i) => rows.push([p.tokenId, p.productName, i+1, t.from?.slice(0,12)||"Genesis", t.to?.slice(0,12), t.location, new Date(t.timestamp).toLocaleString()])));
    } else if (reportId === "ml") {
      filename = "ml_analytics_report.csv";
      rows = [["TokenID","ProductName","RiskScore","RiskLevel","TotalTransfers","Flags"],
        ...products.map(p => [p.tokenId, p.productName, p.riskScore||0, (p.riskScore||0)>=70?"HIGH":(p.riskScore||0)>=40?"MEDIUM":"LOW", (p.transferHistory||[]).length, (p.riskFlags||[]).join("; ")])];
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  if (loading) return <div style={{ textAlign: "center", padding: 64 }}><span className="spinner" /></div>;

  return (
    <div>
      <h1 className="page-title">📊 Reports</h1>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Sidebar */}
        <div>
          {REPORTS.map(r => (
            <div key={r.id}
              className={`report-nav-item ${selected === r.id ? "active" : ""}`}
              onClick={() => setSelected(r.id)}
            >
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected === r.id ? "var(--teal)" : "var(--text)" }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Report Content */}
        <div>
          {selected === "inventory" && <InventoryReport products={products} stats={stats} onDownload={() => downloadCSV("inventory")} />}
          {selected === "transfer"  && <TransferReport  products={products} onDownload={() => downloadCSV("transfer")} />}
          {selected === "fraud"     && <FraudReport     products={products} onDownload={() => downloadCSV("fraud")} />}
          {selected === "auth"      && <AuthReport      products={products} stats={stats} onDownload={() => downloadCSV("auth")} />}
          {selected === "supply"    && <SupplyReport    products={products} onDownload={() => downloadCSV("supply")} />}
          {selected === "ml"        && <MLReport        products={products} onDownload={() => downloadCSV("ml")} />}
        </div>
      </div>
    </div>
  );
}

function ReportHeader({ title, icon, count, onDownload }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{icon} {title}</h2>
        {count !== undefined && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{count} records</div>}
      </div>
      <button className="btn btn-primary" onClick={onDownload}>⬇ Download CSV</button>
    </div>
  );
}

function InventoryReport({ products, stats, onDownload }) {
  const manufacturers = [...new Set(products.map(p => p.manufacturerName))];
  return (
    <div className="card">
      <ReportHeader title="Inventory Summary Report" icon="📦" count={products.length} onDownload={onDownload} />
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[["Total Products", stats?.total??0, "teal"], ["Authentic", stats?.authentic??0, "green"], ["Flagged", stats?.flagged??0, "coral"], ["Manufacturers", manufacturers.length, "amber"]].map(([l,v,c]) => (
          <div className="stat-card" key={l}><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="table-wrap">
        <table><thead><tr><th>Token ID</th><th>Product</th><th>Batch</th><th>Manufacturer</th><th>Location</th><th>Status</th><th>Risk</th></tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.tokenId}>
            <td><code style={{ color: "var(--teal)" }}>#{p.tokenId}</code></td>
            <td>{p.productName}</td><td>{p.batchNumber}</td><td>{p.manufacturerName}</td><td>{p.manufacturerLocation}</td>
            <td><span className={`badge ${p.isAuthentic?"badge-green":"badge-red"}`}>{p.isAuthentic?"Authentic":"Flagged"}</span></td>
            <td><span className={`badge ${(p.riskScore||0)>=70?"badge-red":(p.riskScore||0)>=40?"badge-amber":"badge-green"}`}>{p.riskScore||0}%</span></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

function TransferReport({ products, onDownload }) {
  const all = [];
  products.forEach(p => (p.transferHistory||[]).forEach(t => all.push({ ...t, productName: p.productName, tokenId: p.tokenId })));
  return (
    <div className="card">
      <ReportHeader title="Transfer Activity Report" icon="🔄" count={all.length} onDownload={onDownload} />
      <div className="table-wrap">
        <table><thead><tr><th>Token</th><th>Product</th><th>From</th><th>To</th><th>Location</th><th>Role</th><th>Time</th></tr></thead>
        <tbody>{all.map((t, i) => (
          <tr key={i}>
            <td><code style={{ color: "var(--teal)", fontSize: 11 }}>#{t.tokenId}</code></td>
            <td>{t.productName}</td>
            <td><code style={{ fontSize: 10 }}>{t.from?.slice(0,10)||"Genesis"}...</code></td>
            <td><code style={{ fontSize: 10 }}>{t.to?.slice(0,10)}...</code></td>
            <td>{t.location}</td>
            <td><span className="badge badge-blue">{t.role||"Transfer"}</span></td>
            <td style={{ fontSize: 11 }}>{new Date(t.timestamp).toLocaleString()}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

function FraudReport({ products, onDownload }) {
  const risky = products.filter(p => (p.riskScore||0) > 0).sort((a,b) => b.riskScore - a.riskScore);
  const high = risky.filter(p => p.riskScore >= 70).length;
  const med  = risky.filter(p => p.riskScore >= 40 && p.riskScore < 70).length;
  const low  = risky.filter(p => p.riskScore > 0 && p.riskScore < 40).length;
  return (
    <div className="card">
      <ReportHeader title="Fraud & Risk Report" icon="🚨" count={risky.length} onDownload={onDownload} />
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[["High Risk (≥70%)", high, "coral"], ["Medium Risk (40-69%)", med, "amber"], ["Low Risk (<40%)", low, "green"]].map(([l,v,c]) => (
          <div className="stat-card" key={l}><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      {risky.length === 0 ? <div className="alert alert-success">✅ No fraud risk detected in any transfer.</div> : (
        <div className="table-wrap">
          <table><thead><tr><th>Token</th><th>Product</th><th>Risk Score</th><th>Level</th><th>Flags</th></tr></thead>
          <tbody>{risky.map(p => (
            <tr key={p.tokenId}>
              <td><code style={{ color: "var(--teal)", fontSize: 11 }}>#{p.tokenId}</code></td>
              <td>{p.productName}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${p.riskScore}%`, height: "100%", background: p.riskScore>=70?"var(--coral)":p.riskScore>=40?"var(--amber)":"var(--green)" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{p.riskScore}%</span>
                </div>
              </td>
              <td><span className={`badge ${p.riskScore>=70?"badge-red":p.riskScore>=40?"badge-amber":"badge-green"}`}>{p.riskScore>=70?"HIGH":p.riskScore>=40?"MED":"LOW"}</span></td>
              <td style={{ fontSize: 11, color: "var(--coral)" }}>{(p.riskFlags||[]).join(" | ") || "—"}</td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}

function AuthReport({ products, stats, onDownload }) {
  const total = products.length;
  const authentic = products.filter(p => p.isAuthentic).length;
  const rate = total ? Math.round(authentic / total * 100) : 0;
  return (
    <div className="card">
      <ReportHeader title="Authenticity Report" icon="✅" count={total} onDownload={onDownload} />
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[["Authentic", authentic, "green"], ["Flagged", total-authentic, "coral"], ["Auth Rate", `${rate}%`, "teal"]].map(([l,v,c]) => (
          <div className="stat-card" key={l}><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span>Authentication Rate</span><strong style={{ color: "var(--teal)" }}>{rate}%</strong>
        </div>
        <div style={{ height: 10, background: "var(--bg3)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ width: `${rate}%`, height: "100%", background: "var(--teal)", borderRadius: 5 }} />
        </div>
      </div>
      <div className="table-wrap">
        <table><thead><tr><th>Token</th><th>Product</th><th>Manufacturer</th><th>Batch</th><th>Authenticity</th></tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.tokenId}>
            <td><code style={{ color: "var(--teal)", fontSize: 11 }}>#{p.tokenId}</code></td>
            <td>{p.productName}</td><td>{p.manufacturerName}</td><td>{p.batchNumber}</td>
            <td><span className={`badge ${p.isAuthentic?"badge-green":"badge-red"}`}>{p.isAuthentic?"✅ Authentic":"🚫 Flagged"}</span></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

function SupplyReport({ products, onDownload }) {
  return (
    <div className="card">
      <ReportHeader title="Supply Chain Flow Report" icon="🌐" count={products.length} onDownload={onDownload} />
      {products.length === 0 ? <div className="alert alert-info">No products yet.</div> : products.map(p => (
        <div key={p.tokenId} style={{ marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: 14 }}>#{p.tokenId}</span>
              <span style={{ marginLeft: 10, fontWeight: 600 }}>{p.productName}</span>
              <span className="badge badge-blue" style={{ marginLeft: 8 }}>{p.batchNumber}</span>
            </div>
            <span className={`badge ${p.isAuthentic?"badge-green":"badge-red"}`}>{p.isAuthentic?"Authentic":"Flagged"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {(p.transferHistory||[]).map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 6, padding: "4px 10px", fontSize: 11 }}>
                  <div style={{ color: "var(--teal)", fontWeight: 600 }}>{t.role||"Transfer"}</div>
                  <div style={{ color: "var(--text2)" }}>{t.location}</div>
                </div>
                {i < (p.transferHistory?.length||0) - 1 && <span style={{ color: "var(--text2)" }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MLReport({ products, onDownload }) {
  const total = products.length;
  const withRisk = products.filter(p => (p.riskScore||0) > 0);
  const avgRisk = withRisk.length ? Math.round(withRisk.reduce((s,p) => s + p.riskScore, 0) / withRisk.length) : 0;
  const high = products.filter(p => (p.riskScore||0) >= 70).length;
  const allFlags = products.flatMap(p => p.riskFlags||[]);
  const flagCounts = allFlags.reduce((acc, f) => { acc[f] = (acc[f]||0)+1; return acc; }, {});
  return (
    <div className="card">
      <ReportHeader title="ML Analytics Report" icon="🤖" count={total} onDownload={onDownload} />
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[["Avg Risk Score", `${avgRisk}%`, "amber"], ["High Risk Items", high, "coral"], ["Total Flags", allFlags.length, "purple"], ["Analyzed", withRisk.length, "blue"]].map(([l,v,c]) => (
          <div className="stat-card" key={l}><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      {Object.keys(flagCounts).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="card-title">Top Fraud Flags</div>
          {Object.entries(flagCounts).sort((a,b) => b[1]-a[1]).map(([flag, count]) => (
            <div key={flag} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>⚠ {flag}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, count/allFlags.length*100)}%`, height: "100%", background: "var(--coral)", borderRadius: 3 }} />
                </div>
                <span className="badge badge-red">{count}x</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="table-wrap">
        <table><thead><tr><th>Token</th><th>Product</th><th>Risk Score</th><th>Level</th><th>Transfers</th><th>Flags</th></tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.tokenId}>
            <td><code style={{ color: "var(--teal)", fontSize: 11 }}>#{p.tokenId}</code></td>
            <td>{p.productName}</td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 50, height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${p.riskScore||0}%`, height: "100%", background: (p.riskScore||0)>=70?"var(--coral)":(p.riskScore||0)>=40?"var(--amber)":"var(--green)" }} />
                </div>
                <span style={{ fontSize: 11 }}>{p.riskScore||0}%</span>
              </div>
            </td>
            <td><span className={`badge ${(p.riskScore||0)>=70?"badge-red":(p.riskScore||0)>=40?"badge-amber":"badge-green"}`}>{(p.riskScore||0)>=70?"HIGH":(p.riskScore||0)>=40?"MED":"LOW"}</span></td>
            <td style={{ textAlign: "center" }}>{(p.transferHistory||[]).length}</td>
            <td style={{ fontSize: 11, color: "var(--coral)" }}>{(p.riskFlags||[]).length || "—"}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
