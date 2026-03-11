/* ============================================
   RwandAir Redesign — Application Logic
   Navigation, Search, Booking Flow, Chat, etc.
   ============================================ */

// ---- PAGE NAVIGATION ----
const NAV_MAP = {
  home: 'Book', destinations: 'Destinations',
  travelinfo: 'Travel Info', loyalty: 'Loyalty',
  cargo: 'Cargo', help: 'Help'
};

// ---- PROMOTIONS DATA ----
const PROMOS = [
  { id: 'flash-dubai', type: 'alert', title: 'Flash Sale: 30% off Kigali to Dubai!', description: 'Book by March 31 for travel through June 2026.', cta: { text: 'Book Now', action: "selectDestination('Dubai')" }, badge: '30% OFF', active: true },
  { id: 'nairobi-deal', type: 'card', title: 'Nairobi Weekender', description: 'Return flights from just $149. Includes 23 kg baggage.', cta: { text: 'See Deals', action: "selectDestination('Nairobi')" }, badge: 'FROM $149', image: 'images/companion-fare.jpg', active: true },
  { id: 'dreammiles-double', type: 'card', title: 'Double DreamMiles', description: 'Earn 2x miles on all Business Class bookings this month.', cta: { text: 'Learn More', action: "navigateTo('loyalty')" }, badge: '2X MILES', image: 'images/dreammiles.jpg', active: true },
  { id: 'london-new', type: 'card', title: 'New Route: Kigali to London', description: 'Now flying 4x weekly with our new A330 service.', cta: { text: 'Explore', action: "selectDestination('London')" }, badge: 'NEW', image: 'images/qatar-codeshare.jpg', active: true }
];

// ---- CHATBOT DATA ----
const CHAT_CITIES = {
  'kigali': { code: 'KGL', name: 'Kigali' }, 'kgl': { code: 'KGL', name: 'Kigali' },
  'nairobi': { code: 'NBO', name: 'Nairobi' }, 'nbo': { code: 'NBO', name: 'Nairobi' },
  'dubai': { code: 'DXB', name: 'Dubai' }, 'dxb': { code: 'DXB', name: 'Dubai' },
  'lagos': { code: 'LOS', name: 'Lagos' }, 'los': { code: 'LOS', name: 'Lagos' },
  'london': { code: 'LHR', name: 'London' }, 'lhr': { code: 'LHR', name: 'London' },
  'johannesburg': { code: 'JNB', name: 'Johannesburg' }, 'jnb': { code: 'JNB', name: 'Johannesburg' },
  'brussels': { code: 'BRU', name: 'Brussels' }, 'bru': { code: 'BRU', name: 'Brussels' },
  'entebbe': { code: 'EBB', name: 'Entebbe' }, 'accra': { code: 'ACC', name: 'Accra' },
  'dar es salaam': { code: 'DAR', name: 'Dar es Salaam' }, 'mumbai': { code: 'BOM', name: 'Mumbai' }
};

const CHAT_SUGGESTIONS = [
  'Fly to Dubai next week', 'Book a flight to Nairobi', 'Check my booking status',
  'Baggage allowance info', 'Ship cargo to Lagos', 'Flight status WB 400',
  'Refund request', 'Check-in help', 'Fly to London next month',
  'Ship 200kg to Nairobi', 'Report lost baggage', 'Claim damaged bag'
];

let chatBookingIntent = { origin: null, destination: null, departDate: null, returnDate: null, passengers: '1 Adult' };
let chatCargoIntent = { origin: null, destination: null, weight: null, type: null, date: null };

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

// ---- CUSTOM SINGLE-MONTH CALENDAR ----
var calTargetInput = null;
var calMonth = new Date().getMonth();
var calYear = new Date().getFullYear();

function openCalendar(inputId) {
  calTargetInput = document.getElementById(inputId);
  var currentVal = calTargetInput.value;
  if (currentVal) {
    var d = new Date(currentVal + 'T00:00:00');
    if (!isNaN(d)) { calMonth = d.getMonth(); calYear = d.getFullYear(); }
  } else {
    calMonth = new Date().getMonth();
    calYear = new Date().getFullYear();
  }
  renderCalendar();
  document.getElementById('calOverlay').classList.remove('hidden');
}

function closeCalendar() {
  document.getElementById('calOverlay').classList.add('hidden');
  calTargetInput = null;
}

function calNavMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function renderCalendar() {
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = months[calMonth] + ' ' + calYear;

  var grid = document.getElementById('calDays');
  grid.innerHTML = '';

  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var selectedVal = calTargetInput ? calTargetInput.value : '';

  // Monday-based: convert Sunday=0 to 7
  var startGap = firstDay === 0 ? 6 : firstDay - 1;
  for (var g = 0; g < startGap; g++) {
    var empty = document.createElement('button');
    empty.className = 'cal-day empty';
    empty.disabled = true;
    grid.appendChild(empty);
  }

  for (var d = 1; d <= daysInMonth; d++) {
    var btn = document.createElement('button');
    btn.className = 'cal-day';
    btn.textContent = d;
    var dateObj = new Date(calYear, calMonth, d);

    if (dateObj < today) btn.classList.add('disabled');
    if (dateObj.toDateString() === today.toDateString()) btn.classList.add('today');
    if (selectedVal === formatDate(dateObj)) btn.classList.add('selected');

    (function(day) {
      btn.onclick = function() {
        var sel = new Date(calYear, calMonth, day);
        if (calTargetInput) calTargetInput.value = formatDate(sel);
        closeCalendar();
      };
    })(d);

    grid.appendChild(btn);
  }
}

