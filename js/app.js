/* ============================================
   RwandAir Redesign — Application Logic
   Navigation, Search, Booking Flow, Chat, etc.
   ============================================ */

// ---- NLF DATA ----
const NLF_DESTINATIONS = [
  { city: 'Kigali', code: 'KGL', country: 'Rwanda' },
  { city: 'Nairobi', code: 'NBO', country: 'Kenya' },
  { city: 'Johannesburg', code: 'JNB', country: 'South Africa' },
  { city: 'Lagos', code: 'LOS', country: 'Nigeria' },
  { city: 'Accra', code: 'ACC', country: 'Ghana' },
  { city: 'Entebbe', code: 'EBB', country: 'Uganda' },
  { city: 'Dar es Salaam', code: 'DAR', country: 'Tanzania' },
  { city: 'Lusaka', code: 'LUN', country: 'Zambia' },
  { city: 'Harare', code: 'HRE', country: 'Zimbabwe' },
  { city: 'Kinshasa', code: 'FIH', country: 'DR Congo' },
  { city: 'Bujumbura', code: 'BJM', country: 'Burundi' },
  { city: 'Addis Ababa', code: 'ADD', country: 'Ethiopia' },
  { city: 'Douala', code: 'DLA', country: 'Cameroon' },
  { city: 'Dubai', code: 'DXB', country: 'UAE' },
  { city: 'London', code: 'LHR', country: 'United Kingdom' },
  { city: 'Brussels', code: 'BRU', country: 'Belgium' },
  { city: 'Paris', code: 'CDG', country: 'France' },
  { city: 'Mumbai', code: 'BOM', country: 'India' },
  { city: 'Guangzhou', code: 'CAN', country: 'China' },
];
const NLF_PASSENGERS = ['1 adult', '2 adults', '3 adults', '1 adult, 1 child', '2 adults, 1 child', '2 adults, 2 children'];
const NLF_CLASSES = ['Economy', 'Business'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['january','february','march','april','may','june','july','august','september','october','november','december'];

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
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
  const nlfVisible = document.getElementById('nlfCard') && !document.getElementById('nlfCard').classList.contains('hidden');

  // Validate
  if (!from || !to) {
    if (nlfVisible) showNLFGapError('nlfGapTo');
    else showFieldError('searchTo', 'Please enter a destination city or airport');
    return;
  }
  if (!depart) {
    if (nlfVisible) showNLFGapError('nlfGapDepart');
    else showFieldError('searchDepart', 'Please select a departure date');
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
  const dest = NLF_DESTINATIONS.find(d => d.city === city);
  const value = dest ? city + ' (' + dest.code + ')' : city;
  document.getElementById('searchTo').value = value;

  // Update NLF gap if visible
  const nlfGap = document.getElementById('nlfGapTo');
  const nlfCard = document.getElementById('nlfCard');
  if (nlfGap && nlfCard && !nlfCard.classList.contains('hidden')) {
    nlfGap.textContent = value;
    nlfGap.classList.remove('nlf-gap--empty');
    nlfGap.classList.add('nlf-gap--filled');
    nlfCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    document.getElementById('searchCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
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
          <div class="flight-price-opt selected-price" onclick="event.stopPropagation();selectFlightPrice(${i},'economy')">
            <div class="price-class">Economy</div>
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

  const classMap = { lite: 0, economy: 1, classic: 1, business: 2 };
  const opts = card.querySelectorAll('.flight-price-opt');
  opts[classMap[fareClass]].classList.add('selected-price');

  selectFlight(flightIdx);
}

function continueToBooking() {
  navigateTo('booking');
  goToStep(1);
}

// Navigate to a completed step (back navigation via progress bar)
function goToCompletedStep(step) {
  if (step < currentStep) goToStep(step);
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
    ? 'Selected: Seat ' + seatId + ' (Extra Legroom — $15)'
    : 'Selected: Seat ' + seatId + ' — $5';
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

// ---- NATURAL LANGUAGE FORM ----
function initNLF() {
  // Set default dates
  const today = new Date();
  const dep = new Date(today); dep.setDate(dep.getDate() + 14);
  const ret = new Date(dep); ret.setDate(ret.getDate() + 7);
  document.getElementById('searchDepart').value = formatDate(dep);
  document.getElementById('searchReturn').value = formatDate(ret);

  const gapDepart = document.getElementById('nlfGapDepart');
  const gapReturn = document.getElementById('nlfGapReturn');
  if (gapDepart) { gapDepart.textContent = formatDateDisplay(formatDate(dep)); gapDepart.classList.add('nlf-gap--filled'); gapDepart.classList.remove('nlf-gap--empty'); }
  if (gapReturn) { gapReturn.textContent = formatDateDisplay(formatDate(ret)); gapReturn.classList.add('nlf-gap--filled'); gapReturn.classList.remove('nlf-gap--empty'); }

  // City gap events
  ['nlfGapFrom', 'nlfGapTo'].forEach(id => {
    const gap = document.getElementById(id);
    if (!gap) return;
    // Use both focus and click to ensure suggestions appear on first interaction
    function activateGap() {
      if (gap.classList.contains('nlf-gap--empty')) { gap.textContent = ''; gap.classList.remove('nlf-gap--empty'); }
      // Place cursor at end
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(gap);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch(e) {}
      showSuggestions(gap, '');
    }
    gap.addEventListener('focus', function() { setTimeout(activateGap, 0); });
    gap.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent document click from hiding suggestions
      activateGap();
    });
    gap.addEventListener('input', function() {
      const q = this.textContent.trim();
      showSuggestions(this, q);
      updateGhostText(this, q);
    });
    gap.addEventListener('keydown', function(e) { handleNLFKeydown(e, this); });
    gap.addEventListener('blur', function() {
      setTimeout(() => {
        hideSuggestions(this);
        hideGhost(this);
        if (!this.textContent.trim()) {
          this.textContent = this.dataset.placeholder;
          this.classList.add('nlf-gap--empty');
          this.classList.remove('nlf-gap--filled');
        }
      }, 200);
    });
  });

  // Date gap events
  ['nlfGapDepart', 'nlfGapReturn'].forEach(id => {
    const gap = document.getElementById(id);
    if (!gap) return;
    gap.addEventListener('focus', function() {
      if (this.classList.contains('nlf-gap--filled')) {
        this.dataset.prevValue = this.textContent;
        this.textContent = '';
      } else { this.textContent = ''; }
      hideGhost(this);
    });
    gap.addEventListener('input', function() {
      const q = this.textContent.trim();
      updateDateGhost(this, q);
      // Make ghost clickable for date acceptance
      const wrapper = this.closest('.nlf-gap-wrapper');
      const ghost = wrapper.querySelector('.nlf-ghost');
      if (ghost && !ghost.dataset.clickBound) {
        ghost.style.cursor = 'pointer';
        ghost.addEventListener('mousedown', function(e) {
          e.preventDefault();
          if (gap.dataset.parsedDate) acceptDate(gap);
        });
        ghost.dataset.clickBound = 'true';
      }
    });
    gap.addEventListener('keydown', function(e) { handleDateKeydown(e, this); });
    gap.addEventListener('blur', function() {
      setTimeout(() => {
        hideGhost(this);
        if (!this.textContent.trim() || !this.dataset.parsedDate) {
          // Restore previous value or placeholder
          const prev = this.dataset.prevValue;
          if (prev) { this.textContent = prev; this.classList.add('nlf-gap--filled'); }
          else { this.textContent = this.dataset.placeholder; this.classList.add('nlf-gap--empty'); this.classList.remove('nlf-gap--filled'); }
        }
      }, 150);
    });
  });

  // Passengers gap — type-ahead
  const paxGap = document.getElementById('nlfGapPax');
  if (paxGap) {
    paxGap.addEventListener('focus', function() {
      if (this.classList.contains('nlf-gap--empty')) { this.textContent = ''; }
      else { this.dataset.prevValue = this.textContent; this.textContent = ''; }
      showOptionSuggestions(this, '', NLF_PASSENGERS, 'searchPax');
    });
    paxGap.addEventListener('input', function() {
      const q = this.textContent.trim();
      showOptionSuggestions(this, q, NLF_PASSENGERS, 'searchPax');
      updateOptionGhost(this, q, NLF_PASSENGERS);
    });
    paxGap.addEventListener('keydown', function(e) { handleOptionKeydown(e, this, NLF_PASSENGERS, 'searchPax'); });
    paxGap.addEventListener('blur', function() {
      setTimeout(() => {
        hideSuggestions(this); hideGhost(this);
        if (!this.textContent.trim() || this.classList.contains('nlf-gap--empty')) {
          const prev = this.dataset.prevValue || '1 adult';
          this.textContent = prev; this.classList.add('nlf-gap--filled'); this.classList.remove('nlf-gap--empty');
        }
      }, 200);
    });
  }

  // Class gap — type-ahead
  const classGap = document.getElementById('nlfGapClass');
  if (classGap) {
    classGap.addEventListener('focus', function() {
      if (this.classList.contains('nlf-gap--empty')) { this.textContent = ''; }
      else { this.dataset.prevValue = this.textContent; this.textContent = ''; }
      showOptionSuggestions(this, '', NLF_CLASSES, 'searchClass');
    });
    classGap.addEventListener('input', function() {
      const q = this.textContent.trim();
      showOptionSuggestions(this, q, NLF_CLASSES, 'searchClass');
      updateOptionGhost(this, q, NLF_CLASSES);
    });
    classGap.addEventListener('keydown', function(e) { handleOptionKeydown(e, this, NLF_CLASSES, 'searchClass'); });
    classGap.addEventListener('blur', function() {
      setTimeout(() => {
        hideSuggestions(this); hideGhost(this);
        if (!this.textContent.trim() || this.classList.contains('nlf-gap--empty')) {
          const prev = this.dataset.prevValue || 'Economy';
          this.textContent = prev; this.classList.add('nlf-gap--filled'); this.classList.remove('nlf-gap--empty');
        }
      }, 200);
    });
  }

  // Trip toggle
  document.querySelectorAll('.nlf-trip-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.nlf-trip-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const clause = document.getElementById('nlfReturnClause');
      if (this.dataset.trip === 'oneway') clause.style.display = 'none';
      else clause.style.display = '';
    });
  });

  // Close suggestions on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nlf-gap-wrapper')) {
      document.querySelectorAll('.nlf-suggestions').forEach(s => s.style.display = 'none');
      document.querySelectorAll('.nlf-ghost').forEach(g => g.style.display = 'none');
    }
  });
}

