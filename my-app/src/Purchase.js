import React from 'react';
import url from './Config';

class Purchase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Purchase",
      updating: false,
      stocks: [],
      editpurchase: false,
      formData: {
        company_id: ''
      },
      purchaseRows: [
        { stocks_id: '', purchase_amount: '', purchase_count: '', purchase_item_type: '', purchase_total: '' }
      ]
    };
  }

  componentDidMount() {
    this.fetchStocks();
  }

  // Fetch all stocks for the dropdown
  fetchStocks = () => {
    fetch(url + `/wp-json/taxer/v1/getstock`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stock && Array.isArray(data.stock)) {
          this.setState({ stocks: data.stock });
        } else if (Array.isArray(data)) {
          this.setState({ stocks: data });
        } else {
          this.setState({ stocks: [] });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch stocks:', err);
        this.setState({ stocks: [] });
      });
  };

  setpurchase = (p) => {
    if (p === true) {
      this.fetchStocks();
    }
    this.setState({ editpurchase: p });
  };

  handleClose = () => {
    this.setState({
      editpurchase: false,
      formData: { company_id: '' },
      purchaseRows: [
        { stocks_id: '', purchase_amount: '', purchase_count: '', purchase_item_type: '', purchase_total: '' }
      ]
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

  handleRowChange = (index, e) => {
    const { name, value } = e.target;
    this.setState((prevState) => {
      const updatedRows = [...prevState.purchaseRows];
      updatedRows[index] = {
        ...updatedRows[index],
        [name]: value
      };

      // Auto-calculate row total when price or count changes
      if (name === 'purchase_amount' || name === 'purchase_count') {
        const amount = parseFloat(name === 'purchase_amount' ? value : updatedRows[index].purchase_amount) || 0;
        const count  = parseFloat(name === 'purchase_count'  ? value : updatedRows[index].purchase_count)  || 0;
        updatedRows[index].purchase_total = (amount * count).toFixed(2);
      }

      return { purchaseRows: updatedRows };
    });
  };

  addRow = () => {
    this.setState((prevState) => ({
      purchaseRows: [
        ...prevState.purchaseRows,
        { stocks_id: '', purchase_amount: '', purchase_count: '', purchase_item_type: '', purchase_total: '' }
      ]
    }));
  };

  removeRow = (index) => {
    this.setState((prevState) => {
      const updatedRows = prevState.purchaseRows.filter((_, i) => i !== index);
      return {
        purchaseRows: updatedRows.length > 0
          ? updatedRows
          : [{ stocks_id: '', purchase_amount: '', purchase_count: '', purchase_item_type: '', purchase_total: '' }]
      };
    });
  };

  // ── Calculation helpers ──────────────────────────────────
  getSubTotal = () => {
    return this.state.purchaseRows.reduce((sum, row) => {
      return sum + (parseFloat(row.purchase_total) || 0);
    }, 0);
  };

  getTaxAmount = (subTotal, taxPercentage) => {
    return (subTotal * (parseFloat(taxPercentage) || 0)) / 100;
  };

  getGrandTotal = (subTotal, taxAmount) => {
    return subTotal + taxAmount;
  };
  // ─────────────────────────────────────────────────────────

  handleUpdate = async () => {
    this.setState({ updating: true });

    const { formData, purchaseRows } = this.state;

    // ── Read tax from selectedtax prop — same object App.js sets ──
    // App.js: selectedtax = tax.find(t => t.tax_id == companytaxid)
    // So selectedtax is a single object like { tax_id, tax_name, tax_percentage }
    const { selectedtax, company } = this.props;

    const companytaxid  = Array.isArray(company) && company.length > 0 ? company[0].tax_id : '';

    // selectedtax can be an object {} or array [] depending on App.js state
    // App.js uses: setselectedtax(found || [])  — so guard both cases
    const taxObj        = Array.isArray(selectedtax) ? selectedtax[0] : selectedtax;
    const taxPercentage = taxObj?.tax_percent ?? taxObj?.tax_percentage ?? 0;
    const taxId         = taxObj?.tax_id ?? companytaxid;

    const subTotal   = this.getSubTotal();
    const taxAmount  = this.getTaxAmount(subTotal, taxPercentage);
    const grandTotal = this.getGrandTotal(subTotal, taxAmount);

    const payload = {
      company_id:     formData.company_id || companytaxid,
      tax_id:         taxId,
      tax_percentage: taxPercentage,
      sub_total:      subTotal.toFixed(2),
      tax_amount:     taxAmount.toFixed(2),
      grand_total:    grandTotal.toFixed(2),
      purchases:      purchaseRows
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch(url + `/wp-json/taxer/v1/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Purchase saved:', data);

      this.setState({ updating: false });
      this.handleClose();
    } catch (error) {
      console.error('Failed to save purchase:', error);
      this.setState({ updating: false });
    }
  };

  render() {
    const { editpurchase, updating, purchaseRows, stocks } = this.state;
    const { purchase, company, selectedtax } = this.props;

    if (!purchase || !Array.isArray(purchase)) {
      return <p>Loading...</p>;
    }

    // ── Company details ──
    let companyidee  = '';
    let companyname  = '';
    let companytaxid = '';
    company.forEach((com) => {
      companyidee  = com.company_id;
      companyname  = com.company_name;
      companytaxid = com.tax_id;
    });

    // ── Tax details from selectedtax prop (set by App.js fetchTax/handleEdit) ──
    // App.js does: setselectedtax(found || [])
    // so selectedtax may be an object {} or empty array []
    const taxObj        = Array.isArray(selectedtax) ? selectedtax[0] : selectedtax;
    const taxPercentage = taxObj?.tax_percent ?? taxObj?.tax_percentage ?? 0;
    const taxName       = taxObj?.tax_name ?? '';

    // ── Live totals ──
    const subTotal   = this.getSubTotal();
    const taxAmount  = this.getTaxAmount(subTotal, taxPercentage);
    const grandTotal = this.getGrandTotal(subTotal, taxAmount);

    return (
      <div className='purchase'>
        <h2>Welcome to Purchase of {companyname}</h2>

        <a onClick={() => this.setpurchase(true)}>Add Purchase</a>

        {editpurchase && (
          <div className="modal-overlay">
            <div className="modal-box modal-box--wide">
              <h2>Add Purchase of {companyname}</h2>

              {/* Company ID */}
              <label>Company ID</label>
              <input
                name="company_id"
                value={companyidee}
                readOnly
              />

              {/* Tax info — from selectedtax prop passed by App.js */}
              <label>Tax</label>
              <input
                name="tax_name"
                value={taxName ? `${taxName} (${taxPercentage}%)` : 'No tax found'}
                readOnly
              />

              {/* Dynamic Purchase Items Table */}
              <div className="purchase-table-wrapper">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Stock Item</th>
                      <th>Purchase Price</th>
                      <th>Purchase Count</th>
                      <th>Purchase Unit</th>
                      <th>Purchase Item Total</th>
                      <th>
                        <button
                          type="button"
                          className="btn-icon btn-add-row"
                          onClick={this.addRow}
                          title="Add row"
                        >
                          +
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>

                        {/* Stock Item dropdown */}
                        <td>
                          <select
                            name="stocks_id"
                            className="table-input"
                            value={row.stocks_id}
                            onChange={(e) => this.handleRowChange(index, e)}
                          >
                            <option value="">
                              {stocks.length === 0 ? 'Loading...' : 'Select Stock'}
                            </option>
                            {stocks.map((stock) => (
                              <option key={stock.stocks_id} value={stock.stocks_id}>
                                {stock.stocks_name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            name="purchase_amount"
                            className="table-input"
                            value={row.purchase_amount}
                            onChange={(e) => this.handleRowChange(index, e)}
                            placeholder="0.00"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="purchase_count"
                            className="table-input"
                            value={row.purchase_count}
                            onChange={(e) => this.handleRowChange(index, e)}
                            placeholder="0"
                          />
                        </td>

                        <td>
                          <select
                            name="purchase_item_type"
                            className="table-input"
                            value={row.purchase_item_type}
                            onChange={(e) => this.handleRowChange(index, e)}
                          >
                            <option value="">Select</option>
                            <option value="kg">KG</option>
                            <option value="nos">Number</option>
                            <option value="litre">Litre</option>
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            name="purchase_total"
                            className="table-input"
                            value={row.purchase_total}
                            placeholder="0.00"
                            readOnly
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn-icon btn-remove-row"
                            onClick={() => this.removeRow(index)}
                            title="Remove row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals summary — updates live as rows change */}
              <div className="purchase-totals">
                <div className="totals-row">
                  <span>Sub Total</span>
                  <span>₹ {subTotal.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>Tax ({taxPercentage}%)</span>
                  <span>₹ {taxAmount.toFixed(2)}</span>
                </div>
                <div className="totals-row totals-grand">
                  <span>Grand Total</span>
                  <span>₹ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  className="btn-update"
                  onClick={this.handleUpdate}
                  disabled={updating}
                >
                  {updating ? "Adding..." : "Add"}
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

export default Purchase;