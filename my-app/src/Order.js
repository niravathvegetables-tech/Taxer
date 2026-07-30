import React from "react";
import url from "./Config";

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Order",
      order: [],
      ajaxstatus:"",
      date: new Date().toISOString().split("T")[0],
      updating: false,
      deletestart: false,
      formData: {
        order_id: "",
        customer_id: "",
        delivery_location: "",
        paymentstatus: "",
        delivery_status: "",
        delivery_agent: "",
        order_date: "",
      },
      editOrder: false,
    };
  }

  componentDidMount() {
    this.fetchOrder();
  }

  async fetchOrder() {
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/getorder");
      const data = await res.json();
      if (data.order && Array.isArray(data.order)) {
        this.setState({ order: data.order });
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
    }
  }

  handleEdit = (order) => {


  	this.setState({ ajaxstatus: ""   });

    let loc = null;
    try {
      loc = JSON.parse(order.delivery_location);
    } catch (err) {
      console.error("Invalid delivery_location JSON", err);
    }

    this.setState({
      editOrder: true,
      formData: {
        order_id: order.order_id,
        customer_id: order.customer_id,
        delivery_location: loc,
        paymentstatus: order.paymentstatus,
        delivery_status: order.delivery_status,
        delivery_agent: order.delivery_agent,
        order_date: order.order_date,
      },
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
  };

  handleClose = () => {
    this.setState({ editOrder: false });
  };

  handleUpdate = async () => {

  	  this.setState({ ajaxstatus: "Editing.... "   });

  const { formData } = this.state;

  try {
    const res = await fetch(url + "/wp-json/taxer/v1/webupdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData), // send the updated order data
    });

    const data = await res.json();

    if (data.success) {
			this.setState({
			ajaxstatus: "Order updated successfully!", // set message here
			editOrder: false,
			});
      this.fetchOrder();

      // Close modal
      
    } else {
      

      this.setState({ ajaxstatus: "Failed to update order: " + data.message });
    }
  } catch (err) {
    console.error("Error updating order:", err);
    alert("Error updating order. Please try again.");
  }
};


  render() {
    const { order, formData, editOrder, ajaxstatus  } = this.state;

    return (
      <div className="order mobwidth">
        <h2>Welcome to Order</h2>

        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Delivery Location</th>
              <th>Payment Status</th>
              <th>Delivery Status</th>
              <th>Delivery Agent</th>
              <th>Date</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {order.length === 0 ? (
              <tr>
                <td colSpan="7">No order records found</td>
              </tr>
            ) : (
              order.map((t) => {
                let loc = null;
                try {
                  loc = JSON.parse(t.delivery_location);
                } catch (err) {
                  console.error("Invalid delivery_location JSON", err);
                }

                return (
                  <tr key={t.order_id}>
                    <td>{t.order_id}</td>
                    <td>
                      {loc && loc.mapUrl ? (
                        <a
                          href={loc.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Customer Location
                        </a>
                      ) : (
                        <span>Location not available</span>
                      )}
                    </td>
                    <td>{t.paymentstatus}</td>
                    <td>{t.delivery_status}</td>
                    <td>{t.delivery_agent}</td>
                    <td>{t.order_date}</td>
                    <td>
                      <button
                        className="btn-update"
                        onClick={() => this.handleEdit(t)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {editOrder && (
          <div className="modal-overlay">
            <div className="modal-box modalpos">
              <h2>ORDER ID : {formData.order_id}</h2>

								{ajaxstatus && (
								<h3>{ajaxstatus}</h3>
								)}


              {formData.delivery_location && formData.delivery_location.mapUrl && (
                <a
                  href={formData.delivery_location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Customer Location
                </a>
              )}

              <label>Payment Status</label>
              <input
                name="paymentstatus"
                value={formData.paymentstatus || ""}
                onChange={this.handleChange}
              />

              <label>Delivery Status</label>
              <input
                name="delivery_status"
                value={formData.delivery_status || ""}
                onChange={this.handleChange}
              />

               <label>Delivery Agent</label>
              <input
                name="delivery_agent"
                value={formData.delivery_agent || ""}
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

              <div className="modal-buttons">
                <button className="btn-update" onClick={this.handleUpdate}>
                  Update
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

export default Order;
