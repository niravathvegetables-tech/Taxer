 import { useState } from "react";
 import React from 'react';
 import url from './Config';

 class Contra extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Contra",
       contra: [],
        editBank: false,
         date: new Date().toISOString().split("T")[0],
      updating: false,
      deletestart: false,
         formData: {
        company_id: "",
        contra_name: "",
        contra_amount: "",
      },
    };
  }

   componentDidMount() {
      this.fetchContra();
    }

    
   handleDelete = async (contra_id, company_id) => {
    if (!window.confirm("Are you sure you want to withdraw this Amount from Bank ?")) return;

    this.setState({ deletestart: true });

    try {
      const res = await fetch(url + "/wp-json/taxer/v1/deletecontra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contra_id: contra_id, company_id: company_id })
      });
      const result = await res.json();
      if (result.success) {
        this.fetchContra();
        this.props.reportContra();
      } else {
        alert("Failed to delete payment: " + result.message);
      }
    } catch (err) {
      //alert("Error connecting to WordPress");
    }

    this.setState({ deletestart: false });
  };

   async fetchContra() {

      try {

        const res = await fetch(url + `/wp-json/taxer/v1/getcontra`);        
        const data = await res.json();
        console.log(data);
  
        let contra = [];

        if (data.contra) {

          contra = Array.isArray(data.contra) ? data.contra : [data.contra];

        }

        this.setState({ contra: contra });

      } catch (err) {

        this.setState({ error: 'Failed to connect to WordPress' });

      }


    }

  handleClose = () => {
    this.setState({
      editBank: false,
      formData: { contra_name: "", contra_amount: "" }
    });
  };

   handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  };

   handleEdit = (contra) => {
    this.setState({
      editBank: true,
      formData: {
        contra_id: contra.contra_id,
        contra_name: contra.contra_name,
        contra_amount: contra.contra_amount
      },
      date: contra.contra_date
    });
  };

  
  handleUpdate = async () => {
    this.setState({ updating: true });
    const { formData, date } = this.state;
    const { company } = this.props;

    const data = new FormData();
    data.append('company_id', company && company[0] ? company[0].company_id : "");
    data.append('contra_name', formData.contra_name);
    data.append('contra_amount', formData.contra_amount);
    data.append('contra_date', date);

    let endpoint = url + "/wp-json/taxer/v1/addcontra";

      if (formData.contra_id) {
        data.append("contra_id", formData.contra_id);
        endpoint = url + "/wp-json/taxer/v1/updatecontra";
      }

    if (formData.contra_amount >= 1) {
      try {
        const url =  endpoint;
        const method = formData.contra_id ? 'POST' : 'POST';

        const res = await fetch(url, {
          method: method,
          body: data
        });
        const result = await res.json();
        if (result.success) {
          this.setState({
            formData: { contra_name: "", contra_amount: "" },
            
          });
          this.props.reportPayment();
              this.fetchContra();
          this.setState({ updating: false });
        } else {
          alert("Operation failed: " + result.message);
        }
      } catch (err) {
         this.setState({ updating: false });
      }


    }else {
      alert("Bank amount must be at least 1 Amount");
      this.setState({ updating: false });
    }  

  };


  render() {
   

      const {  company } = this.props;

      const { contra, editBank, updating, formData, date } = this.state;

    if (!contra || !Array.isArray(contra)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='contra mobwidth'>
        

         <h2>Welcome to Contra</h2>

           <button className="btn-update" onClick={() => this.setState({ editBank: true })}>
          Add Bank
        </button>


         <table>
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Edit</th>
              <th>Withdraw</th>
            </tr>
          </thead>
          <tbody>
            {contra.length === 0 ? (
              <tr><td colSpan="5">No banks found</td></tr>
            ) : (
              contra.map((c) => (
                <tr key={c.contra_id}>
                  <td>{c.contra_name}</td>
                  <td>{c.contra_amount}</td>
                  <td>{c.contra_date}</td>
                  <td>
                    <button className="btn-edit" onClick={() => this.handleEdit(c)}>Edit</button>
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => this.handleDelete(c.contra_id, company[0].company_id)}
                    >
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

             {editBank && (
          <div className="modal-overlay">
            <div className="modal-box modalpos">
              <h2>{formData.contra_id ? "Edit Bank" : "Add Bank"}</h2>

              <label>Company ID</label>
              <input
                name="company_id"
                value={company && company[0] ? company[0].company_id : ""}
                readOnly
              />

              <label>Bank Name</label>
              <input
                name="contra_name"
                value={formData.contra_name || ""}
                onChange={this.handleChange}
              />

              <label>Moving Amount to Bank </label>
              <input
                name="contra_amount"
                value={formData.contra_amount || ""}
                onChange={this.handleChange}
              />

              <label>Date</label>
              <input
                name="contra_date"
                type="date"
                className="table-input"
                value={date}
                onChange={(e) => this.setState({ date: e.target.value })}
              />

              <div className="modal-buttons">
                <button
                  className="btn-update"
                  onClick={this.handleUpdate}
                  disabled={updating}
                >
                  {updating
                    ? (formData.contra_id ? "Updating..." : "Adding...")
                    : (formData.contra_id ? "Update" : "Add")}
                </button>
                <button className="btn-cancel" onClick={this.handleClose}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
}

export default Contra;
        