import React from "react";
import url from "./Config";

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Order",
      order: [],
      customers: [],
      ajaxstatus: "",
       butonshow: false,
       orderdatecolumn:false,
      date: new Date().toISOString().split("T")[0],
      updating: false,
      deletestart: false,
      formData: {
        order_id: "",
        customer_id: "",
        stock_datas: "",
        delivery_location: "",
        delivery_vehicle: "",
        delivery_bill_amount: "",
        delivery_amount: "100.00",
        paymentstatus: "",
        delivery_status: "",
        delivery_agent: "",
        delivery_rider_location: "",
        order_date: "",
      },
      formDateData: {
          staff_id: "",
          deliver_date: "",
      },
      editOrder: false,
      parsedLocation: null,
      parsedStock: [], // editable array of stock items
      showedit:true
    };
  }

  componentDidMount() {
    this.fetchOrder();
     this.fetchCustomer();
  }

 

  async fetchOrder() {
  try {
    const res = await fetch(url + "/wp-json/taxer/v1/getorderbyagent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentname: this.props.username }) // pass the prop `username`
    });

    const data = await res.json();

    if (data.order && Array.isArray(data.order)) {
      this.setState({ 
        order: data.order,
        butonshow: true 
      });
    }
  } catch (err) {
    console.error("Failed to fetch order", err);
  }
}


  async fetchCustomer() {
  try {
    const res = await fetch(url + "/wp-json/taxer/v1/getcustomer");
    const data = await res.json();
    if (data.customers && Array.isArray(data.customers)) {
      this.setState({ customers: data.customers });
    }
  } catch (err) {
    console.error("Failed to fetch customer", err);
  }
}


getCustomerById = (customer_id) => {
  const { customers } = this.state;
  return customers.find(
    (c) => String(c.customer_id) === String(customer_id)
  );
};


    async fetchOrdercom() {
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/getorderfull");
      const data = await res.json();
      if (data.order && Array.isArray(data.order)) {
        this.setState({ order: data.order });

         this.setState({ butonshow: false });
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
    }
  }

  handleEdit = (order) => {
    this.setState({ ajaxstatus: "" });

    let loc = null;
    try {
      loc = JSON.parse(order.delivery_location);
    } catch (err) {
      console.error("Invalid delivery_location JSON", err);
    }

    let stockItems = [];
    try {
      stockItems = order.stock_datas ? JSON.parse(order.stock_datas) : [];
    } catch (err) {
      console.error("Invalid stock_datas JSON", err);
      stockItems = [];
    }

    this.setState({
      editOrder: true,
      formData: {
        order_id: order.order_id,
        customer_id: order.customer_id,
        stock_datas: order.stock_datas,
        delivery_location: order.delivery_location, // keep as string
        paymentstatus: order.paymentstatus,
        delivery_status: order.delivery_status,
        delivery_agent: order.delivery_agent,
        delivery_vehicle: order.delivery_vehicle,
        delivery_bill_amount: order.delivery_bill_amount,
        delivery_amount: order.delivery_amount,
        delivery_rider_location: order.delivery_rider_location,
        order_date: order.order_date,
      },
      parsedLocation: loc,
      parsedStock: stockItems,
    });
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        [name]: value,
      },
    }));

    this.handleUpdate();
  };


  handleChangeOrderDate = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formDateData: {
        ...prevState.formDateData,
        [name]: value,
      },
    }));
  };

  // Update a single stock item's field (price, quantity, or bagged), then
  // re-sync the whole parsedStock array back into formData.stock_datas
  // as a JSON string, so it's ready to send on Update.
  handleStockItemChange = (index, field, value) => {
    this.setState((prevState) => {
      const updatedStock = [...prevState.parsedStock];
      updatedStock[index] = {
        ...updatedStock[index],
        [field]: value,
      };

      return {
        parsedStock: updatedStock,
        formData: {
          ...prevState.formData,
          stock_datas: JSON.stringify(updatedStock),
        },
      };
    });

    this.handleUpdate();
  };

  handleClose = () => {
    this.setState({ editOrder: false });

    this.setState({ orderdatecolumn: false });
  };




 handleUpdate = async () => {
  this.setState({ ajaxstatus: "Editing.... " });

  const { formData, parsedStock } = this.state;

  // Rebuild stock_datas fresh from the current parsedStock array,
  // so whatever is shown in the table right now is guaranteed to be sent —
  // instead of relying on formData.stock_datas being kept in sync elsewhere.
  const payload = {
    ...formData,
    stock_datas: JSON.stringify(parsedStock),
  };

  try {
    const res = await fetch(url + "/wp-json/taxer/v1/webupdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // includes freshly-synced stock_datas
    });

    const data = await res.json();

    if (data.success) {
      this.setState({
        ajaxstatus: "Order updated successfully!",
        editOrder: true,
      });
      this.fetchOrder();
    } else {
      this.setState({ ajaxstatus: "Failed to update order: " + data.message });
    }
  } catch (err) {
    console.error("Error updating order:", err);
    alert("Error updating order. Please try again.");
  }
};


