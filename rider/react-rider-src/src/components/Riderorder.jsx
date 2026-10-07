import React from "react";
import ReactDOM from "react-dom";
import url from "./Config";

// Today's date as YYYY-MM-DD in the device's LOCAL time.
// (toISOString() is UTC, so in India it returns yesterday until 5:30 AM.)
const localToday = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const EMPTY_FORM = {
  ekart_order: "NC",
  ekart_arrangement: "",
  ekart_location: "",
  ekart_type: "DELIVERY PREPAID",
  ekart_status: "PENDING",
  ekart_date: localToday(),
};

const EKART_TYPES = ["DELIVERY PREPAID","DELIVERY COD", "PICKUP", "RETURN"];
const EKART_STATUSES = ["PENDING", "ARRANGED", "OUT FOR DELIVERY", "DELIVERED", "CANCELLED"];
const EKART_ORDER_OPTIONS = ["NC", "COK", "CRN"];

const FIELDX_PACKAGE = "com.ekart.logistics.app";
const FIELDX_WEB_URL =
  "https://play.google.com/store/apps/details?id=com.ekart.logistics.app";

const FIELDX_INTENT_URL =
  `intent://#Intent;package=${FIELDX_PACKAGE};` +
  `S.browser_fallback_url=${encodeURIComponent(FIELDX_WEB_URL)};end`;

// ---------- Status colours & summary ----------

const RATE_PER_DELIVERY = 17; // ₹ earned per delivered order

const STATUS_COLORS = {
  DELIVERED: "#c8e6c9", // green
  PENDING: "#ffcdd2",   // red
  CANCELLED: "#d7ccc8", // brown
};

const EMPTY_STATS = { DELIVERED: 0, PENDING: 0, CANCELLED: 0, NC: 0, COK: 0, CRN: 0 };

function countStats(list) {
  const s = { ...EMPTY_STATS };
  list.forEach((o) => {
    if (s[o.ekart_status] !== undefined) s[o.ekart_status]++;
    if (s[o.ekart_order] !== undefined) s[o.ekart_order]++;
  });
  return s;
}

// ---------- Distance helpers ----------

const toRad = (d) => (d * Math.PI) / 180;

