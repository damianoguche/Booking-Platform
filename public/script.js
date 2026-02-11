/******************************
 * SOCKET INITIALIZATION (SAFE)
 ******************************/

let socket = null;

if (typeof window.io === "function") {
  try {
    socket = io();
    console.info("Socket.IO connected");
  } catch (err) {
    console.warn("Socket.IO initialization failed:", err);
  }
} else {
  console.warn("Socket.IO not loaded. Running in offline/demo mode.");
}

let currentUser = null;

/* ===========================
   API HELPER
=========================== */

async function api(url, method = "GET", data) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: data ? JSON.stringify(data) : null
  });

  return res.json();
}

/* ===========================
   INIT
=========================== */

async function init() {
  const data = await api("/api/dashboard");

  currentUser = data.user;

  document.getElementById("adminName").textContent =
    `${currentUser.name} (${currentUser.role})`;

  setupSidebar();
  router();

  window.onhashchange = router;
}

init();

/* ===========================
   ROLE-BASED SIDEBAR
=========================== */

function setupSidebar() {
  document.querySelectorAll("#menu li").forEach((item) => {
    const roles = item.dataset.role.split(",");

    if (!roles.includes(currentUser.role)) {
      item.style.display = "none";
    }
  });
}

/* ===========================
   ROUTER
=========================== */

function router() {
  const route = location.hash || "#/dashboard";

  document
    .querySelectorAll(".sidebar a")
    .forEach((a) => a.classList.remove("active"));

  document.querySelector(`a[href='${route}']`)?.classList.add("active");

  switch (route) {
    case "#/dashboard":
      renderDashboard();
      break;

    case "#/users":
      renderUsers();
      break;

    case "#/bookings":
      renderBookings();
      break;

    case "#/payments":
      renderPayments();
      break;

    case "#/properties":
      renderProperties();
      break;

    case "#/reports":
      renderReports();
      break;

    case "#/logs":
      renderLogs();
      break;

    case "#/settings":
      renderSettings();
      break;

    default:
      render404();
  }
}

/* ===========================
   PAGES
=========================== */

async function renderDashboard() {
  const data = await api("/api/dashboard");

  pageTitle.textContent = "Dashboard";

  app.innerHTML = `

    <section class="kpis">

      ${kpi("Bookings", data.kpis.bookings)}
      ${kpi("Revenue", "₦" + data.kpis.revenue.toLocaleString())}
      ${kpi("Active Users", data.kpis.users)}
      ${kpi("Fraud Alerts", data.kpis.fraud)}
      ${kpi("Pending Payments", data.kpis.pendings)}
      ${kpi("Properties", data.kpis.properties)}
      ${kpi("Guests", data.kpis.guests)}
      ${kpi("Hosts", data.kpis.hosts)}
    </section>



    <div class="container">
        <!-- KPIs -->
        <section class="kpis" id="kpis"></section>

        <!-- Charts -->
        <div class="panel">
          <h2>Platform Growth</h2>
          <canvas id="growthChart"></canvas>
        </div>

        <div class="grid">
          <!-- LEFT -->
          <div>
            <!-- Revenue -->
            <div class="panel">
              <h2>Revenue Trend</h2>
              <canvas id="revenueChart"></canvas>
            </div>

            <!-- Fraud Detection -->
            <div class="panel">
              <h2>Fraud Detection Panel</h2>
              <table id="fraudTable"></table>
            </div>

            <!-- Audit Logs -->
            <div class="panel">
              <h2>Audit Trail</h2>
              <table id="auditTable"></table>
            </div>
          </div>

          <!-- RIGHT -->
          <div>
            <!-- Admin Actions -->
            <div class="panel actions">
              <h2>Admin Controls</h2>

              <div>
                <input id="userId" value="USR102" />
                <button onclick="suspendUser()">Suspend</button>
              </div>

              <div>
                <input id="bookingId" value="BK991" />
                <button onclick="cancelBooking()">Cancel</button>
              </div>

              <div>
                <input id="paymentId" value="PAY221" />
                <button onclick="flagFraud()">Flag</button>
              </div>

              <div>
                <input id="propertyId" value="PROP77" />
                <button onclick="suspendProperty()">Block</button>
              </div>
            </div>

            <!-- System -->
            <div class="panel">
              <h2>System Health</h2>
              <p>API: <span id="api"></span></p>
              <p>Payments: <span id="pay"></span></p>
              <p>Webhooks: <span id="webhook"></span></p>
              <p>Uptime: <span id="sys"></span></p>
            </div>
          </div>
        </div>
      </div>








     <section class="grid">
        <!-- LEFT -->

        <div>
          <div class="panel">
            <h3>Revenue & Bookings</h3>
            <canvas id="chart"></canvas>
          </div>

          <div class="panel">
            <h3>Recent Bookings</h3>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Property</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>B221</td>
                  <td>Ada</td>
                  <td>Lekki View</td>
                  <td><span class="status confirmed">Confirmed</span></td>
                </tr>

                <tr>
                  <td>B220</td>
                  <td>James</td>
                  <td>VI Flat</td>
                  <td><span class="status pending">Pending</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- RIGHT -->

        <div>
          <div class="panel">
            <h3>System Health</h3>

            <p>API: Online</p>
            <p>Payments: OK</p>
            <p>Webhooks: Active</p>
            <p>Uptime: 3d 12h</p>
          </div>

          <div class="panel">
            <h3>Live Activity</h3>

            <ul>
              <li>Payment PAY221 flagged</li>
              <li>User USR102 suspended</li>
              <li>Booking BK992 cancelled</li>
            </ul>
          </div>
        </div>
      </section>

    <div class="panel">

      <h3>Recent Bookings</h3>

      <table>
        <tr>
          <th>ID</th>
          <th>User</th>
          <th>Property</th>
          <th>Status</th>
        </tr>

        ${data.recentBookings
          .map(
            (b) => `
          <tr>
            <td>${b.id}</td>
            <td>${b.user}</td>
            <td>${b.property}</td>
            <td>${b.status}</td>
          </tr>
        `
          )
          .join("")}

      </table>

    </div>
  `;
}

