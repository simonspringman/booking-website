/* ============================================
   RwandAir Redesign — Application Logic
   Navigation, Search, Booking Flow, Chat, etc.
   ============================================ */

// ---- PAGE NAVIGATION ----
const NAV_MAP = {
  home: 'Book', destinations: 'Destinations',
  travelinfo: 'Travel Info', loyalty: 'Loyalty', help: 'Help'
};

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update active nav link
  const label = NAV_MAP[pageId];
  document.querySelectorAll('.topbar-nav .nav-link').forEach(link => {
    link.classList.toggle('active', link.textContent.trim() === label);
  });
  // Close mobile menu if open
  const mm = document.getElementById('mobileMenu');
  if (mm.classList.contains('open')) mm.classList.remove('open');
}

// ---- MOBILE MENU ----
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ---- SEARCH TABS ----
document.querySelectorAll('.search-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const parent = this.closest('.search-tabs');
    parent.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    // Toggle return field for one-way
    const returnField = document.getElementById('returnField');
    if (returnField) {
      if (this.dataset.tab === 'oneway') {
        returnField.style.display = 'none';
      } else {
        returnField.style.display = 'flex';
      }
    }
  });
});

// ---- SWAP CITIES ----
function swapCities() {
  const from = document.getElementById('searchFrom');
  const to = document.getElementById('searchTo');
  const temp = from.value;
  from.value = to.value;
  to.value = temp;
}

// ---- SET DEFAULT DATES ----
(function setDefaultDates() {
  const depart = document.getElementById('searchDepart');
  const ret = document.getElementById('searchReturn');
  const today = new Date();
  const dep = new Date(today);
  dep.setDate(dep.getDate() + 14);
  const retDate = new Date(dep);
  retDate.setDate(retDate.getDate() + 7);

  if (depart) depart.value = formatDate(dep);
  if (ret) ret.value = formatDate(retDate);
})();

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// ---- SEARCH FLIGHTS ----
function searchFlights() {
  const from = document.getElementById('searchFrom').value;
  const to = document.getElementById('searchTo').value;
  const depart = document.getElementById('searchDepart').value;

  // Validate
  if (!from || !to) {
    showFieldError('searchTo', 'Please enter a destination city or airport');
    return;
  }
  if (!depart) {
    showFieldError('searchDepart', 'Please select a departure date');
    return;
  }

  // Update results page
  document.getElementById('resultFrom').textContent = from;
  document.getElementById('resultTo').textContent = to || 'Nairobi (NBO)';
  document.getElementById('resultDate').textContent =
    formatDateDisplay(depart) + ' \u00b7 1 Adult \u00b7 Round Trip';

  renderFlightResults(from, to);
  navigateTo('results');
}

function selectDestination(city) {
  const codes = { Nairobi: 'NBO', Dubai: 'DXB', Lagos: 'LOS', London: 'LHR', Johannesburg: 'JNB' };
  document.getElementById('searchTo').value = city + ' (' + (codes[city] || city) + ')';
  document.getElementById('searchTo').focus();
  // Scroll to search
  document.getElementById('searchCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.style.borderColor = '#ef4444';
    field.style.boxShadow = '0 0 0 3px rgba(239,68,68,.15)';
    field.focus();
    setTimeout(() => {
      field.style.borderColor = '';
      field.style.boxShadow = '';
    }, 3000);
  }
}

// ---- FLIGHT RESULTS ----
function renderFlightResults(from, to) {
  const container = document.getElementById('flightResults');
  const flights = generateFlights();

  container.innerHTML = '<h3 style="margin-bottom:4px">Outbound Flights</h3>' +
    '<p style="font-size:14px;color:#64748b;margin-bottom:16px">Select your preferred departure flight</p>';

  flights.forEach((f, i) => {
    const seatsHtml = f.seatsLeft <= 5
      ? '<span class="flight-seats-left">' + f.seatsLeft + ' seats left at this price</span>'
      : '';

    container.innerHTML += `
      <div class="flight-card" id="flight-${i}" onclick="selectFlight(${i})">
        <div class="flight-time">
          <div class="time">${f.depTime}</div>
          <div class="code">${f.depCode}</div>
        </div>
        <div class="flight-route-line">
          <div class="duration">${f.duration}</div>
          <div class="line"></div>
          <div class="stops">${f.stops}</div>
        </div>
        <div class="flight-time">
          <div class="time">${f.arrTime}</div>
          <div class="code">${f.arrCode}</div>
        </div>
        <div class="flight-meta">
          <span class="flight-num">${f.flightNum}</span>
          <span>${f.aircraft}</span>
          ${seatsHtml}
        </div>
        <div class="flight-prices">
          <div class="flight-price-opt" onclick="event.stopPropagation();selectFlightPrice(${i},'lite')">
            <div class="price-class">Lite</div>
            <div class="price-amount">$${f.priceLite}</div>
          </div>
          <div class="flight-price-opt selected-price" onclick="event.stopPropagation();selectFlightPrice(${i},'classic')">
            <div class="price-class">Classic</div>
            <div class="price-amount">$${f.priceClassic}</div>
          </div>
          <div class="flight-price-opt" onclick="event.stopPropagation();selectFlightPrice(${i},'business')">
            <div class="price-class">Business</div>
            <div class="price-amount">$${f.priceBusiness}</div>
          </div>
        </div>
      </div>`;
  });

  // Add "Continue" button
  container.innerHTML += `
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <button class="btn-primary btn-lg" onclick="continueToBooking()">
        Continue with Selected Flight
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>`;
}

