import { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../utils/api";
import { toast } from "react-hot-toast";

export default function MyInventory({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(user?.walletAddress || "");

  useEffect(() => {
    if (user?.walletAddress) {
      setSelectedAddress(user.walletAddress);
    }
  }, [user]);

  useEffect(() => {
    if (selectedAddress) {
      fetchInventory(selectedAddress);
    }
  }, [selectedAddress]);

  const fetchInventory = async (addr) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/products/inventory/${addr}`);
      if (res.data.success) {
        setProducts(res.data.products);
      } else {
        toast.error("Failed to load inventory");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inventory-page">
      <h2 className="page-title">🎒 My Inventory</h2>

      {selectedAddress ? (
        <div className="card" style={{ padding: "12px 16px", marginBottom: 24, borderLeft: "4px solid var(--blue)", maxWidth: 500 }}>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>Showing inventory for: <code style={{ color: "var(--blue)", fontWeight: 600 }}>{selectedAddress}</code></div>
        </div>
      ) : (
        <div className="alert alert-amber" style={{ marginBottom: 24 }}>Please link your wallet on the Dashboard to view your inventory.</div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : products.length === 0 ? (
        <div className="card">You do not currently own any products.</div>
      ) : (
        <div className="market-grid">
          {products.map(p => (
            <div className="market-card" key={p.tokenId} style={{ position: "relative" }}>
              {p.isForSale && (
                <div style={{ position: "absolute", top: -10, right: -10, background: "var(--amber)", color: "#000", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold" }}>
                  LISTED FOR SALE
                </div>
              )}
              <div className="market-card-header">
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.productName}</h3>
                <span className={`badge badge-${p.isAuthentic ? "teal" : "coral"}`}>
                  {p.isAuthentic ? "Authentic" : "Flagged"}
                </span>
              </div>
              <div className="market-detail">
                <span>Token ID:</span> <strong>#{p.tokenId}</strong>
              </div>
              <div className="market-detail">
                <span>Batch:</span> <strong>{p.batchNumber}</strong>
              </div>
              <div className="market-detail">
                <span>Created:</span> <strong>{new Date(p.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
