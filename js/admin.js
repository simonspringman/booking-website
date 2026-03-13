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

  var reports = [
    { file: 'ceo-dashboard.html', icon: '👤', title: 'CEO Dashboard', desc: 'Strategic overview — KPIs, revenue trends, digital transformation progress, route network, 90-day outlook.', slides: 10, audience: 'Chief Executive Officer' },
    { file: 'cfo-revenue-report.html', icon: '💰', title: 'CFO Revenue & ROI Report', desc: 'Financial deep-dive — revenue by channel, payment mix, route profitability, ancillary revenue, ROI projections, budget vs actuals.', slides: 10, audience: 'Chief Financial Officer' },
    { file: 'cto-tech-report.html', icon: '⚙', title: 'CTO Technical Status', desc: 'Architecture, API migration status, platform capabilities, tech stack, security & compliance, technical debt, performance targets.', slides: 11, audience: 'Chief Technology Officer' },
    { file: 'coo-operations-report.html', icon: '📋', title: 'COO Operations Report', desc: 'Booking funnel, route performance, channel distribution, T2T holds, customer service metrics, passenger & office operations.', slides: 10, audience: 'Chief Operating Officer' },
    { file: 'board-summary.html', icon: '🏛', title: 'Board Summary', desc: 'Concise board-level briefing — executive summary, KPIs, financial highlights, strategic progress, risk register, decisions required.', slides: 8, audience: 'Board of Directors' },
    { file: 'migration-plan.html', icon: '🚀', title: 'Migration Plan', desc: 'Production migration roadmap — Amadeus Digital APIs integration, 5 phases, 14–18 weeks timeline, team requirements, risk matrix.', slides: 12, audience: 'All C-Level / Technical Leadership' }
  ];

  summary.innerHTML = summaryCard('Total Reports', reports.length, '', 'blue') +
    summaryCard('Total Slides', reports.reduce(function(s, r) { return s + r.slides; }, 0), '', 'green') +
    summaryCard('Period', 'Q1 2026', '', 'yellow');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  var container = document.getElementById('adminSummary');
  var cardsHtml = '<div style="grid-column:1/-1;margin-top:16px">' +
    '<p style="color:#64748b;font-size:14px;margin-bottom:20px">Download executive presentations as self-contained HTML files. Open in any browser, print-friendly, no internet required.</p>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">';

  reports.forEach(function(r) {
    cardsHtml += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:8px">' +
      '<div style="font-size:32px">' + r.icon + '</div>' +
      '<div style="font-size:16px;font-weight:700;color:#0f172a">' + r.title + '</div>' +
      '<div style="font-size:12px;color:#64748b;flex:1">' + r.desc + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">' +
        '<span style="font-size:11px;color:#94a3b8">' + r.slides + ' slides &bull; ' + r.audience + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:4px">' +
        '<a href="/' + r.file + '" target="_blank" style="flex:1;text-align:center;padding:8px 12px;background:#00529b;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">Open ↗</a>' +
        '<a href="/' + r.file + '" download style="flex:1;text-align:center;padding:8px 12px;background:#e2e8f0;color:#0f172a;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">Download ↓</a>' +
      '</div>' +
    '</div>';
  });

  cardsHtml += '</div></div>';
  container.innerHTML += cardsHtml;
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