// Straight-line distance between two {lat, lng} points, in km (haversine)
function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Reads "10.151939, 76.447582" (also works for map links containing lat,lng)
function parseLatLng(text) {
  if (!text) return null;
  const m = String(text).match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// Google Maps link for a point. On phones this opens the Maps app.
const mapLink = ({ lat, lng }) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

// Turn-by-turn navigation from the rider's current position to the point
// (use this instead of mapLink if you want the tap to start directions)
// eslint-disable-next-line no-unused-vars
const directionsLink = ({ lat, lng }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

function getCurrentPosition() {
  const ask = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy, // metres
          }),
        reject,
        options
      );
    });

  if (!navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not supported on this device."));
  }

  // 1st try: GPS (accurate). If it times out / fails, 2nd try: network location.
  return ask({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }).catch((err) => {
    if (err && err.code === 1) throw err; // permission denied - don't retry
    return ask({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  });
}

// lat/lng -> readable address (OpenStreetMap Nominatim, free, no API key)
async function reverseGeocode({ lat, lng }) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`
  );
  if (!res.ok) throw new Error("Address service not reachable.");
  const data = await res.json();
  if (!data || data.error || !data.display_name) throw new Error("No address found for this point.");
  return data.display_name;
}

// Nearest first, farthest last. Orders without valid coordinates go to the end.
function sortByDistance(orders, origin) {
  if (!origin) return orders;
  return orders
    .map((o) => {
      const p = parseLatLng(o.ekart_location);
      return { ...o, _distance: p ? distanceKm(origin, p) : null };
    })
    .sort((a, b) => {
      if (a._distance === null && b._distance === null) return 0;
      if (a._distance === null) return 1;
      if (b._distance === null) return -1;
      return a._distance - b._distance;
    });
}

// ---------- Travel time helpers ----------

// Real road time/distance from the rider to every order in ONE request.
// Uses the free public OSRM server (no API key). Returns { [ekart_id]: { sec, km } }
async function fetchRoadInfo(origin, orders) {
  const items = orders
    .map((o) => ({ id: o.ekart_id, p: parseLatLng(o.ekart_location) }))
    .filter((x) => x.p)
    .slice(0, 99); // public server allows about 100 points per request

  if (items.length === 0) return {};

  const coords = [origin, ...items.map((x) => x.p)]
    .map((c) => `${c.lng},${c.lat}`)
    .join(";");

  const res = await fetch(
    `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=duration,distance`
  );
  if (!res.ok) throw new Error("Route service not reachable.");
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route service error.");

  const out = {};
  items.forEach((x, i) => {
    const sec = data.durations && data.durations[0][i + 1];
    const m = data.distances && data.distances[0][i + 1];
    if (sec !== null && sec !== undefined) {
      out[x.id] = { sec, km: m !== null && m !== undefined ? m / 1000 : null };
    }
  });
  return out;
}

// Fallback when the route service is down: straight-line x 1.3 road factor,
// at an average two-wheeler speed of 25 km/h in town.
const estimateSeconds = (straightKm) => ((straightKm * 1.3) / 25) * 3600;

function formatDuration(sec) {
  if (sec === null || sec === undefined) return "—";
  const min = Math.round(sec / 60);
  if (min < 1) return "<1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatKm(km) {
  if (km === null || km === undefined) return "—";
  return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(2) + " km";
}

// ---------- Reroute (trip chain) helpers ----------

// Nearest-neighbour chain: first stop = closest to the rider, every next stop =
// closest to the PREVIOUS stop (not to the rider). Orders without a valid
// location go to the end. Adds _stop (1,2,3…), _legKm (from previous stop)
// and _distance (from the rider, for reference).
function chainByNearest(orders, origin) {
  const withPos = orders.map((o) => ({ o, p: parseLatLng(o.ekart_location) }));
  const remaining = withPos.filter((x) => x.p);
  const noLoc = withPos.filter((x) => !x.p);

  const result = [];
  let current = origin;
  while (remaining.length) {
    let best = 0;
    let bestKm = Infinity;
    remaining.forEach((x, i) => {
      const d = distanceKm(current, x.p);
      if (d < bestKm) {
        bestKm = d;
        best = i;
      }
    });
    const [next] = remaining.splice(best, 1);
    result.push({
      ...next.o,
      _stop: result.length + 1,
      _legKm: bestKm,
      _distance: distanceKm(origin, next.p),
    });
    current = next.p;
  }

  return [
    ...result,
    ...noLoc.map((x) => ({ ...x.o, _stop: null, _legKm: null, _distance: null })),
  ];
}

// Road time/distance for each LEG of the chain (rider -> stop 1 -> stop 2 …)
// in ONE request to the public OSRM route service. Returns { [ekart_id]: { sec, km } }
async function fetchLegInfo(origin, orders) {
  const stops = orders.filter((o) => o._stop).slice(0, 99);
  if (stops.length === 0) return {};

  const coords = [origin, ...stops.map((o) => parseLatLng(o.ekart_location))]
    .map((c) => `${c.lng},${c.lat}`)
    .join(";");

  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`
  );
  if (!res.ok) throw new Error("Route service not reachable.");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes || !data.routes[0]) {
    throw new Error("Route service error.");
  }

  const out = {};
  data.routes[0].legs.forEach((leg, i) => {
    if (stops[i]) out[stops[i].ekart_id] = { sec: leg.duration, km: leg.distance / 1000 };
  });
  return out;
}

