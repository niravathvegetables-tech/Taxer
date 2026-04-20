 import { useState } from "react";
 import React from 'react';
import url from './Config';

 class Sales extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Sales",
       salesreportshow: false,
        salesreport: [],
      updating: false,
      stocks: [],
      date: new Date().toISOString().split("T")[0],
      editsales: false,
      alert: null,
      rowErrors: {},
      formData: {
        company_id: ''
      },
      salesRows: [
        { stocks_id: '', sales_amount: '', sales_count: '', sales_item_type: '', sales_total: '' }
      ]
    };
  }

   componentDidMount() {
      this.fetchStocks();
      this.getfetchSalesREPORT();
    }


 getfetchSalesREPORT = () => {


     fetch(url + `/wp-json/taxer/v1/getreportsales`)

  .then((res) => res.json())

  .then((data) => {

    console.log("API Response:", data); // Debug

    this.setState({

      salesreport: Array.isArray(data.getreport) ? data.getreport : [],

      salesreportshow: true

    });


    

  })

  .catch((err) => {

    console.error('Failed to fetch sales report:', err);

  });



  };

  
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


setsales = (s) => {
    if (s === true) {
      this.fetchStocks();
    }
    this.setState({ editsales: s });
    alert = null;
  };

   handleClose = () => {
    this.setState({
      editsales: false,
      rowErrors: {},
      formData: { company_id: '' },
      salesRows: [
        { stocks_id: '', sales_amount: '', sales_count: '', sales_item_type: '', sales_total: '' }
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

    // Capture stocks from this.state BEFORE entering setState
    // because prevState.stocks can lag behind the already-loaded list
    const currentStocks = this.state.stocks;

    this.setState((prevState) => {
      const updatedRows = [...prevState.salesRows];
      updatedRows[index] = {
        ...updatedRows[index],
        [name]: value
      };

      // ── Auto-fill purchase_amount from selected stock price ──
      if (name === 'stocks_id') {
        const selectedStock = currentStocks.find(
          (stock) => String(stock.stocks_id) === String(value)
        );
        if (selectedStock) {
          updatedRows[index].sales_amount = selectedStock.stocks_price;
          // Recalculate total if count already exists
          const count = parseFloat(updatedRows[index].sales_count) || 0;
          const price = parseFloat(selectedStock.stocks_price) || 0;
          updatedRows[index].sales_total = (price * count).toFixed(2);
        } else {
          // Stock deselected — clear price and total
          updatedRows[index].sales_amount = '';
          updatedRows[index].sales_total  = '';
        }
      }

      // ── Auto-calculate row total ──
      if (name === 'sales_amount' || name === 'sales_count') {
        const amount = parseFloat(name === 'sales_amount' ? value : updatedRows[index].sales_amount) || 0;
        const count  = parseFloat(name === 'sales_count'  ? value : updatedRows[index].sales_count)  || 0;
        updatedRows[index].sales_total = (amount * count).toFixed(2);
      }

      // ── Stock availability check when sales_count changes ──
      let updatedErrors = { ...prevState.rowErrors };

      if (name === 'sales_count') {
        const stocksId     = updatedRows[index].stocks_id;
        const enteredCount = parseFloat(value) || 0;

        if (stocksId && enteredCount > 0) {
          const stockItem = currentStocks.find(
            (s) => parseInt(s.stocks_id) === parseInt(stocksId)
          );
          if (stockItem) {
            const available = parseFloat(stockItem.stocks_total) || 0;
            if (enteredCount > available) {
              updatedErrors[index] = `Only ${available} ${stockItem.stocks_unit || 'units'} available for "${stockItem.stocks_name}"`;
            } else {
              delete updatedErrors[index];
            }
          }
        } else {
          delete updatedErrors[index];
        }
      }

      // ── Reset error when stock item selection changes ──
      if (name === 'stocks_id') {
        delete updatedErrors[index];
      }

      return { salesRows: updatedRows, rowErrors: updatedErrors };
    });
  };

 addRow = () => {
    this.setState((prevState) => ({
      salesRows: [
        ...prevState.salesRows,
        { stocks_id: '', sales_amount: '', sales_count: '', sales_item_type: '', sales_total: '' }
      ]
    }));
  };


  removeRow = (index) => {
    this.setState((prevState) => {
      const updatedRows   = prevState.salesRows.filter((_, i) => i !== index);
      const updatedErrors = { ...prevState.rowErrors };
      delete updatedErrors[index];

      return {
        salesRows: updatedRows.length > 0
          ? updatedRows
          : [{ stocks_id: '', sales_amount: '', sales_count: '', sales_item_type: '', sales_total: '' }],
        rowErrors: updatedErrors
      };
    });
  };


   getSubTotal = () => {
    return this.state.salesRows.reduce((sum, row) => {
      return sum + (parseFloat(row.sales_total) || 0);
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

    const { salesRows, rowErrors } = this.state;

    if (Object.keys(rowErrors).length > 0) {
      alert('Please fix stock availability errors before submitting.');
      return;
    }

    const hasEmptyRow = salesRows.some(row =>
      !row.stocks_id || !row.sales_amount || !row.sales_count || !row.sales_item_type
    );
    if (hasEmptyRow) {
      alert('Please fill in all sales row fields.');
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
      saleses:      JSON.stringify(salesRows),
      date:           this.state.date
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch(url + `/wp-json/taxer/v1/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data = await response.json();
      console.log('Purchase saved:', data);

      if (data.success) {
        this.setState({ alert: `Sales saved! ${data.inserted} item(s) recorded.` });
        this.handleClose();
        this.setState({ updating: false });

         this.props.reportSales();
         
      } else {
        this.setState({ alert: 'Something went wrong: ' + (data.message || 'Unknown error') });
        this.setState({ updating: false });
      }

    } catch (error) {
      console.error('Failed to save sales:', error);
      this.setState({ alert: 'Failed to save sales. Please try again.' });
      this.setState({ updating: false });
    }
  };


  render() {

    const { editsales, updating, salesRows, stocks, rowErrors, salesreportshow, salesreport } = this.state;
    const { sales, company, selectedtax } = this.props;

   if (!sales || !Array.isArray(sales)) {
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
      <div className='sales mobwidth'>
        
           <div className="alert-box">{alert}</div>

         <h2>Welcome to Sales of {companyname} </h2>

          <a className="btn-update" onClick={() => this.setsales(true)}>Add Sales</a>
        {salesreportshow && (
            <div className="salesreport">
          <h2>Sales Report</h2>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead> 

                 <th>Sales ID</th>
                    <th>Item Name</th>
                    <th>Item Quantity</th>
                    <th>Sales Amount</th>
                    <th>Sales Date</th>

                </thead>
              <tbody>

                 {salesreport.length === 0 ? ( 

                  <tr>
                      <td colSpan={2}>No sales records found.</td>
                    </tr>

                 ):(

                  salesreport.map((report,key) => (

                    <tr key={report.key}>
                      <td>{report.sales_id}</td>
                      <td>{this.state.stocks.find(stock => stock.stocks_id === report.stocks_id)?.stocks_name || 'Unknown'}</td>
                      <td>{report.sales_count} - {report.sales_item_type}</td>
                      <td>{report.sales_amount}</td>
                      <td>{report.date}</td>
                    </tr>
                  )) )} 
                </tbody>
            </table>
          </div>  

           </div>
        )}

        {editsales && (
          <div className="modal-overlay">
            <div className="modal-box modal-box-sales modalpos  modal-box--wide">
              <h2>Add Sales of {companyname}</h2>

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
                    {salesRows.map((row, index) => (
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
                                {stock.stocks_name} (Avail: {stock.stocks_total} {stock.stocks_unit} / Price: {stock.stocks_price})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            name="sales_amount"
                            className="table-input"
                            value={row.sales_amount}
                            onChange={(e) => this.handleRowChange(index, e)}
                            placeholder="0.00"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="sales_count"
                            className={`table-input ${rowErrors[index] ? 'input-error' : ''}`}
                            style={rowErrors[index] ? { borderColor: 'red' } : {}}
                            value={row.sales_count}
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
                            name="sales_item_type"
                            className="table-input"
                            value={row.sales_item_type}
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
                            name="sales_total"
                            className="table-input"
                            value={row.sales_total}
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

export default Sales;
        