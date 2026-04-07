 import { useState } from "react";
 import React from 'react';
 import url from './Config';

 class Payment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Payment",
      payment: [],
      editPayment: false,
      date: new Date().toISOString().split("T")[0],
      updating: false,
      deletestart: false,
      formData: {
        company_id: "",
        payment_name: "",
        payment_amount: "",
      },
    };
  }


  componentDidMount() {
      this.fetchPayments();
    }

    handleEdit = (payment) => {
    this.setState({
      editPayment: true,
      formData: {
        payment_id: payment.payment_id,
        payment_name: payment.payment_name,
        payment_amount: payment.payment_amount
      },
      date: payment.payment_date
    });
  };



   handleDelete = async (payment_id, company_id) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;

    this.setState({ deletestart: true });

    try {
      const res = await fetch(url + "/wp-json/taxer/v1/deletepayment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ payment_id: payment_id, company_id: company_id })
      });
      const result = await res.json();
      if (result.success) {
        this.fetchPayments();
        this.props.reportpayments();
      } else {
        alert("Failed to delete payment: " + result.message);
      }
    } catch (err) {
      //alert("Error connecting to WordPress");
    }

    this.setState({ deletestart: false });
  };
  
    async fetchPayments() {
      try {
        const res = await fetch(url + `/wp-json/taxer/v1/getpayment`);
        const data = await res.json();
        console.log(data);
  
        let payment = [];
        if (data.payment) {
          payment = Array.isArray(data.payment) ? data.payment : [data.payment];
        }
  
        this.setState({ payment: payment });
           this.props.reportPayment();

      } catch (err) {
        this.setState({ error: 'Failed to connect to WordPress' });
      }
    }

  
  handleClose = () => {
    this.setState({
      editPayment: false,
      formData: { payment_name: "", payment_amount: "" }
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


  handleUpdate = async () => {
    this.setState({ updating: true });
    const { formData, date } = this.state;
    const { company } = this.props;

    const data = new FormData();
    data.append('company_id', company && company[0] ? company[0].company_id : "");
    data.append('payment_name', formData.payment_name);
    data.append('payment_amount', formData.payment_amount);
    data.append('payment_date', date);

    let endpoint = url + "/wp-json/taxer/v1/addpayment";

      if (formData.payment_id) {
        data.append("payment_id", formData.payment_id);
        endpoint = url + "/wp-json/taxer/v1/updatepayment";
      }

    if (formData.payment_amount >= 1) {
      try {
        const url =  endpoint;
        const method = formData.payment_id ? 'POST' : 'POST';

        const res = await fetch(url, {
          method: method,
          body: data
        });
        const result = await res.json();
        if (result.success) {
          this.setState({
            formData: { payment_name: "", payment_amount: "" },
            
          });
          this.props.reportPayment();
           this.fetchPayments();
          this.setState({ updating: false });
        } else {
          alert("Operation failed: " + result.message);
        }
      } catch (err) {
        alert("Error connecting to WordPress");
      }


    }else {
      alert("Payment amount must be at least 1 Amount");
      this.setState({ updating: false });
    }  

  };


  render() {
    const {  company } = this.props;

      const { payment, editPayment, updating, formData, date } = this.state;

    if (!payment || !Array.isArray(payment)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='payment mobwidth'>
        

         <h2>Welcome to Payment</h2>

         <button className="btn-update" onClick={() => this.setState({ editPayment: true })}>
          Add Payment
        </button>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {payment.length === 0 ? (
              <tr><td colSpan="5">No payments found</td></tr>
            ) : (
              payment.map((p) => (
                <tr key={p.payment_id}>
                  <td>{p.payment_name}</td>
                  <td>{p.payment_amount}</td>
                  <td>{p.payment_date}</td>
                  <td>
                    <button className="btn-edit" onClick={() => this.handleEdit(p)}>Edit</button>
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => this.handleDelete(p.payment_id, company[0].company_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

             {editPayment && (
          <div className="modal-overlay">
            <div className="modal-box modalpos">
              <h2>{formData.payment_id ? "Edit Payment" : "Add Payment"}</h2>

              <label>Company ID</label>
              <input
                name="company_id"
                value={company && company[0] ? company[0].company_id : ""}
                readOnly
              />

              <label>Payment Name</label>
              <input
                name="payment_name"
                value={formData.payment_name || ""}
                onChange={this.handleChange}
              />

              <label>Payment Amount</label>
              <input
                name="payment_amount"
                value={formData.payment_amount || ""}
                onChange={this.handleChange}
              />

              <label>Date</label>
              <input
                name="payment_date"
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
                    ? (formData.payment_id ? "Updating..." : "Adding...")
                    : (formData.payment_id ? "Update" : "Add")}
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

export default Payment;
        