function formatDate(d) {
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
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
  hideChatSuggestions();

  // Remove quick replies after first message
  const qr = document.querySelector('.chat-quick-replies');
  if (qr) qr.remove();

  showChatTyping();
  setTimeout(() => {
    removeChatTyping();
    processChatMessage(msg);
  }, 700 + Math.random() * 500);
}

function processChatMessage(msg) {
  const lower = msg.toLowerCase();

  // Handle follow-up for incomplete flight intent
  if (chatBookingIntent.destination && !chatBookingIntent.departDate) {
    const date = extractDate(lower);
    if (date) { chatBookingIntent.departDate = date; showFlightSummaryCard(); return; }
  }
  // Handle follow-up for incomplete cargo intent
  if (chatCargoIntent.destination && !chatCargoIntent.weight) {
    const weight = extractWeight(lower);
    if (weight) { chatCargoIntent.weight = weight; showCargoSummaryCard(); return; }
  }

  const intent = detectChatIntent(lower);
  switch (intent.type) {
    case 'flight_search': handleFlightSearchIntent(lower, intent); break;
    case 'cargo_search': handleCargoSearchIntent(lower, intent); break;
    case 'baggage_claim':
      addChatMessage("I'm sorry about your baggage issue. Let me take you to our easy claims form where you can report it and track the resolution.", 'bot');
      addChatActionChips(['Report Baggage Issue', 'Track Existing Claim'], [() => { navigateTo('baggageclaim'); toggleChat(); }, () => { navigateTo('baggageclaim'); toggleChat(); }]);
      break;
    case 'booking_management':
      addChatMessage("To check your booking, provide your reference (e.g., WB-2025-NBO-78421) or use our Manage Booking page.", 'bot');
      addChatActionChips(['Manage Booking'], [() => { navigateTo('manage'); toggleChat(); }]);
      break;
    case 'checkin':
      addChatMessage("Online check-in opens 24 hours before departure. You'll need your booking reference and passport.", 'bot');
      addChatActionChips(['Open Check-in'], [() => { navigateTo('checkin'); toggleChat(); }]);
      break;
    case 'flight_status':
      addChatMessage("You can check real-time flight status on our Flight Status page.", 'bot');
      addChatActionChips(['Check Flight Status'], [() => { navigateTo('status'); toggleChat(); }]);
      break;
    case 'baggage_info':
      addChatMessage("Lite: 7 kg hand only. Classic: 7 kg hand + 1x23 kg checked. Business: 7 kg hand + 2x32 kg checked. Extra bags can be purchased during booking.", 'bot');
      break;
    case 'refund':
      addChatMessage("Refund eligibility depends on your fare type. Business is fully refundable, Classic may have a fee, Lite is non-refundable. Share your booking reference for more details.", 'bot');
      break;
    default:
      addChatMessage("I can help you with flight bookings, cargo shipping, baggage claims, check-in, flight status, or refunds. What would you like?", 'bot');
      addChatActionChips(
        ['Book a Flight', 'Ship Cargo', 'Baggage Help', 'Check-in'],
        [() => chatQuickReply('I want to book a flight'), () => chatQuickReply('I need to ship cargo'), () => { navigateTo('baggageclaim'); toggleChat(); }, () => { navigateTo('checkin'); toggleChat(); }]
      );
      break;
  }
}

function detectChatIntent(lower) {
  if (lower.match(/\b(fly|flight|book|travel|trip|go to|going to|flying)\b/) && !lower.match(/\b(cargo|ship|freight|kg|kilogram)\b/)) {
    return { type: 'flight_search', destination: extractCity(lower, 'to'), origin: extractCity(lower, 'from') || { code: 'KGL', name: 'Kigali' }, date: extractDate(lower), passengers: extractPassengers(lower) };
  }
  if (lower.match(/\b(cargo|ship|freight|shipping|send|shipment)\b/) || lower.match(/\d+\s*kg/)) {
    return { type: 'cargo_search', destination: extractCity(lower, 'to'), origin: extractCity(lower, 'from') || { code: 'KGL', name: 'Kigali' }, weight: extractWeight(lower) };
  }
  if (lower.match(/\b(lost|missing|delayed|damaged|broken|claim|baggage claim)\b/) && lower.match(/\b(bag|luggage|baggage|suitcase)\b/)) return { type: 'baggage_claim' };
  if (lower.match(/\b(manage|reservation|modify|change)\b/) && !lower.match(/\b(book a|book flight)\b/)) return { type: 'booking_management' };
  if (lower.match(/\bcheck[\s-]?in\b/)) return { type: 'checkin' };
  if (lower.match(/\b(status|track|where is|wb\s?\d)/)) return { type: 'flight_status' };
  if (lower.match(/\b(bag|luggage|baggage|suitcase|allowance)\b/)) return { type: 'baggage_info' };
  if (lower.match(/\b(refund|cancel|money back)\b/)) return { type: 'refund' };
  return { type: 'unknown' };
}