function renderUsers() {
  pageTitle.textContent = "Users";

  app.innerHTML = `

    <div class="panel">

      <h3>User Management</h3>

      <input id="userId" placeholder="User ID" />

      <button onclick="suspendUser()">
        Suspend
      </button>

    </div>
  `;
}

function renderBookings() {
  pageTitle.textContent = "Bookings";

  app.innerHTML = `

    <div class="panel">

      <h3>Booking Control</h3>

      <input id="bookingId" placeholder="Booking ID" />

      <button onclick="cancelBooking()">
        Cancel
      </button>

    </div>
  `;
}

function renderPayments() {
  pageTitle.textContent = "Payments";

  app.innerHTML = `

    <div class="panel">

      <h3>Payments</h3>

      <p>View settlements, disputes and fraud.</p>

    </div>

      <!-- KPIs -->

      <section class="kpis">
        <div class="kpi">
          <h4>Total Bookings</h4>
          <p>1,284</p>
        </div>

        <div class="kpi">
          <h4>Revenue</h4>
          <p>₦4.2M</p>
        </div>

        <div class="kpi">
          <h4>Active Users</h4>
          <p>612</p>
        </div>

        <div class="kpi">
          <h4>Pending Payments</h4>
          <p>41</p>
        </div>

        <div class="kpi">
          <h4>Fraud Alerts</h4>
          <p>3</p>
        </div>
      </section>

      <!-- Content -->

      <section class="grid">
        <!-- LEFT -->

        <div>
          <div class="panel">
            <h3>Revenue & Bookings</h3>
            <canvas id="chart"></canvas>
          </div>

          <div class="panel">
            <h3>Recent Bookings</h3>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Property</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>B221</td>
                  <td>Ada</td>
                  <td>Lekki View</td>
                  <td><span class="status confirmed">Confirmed</span></td>
                </tr>

                <tr>
                  <td>B220</td>
                  <td>James</td>
                  <td>VI Flat</td>
                  <td><span class="status pending">Pending</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- RIGHT -->

        <div>
          <div class="panel">
            <h3>System Health</h3>

            <p>API: Online</p>
            <p>Payments: OK</p>
            <p>Webhooks: Active</p>
            <p>Uptime: 3d 12h</p>
          </div>

          <div class="panel">
            <h3>Live Activity</h3>

            <ul>
              <li>Payment PAY221 flagged</li>
              <li>User USR102 suspended</li>
              <li>Booking BK992 cancelled</li>
            </ul>
          </div>
        </div>
      </section>
  `;
}

function renderProperties() {
  pageTitle.textContent = "Properties";
  app.innerHTML = `

    <div class="panel">

      <h3>Properties</h3>

      <p>Only admins can see this.</p>

    </div>
  `;
}
function renderReports() {
  pageTitle.textContent = "Reports";
  app.innerHTML = `

    <div class="panel">

      <h3>Reports</h3>

      <p>Only admins can see this.</p>

    </div>
  `;
}
function renderLogs() {
  pageTitle.textContent = "System Logs";
  app.innerHTML = `

    <div class="panel">

      <h3>System Logs</h3>

      <p>Only admins can see this.</p>

    </div>
  `;
}

function renderSettings() {
  pageTitle.textContent = "Settings";

  app.innerHTML = `

    <div class="panel">

      <h3>System Settings</h3>

      <p>Only admins can see this.</p>

    </div>
  `;
}

function render404() {
  app.innerHTML = `
    <h2>Page not found</h2>
  `;
}

/* ===========================
   COMPONENTS
=========================== */

function kpi(title, value) {
  return `
    <div class="kpi">
      <h4>${title}</h4>
      <p>${value}</p>
    </div>
  `;
}

