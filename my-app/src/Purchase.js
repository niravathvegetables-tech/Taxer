import React from 'react';
import url from './Config';

class Purchase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Purchase",
      updating: false,
      stocks: [],
      date: new Date().toISOString().split("T")[0], // default to today's date
      editpurchase: false,
      rowErrors: {}, // ← track per-row stock errors
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
      rowErrors: {},
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

      // Auto-calculate row total
      if (name === 'purchase_amount' || name === 'purchase_count') {

        
        const amount = parseFloat(name === 'purchase_amount' ? value : updatedRows[index].purchase_amount) || 0;
        const count  = parseFloat(name === 'purchase_count'  ? value : updatedRows[index].purchase_count)  || 0;

        /***
         * 
         * this is equivalent to: if else statements for amount and count, but more concise. 
         * It checks which field was changed and uses the new value for that field while keeping the
         *  existing value for the other field.
         * let amount, count;

// if (name === 'purchase_amount') {
//   amount = parseFloat(value) || 0;
// } else {
//   amount = parseFloat(updatedRows[index].purchase_amount) || 0;
// }

// if (name === 'purchase_count') {
//   count = parseFloat(value) || 0;
// } else {
//   count = parseFloat(updatedRows[index].purchase_count) || 0;
// }
         * ** */






        updatedRows[index].purchase_total = (amount * count).toFixed(2);
      }

      // ── Stock availability check when purchase_count changes ──
      let updatedErrors = { ...prevState.rowErrors };

      if (name === 'purchase_count') {
        const stocksId     = updatedRows[index].stocks_id;
        const enteredCount = parseFloat(value) || 0;

        if (stocksId && enteredCount > 0) {
          // Use already-fetched stocks — no extra API call needed
          const stockItem = prevState.stocks.find(
            (s) => parseInt(s.stocks_id) === parseInt(stocksId)
          );

          if (stockItem) {
            const available = parseFloat(stockItem.stocks_total) || 0;
            if (enteredCount > available) {
            //  updatedErrors[index] = `Only ${available} ${stockItem.stocks_unit || 'units'} available for "${stockItem.stocks_name}"`;
            } else {
              delete updatedErrors[index]; // clear error if count is valid
            }
          }
        } else {
          delete updatedErrors[index];
        }
      }

      // Reset error when stock item selection changes
      if (name === 'stocks_id') {
        delete updatedErrors[index];
      }

      return { purchaseRows: updatedRows, rowErrors: updatedErrors };
    });
  };
//here adding a new row to the purchase table with default empty values. 
// The new row is appended to the existing purchaseRows array in the state.
//  This allows users to add multiple items to their purchase before submitting.
  addRow = () => {
    this.setState((prevState) => ({
      purchaseRows: [
        ...prevState.purchaseRows,
        { stocks_id: '', purchase_amount: '', purchase_count: '', purchase_item_type: '', purchase_total: '' }
      ]
    }));
  };