function extractCity(text, direction) {
  const pattern = new RegExp(direction + '\\s+([a-z\\s]+?)(?:\\s+(?:on|in|next|this|tomorrow|from|to|for|with|by|\\d)|$)', 'i');
  const match = text.match(pattern);
  if (match) {
    const candidate = match[1].trim().toLowerCase();
    for (const key of Object.keys(CHAT_CITIES)) {
      if (candidate.startsWith(key) || key.startsWith(candidate)) return CHAT_CITIES[key];
    }
  }
  // Only use fallback (match any city mention) for destination, not origin
  if (direction === 'to') {
    for (const key of Object.keys(CHAT_CITIES).sort((a, b) => b.length - a.length)) {
      if (text.includes(key) && key.length > 2) return CHAT_CITIES[key];
    }
  }
  return null;
}

function extractDate(text) {
  const today = new Date();
  if (text.match(/next\s+week/)) { const d = new Date(today); d.setDate(d.getDate() + 7); return formatDate(d); }
  if (text.match(/next\s+month/)) { const d = new Date(today); d.setMonth(d.getMonth() + 1); return formatDate(d); }
  if (text.includes('tomorrow')) { const d = new Date(today); d.setDate(d.getDate() + 1); return formatDate(d); }
  const daysMatch = text.match(/in\s+(\d+)\s+days?/);
  if (daysMatch) { const d = new Date(today); d.setDate(d.getDate() + parseInt(daysMatch[1])); return formatDate(d); }
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  for (let i = 0; i < months.length; i++) {
    const m = text.match(new RegExp(months[i] + '\\s+(\\d{1,2})', 'i')) || text.match(new RegExp('(\\d{1,2})\\s+' + months[i], 'i'));
    if (m) { const d = new Date(today.getFullYear(), i, parseInt(m[1])); if (d < today) d.setFullYear(d.getFullYear() + 1); return formatDate(d); }
  }
  return null;
}

function extractPassengers(text) {
  const match = text.match(/(\d+)\s*(?:passenger|adult|person|people|pax)/);
  return match ? parseInt(match[1]) + (parseInt(match[1]) === 1 ? ' Adult' : ' Adults') : '1 Adult';
}

function extractWeight(text) {
  const match = text.match(/(\d+)\s*kg/);
  return match ? parseInt(match[1]) : null;
}

// ---- CHAT: Flight Search Intent ----
function handleFlightSearchIntent(lower, intent) {
  if (!intent.destination) {
    addChatMessage("I'd love to help you book a flight! Where would you like to go? Try a city like Dubai, Nairobi, or London.", 'bot');
    return;
  }
  chatBookingIntent.origin = intent.origin || { code: 'KGL', name: 'Kigali' };
  chatBookingIntent.destination = intent.destination;
  chatBookingIntent.departDate = intent.date;
  chatBookingIntent.passengers = intent.passengers || '1 Adult';

  if (!intent.date) {
    addChatMessage("Great! Flying from " + chatBookingIntent.origin.name + " to " + chatBookingIntent.destination.name + ". When would you like to depart? Say 'next week', 'tomorrow', or a date like 'March 25'.", 'bot');
    return;
  }
  showFlightSummaryCard();
}

function handleCargoSearchIntent(lower, intent) {
  if (!intent.destination) {
    addChatMessage("I can help you ship cargo! Where would you like to send it?", 'bot');
    return;
  }
  chatCargoIntent.origin = intent.origin || { code: 'KGL', name: 'Kigali' };
  chatCargoIntent.destination = intent.destination;
  chatCargoIntent.weight = intent.weight;

  if (!intent.weight) {
    addChatMessage("Shipping from " + chatCargoIntent.origin.name + " to " + chatCargoIntent.destination.name + ". What's the approximate weight in kg?", 'bot');
    return;
  }
  showCargoSummaryCard();
}

// ---- CHAT: Summary Cards for Direct Booking ----
function showFlightSummaryCard() {
  const i = chatBookingIntent;
  addChatBubbleHtml('bot',
    '<div class="chat-summary-card">' +
      '<h4>Flight Search</h4>' +
      '<div class="summary-row"><span>From</span><strong>' + escapeHtml(i.origin.name) + '</strong></div>' +
      '<div class="summary-row"><span>To</span><strong>' + escapeHtml(i.destination.name) + '</strong></div>' +
      '<div class="summary-row"><span>Depart</span><strong>' + escapeHtml(formatDateDisplay(i.departDate)) + '</strong></div>' +
      '<div class="summary-row"><span>Pax</span><strong>' + escapeHtml(i.passengers) + '</strong></div>' +
      '<div class="chat-summary-actions">' +
        '<button class="chat-action-edit" onclick="editChatBooking()">Edit</button>' +
        '<button class="chat-action-confirm" onclick="confirmChatFlightSearch()">Search Flights</button>' +
      '</div>' +
    '</div>'
  );
}

function confirmChatFlightSearch() {
  const i = chatBookingIntent;
  document.getElementById('searchFrom').value = i.origin.name + ' (' + i.origin.code + ')';
  document.getElementById('searchTo').value = i.destination.name + ' (' + i.destination.code + ')';
  if (i.departDate) document.getElementById('searchDepart').value = i.departDate;
  if (i.departDate) {
    const dep = new Date(i.departDate + 'T00:00:00');
    dep.setDate(dep.getDate() + 7);
    document.getElementById('searchReturn').value = formatDate(dep);
  }
  addChatMessage("Searching for flights now...", 'bot');
  setTimeout(() => { toggleChat(); searchFlights(); }, 400);
  chatBookingIntent = { origin: null, destination: null, departDate: null, returnDate: null, passengers: '1 Adult' };
}