// City autocomplete
function showSuggestions(gap, query) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  let box = wrapper.querySelector('.nlf-suggestions');
  if (!box) { box = document.createElement('div'); box.className = 'nlf-suggestions'; wrapper.appendChild(box); }

  const q = query.toLowerCase();
  const matches = NLF_DESTINATIONS.filter(d =>
    d.city.toLowerCase().startsWith(q) || d.code.toLowerCase().startsWith(q) || d.country.toLowerCase().startsWith(q)
  ).slice(0, 4);

  if (matches.length === 0 || (matches.length === 1 && matches[0].city.toLowerCase() + ' (' + matches[0].code.toLowerCase() + ')' === q.toLowerCase())) {
    box.style.display = 'none'; return;
  }

  box.innerHTML = matches.map((d, i) =>
    '<div class="nlf-suggestion-item' + (i === 0 ? ' nlf-suggestion-item--active' : '') + '" data-value="' + d.city + ' (' + d.code + ')">' +
    '<span>' + d.city + ', ' + d.country + '</span><span class="nlf-suggestion-code">' + d.code + '</span></div>'
  ).join('');
  box.style.display = 'block';

  box.querySelectorAll('.nlf-suggestion-item').forEach(item => {
    item.addEventListener('mousedown', function(e) {
      e.preventDefault();
      acceptCitySuggestion(gap, this.dataset.value);
    });
  });
}

