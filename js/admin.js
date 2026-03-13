/* ============ ADMIN DASHBOARD JS ============ */
var adminToken = null;
var adminUser = null;
var currentPanel = 'chatbot';
var currentData = [];

// Set default date
document.getElementById('filterDate').value = new Date().toISOString().slice(0, 10);

function adminLogin() {
  var email = document.getElementById('adminEmail').value;
  var password = document.getElementById('adminPassword').value;
  var errEl = document.getElementById('adminLoginError');
  errEl.classList.add('hidden');

  fetch('/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (!res.ok) { errEl.textContent = res.data.error; errEl.classList.remove('hidden'); return; }
      adminToken = res.data.token;
      adminUser = res.data.user;
      localStorage.setItem('adminToken', adminToken);
      showDashboard();
    }).catch(function() {
      errEl.textContent = 'Connection error'; errEl.classList.remove('hidden');
    });
}

function showDashboard() {
  document.getElementById('adminLogin').classList.add('hidden');
  document.getElementById('adminShell').classList.remove('hidden');
  document.getElementById('adminName').textContent = adminUser.firstName + ' ' + adminUser.lastName;
  document.getElementById('adminAvatar').textContent = (adminUser.firstName[0] + adminUser.lastName[0]).toUpperCase();
  document.getElementById('adminRole').textContent = adminUser.role.replace('_', ' ');
  showPanel('chatbot');
}

function adminLogout() {
  adminToken = null; adminUser = null;
  localStorage.removeItem('adminToken');
  document.getElementById('adminShell').classList.add('hidden');
  document.getElementById('adminLogin').classList.remove('hidden');
}

function showPanel(panel) {
  currentPanel = panel;
  document.querySelectorAll('.admin-nav-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-panel') === panel);
  });
  var titles = {
    chatbot: 'Chatbot Support Reports', funnel: 'Booking Funnel Dashboard',
    orders: 'Orders Dashboard', passengers: 'Passengers Dashboard',
    ancillaries: 'Ancillaries Dashboard', holds: 'Time-to-Think Dashboard',
    channels: 'Channels Dashboard', offices: 'Office IDs Dashboard',
    payments: 'Payments Dashboard', clevel: 'C-Level Executive Dashboards',
    users: 'User Management'
  };
  document.getElementById('panelTitle').textContent = titles[panel] || panel;
  loadPanelData(panel);
}

function refreshCurrentPanel() { loadPanelData(currentPanel); }

function fmtMoney(v) { return 'RWF ' + Number(v).toLocaleString(); }

function loadPanelData(panel) {
  var date = document.getElementById('filterDate').value;
  var summary = document.getElementById('adminSummary');
  var thead = document.getElementById('adminTableHead');
  var tbody = document.getElementById('adminTableBody');

  // Show skeleton
  summary.innerHTML = '<div class="admin-summary-card"><div class="admin-skeleton w60" style="height:12px;margin-bottom:8px"></div><div class="admin-skeleton w40" style="height:28px"></div></div>'.repeat(3);
  tbody.innerHTML = '<tr>' + '<td><div class="admin-skeleton w80"></div></td>'.repeat(5) + '</tr>'.repeat(5);

  if (panel === 'users') { loadUsers(); return; }
  if (panel === 'clevel') { loadCLevel(); return; }

  fetch('/api/admin/' + panel + '?date=' + date, {
    headers: { 'Authorization': 'Bearer ' + adminToken }
  }).then(function(r) { return r.json(); })
    .then(function(data) { renderPanel(panel, data); })
    .catch(function(err) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:#64748b">Error loading data</td></tr>';
    });
}