function editChatBooking() {
  addChatMessage("What would you like to change? Tell me a different destination, date, or number of passengers.", 'bot');
  chatBookingIntent.departDate = null;
}

function showCargoSummaryCard() {
  const i = chatCargoIntent;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  i.date = formatDate(tomorrow);
  addChatBubbleHtml('bot',
    '<div class="chat-summary-card">' +
      '<h4>Cargo Quote</h4>' +
      '<div class="summary-row"><span>From</span><strong>' + escapeHtml(i.origin.name) + '</strong></div>' +
      '<div class="summary-row"><span>To</span><strong>' + escapeHtml(i.destination.name) + '</strong></div>' +
      '<div class="summary-row"><span>Weight</span><strong>' + i.weight + ' kg</strong></div>' +
      '<div class="summary-row"><span>Ship</span><strong>' + escapeHtml(formatDateDisplay(i.date)) + '</strong></div>' +
      '<div class="chat-summary-actions">' +
        '<button class="chat-action-edit" onclick="editChatCargo()">Edit</button>' +
        '<button class="chat-action-confirm" onclick="confirmChatCargoSearch()">Get Quote</button>' +
      '</div>' +
    '</div>'
  );
}

function confirmChatCargoSearch() {
  const i = chatCargoIntent;
  var sel = document.getElementById('cargoOrigin');
  for (var x = 0; x < sel.options.length; x++) if (sel.options[x].value === i.origin.code) { sel.selectedIndex = x; break; }
  sel = document.getElementById('cargoDest');
  for (var x = 0; x < sel.options.length; x++) if (sel.options[x].value === i.destination.code) { sel.selectedIndex = x; break; }
  document.getElementById('cargoWeight').value = i.weight;
  document.getElementById('cargoType').selectedIndex = 1;
  if (i.date) document.getElementById('cargoDate').value = i.date;
  addChatMessage("Getting your cargo quote now...", 'bot');
  setTimeout(() => { toggleChat(); searchCargoQuotes(); }, 400);
  chatCargoIntent = { origin: null, destination: null, weight: null, type: null, date: null };
}

function editChatCargo() {
  addChatMessage("What would you like to change? Update the destination, weight, or cargo type.", 'bot');
  chatCargoIntent.weight = null;
}

// ---- CHAT HELPERS ----
function addChatBubbleHtml(sender, html) {
  const body = document.getElementById('chatBody');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + sender;
  div.innerHTML = html;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function addChatActionChips(labels, callbacks) {
  const body = document.getElementById('chatBody');
  const container = document.createElement('div');
  container.className = 'chat-quick-replies';
  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = function() { container.remove(); if (callbacks[i]) callbacks[i](); };
    container.appendChild(btn);
  });
  body.appendChild(container);
  body.scrollTop = body.scrollHeight;
}

function onChatInput(value) {
  const lower = value.toLowerCase().trim();
  if (lower.length < 2) { hideChatSuggestions(); return; }
  const matches = CHAT_SUGGESTIONS.filter(s => s.toLowerCase().includes(lower) || lower.split(/\s+/).some(w => s.toLowerCase().includes(w))).slice(0, 4);
  if (!matches.length) { hideChatSuggestions(); return; }
  const container = document.getElementById('chatSuggestions');
  container.innerHTML = '';
  matches.forEach(s => {
    const chip = document.createElement('button');
    chip.className = 'chat-suggestion-chip';
    chip.textContent = s;
    chip.onclick = function() { document.getElementById('chatInput').value = s; hideChatSuggestions(); sendChat(); };
    container.appendChild(chip);
  });
  container.classList.remove('hidden');
}

function onChatInputFocus() { const v = document.getElementById('chatInput').value; if (v.length >= 2) onChatInput(v); }
function hideChatSuggestions() { const c = document.getElementById('chatSuggestions'); if (c) c.classList.add('hidden'); }

function showChatTyping() {
  const body = document.getElementById('chatBody');
  const t = document.createElement('div');
  t.className = 'chat-typing'; t.id = 'chatTypingIndicator';
  t.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
  body.appendChild(t); body.scrollTop = body.scrollHeight;
}

function removeChatTyping() { const el = document.getElementById('chatTypingIndicator'); if (el) el.remove(); }

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

// ===========================================================
// CARGO / FREIGHT
// ===========================================================

// Cargo state
let cargoState = {
  origin: '', dest: '', type: '', weight: 0, dims: '', date: '',
  selectedService: '', selectedTotal: 0,
  baseRate: 0
};

// ---- Search Cargo Quotes ----
function searchCargoQuotes() {
  const origin = document.getElementById('cargoOrigin').value;
  const dest = document.getElementById('cargoDest').value;
  const type = document.getElementById('cargoType').value;
  const weight = parseFloat(document.getElementById('cargoWeight').value) || 0;
  const dims = document.getElementById('cargoDims').value;
  const date = document.getElementById('cargoDate').value;

  if (!origin || !dest || !type || weight <= 0 || !date) {
    alert('Please fill in all required fields (Origin, Destination, Cargo Type, Weight, Ship Date).');
    return;
  }
  if (origin === dest) {
    alert('Origin and destination cannot be the same.');
    return;
  }

  cargoState = { origin, dest, type, weight, dims, date, selectedService: '', selectedTotal: 0, baseRate: 0 };
  navigateTo('cargoresults');
  renderCargoResults(weight);
}