function hideSuggestions(gap) {
  const box = gap.closest('.nlf-gap-wrapper').querySelector('.nlf-suggestions');
  if (box) box.style.display = 'none';
}

function updateGhostText(gap, query) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  let ghost = wrapper.querySelector('.nlf-ghost');
  if (!ghost) { ghost = document.createElement('span'); ghost.className = 'nlf-ghost'; wrapper.appendChild(ghost); }

  if (!query) { ghost.style.display = 'none'; return; }

  const q = query.toLowerCase();
  const match = NLF_DESTINATIONS.find(d => d.city.toLowerCase().startsWith(q) || d.code.toLowerCase().startsWith(q));
  if (match) {
    const full = match.city + ' (' + match.code + ')';
    const rest = full.substring(query.length);
    ghost.textContent = rest;
    ghost.style.display = 'inline';
  } else { ghost.style.display = 'none'; }
}

function hideGhost(gap) {
  const ghost = gap.closest('.nlf-gap-wrapper').querySelector('.nlf-ghost');
  if (ghost) ghost.style.display = 'none';
}

function acceptCitySuggestion(gap, value) {
  gap.textContent = value;
  gap.classList.remove('nlf-gap--empty', 'nlf-gap--error');
  gap.classList.add('nlf-gap--filled');
  hideSuggestions(gap);
  hideGhost(gap);

  // Sync hidden input
  const hiddenId = gap.id === 'nlfGapFrom' ? 'searchFrom' : 'searchTo';
  document.getElementById(hiddenId).value = value;

  // Auto-advance
  advanceNLF(gap.id);
}