function renderPanel(panel, data) {
  var summary = document.getElementById('adminSummary');
  var thead = document.getElementById('adminTableHead');
  var tbody = document.getElementById('adminTableBody');

  switch (panel) {
    case 'chatbot':
      currentData = data.conversations || [];
      summary.innerHTML = summaryCard('Total Sessions', data.summary.totalSessions, '', 'blue') +
        summaryCard('Resolved by Bot', data.summary.resolvedByBot, '', 'green') +
        summaryCard('Escalated to Agent', data.summary.escalated, '', 'yellow') +
        summaryCard('Avg. Satisfaction', data.summary.avgSatisfaction + '/5', '', 'green');
      thead.innerHTML = '<tr><th>Session ID</th><th>User</th><th>Topic</th><th>Messages</th><th>Duration</th><th>Resolution</th><th>Satisfaction</th><th>Date</th></tr>';
      tbody.innerHTML = currentData.map(function(c) {
        var satColor = c.satisfaction >= 4 ? 'green' : c.satisfaction >= 3 ? 'yellow' : 'red';
        var stars = '★'.repeat(c.satisfaction) + '☆'.repeat(5 - c.satisfaction);
        return '<tr><td><strong>' + c.sessionId + '</strong></td><td>' + c.user + '</td><td>' + c.topic + '</td><td>' + c.messages + '</td><td>' + c.duration + '</td><td>' + statusBadge(c.resolution) + '</td><td><span style="color:var(--' + satColor + ')">' + stars + '</span></td><td>' + c.date + '</td></tr>';
      }).join('');
      break;

    case 'funnel':
      currentData = data.stages || [];
      summary.innerHTML = summaryCard('Search → Results', data.summary.searchToResults + '%', '', 'blue') +
        summaryCard('Results → Cart', data.summary.resultsToCart + '%', '', 'yellow') +
        summaryCard('Cart → Payment', data.summary.cartToPayment + '%', '', 'green') +
        summaryCard('Payment → Confirmed', data.summary.paymentToConfirmed + '%', '', 'green');
      thead.innerHTML = '<tr><th>Funnel Stage</th><th>Sessions</th><th>Conversion</th><th>Drop-off</th><th>Avg. Time</th><th>Trend</th></tr>';
      tbody.innerHTML = currentData.map(function(s) {
        var barWidth = Math.max(s.conversion, 5);
        var trend = s.trend > 0 ? '<span style="color:var(--green)">▲ +' + s.trend + '%</span>' : '<span style="color:var(--red)">▼ ' + s.trend + '%</span>';
        return '<tr><td><strong>' + s.stage + '</strong></td><td>' + s.sessions.toLocaleString() + '</td><td><div style="display:flex;align-items:center;gap:8px"><div style="width:120px;height:8px;background:#e2e8f0;border-radius:4px"><div style="width:' + barWidth + '%;height:100%;background:var(--blue);border-radius:4px"></div></div><span style="font-weight:700">' + s.conversion + '%</span></div></td><td>' + s.dropoff + '%</td><td>' + s.avgTime + '</td><td>' + trend + '</td></tr>';
      }).join('');
      break;

    case 'orders':
      currentData = data.orders || [];
      summary.innerHTML = summaryCard('Total Orders', data.summary.total, '', 'blue') +
        summaryCard('Confirmed', data.summary.confirmed, '', 'green') +
        summaryCard('Cancelled', data.summary.cancelled, '', 'red');
      thead.innerHTML = '<tr><th>PNR</th><th>Flight</th><th>Route</th><th>PAX</th><th>Channel</th><th>Payment</th><th>Status</th><th>Fare</th></tr>';
      tbody.innerHTML = currentData.map(function(o) {
        return '<tr><td><strong>' + o.pnr + '</strong></td><td>' + o.flight + '</td><td>' + o.route + '</td><td>' + o.paxCount + '</td><td>' + o.channel + '</td><td>' + o.payment + '</td><td>' + statusBadge(o.status) + '</td><td>' + fmtMoney(o.totalFare) + '</td></tr>';
      }).join('');
      break;

    case 'passengers':
      currentData = data.passengers || [];
      summary.innerHTML = summaryCard('Total PAX', data.summary.total, '', 'blue') +
        summaryCard('Checked In', data.summary.checkedIn, '', 'green') +
        summaryCard('Business Class', data.summary.business, '', 'yellow');
      thead.innerHTML = '<tr><th>Name</th><th>PNR</th><th>Flight</th><th>Route</th><th>Class</th><th>Seat</th><th>Checked In</th></tr>';
      tbody.innerHTML = currentData.map(function(p) {
        return '<tr><td>' + p.name + '</td><td>' + p.pnr + '</td><td>' + p.flight + '</td><td>' + p.route + '</td><td>' + p.class + '</td><td>' + (p.seatAssigned ? '✓' : '—') + '</td><td>' + (p.checkedIn ? statusBadge('Confirmed') : statusBadge('Pending')) + '</td></tr>';
      }).join('');
      break;

    case 'ancillaries':
      currentData = data.ancillaries || [];
      summary.innerHTML = summaryCard('Total Revenue', fmtMoney(data.summary.totalRevenue), '', 'blue') +
        summaryCard('Items Sold', data.summary.totalItems, '', 'green');
      thead.innerHTML = '<tr><th>Ancillary</th><th>Quantity</th><th>Revenue</th><th>Flights</th></tr>';
      tbody.innerHTML = currentData.map(function(a) {
        return '<tr><td><strong>' + a.type + '</strong></td><td>' + a.quantity + '</td><td>' + fmtMoney(a.revenue) + '</td><td>' + a.flights + '</td></tr>';
      }).join('');
      break;

    case 'holds':
      currentData = data.holds || [];
      summary.innerHTML = summaryCard('Total Holds', data.summary.total, '', 'blue') +
        summaryCard('Active', data.summary.active, '', 'yellow') +
        summaryCard('Converted', data.summary.converted, '', 'green') +
        summaryCard('Expired', data.summary.expired, '', 'red');
      thead.innerHTML = '<tr><th>PNR</th><th>Route</th><th>Created</th><th>Expires</th><th>Fare</th><th>Status</th></tr>';
      tbody.innerHTML = currentData.map(function(h) {
        return '<tr><td><strong>' + h.pnr + '</strong></td><td>' + h.route + '</td><td>' + new Date(h.createdAt).toLocaleString() + '</td><td>' + new Date(h.expiresAt).toLocaleString() + '</td><td>' + fmtMoney(h.fare) + '</td><td>' + statusBadge(h.status) + '</td></tr>';
      }).join('');
      break;

    case 'channels':
      currentData = data.channels || [];
      var totalRev = data.summary.totalRevenue;
      summary.innerHTML = summaryCard('Total PNRs', data.summary.totalPnrs, '', 'blue') +
        summaryCard('Total Revenue', fmtMoney(totalRev), '', 'green');
      thead.innerHTML = '<tr><th>Channel</th><th>PNRs</th><th>Revenue</th><th>Share</th></tr>';
      tbody.innerHTML = currentData.map(function(c) {
        return '<tr><td><strong>' + c.channel + '</strong></td><td>' + c.pnrs + '</td><td>' + fmtMoney(c.revenue) + '</td><td><div style="display:flex;align-items:center;gap:8px"><div style="width:100px;height:8px;background:#e2e8f0;border-radius:4px"><div style="width:' + c.share + '%;height:100%;background:var(--blue);border-radius:4px"></div></div><span>' + c.share + '%</span></div></td></tr>';
      }).join('');
      break;

    case 'offices':
      currentData = data.offices || [];
      summary.innerHTML = summaryCard('Total PNRs', data.summary.totalPnrs, '', 'blue') +
        summaryCard('Total Revenue', fmtMoney(data.summary.totalRevenue), '', 'green');
      thead.innerHTML = '<tr><th>Office ID</th><th>Name</th><th>PNRs</th><th>Revenue</th></tr>';
      tbody.innerHTML = currentData.map(function(o) {
        return '<tr><td><strong>' + o.officeId + '</strong></td><td>' + o.name + '</td><td>' + o.pnrs + '</td><td>' + fmtMoney(o.revenue) + '</td></tr>';
      }).join('');
      break;

    case 'payments':
      currentData = data.payments || [];
      summary.innerHTML = summaryCard('Total PNRs', data.summary.totalPnrs, '', 'blue') +
        summaryCard('Total Revenue', fmtMoney(data.summary.totalRevenue), '', 'green');
      thead.innerHTML = '<tr><th>Payment Method</th><th>PNRs</th><th>Amount</th><th>Share</th></tr>';
      tbody.innerHTML = currentData.map(function(p) {
        return '<tr><td><strong>' + p.method + '</strong></td><td>' + p.pnrs + '</td><td>' + fmtMoney(p.amount) + '</td><td><div style="display:flex;align-items:center;gap:8px"><div style="width:100px;height:8px;background:#e2e8f0;border-radius:4px"><div style="width:' + p.share + '%;height:100%;background:var(--blue);border-radius:4px"></div></div><span>' + p.share + '%</span></div></td></tr>';
      }).join('');
      break;
  }
}