// ---- Render Cargo Results ----
function renderCargoResults(weight) {
  document.getElementById('cargoResultOrigin').textContent = cargoState.origin;
  document.getElementById('cargoResultDest').textContent = cargoState.dest;
  document.getElementById('cargoResultMeta').textContent =
    cargoState.type + ' \u00B7 ' + weight + ' kg \u00B7 Ship: ' + cargoState.date;

  // Base rate per kg varies by route distance
  const routeRates = {
    'KGL-NBO': 2.80, 'KGL-DXB': 4.50, 'KGL-LOS': 3.60, 'KGL-LHR': 5.20,
    'KGL-JNB': 3.90, 'KGL-BRU': 5.00, 'NBO-DXB': 3.80, 'NBO-LHR': 4.80,
    'NBO-LOS': 3.20, 'NBO-JNB': 3.50
  };
  const routeKey = cargoState.origin + '-' + cargoState.dest;
  const reverseKey = cargoState.dest + '-' + cargoState.origin;
  const basePerKg = routeRates[routeKey] || routeRates[reverseKey] || 3.50;

  const options = [
    { service: 'Express Cargo', transit: '24-48 hours', multiplier: 1.8, icon: '\u26A1' },
    { service: 'Standard Freight', transit: '3-5 business days', multiplier: 1.0, icon: '\uD83D\uDCE6' },
    { service: 'Economy Freight', transit: '5-7 business days', multiplier: 0.75, icon: '\uD83D\uDCB0' }
  ];

  const container = document.getElementById('cargoQuoteResults');
  container.innerHTML = '';

  options.forEach((opt, i) => {
    const rate = basePerKg * opt.multiplier;
    const total = Math.round(rate * weight * 100) / 100;
    const card = document.createElement('div');
    card.className = 'cargo-quote-card';
    card.id = 'cargoQuote' + i;
    card.onclick = function() { selectCargoQuote(i, opt.service, total, rate); };
    card.innerHTML =
      '<div style="font-size:32px;">' + opt.icon + '</div>' +
      '<div style="flex:1;">' +
        '<h3 style="margin:0 0 4px;">' + opt.service + '</h3>' +
        '<p style="margin:0;color:var(--gray-500);font-size:14px;">Transit: ' + opt.transit + '</p>' +
        '<p style="margin:4px 0 0;font-size:13px;color:var(--gray-400);">$' + rate.toFixed(2) + ' per kg</p>' +
      '</div>' +
      '<div class="cargo-quote-price" style="text-align:right;">' +
        '<strong style="font-size:24px;color:var(--blue);">$' + total.toFixed(2) + '</strong>' +
        '<p style="margin:4px 0 0;font-size:13px;color:var(--gray-500);">Total for ' + weight + ' kg</p>' +
      '</div>';
    container.appendChild(card);
  });

  // Continue button
  const btnDiv = document.createElement('div');
  btnDiv.className = 'form-actions';
  btnDiv.style.marginTop = '20px';
  btnDiv.innerHTML =
    '<button class="btn-primary btn-lg" id="cargoContBtn" onclick="continueToCargoBooking()" disabled>' +
    'Continue to Booking <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
    '</button>';
  container.appendChild(btnDiv);
}

// ---- Select Cargo Quote ----
function selectCargoQuote(i, service, total, rate) {
  cargoState.selectedService = service;
  cargoState.selectedTotal = total;
  cargoState.baseRate = rate;

  document.querySelectorAll('.cargo-quote-card').forEach(function(c) { c.classList.remove('selected'); });
  document.getElementById('cargoQuote' + i).classList.add('selected');
  document.getElementById('cargoContBtn').disabled = false;
}

// ---- Continue to Cargo Booking ----
function continueToCargoBooking() {
  if (!cargoState.selectedService) {
    alert('Please select a cargo quote option.');
    return;
  }

  // Populate sidebar
  document.getElementById('cargoSidebarRoute').innerHTML = cargoState.origin + ' &rarr; ' + cargoState.dest;
  document.getElementById('cargoSidebarService').textContent = cargoState.selectedService;
  document.getElementById('cargoSidebarDate').textContent = cargoState.date;
  document.getElementById('cargoSidebarWeight').textContent = cargoState.weight + ' kg';
  document.getElementById('cargoSidebarType').textContent = cargoState.type;
  document.getElementById('cargoSidebarTotal').textContent = '$' + cargoState.selectedTotal.toFixed(2);

  // Pre-fill step 1
  document.getElementById('cargoBookWeight').value = cargoState.weight;

  navigateTo('cargobooking');
  goToCargoStep(1);
}