// The removeRow function removes a specific row from the purchaseRows array based on the provided index. 
// It also updates the rowErrors state to ensure that any errors associated with the removed row are cleared. 
// If all rows are removed, it resets to a single empty row to maintain the structure of the purchase form. 
  removeRow = (index) => {
    this.setState((prevState) => {
      const updatedRows   = prevState.purchaseRows.filter((_, i) => i !== index);
      // Create a new array excluding 
      // the row at the specified index
      const updatedErrors = { ...prevState.rowErrors };// Create a copy of the current rowErrors
      delete updatedErrors[index];

      return {
        purchaseRows: updatedRows.length > 0
          ? updatedRows
          : [{ stocks_id: '', purchase_amount: '', purchase_count: '', purchase_item_type: '', purchase_total: '' }],
        rowErrors: updatedErrors
      };
    });
  };

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

  handleUpdate = async () => {
    if (this.state.updating) return;

    const { purchaseRows, rowErrors } = this.state;

    // Block submit if any stock errors exist
    if (Object.keys(rowErrors).length > 0) {
      alert('Please fix stock availability errors before submitting.');
      return;
    }

    // Validate all rows are filled
    const hasEmptyRow = purchaseRows.some(row =>
      !row.stocks_id || !row.purchase_amount || !row.purchase_count || !row.purchase_item_type
    );
    if (hasEmptyRow) {
      alert('Please fill in all purchase row fields.');
      return;
    }

    this.setState({ updating: true });

    const { selectedtax, company } = this.props;

    const companyId     = Array.isArray(company) && company.length > 0 ? company[0].company_id : '';
    const companytaxid  = Array.isArray(company) && company.length > 0 ? company[0].tax_id : '';
    const taxObj        = Array.isArray(selectedtax) ? selectedtax[0] : selectedtax;
    const taxPercentage = taxObj?.tax_percent ?? taxObj?.tax_percentage ?? 0;
    const taxId         = taxObj?.tax_id ?? companytaxid;

    const subTotal   = this.getSubTotal();
    const taxAmount  = this.getTaxAmount(subTotal, taxPercentage);
    const grandTotal = this.getGrandTotal(subTotal, taxAmount);

    const payload = {
      company_id:     companyId,
      tax_id:         taxId,
      tax_percentage: taxPercentage,
      sub_total:      subTotal.toFixed(2),
      tax_amount:     taxAmount.toFixed(2),
      grand_total:    grandTotal.toFixed(2),
      purchases:      JSON.stringify(purchaseRows),
      date:           this.state.date
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch(url + `/wp-json/taxer/v1/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data = await response.json();
      console.log('Purchase saved:', data);

      if (data.success) {
        alert(`Purchase saved! ${data.inserted} item(s) recorded.`);
        this.handleClose();
         this.setState({ updating: false });
      } else {
        alert('Something went wrong: ' + (data.message || 'Unknown error'));
        this.setState({ updating: false });
      }

    } catch (error) {
      console.error('Failed to save purchase:', error);
      alert('Failed to save purchase. Please try again.');
      this.setState({ updating: false });
    }
  };

  render() {
    const { editpurchase, updating, purchaseRows, stocks, rowErrors } = this.state;
    const { purchase, company, selectedtax } = this.props;

    if (!purchase || !Array.isArray(purchase)) {
      return <p>Loading...</p>;
    }

    let companyidee = '';
    let companyname = '';
    company.forEach((com) => {
      companyidee = com.company_id;
      companyname = com.company_name;
    });

    const taxObj        = Array.isArray(selectedtax) ? selectedtax[0] : selectedtax;
    const taxPercentage = taxObj?.tax_percent ?? taxObj?.tax_percentage ?? 0;
    const taxName       = taxObj?.tax_name ?? '';

    const subTotal   = this.getSubTotal();
    const taxAmount  = this.getTaxAmount(subTotal, taxPercentage);
    const grandTotal = this.getGrandTotal(subTotal, taxAmount);

    const hasErrors = Object.keys(rowErrors).length > 0;

    return (
      <div className='purchase'>
        <h2>Welcome to Purchase of {companyname}</h2>

        <a onClick={() => this.setpurchase(true)}>Add Purchase</a>

        {editpurchase && (
          <div className="modal-overlay">
            <div className="modal-box modal-box--wide">
              <h2>Add Purchase of {companyname}</h2>

              <label>Company ID</label>
              <input name="company_id" value={companyidee} readOnly />

              <label>Tax</label>
              <input
                name="tax_name"
                value={taxName ? `${taxName} (${taxPercentage}%)` : 'No tax found'}
                readOnly
              />

               <label>Date</label>
              <input
                name="date"
                type="date"
                className="table-input"
                value={this.state.date}
                onChange={(e) => this.setState({ date: e.target.value })}
              />

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
                                {stock.stocks_name} (Avail: {stock.stocks_total} {stock.stocks_unit})
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
                          {/* Purchase Count with inline stock error */}
                          <input
                            type="number"
                            name="purchase_count"
                            className={`table-input ${rowErrors[index] ? 'input-error' : ''}`}
                            style={ rowErrors[index] ? { borderColor: 'red' } : {} }
                            value={row.purchase_count}
                            onChange={(e) => this.handleRowChange(index, e)}
                            placeholder="0"
                            min="0"
                          />
                          {rowErrors[index] && (
                            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                              ⚠ {rowErrors[index]}
                            </div>
                          )}
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
                  disabled={updating || hasErrors}
                  title={hasErrors ? 'Fix stock errors before submitting' : ''}
                >
                  {updating ? "Adding..." : "Add"}
                </button>
                <button
                  className="btn-cancel"
                  onClick={this.handleClose}
                  disabled={updating}
                >
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