function summaryCard(label, value, sub, color) {
  return '<div class="admin-summary-card ' + (color || '') + '">' +
    '<div class="label">' + label + '</div>' +
    '<div class="value">' + value + '</div>' +
    (sub ? '<div class="sub">' + sub + '</div>' : '') +
    '</div>';
}

function statusBadge(status) {
  var cls = 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  return '<span class="status-badge ' + cls + '">' + status + '</span>';
}

// ---- USER MANAGEMENT ----
function loadUsers() {
  var summary = document.getElementById('adminSummary');
  var thead = document.getElementById('adminTableHead');
  var tbody = document.getElementById('adminTableBody');

  summary.innerHTML = '<div class="admin-user-form"><h3>Add New Admin User</h3>' +
    '<div class="form-row"><input id="newUserFirst" placeholder="First Name"/><input id="newUserLast" placeholder="Last Name"/></div>' +
    '<div class="form-row"><input id="newUserEmail" placeholder="Email" type="email"/><input id="newUserPass" placeholder="Password" type="password"/></div>' +
    '<div class="form-row"><select id="newUserRole"><option value="viewer">Viewer</option><option value="manager">Manager</option><option value="finance">Finance</option><option value="super_admin">Super Admin</option></select>' +
    '<button class="admin-btn-sm primary" onclick="createUser()">Create User</button></div></div>';

  fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + adminToken } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      currentData = data.users || [];
      thead.innerHTML = '<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>';
      tbody.innerHTML = currentData.map(function(u) {
        return '<tr><td>' + u.id + '</td><td>' + u.firstName + ' ' + u.lastName + '</td><td>' + u.email + '</td><td>' + statusBadge(u.role.replace('_', ' ')) + '</td><td><button class="admin-btn-sm danger" onclick="deleteUser(\'' + u.id + '\')">Delete</button></td></tr>';
      }).join('');
    }).catch(function() {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Only super admins can manage users.</td></tr>';
      summary.innerHTML = '';
    });
}

