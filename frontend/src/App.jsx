import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import RegisterProduct from "./pages/RegisterProduct";
import TransferProduct from "./pages/TransferProduct";
import VerifyProduct from "./pages/VerifyProduct";
import ProductHistory from "./pages/ProductHistory";
import ReportsPage from "./pages/ReportsPage";
import Marketplace from "./pages/Marketplace";
import MyInventory from "./pages/MyInventory";
import { Toaster } from "react-hot-toast";
import "./App.css";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "inventory", label: "Inventory", icon: "🎒" },
  { id: "register",  label: "Register",  icon: "📦" },
  { id: "transfer",  label: "Transfer",  icon: "🔄" },
  { id: "market",    label: "Marketplace",icon: "🛒" },
  { id: "verify",    label: "Verify",    icon: "✅" },
  { id: "history",   label: "History",   icon: "📋" },
  { id: "reports",   label: "Reports",   icon: "📊" },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("sc_theme") || "dark");

  useEffect(() => {
    document.body.className = theme === "light" ? "light-mode" : "";
    localStorage.setItem("sc_theme", theme);
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem("sc_user");
    if (stored) { setUser(JSON.parse(stored)); setPage("dashboard"); }
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem("sc_user", JSON.stringify(u));
    setPage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("sc_user");
    localStorage.removeItem("sc_token");
    setPage("home");
  };

  if (page === "home") return <HomePage onGetStarted={() => setPage("login")} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />;
  if (page === "login") return <LoginPage onLogin={handleLogin} onBack={() => setPage("home")} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />;

  return (
    <div className="app">
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' } }} />
      <header className="header">
        <div className="header-brand" onClick={() => setPage("dashboard")} style={{ cursor: "pointer" }}>
          <span className="header-icon">⬡</span>
          <span className="header-title">OneToken Supply Chain</span>
        </div>
        <nav className="header-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
              <span className="nav-icon">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="header-user">
          <span className={`badge badge-${user?.role === "admin" ? "purple" : "blue"}`}>{user?.role}</span>
          <span style={{ fontSize: 13, color: "var(--text2)", marginLeft: 8 }}>{user?.name || user?.email}</span>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
          <button className="btn btn-secondary" style={{ marginLeft: 10, padding: "4px 12px" }} onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="main-content">
        {page === "dashboard" && <Dashboard onNavigate={setPage} user={user} />}
        {page === "inventory" && <MyInventory user={user} />}
        {page === "register"  && <RegisterProduct onNavigate={setPage} user={user} />}
        { page === "transfer"  && <TransferProduct user={user} /> }
        { page === "market"    && <Marketplace user={user} /> }
        { page === "verify"    && <VerifyProduct /> }
        { page === "history"   && <ProductHistory /> }
        { page === "reports"   && <ReportsPage /> }
      </main>
    </div>
  );
}