function handleNLFKeydown(e, gap) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  const box = wrapper.querySelector('.nlf-suggestions');

  if (e.key === 'Tab' || e.key === 'ArrowRight') {
    // Accept ghost suggestion
    const ghost = wrapper.querySelector('.nlf-ghost');
    if (ghost && ghost.style.display !== 'none' && ghost.textContent) {
      e.preventDefault();
      const full = gap.textContent + ghost.textContent;
      acceptCitySuggestion(gap, full);
      return;
    }
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    // Accept first suggestion
    if (box && box.style.display !== 'none') {
      const active = box.querySelector('.nlf-suggestion-item--active');
      if (active) { acceptCitySuggestion(gap, active.dataset.value); return; }
    }
    // Or accept current text
    const val = gap.textContent.trim();
    if (val) acceptCitySuggestion(gap, val);
  }

  if (e.key === 'ArrowDown' && box && box.style.display !== 'none') {
    e.preventDefault();
    const items = box.querySelectorAll('.nlf-suggestion-item');
    let idx = [...items].findIndex(i => i.classList.contains('nlf-suggestion-item--active'));
    items.forEach(i => i.classList.remove('nlf-suggestion-item--active'));
    idx = Math.min(idx + 1, items.length - 1);
    items[idx].classList.add('nlf-suggestion-item--active');
  }
  if (e.key === 'ArrowUp' && box && box.style.display !== 'none') {
    e.preventDefault();
    const items = box.querySelectorAll('.nlf-suggestion-item');
    let idx = [...items].findIndex(i => i.classList.contains('nlf-suggestion-item--active'));
    items.forEach(i => i.classList.remove('nlf-suggestion-item--active'));
    idx = Math.max(idx - 1, 0);
    items[idx].classList.add('nlf-suggestion-item--active');
  }
  if (e.key === 'Escape') { hideSuggestions(gap); hideGhost(gap); gap.blur(); }
}

