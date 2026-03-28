import React from "react";
var url="http://localhost/matsio";
class Stock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Stock",
      stoker: true,
        stocks: [],
      updating: false,
      editstoker: false,
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
    this.setState({ editstoker: false });
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

  async handleUpdate() {
    this.setState({ updating: true });
    const data = new FormData();
    const { formData } = this.state;
    console.log(formData);
    data.append("company_id", formData.company_id);
    data.append("stocks_name", formData.stocks_name);
    data.append("stocks_price", formData.stocks_price);
    data.append("stocks_total", formData.stocks_total);
    data.append("stocks_unit", formData.stocks_unit);

    try {
      const res = await fetch(url+"/wp-json/taxer/v1/updatestock", {
        method: "POST",
        body: data
      });
      const result = await res.json();
      if (result.success) {
        alert("Updated successfully!");
        this.handleClose();
        this.fetchStocks(); // Call the function to fetch updated stock data
      } else {
        alert("Update failed: " + result.message);
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

              <div className="modal-buttons">
                <button
                  className="btn-update"
                  onClick={() => this.handleUpdate()}
                  disabled={updating}
                >
                  {updating ? "Adding..." : "Add"} {/* Fixed label */}
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