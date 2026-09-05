import React from 'react';
import url from './Config';

class Riders extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Riders",
      riders: [],
      error: null,
      loading: true,
      updatingId: null,
      currentPage: 1,
      pageSize: 5,
    };
  }

  componentDidMount() {
    this.fetchRiders();
  }

  async fetchRiders() {
    try {
      const res = await fetch(url + `/wp-json/taxer/v1/getriders`);
      const data = await res.json();
      console.log(data);

      let riders = [];
      if (data.riders) {
        riders = Array.isArray(data.riders) ? data.riders : [data.riders];
      }

      this.setState({ riders: riders, loading: false });
    } catch (err) {
      this.setState({ error: 'Failed to connect to WordPress', loading: false });
    }
  }

  async updateStatus(id, status) {
    this.setState({ updatingId: id });
    try {
      const res = await fetch(url + `/wp-json/taxer/v1/updateriderstatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();

      if (data.success) {
        this.setState((prev) => ({
          riders: prev.riders.map((r) =>
            r.deliver_rider_id === id ? { ...r, delivery_rider_status: status } : r
          ),
        }));
      } else {
        alert(data.message || 'Failed to update rider status.');
      }
    } catch (err) {
      alert('Failed to connect to WordPress');
    } finally {
      this.setState({ updatingId: null });
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

  statusBadgeStyle(status) {
    const colors = {
      approved: { color: '#0a7d29', fontWeight: 'bold' },
      pending: { color: '#b8860b', fontWeight: 'bold' },
      blocked: { color: '#b00020', fontWeight: 'bold' },
    };
    return colors[status] || {};
  }

  render() {
    const { riders, error, loading, currentPage, pageSize, updatingId } = this.state;

    const totalPages = Math.max(1, Math.ceil(riders.length / pageSize));
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = riders.slice(startIdx, startIdx + pageSize);

    return (
      <div className="riders mobwidth">
        <h2>Welcome to Riders</h2>

        {loading && <p>Loading riders...</p>}
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
                    <th>Email</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        No riders found
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((r) => {
                      const isUpdating = updatingId === r.deliver_rider_id;
                      return (
                        <tr key={r.deliver_rider_id}>
                          <td>{r.deliver_rider_id}</td>
                          <td>{r.delivery_rider_name}</td>
                          <td><a href={`tel:${r.delivery_rider_phone}`}>{r.delivery_rider_phone}</a></td>
                          <td>{r.delivery_rider_email}</td>
                          <td style={this.statusBadgeStyle(r.delivery_rider_status)}>
                            {r.delivery_rider_status}
                          </td>
                          <td>{r.deliver_rider_date}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {r.delivery_rider_status !== 'approved' && (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => this.updateStatus(r.deliver_rider_id, 'approved')}
                                >
                                  {isUpdating ? '...' : 'Approve'}
                                </button>
                              )}
                              {r.delivery_rider_status !== 'blocked' && (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => this.updateStatus(r.deliver_rider_id, 'blocked')}
                                >
                                  {isUpdating ? '...' : 'Deactivate'}
                                </button>
                              )}
                              {r.delivery_rider_status === 'blocked' && (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => this.updateStatus(r.deliver_rider_id, 'approved')}
                                >
                                  {isUpdating ? '...' : 'Reactivate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {riders.length > 0 && (
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
              Page {currentPage} of {totalPages} ({riders.length} total riders)
            </p>
          </>
        )}
      </div>
    );
  }
}

export default Riders;