// Date parsing
function parseNLFDate(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  const today = new Date();

  // Try "24 Mar", "24 March", "Mar 24", "March 24"
  for (let mi = 0; mi < 12; mi++) {
    const short = MONTH_NAMES[mi].toLowerCase();
    const full = MONTH_FULL[mi];
    const regA = new RegExp('^(\\d{1,2})\\s*' + short);
    const regB = new RegExp('^(\\d{1,2})\\s*' + full);
    const regC = new RegExp('^' + short + '\\s*(\\d{1,2})');
    const regD = new RegExp('^' + full + '\\s*(\\d{1,2})');

    let m;
    if ((m = s.match(regA)) || (m = s.match(regB)) || (m = s.match(regC)) || (m = s.match(regD))) {
      const day = parseInt(m[1]);
      let year = today.getFullYear();
      const candidate = new Date(year, mi, day);
      if (candidate < today) candidate.setFullYear(year + 1);
      if (day >= 1 && day <= 31) return candidate;
    }
  }

  // Try "24/3", "24-3", "24.3"
  const slashMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1;
    let year = slashMatch[3] ? parseInt(slashMatch[3]) : today.getFullYear();
    if (year < 100) year += 2000;
    const candidate = new Date(year, month, day);
    if (candidate < today && !slashMatch[3]) candidate.setFullYear(candidate.getFullYear() + 1);
    return candidate;
  }

  // Try just a number "24" → 24th of current or next month
  const numMatch = s.match(/^(\d{1,2})$/);
  if (numMatch) {
    const day = parseInt(numMatch[1]);
    if (day >= 1 && day <= 31) {
      let candidate = new Date(today.getFullYear(), today.getMonth(), day);
      if (candidate <= today) candidate.setMonth(candidate.getMonth() + 1);
      return candidate;
    }
  }

  return null;
}

function updateDateGhost(gap, query) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  let ghost = wrapper.querySelector('.nlf-ghost');
  if (!ghost) { ghost = document.createElement('span'); ghost.className = 'nlf-ghost'; wrapper.appendChild(ghost); }

  const parsed = parseNLFDate(query);
  if (parsed) {
    gap.dataset.parsedDate = formatDate(parsed);
    ghost.textContent = ' → ' + formatDateDisplay(formatDate(parsed));
    ghost.style.display = 'inline';
  } else {
    gap.dataset.parsedDate = '';
    ghost.style.display = 'none';
  }
}

function handleDateKeydown(e, gap) {
  if (e.key === 'Tab' || e.key === 'Enter') {
    if (gap.dataset.parsedDate) {
      e.preventDefault();
      acceptDate(gap);
    }
  }
  if (e.key === 'Escape') { hideGhost(gap); gap.blur(); }
}

function acceptDate(gap) {
  const dateStr = gap.dataset.parsedDate;
  gap.textContent = formatDateDisplay(dateStr);
  gap.classList.remove('nlf-gap--empty', 'nlf-gap--error');
  gap.classList.add('nlf-gap--filled');
  gap.dataset.prevValue = gap.textContent;
  hideGhost(gap);

  // Sync hidden input
  const hiddenId = gap.id === 'nlfGapDepart' ? 'searchDepart' : 'searchReturn';
  document.getElementById(hiddenId).value = dateStr;

  advanceNLF(gap.id);
}

// Option type-ahead suggestions (passengers, class)
function showOptionSuggestions(gap, query, options, hiddenId) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  let box = wrapper.querySelector('.nlf-suggestions');
  if (!box) { box = document.createElement('div'); box.className = 'nlf-suggestions'; wrapper.appendChild(box); }

  const q = query.toLowerCase();
  const matches = q ? options.filter(o => o.toLowerCase().includes(q)) : options;

  if (matches.length === 0 || (matches.length === 1 && matches[0].toLowerCase() === q)) {
    box.style.display = 'none'; return;
  }

  box.innerHTML = matches.map((o, i) =>
    '<div class="nlf-suggestion-item' + (i === 0 ? ' nlf-suggestion-item--active' : '') + '" data-value="' + o + '">' +
    '<span>' + o + '</span></div>'
  ).join('');
  box.style.display = 'block';

  box.querySelectorAll('.nlf-suggestion-item').forEach(item => {
    item.addEventListener('mousedown', function(e) {
      e.preventDefault();
      acceptOptionSuggestion(gap, this.dataset.value, hiddenId);
    });
  });
}

