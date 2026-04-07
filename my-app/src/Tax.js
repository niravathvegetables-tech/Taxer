import React from 'react';

import url from './Config';

class Tax extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: { tax_id: "", tax_name: "", tax_percentage: "" },
      tax: [],
      editTax: false,
      updating: false
    };
  }

  componentDidMount() {
    this.fetchTax();
  }

  async fetchTax() {
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/gettax");
      const data = await res.json();
      if (data.tax && Array.isArray(data.tax)) {
        this.setState({ tax: data.tax });

         

      }
    } catch (err) {
      console.error("Failed to fetch tax", err);
    }
  }

  async fetchTax2() {
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/gettax");
      const data = await res.json();
      if (data.tax && Array.isArray(data.tax)) {
        this.setState({ tax: data.tax });
console.log('Fetched tax data:', data.tax);
         this.props.onAddTaxItem(data.tax);

      }
    } catch (err) {
      console.error("Failed to fetch tax", err);
    }
  }

  handleChange = (e) => {
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [e.target.name]: e.target.value }
    }));
  };

 handleEdit = (item) => {
  this.setState({
    formData: {
      tax_id: item.tax_id,
      tax_name: item.tax_name,
      tax_percentage: item.tax_percent  // ✅ tax_percent is the DB column name
    },
    editTax: true
  });
};

  handleClose = () => {
    this.setState({
      editTax: false,
      formData: { tax_id: "", tax_name: "", tax_percentage: "" }
    });
  };

  handleUpdate = async () => {
    this.setState({ updating: true });
    const { formData } = this.state;
    const data = new FormData();

    data.append("tax_name", formData.tax_name);
    data.append("tax_percentage", formData.tax_percentage);

    let endpoint = url + "/wp-json/taxer/v1/inserttax";
    if (formData.tax_id) {
      data.append("tax_id", formData.tax_id);
      endpoint = url + "/wp-json/taxer/v1/updatetax";
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: data
      });
      const result = await res.json();
      if (result.success) {
       // alert(formData.tax_id ? "Tax updated!" : "Tax added!");
       // this.handleClose();

       this.setState({
      
      formData: { tax_id: "", tax_name: "", tax_percentage: "" }
    });


        this.fetchTax2();

      } else {
        alert("Operation failed: " + result.message);
      }
    } catch (err) {
      alert("Error connecting to WordPress");
    }

    this.setState({ updating: false });
  };

  handleDelete = async (tax_id) => {
    if (!window.confirm("Are you sure you want to delete this tax?")) return;

    try {
      const res = await fetch(url + "/wp-json/taxer/v1/deletetax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tax_id })
      });
      const result = await res.json();
      if (result.success) {
       // alert("Deleted successfully!");
        this.fetchTax();
          this.fetchTax2();
      } else {
        alert("Delete failed: " + result.message);
      }
    } catch (err) {
      alert("Error connecting to WordPress");
    }
  };

  render() {
    const { tax, editTax, updating, formData } = this.state;

    return (
      <div className="tax mobwidth">
        <h2>Welcome to Tax</h2>
        <button className="btn-update" onClick={() => this.setState({ editTax: true })}>Add Tax</button>

        <table>
          <thead>
            <tr>
              <th>Tax Name</th>
              <th>Percentage</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {tax.length === 0 ? (
              <tr><td colSpan="4">No tax records found</td></tr>
            ) : (
              tax.map((t) => (
                <tr key={t.tax_id}>
                  <td>{t.tax_name}</td>
                  <td>{t.tax_percent}%</td>  {/* ✅ fixed field name */}
                  <td>
                    <button className="btn-update" onClick={() => this.handleEdit(t)}>Edit</button>
                  </td>
                  <td>
                    <button className="btn-delete" onClick={() => this.handleDelete(t.tax_id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {editTax && (
          <div className="modal-overlay">
            <div className="modal-box modalpos">
              <h2>{formData.tax_id ? "Edit Tax" : "Add Tax"}</h2>

              <label>Tax Name</label>
              <input
                name="tax_name"
                value={formData.tax_name || ""}
                onChange={this.handleChange}
              />

              <label>Tax Percentage</label>
              <input
                name="tax_percentage"
                value={formData.tax_percentage || ""}
                onChange={this.handleChange}
              />

              <div className="modal-buttons">
                <button
                  onClick={this.handleUpdate}
                  disabled={updating}
                >
                  {updating
                    ? (formData.tax_id ? "Updating..." : "Adding...")
                    : (formData.tax_id ? "Update" : "Add")}
                </button>
                <button onClick={this.handleClose}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Tax;