function createUser() {
  var body = {
    firstName: document.getElementById('newUserFirst').value,
    lastName: document.getElementById('newUserLast').value,
    email: document.getElementById('newUserEmail').value,
    password: document.getElementById('newUserPass').value,
    role: document.getElementById('newUserRole').value
  };
  fetch('/api/admin/users', {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function() { loadUsers(); });
}

function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  fetch('/api/admin/users/' + id, {
    method: 'DELETE', headers: { 'Authorization': 'Bearer ' + adminToken }
  }).then(function() { loadUsers(); });
}

// ---- C-LEVEL DASHBOARDS ----
function loadCLevel() {
  var summary = document.getElementById('adminSummary');
  var thead = document.getElementById('adminTableHead');
  var tbody = document.getElementById('adminTableBody');

  // Top KPIs
  summary.innerHTML = summaryCard('Total Revenue', 'RWF 456M', '▲ 18.2% QoQ', 'blue') +
    summaryCard('Conversion Rate', '13%', '▲ 2.1pp QoQ', 'green') +
    summaryCard('Active Routes', '19', '3 new in Q1', 'yellow') +
    summaryCard('Bookings', '1,619', '▲ 22.4% QoQ', 'green');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  var wrap = document.querySelector('.admin-table-wrap');
  var oldDash = document.getElementById('clevelDashboard');
  if (oldDash) oldDash.remove();

  var dash = document.createElement('div');
  dash.id = 'clevelDashboard';
  dash.innerHTML =
    // ---- SECTION: Revenue & Financial Overview ----
    '<div style="margin-bottom:32px">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#0f172a">💰 Revenue & Financial Overview</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
        // Revenue by Channel
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">' +
          '<div style="font-size:14px;font-weight:700;margin-bottom:12px">Revenue by Channel</div>' +
          clevelBar('Website', 42, 'RWF 191.5M', '#00529b') +
          clevelBar('Mobile App', 28, 'RWF 127.7M', '#1ea2dc') +
          clevelBar('Travel Agents', 19, 'RWF 86.6M', '#f59e0b') +
          clevelBar('Call Center', 11, 'RWF 50.2M', '#64748b') +
          '<div style="margin-top:12px;padding:10px;background:#ecfdf5;border-radius:8px;font-size:12px;color:#166534"><strong>Insight:</strong> Digital channels (70%) growing 25%+ QoQ while offline channels decline.</div>' +
        '</div>' +
        // Payment Mix
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">' +
          '<div style="font-size:14px;font-weight:700;margin-bottom:12px">Payment Mix</div>' +
          clevelBar('Card (Visa/MC)', 35, 'RWF 159.6M', '#2563eb') +
          clevelBar('Mobile Money', 27, 'RWF 123.1M', '#16a34a') +
          clevelBar('Bank Transfer', 13, 'RWF 59.3M', '#d97706') +
          clevelBar('DreamMiles', 11, 'RWF 50.2M', '#7c3aed') +
          clevelBar('Wallet', 9, 'RWF 41.0M', '#0891b2') +
          clevelBar('Corporate', 5, 'RWF 22.8M', '#475569') +
          '<div style="margin-top:12px;padding:10px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1e40af"><strong>Processing cost:</strong> 1.47% effective rate. MoMo (1.5%) cheaper than Card (2.8%).</div>' +
        '</div>' +
      '</div>' +
      // Office Performance row
      '<div style="margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:12px">Office Revenue Performance</div>' +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;text-align:center">' +
          clevelOffice('Kigali HQ', 'RWF 285M', '40.2%', '▲ 15.3%', true) +
          clevelOffice('Dubai', 'RWF 156M', '22.0%', '▲ 24.8%', true) +
          clevelOffice('Brussels', 'RWF 112M', '15.8%', '▲ 8.7%', true) +
          clevelOffice('Nairobi', 'RWF 89M', '12.5%', '▲ 11.2%', true) +
          clevelOffice('Johannesburg', 'RWF 67M', '9.5%', '▼ 3.1%', false) +
        '</div>' +
      '</div>' +
    '</div>' +

    // ---- SECTION: Operations & Customer Metrics ----
    '<div style="margin-bottom:32px">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#0f172a">📊 Operations & Customer Metrics</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">' +
        // Booking Funnel
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">' +
          '<div style="font-size:14px;font-weight:700;margin-bottom:12px">Booking Funnel</div>' +
          clevelFunnel('Sessions', '12,450', 100) +
          clevelFunnel('Search', '8,715', 70) +
          clevelFunnel('Results', '4,358', 35) +
          clevelFunnel('Selected', '2,614', 21) +
          clevelFunnel('Payment', '2,241', 18) +
          clevelFunnel('Confirmed', '1,619', 13) +
          '<div style="margin-top:10px;padding:8px;background:#fef3c7;border-radius:6px;font-size:11px;color:#92400e"><strong>⚠ Leak:</strong> Results→Selected (44% drop). Improve fare comparison UX.</div>' +
        '</div>' +
        // T2T Holds
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">' +
          '<div style="font-size:14px;font-weight:700;margin-bottom:12px">Time-to-Think Holds</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#00529b">15</div><div style="font-size:11px;color:#64748b">Total Holds</div></div>' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#16a34a">33%</div><div style="font-size:11px;color:#64748b">Conversion</div></div>' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#f59e0b">5</div><div style="font-size:11px;color:#64748b">Active</div></div>' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#dc2626">5</div><div style="font-size:11px;color:#64748b">Expired</div></div>' +
          '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-bottom:6px"><strong>Fee Revenue:</strong> RWF 375,000</div>' +
          '<div style="font-size:12px;color:#64748b;margin-bottom:6px"><strong>Most Popular:</strong> 48h hold (RWF 25,000)</div>' +
          '<div style="margin-top:8px;padding:8px;background:#ecfdf5;border-radius:6px;font-size:11px;color:#166534"><strong>✓</strong> T2T reduces abandonment. Recommend promoting 48h as default.</div>' +
        '</div>' +
        // AI Chatbot
        '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">' +
          '<div style="font-size:14px;font-weight:700;margin-bottom:12px">AI Chat Assistant</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#16a34a">80%</div><div style="font-size:11px;color:#64748b">AI Resolved</div></div>' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#00529b">4.2/5</div><div style="font-size:11px;color:#64748b">Satisfaction</div></div>' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#f59e0b">13%</div><div style="font-size:11px;color:#64748b">Escalated</div></div>' +
            '<div style="text-align:center;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:24px;font-weight:900;color:#64748b">15/day</div><div style="font-size:11px;color:#64748b">Sessions</div></div>' +
          '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-bottom:4px"><strong>Top topics:</strong> Booking 35%, Baggage 25%, Status 20%</div>' +
          '<div style="font-size:12px;color:#64748b"><strong>Languages:</strong> EN 55%, FR 30%, RW 15%</div>' +
          '<div style="margin-top:8px;padding:8px;background:#ecfdf5;border-radius:6px;font-size:11px;color:#166534"><strong>✓</strong> Reducing call center load by ~40%. Above industry avg (65%).</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ---- SECTION: Strategic Initiatives RAG Status ----
    '<div style="margin-bottom:32px">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#0f172a">🎯 Strategic Initiatives</h3>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
          '<thead><tr style="background:#00529b;color:#fff"><th style="padding:10px 14px;text-align:left">Initiative</th><th style="padding:10px 14px;text-align:center">Status</th><th style="padding:10px 14px">Owner</th><th style="padding:10px 14px">Target</th><th style="padding:10px 14px;width:200px">Progress</th><th style="padding:10px 14px">Notes</th></tr></thead>' +
          '<tbody>' +
            clevelRAG('Amadeus API Migration', 'amber', 'CTO', 'Jul 2026', 20, 'Pending sandbox access') +
            clevelRAG('Digital Booking Platform', 'green', 'Product', 'Complete', 100, '22 endpoints operational') +
            clevelRAG('Payment Integration', 'green', 'Payments', 'Apr 2026', 75, 'Outpace / BK / DPO / MoMo') +
            clevelRAG('Amadeus ALMS Loyalty', 'amber', 'Marketing', 'Jun 2026', 30, 'ALMS integration planning') +
            clevelRAG('AI Customer Service', 'green', 'CX Team', 'Complete', 100, '80% resolution, 3 languages') +
            clevelRAG('Route Expansion', 'amber', 'Network', 'Q2 2026', 40, 'Guangzhou pending bilateral') +
            clevelRAG('Online Check-in', 'red', 'Operations', 'TBD', 0, 'DCS out of service — deferred') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    // ---- SECTION: Risk Register ----
    '<div style="margin-bottom:32px">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#0f172a">⚠️ Risk Register</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
        clevelRisk('HIGH', 'Amadeus branded fare mapping', 'WB fare families (Lite/Classic/Business) may not map cleanly to Amadeus fareDetailsBySegment. 1–2 week discovery sprint needed.', 'Start fare-family mapping sprint immediately. Build configurable engine.') +
        clevelRisk('HIGH', 'Senior Amadeus engineer hiring', 'Without Amadeus-experienced developer, timeline extends 4–6 weeks. Specialized talent is scarce.', 'Engage Amadeus professional services as bridge. Budget: USD 8–12K/month.') +
        clevelRisk('HIGH', 'Payment gateway settlement delays', 'Outpace/DPO settlement timing, BK API timeouts, MTN MoMo callback failures can block ticketing.', 'Pending payment queue with auto-retry. Manual resolution queue in admin.') +
        clevelRisk('MED', 'T2T hold duration mismatch', 'Amadeus payment deadlines set by fare rules may not support 24/48/72h. Need airline config override.', 'Shadow hold pattern: PNR in Amadeus + extended hold on our side. Fee covers risk.') +
      '</div>' +
    '</div>' +

    // ---- SECTION: Decisions Required ----
    '<div style="margin-bottom:32px">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#0f172a">🔴 Decisions Required</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
        clevelDecision(1, 'Approve Amadeus Licensing Budget', 'USD 45,000/year for Digital API access.', 'April 15, 2026', 'critical', 'Blocks Phase 3 integration. Without this, no real API testing.') +
        clevelDecision(2, 'Authorize Senior Engineer Hire', 'Backend engineer with Amadeus experience. USD 8–12K/month.', 'Immediate', 'critical', 'Critical path — delays entire migration by 4–6 weeks if unfilled.') +
        clevelDecision(3, 'Confirm Q3 2026 Go-Live Date', 'July 2026 target. Requires commercial team alignment.', 'April 30, 2026', 'important', 'Marketing launch and agent training planning dependency.') +
        clevelDecision(4, 'Approve Payment Gateway Vendor', 'Outpace (primary) + BK + DPO. Setup: USD 5–15K + txn fees.', 'May 15, 2026', 'important', 'Phase 3 dependency. Vendor contracts need legal review.') +
      '</div>' +
    '</div>' +

    // ---- SECTION: Downloadable Reports ----
    '<div style="margin-bottom:32px">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#0f172a">📥 Downloadable Presentations</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">' +
        clevelReportCard('👤', 'CEO Dashboard', 'ceo-dashboard.html', '10 slides') +
        clevelReportCard('💰', 'CFO Revenue Report', 'cfo-revenue-report.html', '10 slides') +
        clevelReportCard('⚙', 'CTO Tech Report', 'cto-tech-report.html', '11 slides') +
        clevelReportCard('📋', 'COO Operations', 'coo-operations-report.html', '10 slides') +
        clevelReportCard('🏛', 'Board Summary', 'board-summary.html', '8 slides') +
        clevelReportCard('🚀', 'Migration Plan', 'migration-plan.html', '12 slides') +
      '</div>' +
    '</div>';

  wrap.appendChild(dash);
}