function updateOptionGhost(gap, query, options) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  let ghost = wrapper.querySelector('.nlf-ghost');
  if (!ghost) { ghost = document.createElement('span'); ghost.className = 'nlf-ghost'; wrapper.appendChild(ghost); }

  if (!query) { ghost.style.display = 'none'; return; }

  const q = query.toLowerCase();
  const match = options.find(o => o.toLowerCase().startsWith(q));
  if (match) {
    ghost.textContent = match.substring(query.length);
    ghost.style.display = 'inline';
  } else { ghost.style.display = 'none'; }
}

function acceptOptionSuggestion(gap, value, hiddenId) {
  gap.textContent = value;
  gap.classList.remove('nlf-gap--empty', 'nlf-gap--error');
  gap.classList.add('nlf-gap--filled');
  gap.dataset.prevValue = value;
  hideSuggestions(gap);
  hideGhost(gap);
  document.getElementById(hiddenId).value = value;
  advanceNLF(gap.id);
}

function handleOptionKeydown(e, gap, options, hiddenId) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  const box = wrapper.querySelector('.nlf-suggestions');

  if (e.key === 'Tab' || e.key === 'ArrowRight') {
    const ghost = wrapper.querySelector('.nlf-ghost');
    if (ghost && ghost.style.display !== 'none' && ghost.textContent) {
      e.preventDefault();
      acceptOptionSuggestion(gap, gap.textContent + ghost.textContent, hiddenId);
      return;
    }
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (box && box.style.display !== 'none') {
      const active = box.querySelector('.nlf-suggestion-item--active');
      if (active) { acceptOptionSuggestion(gap, active.dataset.value, hiddenId); return; }
    }
    const val = gap.textContent.trim();
    const match = options.find(o => o.toLowerCase() === val.toLowerCase());
    if (match) acceptOptionSuggestion(gap, match, hiddenId);
  }

  if (e.key === 'ArrowDown' && box && box.style.display !== 'none') {
    e.preventDefault();
    const items = box.querySelectorAll('.nlf-suggestion-item');
    let idx = [...items].findIndex(i => i.classList.contains('nlf-suggestion-item--active'));
    items.forEach(i => i.classList.remove('nlf-suggestion-item--active'));
    idx = Math.min(idx + 1, items.length - 1);
    items[idx].classList.add('nlf-suggestion-item--active');
  }
  if (e.key === 'ArrowUp' && box && box.style.display !== 'none') {
    e.preventDefault();
    const items = box.querySelectorAll('.nlf-suggestion-item');
    let idx = [...items].findIndex(i => i.classList.contains('nlf-suggestion-item--active'));
    items.forEach(i => i.classList.remove('nlf-suggestion-item--active'));
    idx = Math.max(idx - 1, 0);
    items[idx].classList.add('nlf-suggestion-item--active');
  }
  if (e.key === 'Escape') { hideSuggestions(gap); hideGhost(gap); gap.blur(); }
}

// Auto-advance
function advanceNLF(currentId) {
  const order = ['nlfGapFrom', 'nlfGapTo', 'nlfGapDepart', 'nlfGapReturn', 'nlfGapPax', 'nlfGapClass'];
  const idx = order.indexOf(currentId);
  for (let i = idx + 1; i < order.length; i++) {
    // Skip return if one-way
    if (order[i] === 'nlfGapReturn') {
      const clause = document.getElementById('nlfReturnClause');
      if (clause && clause.style.display === 'none') continue;
    }
    const next = document.getElementById(order[i]);
    if (next) { setTimeout(() => next.focus(), 80); return; }
  }
}

// Toggle advanced search
function toggleAdvancedSearch(e) {
  e.preventDefault();
  document.getElementById('nlfCard').classList.toggle('hidden');
  document.getElementById('searchCard').classList.toggle('hidden');
}