class RiderOrder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ekartOrders: [],
      formData: { ...EMPTY_FORM },
      editingId: null, // null = adding new, number = editing existing
      showForm: false,
      saving: false,
      loading: false,
      status: "",
      currentPos: null, // rider's latest {lat, lng}
      todayOnly: false, // true after Refresh: show only today's pending orders
      todayAll: false, // true after Today: show ALL of today's orders (every status)
      reroute: false, // true after Reroute: today's pending orders chained stop to stop
      customerPool: [], // unique customer name & address texts from ALL saved orders
      showSuggest: false, // suggestion list under the customer field
      locChecking: false, // verifying pasted location
      locAddress: "", // address found for the pasted lat/lng
      locError: "",
      searchText: "", // customer name / address search
      orderFilter: "ALL", // ALL | NC | COK | CRN
      typeFilter: "ALL", // ALL | DELIVERY PREPAID | DELIVERY COD | PICKUP | RETURN
      statusFilter: "ALL", // ALL | PENDING | ARRANGED | OUT FOR DELIVERY | DELIVERED | CANCELLED
      stats: { ...EMPTY_STATS }, // ribbon counts
    };
  }

  componentDidMount() {
    this.fetchEkartOrders();
  }

  // ---------- API ----------

  fetchEkartOrders = async (
    origin = this.state.currentPos,
    todayOnly = this.state.todayOnly,
    todayAll = this.state.todayAll,
    reroute = this.state.reroute
  ) => {
    this.setState({ loading: true });
    try {
      const res = await fetch(url + "/wp-json/taxer/v1/getekartorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rider_phone: this.props.phone }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        let list = data.orders;

        // Pool of existing customer name & address texts, for the suggestions
        const seen = new Set();
        const pool = [];
        data.orders.forEach((o) => {
          const name = String(o.ekart_arrangement || "").trim();
          const key = name.toLowerCase();
          if (name && !seen.has(key)) {
            seen.add(key);
            pool.push(name);
          }
        });
        this.setState({ customerPool: pool });

        // Ribbon counts: today's orders (all statuses) in Refresh / Today / Reroute mode, otherwise everything
        const today = localToday();
        const scope =
          todayOnly || todayAll || reroute
            ? list.filter((o) => String(o.ekart_date).slice(0, 10) === today)
            : list;
        this.setState({ stats: countStats(scope) });

        if (reroute) {
          // Reroute button: only today's PENDING orders
          list = scope.filter((o) => o.ekart_status === "PENDING");
        } else if (todayAll) {
          // Today button: every order of today, all statuses
          list = scope;
        } else if (todayOnly) {
          // Refresh button: only today's pending orders
          list = scope.filter(
            (o) => !["DELIVERED", "CANCELLED"].includes(o.ekart_status)
          );
        }

        // Reroute: chain stop to stop. Otherwise: nearest first, farthest last
        const sorted =
          reroute && origin ? chainByNearest(list, origin) : sortByDistance(list, origin);
        this.setState({ ekartOrders: sorted });

        // Travel time is filled in afterwards so the list shows immediately
        if (origin) {
          if (reroute) this.attachLegTimes(sorted, origin);
          else this.attachTravelTimes(sorted, origin);
        }
        return sorted;
      }
    } catch (err) {
      console.error("Failed to fetch ekart orders", err);
      this.setState({ status: "Could not load ekart orders." });
    } finally {
      this.setState({ loading: false });
    }
    return null;
  };

  // Adds _roadSec (seconds) and _roadKm to each order. Falls back to an estimate.
  attachTravelTimes = async (orders, origin) => {
    let info = null;
    try {
      info = await fetchRoadInfo(origin, orders);
    } catch (err) {
      console.error("Road time failed, using estimate", err);
    }

    this.setState((prev) => ({
      ekartOrders: prev.ekartOrders.map((o) => {
        const r = info && info[o.ekart_id];
        if (r) return { ...o, _roadSec: r.sec, _roadKm: r.km, _etaEstimated: false };
        if (o._distance !== null && o._distance !== undefined) {
          return { ...o, _roadSec: estimateSeconds(o._distance), _roadKm: null, _etaEstimated: true };
        }
        return { ...o, _roadSec: null, _roadKm: null, _etaEstimated: false };
      }),
    }));
  };

  // Reroute: _roadSec / _roadKm are the road time / distance of each LEG
  // (from the previous stop), falling back to an estimate.
  attachLegTimes = async (orders, origin) => {
    let info = null;
    try {
      info = await fetchLegInfo(origin, orders);
    } catch (err) {
      console.error("Leg time failed, using estimate", err);
    }

    this.setState((prev) => ({
      ekartOrders: prev.ekartOrders.map((o) => {
        const r = info && info[o.ekart_id];
        if (r) return { ...o, _roadSec: r.sec, _roadKm: r.km, _etaEstimated: false };
        if (o._legKm !== null && o._legKm !== undefined) {
          return { ...o, _roadSec: estimateSeconds(o._legKm), _roadKm: null, _etaEstimated: true };
        }
        return { ...o, _roadSec: null, _roadKm: null, _etaEstimated: false };
      }),
    }));
  };

  // Refresh button: get the rider's current location, load TODAY's orders,
  // compare each order's lat/long with the rider, list nearest -> farthest.
  handleRefreshTrip = async () => {
    this.setState({ loading: true, status: "Getting your current location…" });

    try {
      const pos = await getCurrentPosition();
      this.setState({ currentPos: pos, todayOnly: true, todayAll: false, reroute: false });
      await this.fetchEkartOrders(pos, true, false, false);

      const approx =
        pos.accuracy > 1000
          ? ` Location is only approximate (±${Math.round(pos.accuracy)} m) – use a phone with GPS for correct order.`
          : "";
      this.setState({
        status:
          `Today's orders sorted nearest to farthest from ` +
          `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}.` +
          approx,
      });
    } catch (err) {
      console.error("Location error", err);
      await this.fetchEkartOrders(null, true, false, false);
      this.setState({
        todayOnly: true,
        todayAll: false,
        reroute: false,
        status:
          err && err.code === 1
            ? "Location permission denied. Allow location access in the browser, then press Refresh again."
            : "Could not get your location (turn on GPS / location and try again). Orders are NOT sorted.",
      });
    }
  };

  // Reroute button: today's PENDING orders as a trip. Stop 1 = nearest to the rider,
  // stop 2 = nearest to stop 1, stop 3 = nearest to stop 2 … (not compared to the rider).
  handleReroute = async () => {
    this.setState({ loading: true, status: "Getting your current location…" });

    try {
      const pos = await getCurrentPosition();
      this.setState({ currentPos: pos, todayOnly: false, todayAll: false, reroute: true });
      const sorted = (await this.fetchEkartOrders(pos, false, false, true)) || [];

      const stops = sorted.filter((o) => o._stop);
      const totalKm = stops.reduce((sum, o) => sum + (o._legKm || 0), 0);
      const approx =
        pos.accuracy > 1000
          ? ` Location is only approximate (±${Math.round(pos.accuracy)} m).`
          : "";
      this.setState({
        status: stops.length
          ? `Trip route: ${stops.length} pending stop(s), about ${totalKm.toFixed(1)} km in straight lines. ` +
            `Each stop is the nearest to the previous one.` + approx
          : "No pending orders for today.",
      });
    } catch (err) {
      console.error("Location error", err);
      this.setState({
        loading: false,
        status:
          err && err.code === 1
            ? "Location permission denied. Allow location access in the browser, then press Reroute again."
            : "Could not get your location (turn on GPS / location and try again). Reroute needs your location.",
      });
    }
  };

  // Show every date again (unsorted, as saved)
  handleShowAll = async () => {
    this.setState({ todayOnly: false, todayAll: false, reroute: false, currentPos: null, status: "" });
    await this.fetchEkartOrders(null, false, false, false);
  };

  // Show ALL of today's orders (every status), nothing from previous days
  handleShowToday = async () => {
    this.setState({
      todayOnly: false,
      todayAll: true,
      reroute: false,
      status: "Showing all of today's orders.",
    });
    await this.fetchEkartOrders(this.state.currentPos, false, true, false);
  };

  handleSave = async () => {
    const { formData, editingId } = this.state;

    if (!formData.ekart_order.trim()) {
      this.setState({ status: "Ekart order is required." });
      return;
    }
    if (!formData.ekart_date) {
      this.setState({ status: "Ekart date is required." });
      return;
    }

    this.setState({ saving: true, status: "Saving…" });

    const endpoint = editingId ? "updateekartorder" : "addekartorder";
    const payload = {
      ...formData,
      rider_phone: this.props.phone,
      rider_name: this.props.username,
      ...(editingId ? { ekart_id: editingId } : {}),
    };

    try {
      const res = await fetch(url + "/wp-json/taxer/v1/" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        this.setState({
          status: editingId ? "Ekart order updated." : "Ekart order saved.",
          formData: { ...EMPTY_FORM },
          editingId: null,
          showForm: false,
          locAddress: "",
          locError: "",
        });
        this.fetchEkartOrders();
      } else {
        this.setState({ status: "Failed: " + (data.message || "Unknown error") });
      }
    } catch (err) {
      console.error("Error saving ekart order", err);
      this.setState({ status: "Error saving. Please try again." });
    } finally {
      this.setState({ saving: false });
    }
  };

  handleOpenFieldX = () => {
    const isAndroid = /android/i.test(navigator.userAgent);
    window.location.href = isAndroid ? FIELDX_INTENT_URL : FIELDX_WEB_URL;
  };

  handleDelete = async (ekart_id) => {
    if (!window.confirm("Delete this ekart order?")) return;

    try {
      const res = await fetch(url + "/wp-json/taxer/v1/deleteekartorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ekart_id, rider_phone: this.props.phone }),
      });
      const data = await res.json();

      if (data.success) {
        this.setState((prev) => ({
          ekartOrders: prev.ekartOrders.filter((o) => o.ekart_id !== ekart_id),
          status: "Ekart order deleted.",
        }));
        // Reload so the ribbon counts are updated too
        this.fetchEkartOrders();
      } else {
        this.setState({ status: "Failed to delete: " + (data.message || "") });
      }
    } catch (err) {
      console.error("Error deleting ekart order", err);
      this.setState({ status: "Error deleting. Please try again." });
    }
  };

  handleClearOldOrders = async () => {
    const body = (extra) =>
      JSON.stringify({
        rider_phone: this.props.phone,
        before_date: localToday(),
        ...extra,
      });
    const post = async (extra) => {
      const res = await fetch(url + "/wp-json/taxer/v1/clearoldekartorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body(extra),
      });
      return res.json();
    };

    this.setState({ loading: true, status: "Checking previous days' orders…" });

    try {
      const check = await post({ dry_run: true });
      if (!check.success) throw new Error(check.message);

      if (check.count === 0) {
        this.setState({ status: "No previous-day orders to clear." });
        return;
      }

      if (
        !window.confirm(
          `Delete ${check.count} order(s) from previous days?\nToday's orders will NOT be deleted.`
        )
      ) {
        this.setState({ status: "" });
        return;
      }

      const result = await post({});
      if (!result.success) throw new Error(result.message);

      this.setState({ status: `Cleared ${result.deleted} old order(s).` });
      await this.fetchEkartOrders();
    } catch (err) {
      console.error("Clear old orders failed", err);
      this.setState({ status: "Could not clear old orders. Please try again." });
    } finally {
      this.setState({ loading: false });
    }
  };

  // ---------- UI handlers ----------

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      formData: { ...prev.formData, [name]: value },
    }));
  };

  // ---------- Search / filter (works on already-loaded data, no API call) ----------

  handleSearchChange = (e) => this.setState({ searchText: e.target.value });

  handleOrderFilterChange = (e) => this.setState({ orderFilter: e.target.value });

  handleTypeFilterChange = (e) => this.setState({ typeFilter: e.target.value });

  handleStatusFilterChange = (e) => this.setState({ statusFilter: e.target.value });

  handleClearFilters = () =>
    this.setState({
      searchText: "",
      orderFilter: "ALL",
      typeFilter: "ALL",
      statusFilter: "ALL",
    });

  // Filters the already-loaded orders. The distance sort is kept because
  // filter() preserves the existing order.
  getVisibleOrders = () => {
    const { ekartOrders, searchText, orderFilter, typeFilter, statusFilter } = this.state;
    const q = searchText.trim().toLowerCase();

    return ekartOrders.filter((o) => {
      if (orderFilter !== "ALL" && o.ekart_order !== orderFilter) return false;
      if (typeFilter !== "ALL" && o.ekart_type !== typeFilter) return false;
      if (statusFilter !== "ALL" && o.ekart_status !== statusFilter) return false;
      if (q && !String(o.ekart_arrangement || "").toLowerCase().includes(q)) return false;
      return true;
    });
  };

  // ---------- Customer suggestions ----------

  handleArrangementChange = (e) => {
    const value = e.target.value;
    this.setState((prev) => ({
      formData: { ...prev.formData, ekart_arrangement: value },
      showSuggest: true,
    }));
  };

  // Up to 6 saved customers that contain what is typed (not an exact match already)
  getSuggestions = () => {
    const q = this.state.formData.ekart_arrangement.trim().toLowerCase();
    if (!q) return [];
    return this.state.customerPool
      .filter((n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
      .slice(0, 6);
  };

  pickSuggestion = (name) => {
    this.setState((prev) => ({
      formData: { ...prev.formData, ekart_arrangement: name },
      showSuggest: false,
    }));
  };

  lastPastedClip = ""; // remembers the last clipboard text we pasted

  handleLocationFocus = async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) return;

    try {
      const text = (await navigator.clipboard.readText()).trim();

      if (!parseLatLng(text)) return; // clipboard isn't a location
      if (text === this.lastPastedClip) return; // already pasted this one, so don't overwrite manual edits
      if (text === this.state.formData.ekart_location) return; // same as current value

      this.lastPastedClip = text;
      this.setState((prev) => ({
        formData: { ...prev.formData, ekart_location: text },
        locAddress: "",
        locError: "",
      }));
    } catch (err) {
      // Permission denied / not allowed: user can still paste manually
    }
  };

  handleLocationChange = (e) => {
    const value = e.target.value;
    this.setState((prev) => ({
      formData: { ...prev.formData, ekart_location: value },
      locAddress: "",
      locError: "",
    }));
  };

  handleVerifyLocation = async () => {
    const p = parseLatLng(this.state.formData.ekart_location);
    if (!p) return;

    this.setState({ locChecking: true, locAddress: "", locError: "" });
    try {
      const address = await reverseGeocode(p);
      this.setState({ locAddress: address });
    } catch (err) {
      this.setState({ locError: err.message || "Could not verify location." });
    } finally {
      this.setState({ locChecking: false });
    }
  };

  openAdd = () => {
    this.setState({
      showForm: true,
      editingId: null,
      formData: { ...EMPTY_FORM, ekart_date: localToday() },
      status: "",
      locAddress: "",
      locError: "",
    });
  };

  openEdit = (o) => {
    this.setState({
      showForm: true,
      editingId: o.ekart_id,
      formData: {
        ekart_order: o.ekart_order || "NC",
        ekart_arrangement: o.ekart_arrangement || "",
        ekart_location: o.ekart_location || "",
        ekart_type: o.ekart_type || "DELIVERY",
        ekart_status: o.ekart_status || "PENDING",
        ekart_date: o.ekart_date || "",
      },
      status: "",
      locAddress: "",
      locError: "",
    });
  };

  closeForm = () => {
    this.setState({
      showForm: false,
      editingId: null,
      formData: { ...EMPTY_FORM },
      locAddress: "",
      locError: "",
    });
  };

  // ---------- Render ----------

  // Location cell: full URL -> "Open Location"; lat,lng -> map link; else plain text
  renderLocation = (loc) => {
    const value = loc || "";
    if (/^https?:\/\//i.test(value)) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer">
          Open Location
        </a>
      );
    }
    const p = parseLatLng(value);
    if (p) {
      return (
        <a href={mapLink(p)} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      );
    }
    return value;
  };

  // Time cell: "12 min" (road), "~12 min" (estimate), "…" (still loading), "—" (no data)
  renderTime = (o) => {
    if (!this.state.currentPos) return "—";
    if (o._roadSec === undefined) return o._distance === null ? "—" : "…";
    if (o._roadSec === null) return "—";
    return (o._etaEstimated ? "~" : "") + formatDuration(o._roadSec);
  };

  render() {
    const {
      formData,
      editingId,
      showForm,
      saving,
      loading,
      status,
      locChecking,
      locAddress,
      locError,
      searchText,
      orderFilter,
      typeFilter,
      statusFilter,
      stats,
    } = this.state;
    const parsedLoc = parseLatLng(formData.ekart_location);
    const visibleOrders = this.getVisibleOrders();
    const suggestions = showForm ? this.getSuggestions() : [];
    const isFiltering =
      searchText.trim() !== "" ||
      orderFilter !== "ALL" ||
      typeFilter !== "ALL" ||
      statusFilter !== "ALL";

    return (
      <div className="order mobwidth">
        <h2>Ekart Orders</h2>

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px",
            margin: "8px 0",
            background: "#fff",
            borderBottom: "1px solid #ddd",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {[
            ["Delivered", stats.DELIVERED, "#2e7d32", "#c8e6c9"],
            ["Earnings", `₹${stats.DELIVERED * RATE_PER_DELIVERY}`, "#1b5e20", "#a5d6a7"],
            ["Pending", stats.PENDING, "#c62828", "#ffcdd2"],
            ["Cancelled", stats.CANCELLED, "#5d4037", "#d7ccc8"],
            ["COK", stats.COK, "#333", "#e3f2fd"],
            ["CRN", stats.CRN, "#333", "#fff3e0"],
            ["NC", stats.NC, "#333", "#eeeeee"],
          ].map(([label, count, color, bg]) => (
            <span
              key={label}
              style={{
                background: bg,
                color,
                padding: "4px 10px",
                borderRadius: 14,
                whiteSpace: "nowrap",
              }}
            >
              {label}: {count}
            </span>
          ))}
        </div>

        <a className="btn-update" onClick={this.handleOpenFieldX}>
          Field X
        </a>
        <div className="button-row">
          <a className="btn-update" onClick={this.openAdd}>
            Add Ekart Order
          </a>
          <a className="btn-update" onClick={this.handleRefreshTrip}>
            {loading ? "Loading…" : "Refresh"}
          </a>
          <a className="btn-update" onClick={this.handleReroute}>
            Reroute
          </a>
          <a className="btn-update" onClick={this.handleShowToday}>
            Today
          </a>
          {(this.state.todayOnly || this.state.todayAll || this.state.reroute) && (
            <a className="btn-update" onClick={this.handleShowAll}>
              Show All
            </a>
          )}

          <a className="btn-cancel"  >
            Clear DB
          </a>
        </div>

        {!showForm && status && <h3>{status}</h3>}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            margin: "10px 0",
          }}
        >
          <input
            type="text"
            value={searchText}
            onChange={this.handleSearchChange}
            placeholder="Search customer name…"
            style={{ flex: 1, minWidth: 160 }}
          />

          <select value={orderFilter} onChange={this.handleOrderFilterChange}>
            <option value="ALL">All</option>
            {EKART_ORDER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select value={typeFilter} onChange={this.handleTypeFilterChange}>
            <option value="ALL">All Types</option>
            {EKART_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={this.handleStatusFilterChange}>
            <option value="ALL">All Status</option>
            {EKART_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {isFiltering && (
            <a className="btn-cancel" onClick={this.handleClearFilters}>
              Clear
            </a>
          )}
        </div>

        <div className="table-responsive">
          <table className="order-table">
            <thead>
              <tr>
                <th>Ekart Order</th>
                <th>Arrangement</th>
                <th>Location</th>
                <th>{this.state.reroute ? "From prev" : "Distance"}</th>
                <th>{this.state.reroute ? "Leg time" : "Time"}</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    {isFiltering ? "No orders match your search" : "No ekart orders saved yet"}
                  </td>
                </tr>
              ) : (
                visibleOrders.map((o) => (
                  <tr
                    key={o.ekart_id}
                    style={{ backgroundColor: STATUS_COLORS[o.ekart_status] || "transparent" }}
                  >
                    <td>{o._stop ? `#${o._stop} ` : ""}{o.ekart_order}</td>
                    <td>{o.ekart_arrangement}</td>
                    <td>{this.renderLocation(o.ekart_location)}</td>
                    <td>{formatKm(this.state.reroute ? o._legKm : o._distance)}</td>
                    <td>{this.renderTime(o)}</td>
                    <td>{o.ekart_type}</td>
                    <td>{o.ekart_status}</td>
                    <td>{o.ekart_date}</td>
                    <td>
                      <button className="btn-update" onClick={() => this.openEdit(o)}>
                        Edit
                      </button>
                    </td>
                    <td>
                      <button className="btn-cancel" onClick={() => this.handleDelete(o.ekart_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm &&
          ReactDOM.createPortal(
            <div className="popup">
              <div className="modal-overlay">
                <div className="modal-box modalpos">
                  <h2>{editingId ? `EDIT EKART ORDER #${editingId}` : "NEW EKART ORDER"}</h2>

                  <label>NC=Not Called,COK=called and ok ,CRN=called not ok reject</label>
                  <select
                    name="ekart_order"
                    value={formData.ekart_order}
                    onChange={this.handleChange}
                  >
                    {EKART_ORDER_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>

                  <label>Customer Name & Address</label>
                  <input
                    name="ekart_arrangement"
                    value={formData.ekart_arrangement}
                    onChange={this.handleArrangementChange}
                    onFocus={() => this.setState({ showSuggest: true })}
                    onBlur={() => setTimeout(() => this.setState({ showSuggest: false }), 150)}
                    placeholder="Name & Address"
                    autoComplete="off"
                  />

                  {this.state.showSuggest && suggestions.length > 0 && (
                    <div
                      ref={(el) => {
                        // keep the list on screen (small phones / keyboard open)
                        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
                      }}
                      style={{
                        display: "block",
                        flex: "0 0 auto", // do not let the popup layout squeeze it
                        height: "auto",
                        minHeight: 48,
                        maxHeight: "40vh",
                        overflowY: "auto",
                        boxSizing: "border-box",
                        width: "100%",
                        border: "2px solid #0077b6",
                        borderRadius: 8,
                        backgroundColor: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                        margin: "4px 0 10px",
                        textAlign: "left",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {suggestions.map((name) => (
                        <div
                          key={name}
                          onMouseDown={(e) => {
                            e.preventDefault(); // keep focus so the tap is not lost
                            this.pickSuggestion(name);
                          }}
                          style={{
                            display: "block",
                            padding: "12px 12px",
                            minHeight: 44,
                            boxSizing: "border-box",
                            fontSize: 15,
                            lineHeight: 1.3,
                            color: "#111",
                            backgroundColor: "#fff",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            borderBottom: "1px solid #ddd",
                            cursor: "pointer",
                          }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}

                  <label>Ekart Location</label>
                  <input
                    name="ekart_location"
                    value={formData.ekart_location}
                    onChange={this.handleLocationChange}
                    onFocus={this.handleLocationFocus}
                    onClick={this.handleLocationFocus}
                    placeholder="Tap to paste latest copied latitude, longitude"
                  />

                  {parsedLoc && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        margin: "6px 0",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="btn-update"
                        onClick={this.handleVerifyLocation}
                        disabled={locChecking}
                      >
                        {locChecking ? "Checking…" : "Verify"}
                      </button>

                      <a
                        className="btn-update"
                        href={mapLink(parsedLoc)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Map
                      </a>

                      {locAddress && (
                        <span style={{ flex: 1, minWidth: 150, fontSize: 13, color: "#1b7f3b" }}>
                          ✔ {locAddress}
                        </span>
                      )}
                      {locError && (
                        <span style={{ flex: 1, minWidth: 150, fontSize: 13, color: "#c62828" }}>
                          ✖ {locError}
                        </span>
                      )}
                    </div>
                  )}

                  <label>Ekart Type</label>
                  <select name="ekart_type" value={formData.ekart_type} onChange={this.handleChange}>
                    {EKART_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <label>Ekart Status</label>
                  <select name="ekart_status" value={formData.ekart_status} onChange={this.handleChange}>
                    {EKART_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <label>Ekart Date</label>
                  <input
                    type="date"
                    name="ekart_date"
                    value={formData.ekart_date}
                    onChange={this.handleChange}
                  />

                  {status && <h3>{status}</h3>}

                  <div className="modal-buttons">
                    <button className="btn-update" onClick={this.handleSave} disabled={saving}>
                      {saving ? "Saving…" : editingId ? "Update" : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={this.closeForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }
}

export default RiderOrder;