handleUpdateOrderDate = async () => {
  this.setState({ ajaxstatus: "Editing.... " });

  const { formDateData } = this.state;

  // Rebuild stock_datas fresh from the current parsedStock array,
  // so whatever is shown in the table right now is guaranteed to be sent —
  // instead of relying on formData.stock_datas being kept in sync elsewhere.
  const payload = {
    datepayload: JSON.stringify(formDateData),
  };

  try {
    const res = await fetch(url + "/wp-json/taxer/v1/orderdateupdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // includes freshly-synced stock_datas
    });

    const data = await res.json();

    if (data.success) {
      this.setState({
        ajaxstatus: "Order Date updated successfully!",
        
      });
      this.fetchOrder();
    } else {
      this.setState({ ajaxstatus: "Failed to update order: " + data.message });
    }
  } catch (err) {
    console.error("Error updating order:", err);
    alert("Error updating order. Please try again.");
  }
};

async fetchDeliverDates() {
  try {
    const res = await fetch(url + "/wp-json/taxer/v1/getdeliverdate");
    const data = await res.json();
    if (data.success) {
      this.setState({ deliverDates: data.dates });
    }
  } catch (err) {
    console.error("Failed to fetch deliver dates", err);
  }
}


 SetOrder = () => {
     

    this.fetchDeliverDates();
      this.setState({ orderdatecolumn: true });




  };

fixdel = () => {
  this.setState((prevState) => ({
    formData: {
      ...prevState.formData,
      delivery_bill_amount: this.getStockTotal().toFixed(2),
    },
  }));
};