function clevelBar(label, pct, value, color) {
  return '<div style="display:flex;align-items:center;margin:6px 0;gap:8px">' +
    '<div style="width:100px;font-size:12px;font-weight:600;color:#0f172a;flex-shrink:0">' + label + '</div>' +
    '<div style="flex:1;height:20px;background:#e2e8f0;border-radius:6px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:6px;display:flex;align-items:center;padding-left:6px;color:#fff;font-size:10px;font-weight:700">' + pct + '%</div>' +
    '</div>' +
    '<div style="width:90px;text-align:right;font-size:12px;font-weight:700;color:#0f172a;flex-shrink:0">' + value + '</div>' +
  '</div>';
}

function clevelOffice(name, revenue, share, trend, isUp) {
  var tColor = isUp ? '#16a34a' : '#dc2626';
  return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px">' +
    '<div style="font-size:13px;font-weight:700;color:#0f172a">' + name + '</div>' +
    '<div style="font-size:18px;font-weight:900;color:#00529b;margin:4px 0">' + revenue + '</div>' +
    '<div style="font-size:11px;color:#64748b">' + share + ' share</div>' +
    '<div style="font-size:12px;font-weight:700;color:' + tColor + ';margin-top:4px">' + trend + '</div>' +
  '</div>';
}

function clevelFunnel(label, value, pct) {
  var opacity = 0.3 + (pct / 100) * 0.7;
  return '<div style="display:flex;align-items:center;margin:3px 0;gap:6px">' +
    '<div style="width:70px;font-size:11px;color:#64748b;flex-shrink:0">' + label + '</div>' +
    '<div style="flex:1;height:18px;background:rgba(0,82,155,' + opacity + ');border-radius:4px;display:flex;align-items:center;padding-left:6px;max-width:' + pct + '%">' +
      '<span style="color:#fff;font-size:10px;font-weight:700">' + value + '</span>' +
    '</div>' +
    '<div style="font-size:10px;color:#94a3b8;width:30px;flex-shrink:0">' + pct + '%</div>' +
  '</div>';
}

