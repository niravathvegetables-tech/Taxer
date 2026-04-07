import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import Home from './Home';
import Stock from './Stock';
import Receipt from './Receipt';
import Payment from './Payment';
import Contra from './Contra';
import Purchase from './Purchase';
import Sales from './Sales';
import Tax from './Tax';
import url from './Config';


function App() {

  const [company, setCompany] = useState([]);
  const [stock, setstock] = useState([]);
  const [tax, setTax] = useState([]);
  const [selectedtax, setselectedtax] = useState({});
  const [receipt, setReceipt] = useState([]);
  const [payment, setpayment] = useState([]);
  const [contra, setcontra] = useState([]);
  const [sales, setsales] = useState([]);
  const [purchase, setpurchase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [editCompany, setEditCompany] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [showIntro, setShowIntro] = useState(true);

  // Step 1: Fetch company first
  useEffect(() => {
    fetchCompany();
  }, []);

  // Step 2: Fetch tax only after company is loaded
  useEffect(() => {
    if (company.length > 0) {
      fetchTax();
    }
  }, [company]);


  function handleAddTaxItem(newItem) {
    console.log('Adding new tax item:', newItem);
    setTax(newItem);
  }


  function handleChangeinCompany() {
     fetchCompany();
  }


  function fetchCompany() {
    fetch(url + `/wp-json/taxer/v1/data`)
      .then((res) => res.json())
      .then((data) => {
        setCompany(data.company ? [data.company] : []);
        console.log('Company data:', data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to connect to WordPress');
        setLoading(false);
      });
  }


  async function fetchTax() {
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/gettax");
      const data = await res.json();

      if (data.tax && Array.isArray(data.tax)) {
        setTax(data.tax);

        // company is guaranteed to be loaded here
        const companytaxid = company.length > 0 ? company[0].tax_id : '';
        const found = data.tax.find(t => t.tax_id == companytaxid);
        console.log('companytaxid:', companytaxid, 'found tax:', found);
        setselectedtax(found || {});
      }
    } catch (err) {
      console.error("Failed to fetch tax", err);
    }
  }


  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "tax_id") {
      const found = tax.find(t => t.tax_id == e.target.value);
      setselectedtax(found || {});
    }
  }

  function handleEdit(com) {
    setEditCompany(com);
    setFormData({
      id:      com.company_id,
      name:    com.company_name,
      trn:     com.company_trn,
      amount:  com.company_amount,
      address: com.company_address,
      tax_id:  com.tax_id
    });
    const found = tax.find(t => t.tax_id == com.tax_id);
    setselectedtax(found || {});
  }

  function handleClose() {
    setEditCompany(null);
  }

  async function handleUpdate() {
    setUpdating(true);
    const data = new FormData();
    data.append('id',      formData.id);
    data.append('name',    formData.name);
    data.append('trn',     formData.trn);
    data.append('address', formData.address);
    data.append('amount',  formData.amount);
    data.append('tax_id',  formData.tax_id);

    try {
      const res = await fetch(url + `/wp-json/taxer/v1/update`, {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        handleClose();
        fetchCompany(); // this will trigger fetchTax via useEffect
      } else {
        alert('Update failed: ' + result.message);
      }
    } catch (err) {
      alert('Error connecting to WordPress');
    }
    setUpdating(false);
  }

  const navItems = ["Home", "Stock", "Purchase", "Sales", "Receipt", "Payment", "Contra", "Tax"];

//   if (showIntro==true) {
//   return (
//     <div className='modervideoe'>
//       <div className='modersube'>
//         {/* Optional skip button */}
//         <button
//           onClick={() => setShowIntro(false)}
//            className='modersubbtn'
//         >
//           Skip
//         </button>

//         <video
//           src="/taxer.mp4"
//           autoPlay
//           muted
//           playsInline
//           onEnded={() => setShowIntro(false)}
//           style={{ 
//             width: '100%',
//             height: '100%',
//             borderRadius: '8px',
//             objectFit: 'cover'
//           }}
//         />
//       </div>
//     </div>
//   );
// }

const tabColors = {
  Home: "home-color",
  Stock: "stock-color",
  Purchase: "purchase-color",
  Sales: "sales-color",
  Receipt: "receipt-color",
  Payment: "payment-color",
  Contra: "contra-color",
  Tax: "tax-color"
};

  return (



      
    
    <div className="app">

     

      <div className='header'>
        <div className={`tabs ${tabColors[activeTab] || ""}`}>
          <ul>
            {navItems.map((item) => (
              <li
                key={item}
                onClick={() => setActiveTab(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {activeTab === "Home" && (
        <Home company={company} selectedtax={selectedtax} handleEdit={handleEdit} />
      )}
      {activeTab === "Stock" && (
        <Stock stock={stock} handleEdit={handleEdit} company={company}      reportStock={handleChangeinCompany} />
      )}
      {activeTab === "Receipt" && (
        <Receipt receipt={receipt} handleEdit={handleEdit} company={company} reportReceipt={handleChangeinCompany} />
      )}
      {activeTab === "Payment" && (
        <Payment payment={payment} handleEdit={handleEdit} company={company} reportPayment={handleChangeinCompany} />
      )}
      {activeTab === "Contra" && (
        <Contra contra={contra} handleEdit={handleEdit} company={company} reportContra={handleChangeinCompany} />
      )}
      {activeTab === "Purchase" && (
        <Purchase purchase={purchase} selectedtax={selectedtax} company={company} handleEdit={handleEdit} />
      )}
      {activeTab === "Sales" && (
        <Sales sales={sales} handleEdit={handleEdit}  company={company}  selectedtax={selectedtax} />
      )}
      {activeTab === "Tax" && (
        <Tax tax={tax} handleEdit={handleEdit}  onAddTaxItem={handleAddTaxItem} />
      )}

      {/* ── Edit Company Modal ── */}
      {editCompany && (
        <div className="modal-overlay">
          <div className="modal-box modalpos" >
            <h2>Edit Company</h2>

            <label>Sl No</label>
            <input name="id" value={formData.id} onChange={handleChange} />

            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} />

            <label>TRN</label>
            <input name="trn" value={formData.trn} onChange={handleChange} />

              <label>Amount</label>
            <input name="amount" value={formData.amount} onChange={handleChange} />

            <label>Address</label>
            <input name="address" value={formData.address} onChange={handleChange} />

            <label>Tax</label>
            <select
              name="tax_id"
              value={formData.tax_id || ""}
              onChange={handleChange}
            >
              <option value="">Select Tax</option>
              {tax && tax.length > 0 ? (
                tax.map((t) => (
                  <option key={t.tax_id} value={t.tax_id}>
                    {t.tax_name} - {t.tax_percent}%
                  </option>
                ))
              ) : (
                <option disabled>No tax available</option>
              )}
            </select>

            <div className="modal-buttons">
              <button className="btn-update" onClick={handleUpdate} disabled={updating}>
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button className="btn-cancel" onClick={handleClose}>Cancel</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;