function generateFlights() {
  return [
    { depTime: '06:30', arrTime: '07:55', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 400', aircraft: 'Boeing 737-800', priceLite: 155, priceClassic: 210, priceBusiness: 580, seatsLeft: 4 },
    { depTime: '08:30', arrTime: '09:55', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 402', aircraft: 'Airbus A330', priceLite: 170, priceClassic: 230, priceBusiness: 620, seatsLeft: 12 },
    { depTime: '14:00', arrTime: '15:25', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 404', aircraft: 'Boeing 737-800', priceLite: 145, priceClassic: 195, priceBusiness: 550, seatsLeft: 8 },
    { depTime: '19:45', arrTime: '21:10', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 406', aircraft: 'Boeing 737-700', priceLite: 135, priceClassic: 180, priceBusiness: 520, seatsLeft: 15 },
  ];
}

function selectFlight(i) {
  document.querySelectorAll('.flight-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('flight-' + i).classList.add('selected');
}

function selectFlightPrice(flightIdx, fareClass) {
  const card = document.getElementById('flight-' + flightIdx);
  card.querySelectorAll('.flight-price-opt').forEach(p => p.classList.remove('selected-price'));

  const classMap = { lite: 0, classic: 1, business: 2 };
  const opts = card.querySelectorAll('.flight-price-opt');
  opts[classMap[fareClass]].classList.add('selected-price');

  selectFlight(flightIdx);
}

function continueToBooking() {
  navigateTo('booking');
  goToStep(1);
}

// ---- BOOKING FLOW ----
let currentStep = 1;

function goToStep(step) {
  currentStep = step;

  // Update step visibility
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById('bookingStep' + i);
    if (el) el.classList.toggle('hidden', i !== step);
  }

  // Update progress indicator
  document.querySelectorAll('.progress-step').forEach(s => {
    const sNum = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (sNum < step) s.classList.add('completed');
    if (sNum === step) s.classList.add('active');
  });

  // Generate seat map if step 2
  if (step === 2) renderSeatMap();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- SEAT MAP ----
function renderSeatMap() {
  const grid = document.getElementById('seatGrid');
  if (!grid || grid.children.length > 0) return;

  const rows = 8;
  const cols = ['A', 'B', 'C', '', 'D', 'E', 'F']; // '' = aisle

  for (let r = 1; r <= rows; r++) {
    cols.forEach((col, ci) => {
      const btn = document.createElement('button');
      if (col === '') {
        btn.className = 'seat-btn aisle';
        btn.textContent = r.toString();
      } else {
        const seatId = r + col;
        const isOccupied = Math.random() < 0.3;
        const isExtraLeg = r <= 2;

        if (isOccupied) {
          btn.className = 'seat-btn occupied';
          btn.textContent = seatId;
          btn.disabled = true;
        } else if (isExtraLeg) {
          btn.className = 'seat-btn extra-legroom';
          btn.textContent = seatId;
          btn.onclick = () => selectSeat(btn, seatId, true);
        } else {
          btn.className = 'seat-btn available';
          btn.textContent = seatId;
          btn.onclick = () => selectSeat(btn, seatId, false);
        }
      }
      grid.appendChild(btn);
    });
  }
}

function selectSeat(btn, seatId, isExtra) {
  document.querySelectorAll('.seat-btn.selected-seat').forEach(s => {
    s.classList.remove('selected-seat');
    if (s.classList.contains('extra-legroom')) {
      // keep extra-legroom class
    }
  });
  btn.classList.add('selected-seat');
  const text = isExtra
    ? 'Selected: Seat ' + seatId + ' (Extra Legroom +$15)'
    : 'Selected: Seat ' + seatId;
  document.getElementById('seatSelectedText').textContent = text;
}

// ---- INLINE VALIDATION ----
['paxFirst', 'paxLast'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function () {
    const val = this.value.trim();
    const valEl = document.getElementById('val' + id.charAt(3).toUpperCase() + id.slice(4));
    if (val.length === 0) {
      this.classList.remove('valid', 'invalid');
      if (valEl) { valEl.textContent = ''; valEl.className = 'field-validation'; }
    } else if (val.length < 2) {
      this.classList.add('invalid');
      this.classList.remove('valid');
      if (valEl) { valEl.textContent = 'Name must be at least 2 characters'; valEl.className = 'field-validation error'; }
    } else {
      this.classList.add('valid');
      this.classList.remove('invalid');
      if (valEl) { valEl.textContent = 'Looks good'; valEl.className = 'field-validation success'; }
    }
  });
});

// ---- PAYMENT ----
function processPayment() {
  const terms = document.getElementById('termsCheck');
  if (!terms.checked) {
    terms.parentElement.style.color = '#ef4444';
    terms.focus();
    setTimeout(() => terms.parentElement.style.color = '', 3000);
    return;
  }

  // Show modal
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('hidden');

  const progressBar = document.getElementById('paymentProgress');
  const stepText = document.getElementById('processingStep');

  const steps = [
    { pct: 25, text: 'Verifying payment details...' },
    { pct: 50, text: 'Connecting to payment provider...' },
    { pct: 75, text: 'Authorizing payment...' },
    { pct: 95, text: 'Finalizing booking...' },
    { pct: 100, text: 'Complete!' }
  ];

  let i = 0;
  function nextStep() {
    if (i >= steps.length) {
      setTimeout(() => {
        modal.classList.add('hidden');
        progressBar.style.width = '0';
        navigateTo('confirmation');
        // Animate miles bar
        setTimeout(() => {
          document.querySelector('.miles-bar-fill').style.width = '24%';
        }, 500);
      }, 600);
      return;
    }
    progressBar.style.width = steps[i].pct + '%';
    stepText.textContent = steps[i].text;
    i++;
    setTimeout(nextStep, 1200);
  }
  nextStep();
}

// ---- CHAT WIDGET ----
function toggleChat() {
  const win = document.getElementById('chatWindow');
  const fab = document.getElementById('chatFab');
  win.classList.toggle('hidden');
  // Hide badge when opened
  if (!win.classList.contains('hidden')) {
    const badge = fab.querySelector('.chat-badge');
    if (badge) badge.style.display = 'none';
  }
}

function openChat() {
  const win = document.getElementById('chatWindow');
  win.classList.remove('hidden');
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  addChatMessage(msg, 'user');
  input.value = '';

  // Remove quick replies after first message
  const qr = document.querySelector('.chat-quick-replies');
  if (qr) qr.remove();

  // Simulate bot response
  setTimeout(() => {
    const responses = {
      default: "Thank you for your message. A member of our team will assist you shortly. In the meantime, you can check our FAQ section for quick answers.",
      booking: "To check your booking status, please provide your booking reference (e.g., WB-2025-NBO-78421) and I'll look it up for you.",
      baggage: "Economy Lite includes 7 kg hand baggage. Economy Classic includes 7 kg hand baggage plus 1 x 23 kg checked bag. Business Class includes 2 x 32 kg checked bags. Would you like to add extra baggage?",
      refund: "I can help with your refund request. Refund eligibility depends on your fare type. Economy Classic and Business fares may be eligible. Please share your booking reference and I'll check your options.",
      checkin: "Online check-in opens 24 hours before departure and closes 3 hours before. You'll need your booking reference and passport. Would you like me to guide you through it?"
    };

    let response = responses.default;
    const lower = msg.toLowerCase();
    if (lower.includes('booking') || lower.includes('status')) response = responses.booking;
    if (lower.includes('bag') || lower.includes('luggage')) response = responses.baggage;
    if (lower.includes('refund') || lower.includes('cancel')) response = responses.refund;
    if (lower.includes('check') && lower.includes('in')) response = responses.checkin;

    addChatMessage(response, 'bot');
  }, 1000);
}

function chatQuickReply(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

function addChatMessage(text, sender) {
  const body = document.getElementById('chatBody');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + sender;
  div.innerHTML = '<div class="chat-bubble">' + escapeHtml(text) + '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- STICKY TOPBAR SHADOW ----
window.addEventListener('scroll', () => {
  const topbar = document.getElementById('topbar');
  if (window.scrollY > 10) {
    topbar.style.boxShadow = '0 2px 12px rgba(0,0,0,.1)';
  } else {
    topbar.style.boxShadow = 'var(--shadow-sm)';
  }
});

// ---- INIT ----
console.log('RwandAir Prototype loaded');