// ---- Cargo Step Navigation ----
function goToCargoStep(step) {
  // Hide all steps
  for (var s = 1; s <= 3; s++) {
    var el = document.getElementById('cargoStep' + s);
    if (el) el.classList.toggle('hidden', s !== step);
  }

  // Update progress indicators
  var steps = document.querySelectorAll('#page-cargobooking .progress-step');
  steps.forEach(function(ps) {
    var dataStep = parseInt(ps.getAttribute('data-step'));
    ps.classList.toggle('active', dataStep <= step);
  });

  // On step 3, build the review summary and price breakdown
  if (step === 3) {
    buildCargoReview();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Build Cargo Review ----
function buildCargoReview() {
  var review = document.getElementById('cargoReviewSummary');
  review.innerHTML =
    '<div class="confirm-segment" style="margin-bottom:20px;">' +
      '<span class="confirm-badge">Route</span>' +
      '<p><strong>' + cargoState.origin + ' \u2192 ' + cargoState.dest + '</strong> &mdash; ' + cargoState.selectedService + '</p>' +
      '<p>Ship Date: ' + cargoState.date + '</p>' +
    '</div>' +
    '<div class="confirm-segment" style="margin-bottom:20px;">' +
      '<span class="confirm-badge">Cargo</span>' +
      '<p>' + (document.getElementById('cargoBookType').value || cargoState.type) +
        ' &mdash; ' + (document.getElementById('cargoPieces').value || 1) + ' piece(s), ' +
        (document.getElementById('cargoBookWeight').value || cargoState.weight) + ' kg</p>' +
      '<p>' + (document.getElementById('cargoDesc').value || 'No description') + '</p>' +
    '</div>' +
    '<div class="confirm-segment" style="margin-bottom:20px;">' +
      '<span class="confirm-badge">Shipper</span>' +
      '<p>' + (document.getElementById('shipperCompany').value || '-') + ' &mdash; ' +
        (document.getElementById('shipperContact').value || '-') + '</p>' +
      '<p>' + (document.getElementById('shipperEmail').value || '') + ' | ' +
        (document.getElementById('shipperPhone').value || '') + '</p>' +
    '</div>' +
    '<div class="confirm-segment" style="margin-bottom:20px;">' +
      '<span class="confirm-badge">Consignee</span>' +
      '<p>' + (document.getElementById('consigneeCompany').value || '-') + ' &mdash; ' +
        (document.getElementById('consigneeContact').value || '-') + '</p>' +
      '<p>' + (document.getElementById('consigneeEmail').value || '') + ' | ' +
        (document.getElementById('consigneePhone').value || '') + '</p>' +
    '</div>';

  // Price breakdown
  var basePrice = cargoState.selectedTotal;
  var fuel = Math.round(basePrice * 0.12 * 100) / 100;
  var security = Math.round(basePrice * 0.04 * 100) / 100;
  var extras = 0;
  if (document.getElementById('cargoTempControl').checked) extras += 120;
  if (document.getElementById('cargoDG').checked) extras += 200;
  if (document.getElementById('cargoInsurance').checked) extras += 85;

  var total = basePrice + fuel + security + extras;

  document.getElementById('cargoBasePrice').textContent = '$' + basePrice.toFixed(2);
  document.getElementById('cargoFuelPrice').textContent = '$' + fuel.toFixed(2);
  document.getElementById('cargoSecPrice').textContent = '$' + security.toFixed(2);

  var extrasRow = document.getElementById('cargoExtrasRow');
  if (extras > 0) {
    extrasRow.classList.remove('hidden');
    document.getElementById('cargoExtrasAmount').textContent = '$' + extras.toFixed(2);
  } else {
    extrasRow.classList.add('hidden');
  }

  document.getElementById('cargoTotalPrice').textContent = '$' + total.toFixed(2);
  document.getElementById('cargoSidebarTotal').textContent = '$' + total.toFixed(2);
}

// ---- Cargo Payment Tab ----
function selectCargoPayTab(btn, formId) {
  btn.parentElement.querySelectorAll('.payment-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('cargoPayMobile').classList.add('hidden');
  document.getElementById('cargoPayCard').classList.add('hidden');
  document.getElementById('cargoPayBank').classList.add('hidden');
  document.getElementById(formId).classList.remove('hidden');
}

// ---- Process Cargo Payment ----
function processCargoPayment() {
  if (!document.getElementById('cargoTermsCheck').checked) {
    alert('Please agree to the Cargo Terms & Conditions to proceed.');
    return;
  }

  var modal = document.getElementById('cargoPaymentModal');
  var progress = document.getElementById('cargoPaymentProgress');
  var stepText = document.getElementById('cargoProcessingStep');
  modal.classList.remove('hidden');

  var steps = [
    { pct: 25, text: 'Verifying payment details...' },
    { pct: 50, text: 'Processing payment...' },
    { pct: 75, text: 'Generating Air Waybill...' },
    { pct: 100, text: 'Complete!' }
  ];

  var idx = 0;
  var interval = setInterval(function() {
    if (idx < steps.length) {
      progress.style.width = steps[idx].pct + '%';
      stepText.textContent = steps[idx].text;
      idx++;
    } else {
      clearInterval(interval);
      modal.classList.add('hidden');
      showCargoConfirmation();
    }
  }, 800);
}

// ---- Show Cargo Confirmation ----
function showCargoConfirmation() {
  // Generate AWB
  var awb = '459-' + Math.floor(10000000 + Math.random() * 90000000);
  document.getElementById('cargoAwbNumber').textContent = awb;

  document.getElementById('cargoConfOrigin').textContent = cargoState.origin;
  document.getElementById('cargoConfDest').textContent = cargoState.dest;

  // Transit time based on service
  var transit = '3-5 business days';
  if (cargoState.selectedService === 'Express Cargo') transit = '24-48 hours';
  if (cargoState.selectedService === 'Economy Freight') transit = '5-7 business days';
  document.getElementById('cargoConfTransit').textContent = transit;

  document.getElementById('cargoConfDetails').textContent =
    cargoState.type + ' \u00B7 ' +
    (document.getElementById('cargoPieces').value || 1) + ' pc(s) \u00B7 ' +
    (document.getElementById('cargoBookWeight').value || cargoState.weight) + ' kg \u00B7 ' +
    cargoState.selectedService;

  document.getElementById('cargoConfShipper').textContent =
    (document.getElementById('shipperCompany').value || '-') + ' \u2014 ' +
    (document.getElementById('shipperContact').value || '-') + ', ' +
    (document.getElementById('shipperCity').value || '') + ', ' +
    (document.getElementById('shipperCountry').value || '');

  document.getElementById('cargoConfConsignee').textContent =
    (document.getElementById('consigneeCompany').value || '-') + ' \u2014 ' +
    (document.getElementById('consigneeContact').value || '-') + ', ' +
    (document.getElementById('consigneeCity').value || '') + ', ' +
    (document.getElementById('consigneeCountry').value || '');

  document.getElementById('cargoConfTotal').textContent =
    document.getElementById('cargoTotalPrice').textContent + ' USD';

  navigateTo('cargoconfirmation');
}

// ---- Track Cargo ----
function trackCargo() {
  var awb = document.getElementById('cargoAwbInput').value.trim();
  if (!awb) {
    alert('Please enter an AWB number.');
    return;
  }

  var result = document.getElementById('cargoTrackResult');
  result.classList.remove('hidden');

  var events = [
    { status: 'Booked', detail: 'Shipment booked and confirmed', time: '2 days ago', cls: 'completed' },
    { status: 'Received at Origin', detail: 'Cargo received at KGL warehouse', time: '1 day ago', cls: 'completed' },
    { status: 'In Transit', detail: 'Departed Kigali International Airport', time: '12 hours ago', cls: 'active' },
    { status: 'Arrived at Destination', detail: 'Expected arrival at destination hub', time: 'Pending', cls: '' },
    { status: 'Delivered', detail: 'Delivered to consignee', time: 'Pending', cls: '' }
  ];

  var html = '<h3 style="margin-bottom:8px;">AWB: ' + escapeHtml(awb) + '</h3>' +
    '<p style="color:var(--gray-500);margin-bottom:16px;">' + cargoState.origin + ' \u2192 ' + cargoState.dest + ' &mdash; In Transit</p>' +
    '<div class="cargo-track-timeline">';

  events.forEach(function(e) {
    html += '<div class="cargo-track-event ' + e.cls + '">' +
      '<div><strong>' + e.status + '</strong><span>' + e.detail + '</span><span style="font-size:12px;color:var(--gray-400);">' + e.time + '</span></div>' +
    '</div>';
  });

  html += '</div>';
  result.innerHTML = html;
}

// ---- Set default cargo date to tomorrow ----
(function() {
  var dateEl = document.getElementById('cargoDate');
  if (dateEl) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateEl.min = tomorrow.toISOString().split('T')[0];
    dateEl.value = tomorrow.toISOString().split('T')[0];
  }
})();

// ===========================================================
// PROMO ALERT BAR & CARDS
// ===========================================================
function initPromoAlertBar() {
  const alertPromo = PROMOS.find(p => p.type === 'alert' && p.active);
  const bar = document.getElementById('promoAlertBar');
  if (!alertPromo || !bar) { if (bar) bar.style.display = 'none'; return; }
  if (sessionStorage.getItem('promo-dismissed-' + alertPromo.id)) { bar.style.display = 'none'; return; }
  document.getElementById('promoAlertBadge').textContent = alertPromo.badge || 'PROMO';
  document.getElementById('promoAlertText').textContent = alertPromo.title;
  var ctaBtn = document.getElementById('promoAlertCta');
  ctaBtn.textContent = alertPromo.cta.text;
  ctaBtn.setAttribute('onclick', alertPromo.cta.action);
  bar.dataset.promoId = alertPromo.id;
}

function dismissPromoAlert() {
  var bar = document.getElementById('promoAlertBar');
  if (bar) { sessionStorage.setItem('promo-dismissed-' + bar.dataset.promoId, '1'); bar.classList.add('dismissed'); }
}

function renderPromoCards() {
  var grid = document.getElementById('promoGrid');
  if (!grid) return;
  var cards = PROMOS.filter(function(p) { return p.type === 'card' && p.active; });
  if (!cards.length) { document.getElementById('promoSection').style.display = 'none'; return; }
  grid.innerHTML = '';
  cards.forEach(function(promo) {
    var card = document.createElement('div');
    card.className = 'promo-card';
    card.innerHTML =
      '<div class="promo-card-img" style="background-image:url(\'' + (promo.image || 'images/7days-flights.jpg') + '\')">' +
        (promo.badge ? '<span class="promo-card-badge">' + escapeHtml(promo.badge) + '</span>' : '') +
      '</div><div class="promo-card-body"><h3>' + escapeHtml(promo.title) + '</h3><p>' + escapeHtml(promo.description) +
      '</p><button class="promo-card-cta" onclick="' + promo.cta.action + '">' + escapeHtml(promo.cta.text) +
      ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button></div>';
    grid.appendChild(card);
  });
}

// ===========================================================
// BAGGAGE CLAIMS
// ===========================================================
var currentClaimType = 'delayed';

function selectClaimType(el, type) {
  currentClaimType = type;
  document.querySelectorAll('.claim-type-card').forEach(function(c) { c.classList.remove('active'); });
  el.classList.add('active');
  var titles = { delayed: 'Report Delayed Baggage', damaged: 'Report Damaged Baggage', lost: 'Report Lost Baggage', feedback: 'General Feedback' };
  var subs = {
    delayed: 'Please provide your flight and baggage details so we can locate your bag.',
    damaged: 'Tell us about the damage so we can process your claim quickly.',
    lost: 'We will do everything we can to find and return your baggage.',
    feedback: 'We value your feedback. Please share your experience with us.'
  };
  document.getElementById('claimFormTitle').textContent = titles[type] || titles.delayed;
  document.getElementById('claimFormSub').textContent = subs[type] || subs.delayed;
  goClaimStep(1);
}

function goClaimStep(step) {
  for (var s = 1; s <= 3; s++) {
    var el = document.getElementById('claimStep' + s);
    if (el) el.classList.toggle('hidden', s !== step);
  }
  document.getElementById('claimConfirmation').classList.add('hidden');
  var pcts = { 1: '33%', 2: '66%', 3: '100%' };
  document.getElementById('claimProgressFill').style.width = pcts[step] || '33%';

  if (step === 3) buildClaimReview();
}

function buildClaimReview() {
  var html = '';
  var rows = [
    ['Claim Type', currentClaimType.charAt(0).toUpperCase() + currentClaimType.slice(1) + ' Baggage'],
    ['Booking Ref', document.getElementById('claimBookingRef').value || '-'],
    ['Flight', document.getElementById('claimFlightNum').value || '-'],
    ['Date', document.getElementById('claimFlightDate').value || '-'],
    ['Route', (document.getElementById('claimFromCity').value || '?') + ' \u2192 ' + (document.getElementById('claimToCity').value || '?')],
    ['Name', document.getElementById('claimFullName').value || '-'],
    ['Email', document.getElementById('claimEmail').value || '-'],
    ['Phone', document.getElementById('claimPhone').value || '-'],
    ['Bag Tag', document.getElementById('claimBagTag').value || 'N/A'],
    ['Bag', (document.getElementById('claimBagColor').value || '') + ' ' + (document.getElementById('claimBagType').value || '')]
  ];
  rows.forEach(function(r) {
    html += '<div class="claim-review-row"><span>' + r[0] + '</span><span>' + escapeHtml(r[1]) + '</span></div>';
  });
  var desc = document.getElementById('claimBagDesc').value;
  if (desc) html += '<div style="margin-top:12px;font-size:13px;color:var(--gray-500);">' + escapeHtml(desc) + '</div>';
  document.getElementById('claimReviewContent').innerHTML = html;
}

function submitBaggageClaim() {
  if (!document.getElementById('claimAgree').checked) {
    alert('Please confirm the information is accurate to submit.');
    return;
  }
  var ref = 'BC-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('claimRefNum').textContent = ref;
  for (var s = 1; s <= 3; s++) document.getElementById('claimStep' + s).classList.add('hidden');
  document.getElementById('claimConfirmation').classList.remove('hidden');
  document.getElementById('claimProgressFill').style.width = '100%';
}

function resetBaggageClaim() {
  document.getElementById('claimConfirmation').classList.add('hidden');
  document.getElementById('claimStep1').classList.remove('hidden');
  document.getElementById('claimProgressFill').style.width = '33%';
  // Clear form
  ['claimBookingRef','claimFlightNum','claimFlightDate','claimFromCity','claimToCity','claimFullName','claimEmail','claimPhone','claimBagTag','claimBagColor','claimBagType','claimBagDesc'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? '' : '';
  });
  document.getElementById('claimAgree').checked = false;
}

function trackBaggageClaim() {
  var ref = document.getElementById('claimTrackRef').value.trim();
  if (!ref) { alert('Please enter a claim reference number.'); return; }
  var result = document.getElementById('claimTrackResult');
  result.classList.remove('hidden');
  result.innerHTML =
    '<div style="padding:16px;background:var(--sky-light);border:1px solid rgba(30,162,220,.2);border-radius:var(--radius-sm);">' +
      '<h3 style="margin-bottom:8px;">Claim: ' + escapeHtml(ref) + '</h3>' +
      '<div class="claim-review-row"><span>Status</span><span style="color:var(--warning);font-weight:700;">Under Investigation</span></div>' +
      '<div class="claim-review-row"><span>Filed</span><span>Today</span></div>' +
      '<div class="claim-review-row"><span>Expected Resolution</span><span>Within 48 hours</span></div>' +
      '<p style="margin-top:12px;font-size:13px;color:var(--gray-500);">Our team is actively investigating. You will receive an email update once we have more information.</p>' +
    '</div>';
}

// ---- INIT ----
initPromoAlertBar();
renderPromoCards();
console.log('RwandAir Prototype loaded');
