import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Marketplace({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyingId, setBuyingId] = useState(null);
  const [tab, setTab] = useState("buy");

  const [accounts, setAccounts] = useState([]);
  const [sellTokenId, setSellTokenId] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [selling, setSelling] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then(res => setAllProducts(res.data.products || []))
      .catch(() => {});
  }, []);

  const ownedProducts = allProducts.filter(p => p.currentOwner?.toLowerCase() === user?.walletAddress?.toLowerCase() && !p.isForSale);

  useEffect(() => {
    if (user?.walletAddress) {
      setBuyerAddress(user.walletAddress);
      setSellerAddress(user.walletAddress);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "buy") {
      fetchMarketplace();
    }
  }, [tab]);

  useEffect(() => {
    if (sellTokenId) {
      axios.get(`http://localhost:5000/api/products/${sellTokenId}`)
        .then(res => {
          if (res.data.success && res.data.product) {
            setSellerAddress(res.data.product.currentOwner);
          }
        })
        .catch(() => { /* ignore 404s while typing */ });
    }
  }, [sellTokenId]);

  const fetchMarketplace = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/products/market/forsale");
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (tokenId, priceWei) => {
    if (!buyerAddress) return toast.error("Please enter your ETH Address first to purchase.");
    setBuyingId(tokenId);
    try {
      const res = await axios.post(`http://localhost:5000/api/products/${tokenId}/buy`, {
        priceWei,
        fromAddress: buyerAddress
      });
      if (res.data.success) {
        toast.success("Purchase successful! Ownership transferred.");
        fetchMarketplace();
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setBuyingId(null);
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (!sellTokenId || !sellPrice || !sellerAddress) return toast.error("All fields required");
    setSelling(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/products/${sellTokenId}/list-sale`, {
        priceWei: sellPrice,
        fromAddress: sellerAddress
      });
      if (res.data.success) {
        toast.success("Product listed for sale successfully!");
        setSellTokenId("");
        setSellPrice("");
        setTab("buy");
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className="marketplace-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>NFT Marketplace</h2>
        <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>Trade verified products securely via smart contracts.</p>
      </div>

      <div className="login-tabs" style={{ maxWidth: 300, marginBottom: 24 }}>
        <button className={`login-tab ${tab === "buy" ? "active" : ""}`} onClick={() => setTab("buy")}>Buy Products</button>
        <button className={`login-tab ${tab === "sell" ? "active" : ""}`} onClick={() => setTab("sell")}>List for Sale</button>
      </div>
      
      {tab === "buy" && (
        <div className="buy-section">
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Your Wallet Address (Buyer)</label>
              <input 
                type="text" 
                className="form-input" 
                value={buyerAddress} 
                readOnly
                style={{ background: "rgba(255,255,255,0.05)", cursor: "not-allowed" }}
              />
              <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>Locked to your profile wallet</div>
            </div>
          </div>

          {loading ? (
            <div className="spinner"></div>
          ) : products.length === 0 ? (
            <div className="card">No products currently listed for sale.</div>
          ) : (
            <div className="market-grid">
              {products.map(p => (
                <div className="market-card" key={p.tokenId}>
                  <div className="market-card-header">
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.productName}</h3>
                    <span className="badge badge-teal">Token #{p.tokenId}</span>
                  </div>
                  <div className="market-detail">
                    <span>Batch:</span> <strong>{p.batchNumber}</strong>
                  </div>
                  <div className="market-detail">
                    <span>Seller:</span> <strong>{p.currentOwner.substring(0, 10)}...</strong>
                  </div>
                  <div className="market-price">
                    <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Price</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--amber)", lineHeight: 1 }}>{p.priceWei} Wei</div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: "100%", justifyContent: "center", marginTop: 16, background: "var(--amber)", color: "#000" }}
                    onClick={() => handleBuy(p.tokenId, p.priceWei)}
                    disabled={buyingId === p.tokenId}
                  >
                    {buyingId === p.tokenId ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : "Buy Now"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "sell" && (
        <div className="sell-section card" style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 16 }}>List a Product for Sale</h3>
          <form onSubmit={handleSell}>
            <div className="form-group">
              <label className="form-label">Product to Sell *</label>
              {ownedProducts.length > 0 ? (
                <select className="form-select" required value={sellTokenId} onChange={e => setSellTokenId(e.target.value)}>
                  <option value="">-- Select your product --</option>
                  {ownedProducts.map(p => (
                    <option key={p.tokenId} value={p.tokenId}>#{p.tokenId} – {p.productName}</option>
                  ))}
                </select>
              ) : (
                <div className="alert alert-error" style={{ fontSize: 12 }}>You do not own any sellable products.</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Price (in Wei)</label>
              <input type="number" className="form-input" required value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="e.g. 10000000000000000" />
            </div>
            <div className="form-group">
              <label className="form-label">Your Wallet Address (Seller)</label>
              <input 
                type="text" 
                className="form-input" 
                value={sellerAddress} 
                readOnly
                style={{ background: "rgba(255,255,255,0.05)", cursor: "not-allowed" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={selling}>
              {selling ? "Listing..." : "List for Sale"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
