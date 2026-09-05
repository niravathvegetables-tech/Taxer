import React from 'react';
import url from './Config';

class Customer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Customer",
      customer: [],
      error: null,
      loading: true,
      currentPage: 1,
      pageSize: 5,
    };
  }

  componentDidMount() {
    this.fetchCustomer();
  }

  async fetchCustomer() {
    try {
      const res = await fetch(url + `/wp-json/taxer/v1/getcustomer`);
      const data = await res.json();
      console.log(data);

      let customer = [];
      if (data.customers) {
        customer = Array.isArray(data.customers) ? data.customers : [data.customers];
      }

      this.setState({ customer: customer, loading: false });
    } catch (err) {
      this.setState({ error: 'Failed to connect to WordPress', loading: false });
    }
  }

  parseLocation(locStr) {
    if (!locStr || locStr === "0") return null;
    try {
      return JSON.parse(locStr);
    } catch (e) {
      return null;
    }
  }

  goToPage = (page) => {
    this.setState({ currentPage: page });
  };

  goPrev = () => {
    this.setState((prev) => ({ currentPage: Math.max(1, prev.currentPage - 1) }));
  };

  goNext = (totalPages) => {
    this.setState((prev) => ({ currentPage: Math.min(totalPages, prev.currentPage + 1) }));
  };

  render() {
    const { customer, error, loading, currentPage, pageSize } = this.state;

    const totalPages = Math.max(1, Math.ceil(customer.length / pageSize));
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = customer.slice(startIdx, startIdx + pageSize);

    return (
      <div className="customer mobwidth">
        <h2>Welcome to Customer</h2>

        {loading && <p>Loading customers...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table border="1" cellPadding="8" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Location</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((c) => {
                      const loc = this.parseLocation(c.customer_location);
                      return (
                        <tr key={c.customer_id}>
                          <td>{c.customer_id}</td>
                          <td>{c.customer_name}</td>
                         <td><a href={`tel:${c.customer_phone}`}>{c.customer_phone}</a></td>
                          <td>{c.customer_address}</td>
                          <td>
                            {loc ? (
                              <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer">
                                {loc.latitude}, {loc.longitude}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{c.customer_date}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {customer.length > 0 && (
              <div
                className="pagination"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginTop: "16px",
                  flexWrap: "wrap",
                }}
              >
                <button onClick={this.goPrev} disabled={currentPage === 1}>
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => this.goToPage(page)}
                    style={{
                      fontWeight: page === currentPage ? "bold" : "normal",
                      textDecoration: page === currentPage ? "underline" : "none",
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button onClick={() => this.goNext(totalPages)} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            )}

            <p style={{ textAlign: "center", marginTop: "8px", fontSize: "0.9em", color: "#666" }}>
              Page {currentPage} of {totalPages} ({customer.length} total customers)
            </p>
          </>
        )}
      </div>
    );
  }
}

export default Customer;