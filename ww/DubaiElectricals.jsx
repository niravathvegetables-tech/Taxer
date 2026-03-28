import { useState } from "react";

const navItems = ["Home", "Stock", "Purchase", "Sales", "Reciept", "Payment", "Contra"];

// ── Stock Tab ──────────────────────────────────────────────
function StockTab() {
  const [stocks, setStocks] = useState([
    { id: 1, name: "LED Bulb 9W", category: "Lighting", qty: 120, unit: "Pcs", price: 25 },
    { id: 2, name: "MCB 32A", category: "Switchgear", qty: 45, unit: "Pcs", price: 180 },
    { id: 3, name: "Cable 2.5mm", category: "Wiring", qty: 300, unit: "Mtr", price: 22 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", qty: "", unit: "", price: "" });

  const handleAdd = () => {
    if (!form.name || !form.qty) return;
    setStocks([...stocks, { id: Date.now(), ...form, qty: Number(form.qty), price: Number(form.price) }]);
    setForm({ name: "", category: "", qty: "", unit: "", price: "" });
    setShowForm(false);
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.tabHeader}>
        <h2 style={styles.tabTitle}>📦 Stock Management</h2>
        <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Stock"}
        </button>
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <div style={styles.formGrid}>
            {[
              { label: "Item Name", key: "name", type: "text" },
              { label: "Category", key: "category", type: "text" },
              { label: "Quantity", key: "qty", type: "number" },
              { label: "Unit", key: "unit", type: "text" },
              { label: "Price (AED)", key: "price", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={styles.input}
                  placeholder={label}
                />
              </div>
            ))}
          </div>
          <button style={styles.primaryBtn} onClick={handleAdd}>Save Stock</button>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Item Name</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Quantity</th>
            <th style={styles.th}>Unit</th>
            <th style={styles.th}>Price (AED)</th>
            <th style={styles.th}>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, i) => (
            <tr key={s.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
              <td style={styles.td}>{i + 1}</td>
              <td style={styles.td}>{s.name}</td>
              <td style={styles.td}>{s.category}</td>
              <td style={styles.td}>{s.qty}</td>
              <td style={styles.td}>{s.unit}</td>
              <td style={styles.td}>{s.price}</td>
              <td style={styles.td}>{(s.qty * s.price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Sales Tab ──────────────────────────────────────────────
function SalesTab() {
  const [sales, setSales] = useState([
    { id: 1, invoice: "INV-001", customer: "Al Noor Trading", date: "2026-03-10", amount: 4500, status: "Paid" },
    { id: 2, invoice: "INV-002", customer: "Gulf Tech LLC", date: "2026-03-15", amount: 12300, status: "Pending" },
    { id: 3, invoice: "INV-003", customer: "Sunrise Builders", date: "2026-03-20", amount: 8750, status: "Paid" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ invoice: "", customer: "", date: "", amount: "", status: "Pending" });

  const handleAdd = () => {
    if (!form.invoice || !form.customer) return;
    setSales([...sales, { id: Date.now(), ...form, amount: Number(form.amount) }]);
    setForm({ invoice: "", customer: "", date: "", amount: "", status: "Pending" });
    setShowForm(false);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const paidSales  = sales.filter(s => s.status === "Paid").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={styles.tabContent}>
      <div style={styles.tabHeader}>
        <h2 style={styles.tabTitle}>🧾 Sales Management</h2>
        <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Sale"}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.cardRow}>
        <div style={{ ...styles.card, borderLeft: "4px solid #1a5276" }}>
          <p style={styles.cardLabel}>Total Sales</p>
          <p style={styles.cardValue}>AED {totalSales.toLocaleString()}</p>
        </div>
        <div style={{ ...styles.card, borderLeft: "4px solid #1e8449" }}>
          <p style={styles.cardLabel}>Collected</p>
          <p style={styles.cardValue}>AED {paidSales.toLocaleString()}</p>
        </div>
        <div style={{ ...styles.card, borderLeft: "4px solid #cb4335" }}>
          <p style={styles.cardLabel}>Pending</p>
          <p style={styles.cardValue}>AED {(totalSales - paidSales).toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <div style={styles.formGrid}>
            {[
              { label: "Invoice No", key: "invoice", type: "text" },
              { label: "Customer Name", key: "customer", type: "text" },
              { label: "Date", key: "date", type: "date" },
              { label: "Amount (AED)", key: "amount", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={styles.input}
                  placeholder={label}
                />
              </div>
            ))}
            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={styles.input}
              >
                <option>Pending</option>
                <option>Paid</option>
              </select>
            </div>
          </div>
          <button style={styles.primaryBtn} onClick={handleAdd}>Save Sale</button>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Invoice</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Amount (AED)</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s, i) => (
            <tr key={s.id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
              <td style={styles.td}>{i + 1}</td>
              <td style={styles.td}>{s.invoice}</td>
              <td style={styles.td}>{s.customer}</td>
              <td style={styles.td}>{s.date}</td>
              <td style={styles.td}>{s.amount.toLocaleString()}</td>
              <td style={styles.td}>
                <span style={s.status === "Paid" ? styles.badgePaid : styles.badgePending}>
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Home Panel ─────────────────────────────────────────────
function HomePanel() {
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState({ name: "Dubai Electricals", address: "asdad", trn: "123456789123900" });
  const [draft, setDraft] = useState({ ...info });

  const handleSave = () => { setInfo({ ...draft }); setEditing(false); };

  return (
    <div style={styles.homePanel}>
      {editing ? (
        <div>
          {[
            { label: "Company Name", key: "name" },
            { label: "Address", key: "address" },
            { label: "TRN", key: "trn" },
          ].map(({ label, key }) => (
            <div key={key} style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: "bold", fontSize: 13 }}>{label}: </label>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                style={{ ...styles.input, width: 280, display: "inline-block", marginLeft: 8 }}
              />
            </div>
          ))}
          <button style={styles.editBtn} onClick={handleSave}>Save</button>
          <button style={{ ...styles.editBtn, marginLeft: 8, background: "#555" }} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>{info.name}</h1>
          <p style={{ marginBottom: 6 }}>Address: {info.address}</p>
          <p style={{ marginBottom: 12 }}>TRN : {info.trn}</p>
          <button style={styles.editBtn} onClick={() => { setDraft({ ...info }); setEditing(true); }}>Edit</button>
        </div>
      )}
    </div>
  );
}

// ── Placeholder Tab ────────────────────────────────────────
function PlaceholderTab({ name }) {
  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>{name}</h2>
      <p style={{ color: "#666", marginTop: 10 }}>This section is under construction.</p>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("Home");

  const renderContent = () => {
    switch (activeTab) {
      case "Home":     return <HomePanel />;
      case "Stock":    return <StockTab />;
      case "Sales":    return <SalesTab />;
      default:         return <PlaceholderTab name={activeTab} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f8", fontFamily: "Arial, sans-serif" }}>
      {/* Nav */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActiveTab(item)}
            style={{ ...styles.navBtn, ...(activeTab === item ? styles.navBtnActive : {}) }}
          >
            {item}
          </button>
        ))}
      </nav>

      {renderContent()}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = {
  nav: {
    background: "#4dd0e1",
    display: "flex",
    gap: 4,
    padding: "8px 16px",
    flexWrap: "wrap",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "6px 14px",
    borderRadius: 4,
    color: "#111",
    fontFamily: "Arial, sans-serif",
  },
  navBtnActive: {
    background: "rgba(0,0,0,0.18)",
    fontWeight: "bold",
  },
  homePanel: {
    background: "#4dd0e1",
    padding: "20px 24px",
  },
  editBtn: {
    background: "#1a5276",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
  },
  tabContent: {
    padding: 24,
  },
  tabHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a252f",
  },
  primaryBtn: {
    background: "#1a5276",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
  },
  formBox: {
    background: "#eaf4fb",
    border: "1px solid #aed6f1",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  formGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    minWidth: 180,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  input: {
    padding: "7px 10px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 14,
    outline: "none",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  thead: {
    background: "#1a5276",
  },
  th: {
    color: "#fff",
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: "bold",
  },
  td: {
    padding: "10px 14px",
    fontSize: 13,
    color: "#222",
    borderBottom: "1px solid #eee",
  },
  trEven: { background: "#fff" },
  trOdd:  { background: "#f8f9fa" },
  cardRow: {
    display: "flex",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  card: {
    background: "#fff",
    borderRadius: 8,
    padding: "16px 24px",
    flex: 1,
    minWidth: 160,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardLabel: { fontSize: 12, color: "#666", marginBottom: 6 },
  cardValue: { fontSize: 20, fontWeight: "bold", color: "#1a252f" },
  badgePaid: {
    background: "#d5f5e3",
    color: "#1e8449",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  badgePending: {
    background: "#fde8d8",
    color: "#cb4335",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
};