function clevelRAG(name, status, owner, target, pct, notes) {
  var dotColors = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
  var dot = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + dotColors[status] + ';margin-right:6px"></span>';
  var bar = '<div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px"><div style="width:' + pct + '%;height:100%;background:' + dotColors[status] + ';border-radius:4px"></div></div>';
  return '<tr style="border-bottom:1px solid #e2e8f0">' +
    '<td style="padding:10px 14px;font-weight:600">' + name + '</td>' +
    '<td style="padding:10px 14px;text-align:center">' + dot + status.toUpperCase() + '</td>' +
    '<td style="padding:10px 14px">' + owner + '</td>' +
    '<td style="padding:10px 14px">' + target + '</td>' +
    '<td style="padding:10px 14px">' + bar + '<span style="font-size:10px;color:#64748b">' + pct + '%</span></td>' +
    '<td style="padding:10px 14px;font-size:12px;color:#64748b">' + notes + '</td>' +
  '</tr>';
}

function clevelRisk(severity, title, description, mitigation) {
  var bgColor = severity === 'HIGH' ? '#fef2f2' : '#fefce8';
  var borderColor = severity === 'HIGH' ? '#dc2626' : '#f59e0b';
  var tagBg = severity === 'HIGH' ? '#fee2e2' : '#fef3c7';
  var tagColor = severity === 'HIGH' ? '#dc2626' : '#92400e';
  return '<div style="background:' + bgColor + ';border:1px solid #e2e8f0;border-left:4px solid ' + borderColor + ';border-radius:8px;padding:16px">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
      '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:' + tagBg + ';color:' + tagColor + '">' + severity + '</span>' +
      '<span style="font-size:14px;font-weight:700;color:#0f172a">' + title + '</span>' +
    '</div>' +
    '<div style="font-size:12px;color:#475569;margin-bottom:8px">' + description + '</div>' +
    '<div style="font-size:12px;color:#166534;background:#ecfdf5;padding:8px;border-radius:6px"><strong>Mitigation:</strong> ' + mitigation + '</div>' +
  '</div>';
}