handleDeleteDate = async (deliver_date_id) => {
  if (!window.confirm("Are you sure you want to delete this date?")) {
    return;
  }

  try {
    const res = await fetch(url + "/wp-json/taxer/v1/deletedeldate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deliver_date_id }),
    });

    const data = await res.json();

    if (data.success) {
      // Remove the deleted row locally so the table updates immediately
      this.setState((prevState) => ({
        deliverDates: prevState.deliverDates.filter(
          (d) => d.deliver_date_id !== deliver_date_id
        ),
        ajaxstatus: "Date deleted successfully!",
      }));
    } else {
      this.setState({ ajaxstatus: "Failed to delete date: " + data.message });
    }
  } catch (err) {
    console.error("Error deleting date:", err);
    alert("Error deleting date. Please try again.");
  }
};


  handleRefresh = () => {
    this.fetchOrder().then(() => {
      const updatedOrder = this.state.order.find(
        (o) => o.order_id === this.state.formData.order_id
      );
      if (updatedOrder) {
        this.handleEdit(updatedOrder);
      }
    });
  };

  getStockTotal = () => {
  const { parsedStock } = this.state;
  if (!parsedStock || parsedStock.length === 0) return 0;

  return parsedStock.reduce((sum, item) => {
    const qty = parseFloat(item.stocks_total) || 0;
    const price = parseFloat(item.stocks_price) || 0;
    return sum + qty * price;
  }, 0);


};

  render() {
    const { order, formData, editOrder, ajaxstatus, parsedStock, butonshow,  orderdatecolumn, formDateData } = this.state;

    let tqer=formData.delivery_amount;

  if(tqer=="NOTASSIGNED"){

    tqer="100.00";

  }else{

    

  }

    return (
      <div className="order mobwidth">
        <h2>Rajmohan N R</h2>
        <h3>Senior Application Test Engineer(Shopvath LLC)</h3>
        

 <div className="profile">
      <img 
        src="https://wordpress-kuyu3.wasmer.app/wp-content/themes/rajmohan/images/profile.png" 
        alt="Profile" 
         
      />
    </div>

      <div className="hide" >
        {butonshow ? (
        <a
        className="completed-order orcomm btn-update"
        onClick={() => this.fetchOrdercom()}
        >
        Show Completed
        </a>
        ) : (
        <a
        className="completed-pend orcomm btn-update"
        onClick={() => this.fetchOrder()}
        >
        Show Pending
        </a>
        )}

        <a
        className="set-date btn-update"
        onClick={() => this.SetOrder()}
        >
        Set Dates
        </a>
 </div>
        {orderdatecolumn && (  <div className="modal-overlay">
            <div className="modal-box modalpos"> 
              <h2>Delivery Date Setting</h2>
              <p>
              Add Date  :{" "}
              <input
              type="date"
              name="deliver_date"
              value={formDateData.deliver_date || ""}
              onChange={this.handleChangeOrderDate}
              />
              </p>

              <p>
              Add Staff  :{" "}
              <input
              type="text"
              name="staff_id"
              value={formDateData.staff_id || ""}
              onChange={this.handleChangeOrderDate}
              />
              </p>


              <button className="btn-cancel" onClick={this.handleUpdateOrderDate}>
                  SET ORDER DATE
                </button>

               <button className="btn-cancel" onClick={this.handleClose}>
                  Cancel
                </button>
         

                <table>
  <thead>
    <tr>
      <th>Delivery Date</th>
      <th>Staff ID</th>
      <th>Delete</th>
    </tr>
  </thead>
  <tbody>
    {this.state.deliverDates && this.state.deliverDates.length > 0 ? (
      this.state.deliverDates.map((d) => (
        <tr key={d.deliver_date_id}>
          <td>{d.deliver_date}</td>
          <td>{d.staff_id}</td>
          <td>
            <button
              className="btn-cancel"
              onClick={() => this.handleDeleteDate(d.deliver_date_id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="2">No dates set</td>
      </tr>
    )}
  </tbody>
</table>

                </div>
                </div>
               )}

        <div className="table-responsive">
        <table className="order-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Location</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {order.length === 0 ? (
              <tr>
                <td colSpan="7">Engineering Team Field Tests:MObile Delivery Issues</td>
              </tr>
            ) : (
              order.map((t) => {
                let loc = null;
                try {
                  loc = JSON.parse(t.delivery_location);
                } catch (err) {
                  console.error("Invalid delivery_location JSON", err);
                }

                 const customer = this.getCustomerById(t.customer_id);

                return (
                  <tr key={t.order_id}>
                    <td>{t.order_id}</td>
                    <td>
                      {loc && loc.mapUrl ? (
                        <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer">
                          Customer Location
                        </a>
                      ) : (
                        <span>Location not available</span>
                      )}
                    </td>
                    <td>{t.paymentstatus}</td>
                    <td>{t.delivery_status}</td>


<td>
  {customer ? (
    <>
      {customer.customer_name}
      <br />
      <a href={`tel:${customer.customer_phone}`}>
        {customer.customer_phone}
      </a>
      {" | "}
      <a href={`https://wa.me/${customer.customer_phone}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
    </>
  ) : (
    "Unknown"
  )}
</td>

                    <td>{t.order_date}</td>
                    <td>
                      <button className="btn-update" onClick={() => this.handleEdit(t)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {editOrder && (

          <div className="popup">
          <div className="modal-overlay">
            <div className="modal-box modalpos">
              <h2>ORDER ID : {formData.order_id}</h2>

              {parsedStock && parsedStock.length > 0 && (
                <div className="stock-items-box">
                  <h3>Items (editable)</h3>
                 <table className="stock-table">
  <thead>
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Unit</th>
      <th>Price</th>
      <th>Bagged</th>
    </tr>
  </thead>
  <tbody>
    {parsedStock.map((item, index) => (
      <tr key={item.stocks_id || index}>
        <td>{item.stocks_name}</td>
        <td>
          <input
            type="number"
            className="stock-input"
            value={item.stocks_total || ""}
            onChange={(e) =>
              this.handleStockItemChange(index, "stocks_total", e.target.value)
            }
          />
        </td>
        <td>{item.stocks_unit}</td>
        <td>
          <input
            type="number"
            step="0.01"
            className="stock-input"
            value={item.stocks_price || ""}
            onChange={(e) =>
              this.handleStockItemChange(index, "stocks_price", e.target.value)
            }
          />
        </td>
        <td style={{ textAlign: "center" }}>
          <input
            type="checkbox"
            className="stock-checkbox"
            checked={!!item.stocks_bagged}
            onChange={(e) =>
              this.handleStockItemChange(index, "stocks_bagged", e.target.checked)
            }
          />
        </td>
      </tr>
    ))}
  </tbody>
  <tfoot onClick={this.fixdel}  >
    <tr className="stock-total-row">
      <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>
        Total Bill Amount:
      </td>
      <td style={{ fontWeight: "bold" }}>₹{this.getStockTotal().toFixed(2)}  (click here to copy)</td>
    </tr>
  </tfoot>
</table>
                </div>
              )}

              {this.state.parsedLocation && this.state.parsedLocation.mapUrl && (


                
                <a  href={this.state.parsedLocation.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Customer Location
                </a>
              )}

              <label>Payment Status</label>
              <select
              name="paymentstatus"
              value={formData.paymentstatus || ""}
              onChange={this.handleChange}
              disabled={formData.paymentstatus === "PAID"}   // disable if PAID
              >
              <option value="NOTPAID">NOTPAID</option>
              <option value="PAID">PAID</option>
              </select>

              <label>Delivery Status</label>
              <select
                name="delivery_status"
                value={formData.delivery_status || ""}
                onChange={this.handleChange}
              >
                <option value="NOTSTARTED">NOTSTARTED</option>
                <option value="STARTED">STARTED</option>
                <option value="REACHED SHOP PURCHASE">REACHED SHOP PURCHASE</option>
                <option value="SHOP PURCHASE COMPLETED">SHOP PURCHASE COMPLETED</option>
                <option value="BILLING">BILLING</option>
                <option value="BILLING DONE">BILLING DONE</option>
                <option value="WAITING CUSTOMER TO GPAY THE BILL">
                  WAITING CUSTOMER TO PAY - GPAY
                </option>
                <option value="EXITED FROM SHOP TO CUSTOMER">EXITED FROM SHOP TO CUSTOMER</option>
                <option value="REACHED CUSTOMER LOCATION">REACHED CUSTOMER LOCATION</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              <label>Delivery Agent</label>
              <input
                name="delivery_agent"
                value={formData.delivery_agent || ""}
                onChange={this.handleChange}
              />

              <label>Delivery Vehicle</label>
              <select
                name="delivery_vehicle"
                value={formData.delivery_vehicle || ""}
                onChange={this.handleChange}
              >
                <option value="NOTASSIGNED">NOTASSIGNED</option>
                <option value="CAR">CAR</option>
                <option value="PETROL-BIKE">PETROL-BIKE</option>
              </select>

              <label>Delivery BILL Amount</label>
                <input
                name="delivery_bill_amount"
                value={formData.delivery_bill_amount || ""}
               onChange={this.handleChange}
                />

              <label>Delivery Amount</label>
              <input
                name="delivery_amount"
                value={tqer || ""}
                onChange={this.handleChange}
              />

              <label>Delivery Rider Current Location</label>
              <input
                name="delivery_rider_location"
                value={formData.delivery_rider_location || ""}
                onChange={this.handleChange}
              />

              <label>Date</label>
              <input
                name="order_date"
                type="date"
                className="table-input"
                value={formData.order_date}
                readOnly
              />

              {ajaxstatus && <h3>{ajaxstatus}</h3>}

              <div className="modal-buttons">
                <button className="btn-update" onClick={this.handleUpdate}>
                  Update
                </button>

                <button className="btn-cancel" onClick={this.handleRefresh}>
                  Refresh
                </button>

                <button className="btn-cancel" onClick={this.handleClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>

          </div>
        )}
      </div>
    );
  }
}

export default Order;  