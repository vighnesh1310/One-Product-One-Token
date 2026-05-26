const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() { return localStorage.getItem("sc_token"); }

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (d) => request("POST", "/auth/login", d),
  register: (d) => request("POST", "/auth/register", d),
  getAccounts: () => request("GET", "/auth/accounts"),
  getProducts: () => request("GET", "/products"),
  getProduct: (id) => request("GET", `/products/${id}`),
  createProduct: (d) => request("POST", "/products", d),
  transferProduct: (id, d) => request("POST", `/products/${id}/transfer`, d),
  verifyProduct: (id) => request("GET", `/products/${id}/verify`),
  getStats: () => request("GET", "/products/stats/overview"),
  mlHealth: () => request("GET", "/ml/health"),
  updateWallet: (d) => request("POST", "/auth/update-wallet", d),
};
