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

var url="http://localhost/matsio";

function App() {

   const [company, setCompany] = useState([]);
    const [stock, setstock] = useState([]);
      const [tax, setTax] = useState([]);
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
  }

   function handleEdit(com) {
      setEditCompany(com);
    setFormData({
      id:       com.company_id,
      name:     com.company_name,
      trn:      com.company_trn,
      address:      com.company_address
    });
    
  }

  function handleClose() {
    setEditCompany(null);
    
  }


   async function handleUpdate() {
    setUpdating(true);
    const data = new FormData();
    data.append('id',       formData.id);     
    data.append('name',     formData.name);
    data.append('trn',  formData.trn);
   data.append('address',  formData.address);

    try {
      const res = await fetch(url+`/wp-json/taxer/v1/update`, {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        alert('Updated successfully!');
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
        <Home company={company} handleEdit={handleEdit} />
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
