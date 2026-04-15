import React from 'react';
import url from './Config';

class Receipt extends React.Component {
  constructor(props) {
    super(props);
       
    this.state = {
      activeTab: "Receipt",
      editReceipt: false,
      receipt: [],
      date: new Date().toISOString().split("T")[0],
      updating: false,
      deletestart: false,
      formData: {
        company_id: "",
        receipt_name: "",
        receipt_amount: "",
      },
    };
  }

 

  componentDidMount() {
    this.fetchReceipts();
  }

  handleEdit = (payment) => {
    this.setState({
      editReceipt: true,
      formData: {
        receipt_id: payment.receipt_id,
        receipt_name: payment.receipt_name,
        receipt_amount: payment.receipt_amount
      },
      date: payment.receipt_date
    });
  };

  async fetchReceipts() {
    try {
      const res = await fetch(url + `/wp-json/taxer/v1/getreceipt`);
      const data = await res.json();
      console.log(data);

      let receipts = [];
      if (data.receipt) {
        receipts = Array.isArray(data.receipt) ? data.receipt : [data.receipt];
      }

      this.setState({ receipt: receipts });
      this.props.reportreceipts();

    } catch (err) {
      this.setState({ error: 'Failed to connect to WordPress' });
    }
  }

  handleClose = () => {
    this.setState({
      editReceipt: false,
      formData: { receipt_name: "", receipt_amount: "" }
    });
  };

  handleEdit = (receipt) => {
    this.setState({
      editReceipt: true,
      formData: {
        receipt_id: receipt.receipt_id,
        receipt_name: receipt.receipt_name,
        receipt_amount: receipt.receipt_amount
      },
      date: receipt.receipt_date
    });
  };

  handleDelete = async (receipt_id, company_id) => {
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;

    this.setState({ deletestart: true });

    try {
      const res = await fetch(url + "/wp-json/taxer/v1/deletereceipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ receipt_id: receipt_id, company_id: company_id })
      });
      const result = await res.json();
      if (result.success) {
        this.fetchReceipts();
        
      } else {
        alert("Failed to delete receipt: " + result.message);
      }
    } catch (err) {
      //alert("Error connecting to WordPress");
    }

    this.setState({ deletestart: false });
  };

  handleChange = (e) => {
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [e.target.name]: e.target.value }
    }));
  };

  

  handleUpdate = async () => {
    this.setState({ updating: true });
    const { formData, date } = this.state;
    const { company } = this.props;

    if (formData.receipt_amount >= 1) {
      const data = new FormData();
      data.append("company_id", company && company[0] ? company[0].company_id : "");
      data.append("receipt_name", formData.receipt_name);
      data.append("receipt_amount", formData.receipt_amount);
      data.append("date", date);

      let endpoint = url + "/wp-json/taxer/v1/insertreceipt";

      if (formData.receipt_id) {
        data.append("receipt_id", formData.receipt_id);
        endpoint = url + "/wp-json/taxer/v1/updatereceipt";
      }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: data
        });
        const result = await res.json();
        if (result.success) {
          this.setState({
            formData: { receipt_name: "", receipt_amount: "" }
          });
          this.fetchReceipts();
          this.props.reportReceipt();
          
        } else {

          alert("Operation failed: " + result.message);
          
        }
      } catch (err) {
        //alert("Error connecting to WordPress");

          console.error("Failed to save receipt", err);
      }

      
    }

    this.setState({ updating: false });
  };

  render() {
    const { company } = this.props;
    const { receipt, editReceipt, updating, formData, date } = this.state;

    if (!Array.isArray(receipt)) {
      return <p>Loading...</p>;
    }

    return (
      <div className='receipt mobwidth'>
        <h2>Welcome to Receipt</h2>

        <button className="btn-update" onClick={() => this.setState({ editReceipt: true })}>
          Add Receipt
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
            {receipt.length === 0 ? (
              <tr><td colSpan="5">No receipts found</td></tr>
            ) : (
              receipt.map((r) => (
                <tr key={r.receipt_id}>
                  <td>{r.receipt_name}</td>
                  <td>{r.receipt_amount}</td>
                  <td>{r.receipt_date}</td>
                  <td>
                    <button className="btn-edit" onClick={() => this.handleEdit(r)}>Edit</button>
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => this.handleDelete(r.receipt_id, company[0].company_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {editReceipt && (
          <div className="modal-overlay">
            <div className="modal-box modalpos">
              <h2>{formData.receipt_id ? "Edit Receipt" : "Add Receipt"}</h2>

              <label>Company ID</label>
              <input
                name="company_id"
                value={company && company[0] ? company[0].company_id : ""}
                readOnly
              />

              <label>Receipt Name</label>
              <input
                name="receipt_name"
                value={formData.receipt_name || ""}
                onChange={this.handleChange}
              />

              <label>Receipt Amount</label>
              <input
                name="receipt_amount"
                value={formData.receipt_amount || ""}
                onChange={this.handleChange}
              />

              <label>Date</label>
              <input
                name="receipt_date"
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
                    ? (formData.receipt_id ? "Updating..." : "Adding...")
                    : (formData.receipt_id ? "Update" : "Add")}
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

export default Receipt;