function clevelDecision(num, title, detail, deadline, priority, impact) {
  var borderColor = priority === 'critical' ? '#dc2626' : '#f59e0b';
  var tagBg = priority === 'critical' ? '#fee2e2' : '#fef3c7';
  var tagColor = priority === 'critical' ? '#dc2626' : '#92400e';
  var tagLabel = priority === 'critical' ? '🔴 URGENT' : '🟡 IMPORTANT';
  return '<div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid ' + borderColor + ';border-radius:8px;padding:16px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
      '<span style="font-size:15px;font-weight:700;color:#0f172a">#' + num + ' ' + title + '</span>' +
      '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:' + tagBg + ';color:' + tagColor + '">' + tagLabel + '</span>' +
    '</div>' +
    '<div style="font-size:13px;color:#0f172a;margin-bottom:6px">' + detail + '</div>' +
    '<div style="font-size:12px;color:#64748b;margin-bottom:6px"><strong>Deadline:</strong> ' + deadline + '</div>' +
    '<div style="font-size:12px;color:#475569;background:#f8fafc;padding:8px;border-radius:6px"><strong>Impact:</strong> ' + impact + '</div>' +
  '</div>';
}

function clevelReportCard(icon, title, file, slides) {
  return '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px">' +
    '<div style="font-size:24px">' + icon + '</div>' +
    '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0f172a">' + title + '</div><div style="font-size:11px;color:#94a3b8">' + slides + '</div></div>' +
    '<a href="/' + file + '" target="_blank" style="padding:6px 12px;background:#00529b;color:#fff;border-radius:6px;text-decoration:none;font-size:11px;font-weight:600">Open</a>' +
    '<a href="/' + file + '" download style="padding:6px 12px;background:#e2e8f0;color:#0f172a;border-radius:6px;text-decoration:none;font-size:11px;font-weight:600">↓</a>' +
  '</div>';
}

// ---- CSV EXPORT ----
function exportCSV() {
  if (!currentData.length) return;
  var keys = Object.keys(currentData[0]);
  var csv = keys.join(',') + '\n';
  currentData.forEach(function(row) {
    csv += keys.map(function(k) {
      var v = String(row[k] || '');
      return v.includes(',') ? '"' + v + '"' : v;
    }).join(',') + '\n';
  });
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = currentPanel + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click(); URL.revokeObjectURL(url);
}

// ---- AUTO LOGIN ----
(function() {
  var saved = localStorage.getItem('adminToken');
  if (saved) {
    adminToken = saved;
    fetch('/api/admin/me', { headers: { 'Authorization': 'Bearer ' + saved } })
      .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function(u) { adminUser = u; showDashboard(); })
      .catch(function() { localStorage.removeItem('adminToken'); });
  }
})();