/* ===========================
   ADMIN ACTIONS
=========================== */

async function suspendUser() {
  const id = userId.value;

  await api("/api/admin/suspend-user", "POST", { id });

  alert("User suspended");
}

async function cancelBooking() {
  const id = bookingId.value;

  await api("/api/admin/cancel-booking", "POST", { id });

  alert("Booking cancelled");
}

/******************************
 * DUMMY DASHBOARD DATA
 ******************************/

const demo = {
  kpis: {
    guests: 340,
    hosts: 87,
    properties: 129,
    bookings: 911,
    confirmed: 742,
    revenue: 4200000
  },

  growth: {
    labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    users: [120, 160, 210, 260, 300, 340],
    bookings: [300, 380, 420, 550, 720, 910]
  },

  revenue: {
    labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    data: [400000, 620000, 780000, 920000, 1100000, 1200000]
  },

  fraud: [
    {
      id: "PAY221",
      user: "James",
      amount: 120000,
      reason: "Multiple retries"
    },
    { id: "PAY199", user: "Ada", amount: 98000, reason: "IP mismatch" },
    {
      id: "PAY176",
      user: "John",
      amount: 150000,
      reason: "Velocity abuse"
    }
  ],

  audit: [
    { time: "10:21", admin: "SYS", action: "Auto-cancel expired" },
    { time: "10:18", admin: "Admin1", action: "Suspended user USR102" },
    { time: "10:11", admin: "Admin2", action: "Adjusted payment PAY180" },
    { time: "09:55", admin: "SYS", action: "Webhook retry" }
  ],

  health: { api: true, payments: true, webhooks: true, uptime: "3d 12h" }
};

render(demo);

/******************************
 * RENDER
 ******************************/

function render(d) {
  renderKpis(d.kpis);
  renderGrowth(d.growth);
  renderRevenue(d.revenue);
  renderFraud(d.fraud);
  renderAudit(d.audit);
  renderHealth(d.health);
}

function renderKpis(k) {
  kpis.innerHTML = `
   ${card("Guests", k.guests)}
   ${card("Hosts", k.hosts)}
   ${card("Properties", k.properties)}
   ${card("Bookings", k.bookings)}
   ${card("Revenue", "₦" + k.revenue.toLocaleString())}
  `;
}

function card(t, v) {
  return `<div class='kpi'><h3>${t}</h3><p>${v}</p></div>`;
}

/******************************
 * CHARTS
 ******************************/

function renderGrowth(g) {
  new Chart(growthChart, {
    type: "line",
    data: {
      labels: g.labels,
      datasets: [
        {
          label: "Users",
          data: g.users,
          borderColor: "#f472ff",
          tension: 0.4
        },
        {
          label: "Bookings",
          data: g.bookings,
          borderColor: "#9c489e",
          tension: 0.4
        }
      ]
    }
  });
}

function renderRevenue(r) {
  new Chart(revenueChart, {
    type: "bar",
    data: {
      labels: r.labels,
      datasets: [
        {
          label: "Revenue (₦)",
          data: r.data,
          backgroundColor: "rgba(156,72,158,.6)"
        }
      ]
    }
  });
}

/******************************
 * FRAUD
 ******************************/

function renderFraud(list) {
  fraudTable.innerHTML = `
    <tr><th>Payment</th><th>User</th><th>Amount</th><th>Reason</th><th>Status</th></tr>
    ${list
      .map(
        (f) => `
      <tr>
        <td>${f.id}</td>
        <td>${f.user}</td>
        <td>₦${f.amount}</td>
        <td>${f.reason}</td>
        <td><span class='status FRAUD'>FLAGGED</span></td>
      </tr>`
      )
      .join("")}
  `;
}

/******************************
 * AUDIT
 ******************************/

function renderAudit(list) {
  auditTable.innerHTML = `
    <tr><th>Time</th><th>Admin</th><th>Action</th></tr>
    ${list
      .map(
        (a) => `
      <tr>
        <td>${a.time}</td>
        <td>${a.admin}</td>
        <td>${a.action}</td>
      </tr>`
      )
      .join("")}
  `;
}

/******************************
 * HEALTH
 ******************************/

function renderHealth(h) {
  set("api", h.api);
  set("pay", h.payments);
  set("webhook", h.webhooks);
  sys.textContent = h.uptime;
  uptime.textContent = "Uptime: " + h.uptime;
}

function set(id, v) {
  const el = document.getElementById(id);
  el.textContent = v ? "Online" : "Offline";
  el.style.color = v ? "#4ade80" : "#f87171";
}

/******************************
 * ADMIN ACTIONS (DEMO)
 ******************************/

function suspendUser() {
  alert("User suspended: " + userId.value);
}

function cancelBooking() {
  alert("Booking cancelled: " + bookingId.value);
}

function flagFraud() {
  alert("Payment flagged: " + paymentId.value);
}

function suspendProperty() {
  alert("Property blocked: " + propertyId.value);
}
