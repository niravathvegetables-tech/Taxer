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

    useEffect(() => {
      fetchTax();
    fetchCompany();
  }, []);


   function fetchCompany() { 
     
    fetch(url+`/wp-json/taxer/v1/data`)
      .then((res) => res.json())
      .then((data) => {
        setCompany(data.company ? [data.company] : []);       
        console.log(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to connect to WordPress');
        setLoading(false);
      });
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
      id:       com.company_id,
      name:     com.company_name,
      trn:      com.company_trn,
      address:      com.company_address,
      tax_id:     com.tax_id
    });
    const found = tax.find(t => t.tax_id == com.tax_id);
  setselectedtax(found || {});
    
  }

  function handleClose() {
    setEditCompany(null);
    
  }

   async function  fetchTax() {
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/gettax");
      const data = await res.json();
      if (data.tax && Array.isArray(data.tax)) {
        setTax( data.tax );

                const found = data.tax.find(t => t.tax_id == formData.tax_id);
      setselectedtax(found || []);



      }
    } catch (err) {
      console.error("Failed to fetch tax", err);
    }
  }


   async function handleUpdate() {
    setUpdating(true);
    const data = new FormData();
    data.append('id',       formData.id);     
    data.append('name',     formData.name);
    data.append('trn',  formData.trn);
   data.append('address',  formData.address);
    data.append('tax_id',  formData.tax_id);

    try {
      const res = await fetch(url+`/wp-json/taxer/v1/update`, {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
       // alert('Updated successfully!');
        handleClose();
        fetchCompany();
      } else {
        alert('Update failed: ' + result.message);
      }
    } catch (err) {
      alert('Error connecting to WordPress');
    }
    setUpdating(false);
  }

   const navItems = ["Home", "Stock", "Purchase", "Sales", "Receipt", "Payment", "Contra" , "Tax"];
 

  return (
   <div style={{ padding: '20px' }}>
       
    <div className='header' >
     
        <div className='tabs'>
<ul>
  {navItems.map((item) => (
    <li
      key={item}
      onClick={() => setActiveTab(item)}   // ← fixed
    >
      {item}
    </li>
  ))}
</ul>


        </div>

        </div>

    {/* Render only the active tab */}

 
      {activeTab === "Home" && (
        <Home company={company}  selectedtax={selectedtax} handleEdit={handleEdit} />
      )}
      {activeTab === "Stock" && (
        <Stock stock={stock} handleEdit={handleEdit} company={company} />
      )}
      {activeTab === "Receipt" && (
        <Receipt receipt={receipt} handleEdit={handleEdit} />
      )}
   {activeTab === "Payment" && (
  <Payment payment={payment} handleEdit={handleEdit} />   // ✔ correct
    )}
    {activeTab === "Contra" && (
  <Contra contra={contra} handleEdit={handleEdit} />   // ✔ correct
)}
  {activeTab === "Purchase" && (
  <Purchase purchase={purchase} handleEdit={handleEdit} />   // ✔ correct
)}
{activeTab === "Sales" && (
  <Sales sales={sales} handleEdit={handleEdit} />   // ✔ correct
)}
{activeTab === "Tax" && (
  <Tax tax={tax} handleEdit={handleEdit} />   // ✔ correct
)}

       

    


 {/* ── Edit Modal ── */}
      {editCompany && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Edit Candidate</h2>

            <label>Sl No</label>
           <input name="id"      value={formData.id}      onChange={handleChange} />

            <label>Name</label>
           <input name="name"    value={formData.name}    onChange={handleChange} />

              <label>TRN</label>
           <input name="trn"     value={formData.trn}     onChange={handleChange} />

              <label>Adddress</label>
           <input name="address" value={formData.address} onChange={handleChange} />

            <label>Tax   </label>

            <select
            name="tax_id"
            value={formData.tax_id || ""}
            onChange={handleChange}
            >
            <option value="">Select Tax  </option>

           

            {tax && tax.length > 0 ? (
            tax.map((t) => (



            <option key={t.tax_id} value={t.tax_id} 
            
              selected={t.tax_id == formData.tax_id ? 'selected' : false}
  
            
            >
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