// NLF error shake
function showNLFGapError(gapId) {
  const gap = document.getElementById(gapId);
  gap.classList.add('nlf-gap--error');
  gap.focus();
  setTimeout(() => gap.classList.remove('nlf-gap--error'), 2000);
}

// ---- PAYMENT METHOD TOGGLE ----
function initPaymentToggle() {
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const mobileForm = document.getElementById('payMobile');
      if (mobileForm) {
        mobileForm.style.display = this.value === 'mobile' ? '' : 'none';
      }
      // Update active tab styling
      document.querySelectorAll('.payment-tab').forEach(tab => tab.classList.remove('active'));
      this.closest('.payment-tab').classList.add('active');
    });
  });
}

// ---- NATIONALITY SEARCH ----
function initNationalitySearch() {
  const select = document.getElementById('paxNat');
  if (!select) return;

  // Collect all options
  const allOptions = [];
  select.querySelectorAll('option').forEach(opt => {
    if (opt.value) allOptions.push(opt.textContent.trim());
  });

  // Create search wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'nat-search-wrapper';
  wrapper.style.position = 'relative';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type to search country...';
  input.className = 'nat-search-input';
  input.autocomplete = 'off';

  const dropdown = document.createElement('div');
  dropdown.className = 'nlf-suggestions nat-suggestions';
  dropdown.style.display = 'none';

  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(input);
  wrapper.appendChild(dropdown);
  select.style.display = 'none';

  function showMatches(query) {
    const q = query.toLowerCase();
    const matches = q ? allOptions.filter(o => o.toLowerCase().includes(q)) : allOptions;
    if (matches.length === 0) { dropdown.style.display = 'none'; return; }

    dropdown.innerHTML = matches.slice(0, 8).map((o, i) =>
      '<div class="nlf-suggestion-item' + (i === 0 ? ' nlf-suggestion-item--active' : '') + '" data-value="' + o + '"><span>' + o + '</span></div>'
    ).join('');
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.nlf-suggestion-item').forEach(item => {
      item.addEventListener('mousedown', function(e) {
        e.preventDefault();
        acceptNationality(this.dataset.value);
      });
    });
  }

  function acceptNationality(value) {
    input.value = value;
    dropdown.style.display = 'none';
    // Set the hidden select value
    const opt = [...select.options].find(o => o.textContent.trim() === value);
    if (opt) select.value = opt.value || opt.textContent;
  }

  input.addEventListener('focus', function() { showMatches(this.value); });
  input.addEventListener('input', function() { showMatches(this.value); });
  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('.nlf-suggestion-item');
    if (e.key === 'ArrowDown' && dropdown.style.display !== 'none') {
      e.preventDefault();
      let idx = [...items].findIndex(i => i.classList.contains('nlf-suggestion-item--active'));
      items.forEach(i => i.classList.remove('nlf-suggestion-item--active'));
      idx = Math.min(idx + 1, items.length - 1);
      items[idx].classList.add('nlf-suggestion-item--active');
    }
    if (e.key === 'ArrowUp' && dropdown.style.display !== 'none') {
      e.preventDefault();
      let idx = [...items].findIndex(i => i.classList.contains('nlf-suggestion-item--active'));
      items.forEach(i => i.classList.remove('nlf-suggestion-item--active'));
      idx = Math.max(idx - 1, 0);
      items[idx].classList.add('nlf-suggestion-item--active');
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const active = dropdown.querySelector('.nlf-suggestion-item--active');
      if (active) acceptNationality(active.dataset.value);
    }
    if (e.key === 'Escape') { dropdown.style.display = 'none'; }
  });
  input.addEventListener('blur', function() {
    setTimeout(() => { dropdown.style.display = 'none'; }, 200);
  });
}

// ---- INIT ----
initNLF();
initPaymentToggle();
initNationalitySearch();
console.log('RwandAir Prototype loaded');
