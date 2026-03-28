import React from "react";
import url from './Config';
class Stock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Stock",
      stoker: true,
        stocks: [],
      updating: false,
      editstoker: false,
      imagePreview: null,
      formData: {
        company_id: props.company && props.company.length > 0 ? props.company[0].company_id : "" // Pre-fill with first company ID
      }
    };
  }

  componentDidMount() {
    this.fetchStocks(); // called once when component mounts
  }

  setonstoker = (s) => {
    this.setState({ editstoker: s });
  };

  handleChange = (e) => {
    this.setState({
      formData: { ...this.state.formData, [e.target.name]: e.target.value }
    });
  };

  handleClose = () => {
  this.setState({
    editstoker: false,
    formData: { company_id: this.props.company?.[0]?.company_id || "" },
    imagePreview: null
  });
};

  handleEdit = (stock) => {
  this.setState({
    formData: {
      stocks_id: stock.stocks_id,   // ✅ include ID
      company_id: stock.company_id,
      stocks_name: stock.stocks_name,
      stocks_price: stock.stocks_price,
      stocks_total: stock.stocks_total,
      stocks_unit: stock.stocks_unit,
      stocks_image: stock.stocks_image
    },
    imagePreview: stock.stocks_image || null, // show existing image until new one selected
    editstoker: true
  });
};

handleDelete = async (stocks_id) => {
  if (!window.confirm("Are you sure you want to delete this stock?")) return;

  try {
    const res = await fetch(url + "/wp-json/taxer/v1/deletestock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stocks_id })
    });
    const result = await res.json();
    if (result.success) {
      alert("Deleted successfully!");
      this.fetchStocks(); // refresh list
    } else {
      alert("Delete failed: " + result.message);
    }
  } catch (err) {
    alert("Error connecting to WordPress");
  }
};

  async fetchStocks() {
  fetch(url + `/wp-json/taxer/v1/getstock`)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      
      if (data.stock && Array.isArray(data.stock)) {
        this.setState({ stocks: data.stock }); // ← use data.stock not data.data
      } else {
        this.setState({ stocks: [] });
      }
    })
    .catch(() => {
      this.setState({ error: 'Failed to connect to WordPress' });
    });
}

handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    this.setState({
      formData: { ...this.state.formData, stocks_image: file },
      imagePreview: URL.createObjectURL(file) // preview URL
    });
  }
};

 

  async handleUpdate() {
  this.setState({ updating: true });
  const data = new FormData();
  const { formData } = this.state;

  data.append("company_id", formData.company_id);
  data.append("stocks_name", formData.stocks_name);
  data.append("stocks_price", formData.stocks_price);
  data.append("stocks_total", formData.stocks_total);
  data.append("stocks_unit", formData.stocks_unit);

  if (formData.stocks_image) {
    data.append("stocks_image", formData.stocks_image);
  }


  let endpoint = "/wp-json/taxer/v1/insertstock";
if (formData.stocks_id) {
  data.append("stocks_id", formData.stocks_id);
  endpoint = "/wp-json/taxer/v1/updatestock"; //  
}

 

  try {
    const res = await fetch(url + endpoint, { method: "POST", body: data });
    const result = await res.json();
    if (result.success) {
      alert(formData.stocks_id ? "Updated successfully!" : "Inserted successfully!");
      //this.handleClose();

      this.setState({
    
    formData: { company_id: this.props.company?.[0]?.company_id || "" },
    imagePreview: null
  });

      this.fetchStocks();
    } else {
      alert("Operation failed: " + result.message);
    }
  } catch (err) {
    alert("Error connecting to WordPress");
  }
  this.setState({ updating: false });
}

  render() {
    
    const { editstoker, updating ,stocks  } = this.state;
    const { company } = this.props;

   

    // No need for companyide loop; use formData.company_id

    return (
      <div className="stock">
        <h2>Welcome to Stock</h2>
        <a onClick={() => this.setonstoker(true)}>Add Stock</a>

        {/* Stock list table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Total</th>
            <th>Unit</th>
            <th>Image</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {stocks.length === 0 ? (
            <tr><td colSpan="4">No stocks found</td></tr>
          ) : (
            stocks.map((s) => (
              <tr key={s.stocks_id}>
                <td>{s.stocks_name}</td>
                <td>{s.stocks_price}</td>
                <td>{s.stocks_total}</td>
                <td>{s.stocks_unit}</td>
                  <td>
                  {s.stocks_image ? (
                  <img src={s.stocks_image} alt={s.stocks_name} width="50" />
                  ) : (
                  "No image"
                  )}
                  </td>
                   <td>
          <button className="btn-edit" onClick={() => this.handleEdit(s)}>Edit</button>
        </td>
        <td>
          <button className="btn-edit" onClick={() => this.handleDelete(s.stocks_id)}>Delete</button>
        </td>


              </tr>
            ))
          )}
        </tbody>
      </table>

        {editstoker && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Add Stock</h2> {/* Fixed title */}

              <label>Company ID</label>
              <input
                name="company_id"
                value={this.state.formData.company_id || ""}
                onChange={this.handleChange}
              />

              <label>Stock Name</label>
              <input
                name="stocks_name"
                value={this.state.formData.stocks_name || ""}
                onChange={this.handleChange}
              />

              <label>Stock Price</label>
              <input
                name="stocks_price"
                value={this.state.formData.stocks_price || ""}
                onChange={this.handleChange}
              />

              <label>Stock Total</label>
              <input
                name="stocks_total"
                value={this.state.formData.stocks_total || ""}
                onChange={this.handleChange}
              />

              <label>Stock Unit</label>
              <select
                name="stocks_unit"
                value={this.state.formData.stocks_unit || ""}
                onChange={this.handleChange}
              >
                <option value="">Please Select</option>
                <option value="kg">KG</option>
                <option value="nos">Number</option>
                <option value="litre">Litre</option>
              </select>

              <label>Stock Image</label>
               <div className="image-preview-box">
  {this.state.imagePreview
    ? <img src={this.state.imagePreview} alt="preview" width="100" />
    : <p>No image</p>
  }
</div>

              <input
              type="file"
              name="stocks_image"
              onChange={(e) => this.handleFileChange(e)}
              />
              <input type="hidden" name="stocks_id" value={this.state.formData.stocks_id || ""} />

              <div className="modal-buttons">
                <h2>{this.state.formData.stocks_id ? "Edit Stock" : "Add Stock"}</h2>

<button
  className="btn-update"
  onClick={() => this.handleUpdate()}
  disabled={updating}
>
  {updating ? (this.state.formData.stocks_id ? "Updating..." : "Adding...") 
            : (this.state.formData.stocks_id ? "Update" : "Add")}
</button>
                <button className="btn-cancel" onClick={this.handleClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Stock;