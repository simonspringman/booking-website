/**
 * RwandAir Booking App — app.js
 * Connects to mock backend at /api/*
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
const State = {
  tripType:        'round',
  pax:             { adults:1, children:0, infants:0 },
  cabin:           'economy',
  results:         null,
  selectedOut:     null,
  selectedIn:      null,
  holdRef:         null,
  holdExpiry:      null,
  passengerData:   [],
  contactData:     {},
  booking:         null,
};

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────────────────────────────────────
const API = {
  base: '',

  _token() { return localStorage.getItem('rw_token') || ''; },

  async get(path) {
    const r = await fetch(this.base + path, {
      headers: { 'Authorization': `Bearer ${this._token()}` },
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || r.statusText); }
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(this.base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._token()}`,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || r.statusText); }
    return r.json();
  },

  searchAirports: (q)      => API.get(`/api/airports?q=${encodeURIComponent(q)}`),
  searchFlights:  (body)   => API.post('/api/flights/search', body),
  holdFlight:     (body)   => API.post('/api/bookings/hold', body),
  confirm:        (body)   => API.post('/api/bookings/confirm', body),
  getBooking:     (ref)    => API.get(`/api/bookings/${ref}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// APP NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
const App = {
  go(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(`page-${page}`);
    if (el) { el.classList.add('active'); window.scrollTo(0,0); }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE BANNER
// ─────────────────────────────────────────────────────────────────────────────
const Cookie = {
  banner: () => document.getElementById('cookie-banner'),
  accept()  { this.banner().style.display = 'none'; localStorage.setItem('cookie','accepted'); },
  reject()  { this.banner().style.display = 'none'; localStorage.setItem('cookie','rejected'); },
  manage()  { Toast.show('Cookie preferences saved'); this.banner().style.display = 'none'; },
  init()    { if (localStorage.getItem('cookie')) this.banner().style.display = 'none'; },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST & LOADING
// ─────────────────────────────────────────────────────────────────────────────
const Toast = {
  show(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' toast--error' : '');
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3500);
  },
};

const Loading = {
  show(msg = 'Please wait…') {
    document.getElementById('loading-msg').textContent = msg;
    document.getElementById('loading-overlay').style.display = 'flex';
  },
  hide() { document.getElementById('loading-overlay').style.display = 'none'; },
};

// ─────────────────────────────────────────────────────────────────────────────
// PASSENGERS PICKER
// ─────────────────────────────────────────────────────────────────────────────
const Pax = {
  toggle() {
    document.getElementById('pax-dropdown').classList.toggle('open');
  },
  close() {
    document.getElementById('pax-dropdown').classList.remove('open');
    this.updateLabel();
  },
  change(type, delta) {
    const mins = { adults:1, children:0, infants:0 };
    const maxs = { adults:9, children:6, infants:4 };
    State.pax[type] = Math.max(mins[type], Math.min(maxs[type], State.pax[type] + delta));
    document.getElementById(`cnt-${type}`).textContent = State.pax[type];
    this.updateLabel();
  },
  getCabin() {
    return document.querySelector('input[name="cabin"]:checked')?.value || 'economy';
  },
  updateLabel() {
    const total = State.pax.adults + State.pax.children;
    const cabin = this.getCabin();
    const cabinLabel = cabin.charAt(0).toUpperCase() + cabin.slice(1);
    const paxLabel = `${total} ${total === 1 ? 'Passenger' : 'Passengers'} · ${cabinLabel}`;
    document.getElementById('pax-label').textContent = paxLabel;
    State.cabin = cabin;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────
function setupAutocomplete(inputId, listId) {
  const inp  = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let timer;

  inp.addEventListener('input', () => {
    clearTimeout(timer);
    const q = inp.value.trim();
    if (q.length < 2) { list.innerHTML = ''; list.classList.remove('open'); return; }
    timer = setTimeout(async () => {
      try {
        const results = await API.searchAirports(q);
        if (!results.length) { list.classList.remove('open'); return; }
        list.innerHTML = results.map(a => `
          <div class="ac-item" data-code="${a.code}" data-city="${a.city}" onclick="selectAirport('${inputId}','${listId}','${a.code}','${a.city} (${a.code})')">
            <span class="ac-code">${a.code}</span>
            <div class="ac-info"><div class="ac-city">${a.city}, ${a.country}</div><div class="ac-name">${a.name}</div></div>
          </div>`).join('');
        list.classList.add('open');
      } catch(e) { /* silent */ }
    }, 250);
  });

  inp.addEventListener('blur', () => setTimeout(() => list.classList.remove('open'), 200));
}

function selectAirport(inputId, listId, code, label) {
  const inp = document.getElementById(inputId);
  inp.value = label;
  inp.dataset.code = code;
  document.getElementById(listId).classList.remove('open');
  // clear any error
  const fieldMap = { 'inp-origin':'err-origin', 'inp-dest':'err-dest' };
  if (fieldMap[inputId]) document.getElementById(fieldMap[inputId]).textContent = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────
const Search = {
  setTrip(btn, trip) {
    document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    State.tripType = trip;
    const retField = document.getElementById('field-return');
    retField.style.opacity = (trip === 'round') ? '1' : '.4';
    retField.style.pointerEvents = (trip === 'round') ? '' : 'none';
  },

  swap() {
    const o = document.getElementById('inp-origin');
    const d = document.getElementById('inp-dest');
    [o.value, d.value] = [d.value, o.value];
    [o.dataset.code, d.dataset.code] = [d.dataset.code, o.dataset.code];
  },

  validate() {
    let ok = true;
    const origin = document.getElementById('inp-origin').dataset.code || '';
    const dest   = document.getElementById('inp-dest').dataset.code   || '';
    const depart = document.getElementById('inp-depart').value;

    if (!origin) {
      document.getElementById('err-origin').textContent = 'Please enter a departure city or airport';
      ok = false;
    }
    if (!dest) {
      document.getElementById('err-dest').textContent = 'Please enter a destination';
      ok = false;
    }
    if (!depart) {
      document.getElementById('err-depart').textContent = 'Please select a departure date';
      ok = false;
    }
    if (origin && dest && origin === dest) {
      document.getElementById('err-dest').textContent = 'Origin and destination cannot be the same';
      ok = false;
    }
    return ok;
  },

  async submit(e) {
    if (e) e.preventDefault();
    // Clear errors
    ['err-origin','err-dest','err-depart'].forEach(id => {
      document.getElementById(id).textContent = '';
    });
    if (!this.validate()) return;

    const origin      = document.getElementById('inp-origin').dataset.code;
    const destination = document.getElementById('inp-dest').dataset.code;
    const departDate  = document.getElementById('inp-depart').value;
    const returnDate  = document.getElementById('inp-return').value;
    const cabin       = Pax.getCabin();
    const { adults, children, infants } = State.pax;

    Loading.show('Searching for the best fares…');
    try {
      const data = await API.searchFlights({
        origin, destination, departDate, returnDate,
        adults, children, infants, cabin,
        tripType: State.tripType,
      });

      State.results = data;
      State.selectedOut = null;
      State.selectedIn  = null;

      // Update results bar
      const originText = document.getElementById('inp-origin').value.split('(')[0].trim();
      const destText   = document.getElementById('inp-dest').value.split('(')[0].trim();
      document.getElementById('res-route').textContent = `${origin} → ${destination}`;
      document.getElementById('res-meta').textContent  =
        `${fmtDate(departDate)} · ${adults + children} Passenger${adults+children>1?'s':''} · ${cabin.charAt(0).toUpperCase()+cabin.slice(1)}`;

      Render.results(data);
      App.go('results');
    } catch(err) {
      Toast.show(err.message || 'Search failed. Please try again.', true);
    } finally {
      Loading.hide();
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

function fmtMoney(n) {
  return 'RWF ' + Math.round(n).toLocaleString('en-US');
}

function flightCard(flight, type) {
  const stopLabel = flight.stops === 0
    ? `<span class="flt-stop stop-direct">✓ Direct</span>`
    : `<span class="flt-stop stop-1">1 stop · ${flight.stopCity}</span>`;

  const urgency = flight.seatsLeft <= 5
    ? `<div class="urgency-tag">⚡ Only ${flight.seatsLeft} seats left</div>`
    : '';

  const bestTag = flight.isBestValue
    ? `<div class="best-tag">Best Value</div>` : '';

  return `
    <div class="flight-card ${flight.isBestValue ? 'flight-card--best' : ''}" id="flt-${flight.id}">
      ${bestTag}
      <div class="flt-route">
        <div>
          <div class="flt-time">${flight.departure}</div>
          <div class="flt-code">${flight.origin}</div>
        </div>
        <div class="flt-mid">
          <div class="flt-line">────────</div>
          <div class="flt-dur">${flight.duration}</div>
          ${stopLabel}
        </div>
        <div>
          <div class="flt-time">${flight.arrival}${flight.arrivalNextDay ? '<sup style="font-size:.55rem;vertical-align:super">+1</sup>' : ''}</div>
          <div class="flt-code">${flight.destination}</div>
        </div>
        <div style="margin-left:.5rem">
          <div class="flt-meta">${flight.flightNumber} · ${flight.aircraft}</div>
          <div class="flt-meta" style="margin-top:.2rem">${flight.amenities.slice(0,2).join(' · ')}</div>
        </div>
      </div>
      ${urgency}
      <div class="flt-price-block">
        <div class="flt-price">${flight.fare.label}</div>
        <div class="flt-plabel">per person</div>
        <div class="flt-ptax">✓ Taxes &amp; fees included</div>
      </div>
      <button class="btn-select" onclick="selectFlight('${flight.id}','${type}')">Select →</button>
    </div>`;
}

const Render = {
  results(data) {
    const list  = document.getElementById('flights-list');
    const label = document.getElementById('results-label');

    if (!data.outbound || !data.outbound.length) {
      label.textContent = data.message || 'No flights found for this route.';
      list.innerHTML = '<p style="color:var(--muted);padding:2rem 0">Try adjusting your dates or route.</p>';
      return;
    }

    label.textContent = `Showing ${data.outbound.length} flight${data.outbound.length>1?'s':''} · Prices include all taxes & fees`;
    list.innerHTML = data.outbound.map(f => flightCard(f, 'out')).join('');
  },

  inbound(data) {
    const list  = document.getElementById('flights-list');
    const label = document.getElementById('results-label');
    const route = document.getElementById('res-route');
    route.textContent = route.textContent.replace('→', '→') + ' (return)';
    label.textContent = `Select your return flight — ${data.inbound.length} options`;
    list.innerHTML = data.inbound.map(f => flightCard(f, 'in')).join('');
  },

  passengerForms() {
    const wrap = document.getElementById('pax-forms-wrap');
    const total = State.pax.adults + State.pax.children;
    let html = '';
    for (let i = 0; i < total; i++) {
      const type = i < State.pax.adults ? 'Adult' : 'Child';
      html += `
        <div class="form-card">
          <div class="pax-form-header">
            <span class="pax-form-label">Passenger ${i+1} — ${type}</span>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label>Title *</label>
              <select id="pax-${i}-title">
                <option value="">Select</option>
                <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
              </select>
              <div class="form-error" id="err-pax-${i}-title"></div>
            </div>
            <div class="form-field"></div>
            <div class="form-field">
              <label>First name *</label>
              <input id="pax-${i}-first" type="text" placeholder="As on passport"/>
              <div class="form-error" id="err-pax-${i}-first"></div>
            </div>
            <div class="form-field">
              <label>Last name *</label>
              <input id="pax-${i}-last" type="text" placeholder="As on passport"/>
              <div class="form-error" id="err-pax-${i}-last"></div>
            </div>
            <div class="form-field">
              <label>Date of birth *</label>
              <input id="pax-${i}-dob" type="date"/>
              <div class="form-error" id="err-pax-${i}-dob"></div>
            </div>
            <div class="form-field">
              <label>Nationality *</label>
              <input id="pax-${i}-nat" type="text" placeholder="e.g. Rwandan"/>
              <div class="form-error" id="err-pax-${i}-nat"></div>
            </div>
            <div class="form-field">
              <label>Passport number *</label>
              <input id="pax-${i}-passport" type="text" placeholder="e.g. PA123456"/>
              <div class="form-error" id="err-pax-${i}-passport"></div>
            </div>
            <div class="form-field">
              <label>Passport expiry *</label>
              <input id="pax-${i}-expiry" type="date"/>
              <div class="form-error" id="err-pax-${i}-expiry"></div>
            </div>
          </div>
        </div>`;
    }
    wrap.innerHTML = html;
  },

  bookingSummary(containerId) {
    const f = State.selectedOut;
    if (!f) return;
    const paxCount = State.pax.adults + State.pax.children;
    const total = f.fare.total * paxCount;
    const tax   = f.fare.tax   * paxCount;
    const base  = f.fare.base  * paxCount;

    document.getElementById(containerId).innerHTML = `
      <div class="bs-title">Booking Summary</div>
      <div class="bs-flight">
        <div class="bs-route">${f.origin} → ${f.destination}</div>
        <div class="bs-meta">${f.date ? fmtDate(f.date) : ''} · ${f.flightNumber}</div>
        <div class="bs-meta">${f.departure} → ${f.arrival} · ${f.duration}</div>
      </div>
      <div class="bs-row"><span>Base fare (×${paxCount})</span><span>${fmtMoney(base)}</span></div>
      <div class="bs-row"><span>Taxes &amp; fees</span><span>${fmtMoney(tax)}</span></div>
      <div class="bs-row"><span class="bs-total">Total</span><span class="bs-total">${fmtMoney(total)}</span></div>
      <div style="margin-top:.75rem;font-size:.7rem;color:var(--muted)">✓ No booking fee · Free 24hr hold</div>`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FLIGHT SELECTION
// ─────────────────────────────────────────────────────────────────────────────
async function selectFlight(flightId, type) {
  const flights = type === 'out' ? State.results?.outbound : State.results?.inbound;
  const flight  = flights?.find(f => f.id === flightId);
  if (!flight) return;

  if (type === 'out') {
    State.selectedOut = flight;
    // If round trip and inbound available, show inbound selection
    if (State.tripType === 'round' && State.results?.inbound?.length) {
      Render.inbound(State.results);
      return;
    }
  } else {
    State.selectedIn = flight;
  }

  // Hold the flight
  Loading.show('Securing your fare…');
  try {
    const hold = await API.holdFlight({
      outboundFlight: State.selectedOut,
      inboundFlight:  State.selectedIn,
      passengers:     State.pax,
      cabin:          State.cabin,
    });
    State.holdRef    = hold.holdRef;
    State.holdExpiry = hold.expiresAt;

    // Setup passenger forms and go
    const route = `${State.selectedOut.origin} → ${State.selectedOut.destination}`;
    document.getElementById('pax-route-label').textContent = route;
    Render.passengerForms();
    Render.bookingSummary('booking-summary-pax');
    App.go('passengers');
    startHoldTimer();
  } catch(err) {
    Toast.show(err.message || 'Could not hold this fare. Please try again.', true);
  } finally {
    Loading.hide();
  }
}

// Hold countdown timer
let holdTimer;
function startHoldTimer() {
  clearInterval(holdTimer);
  holdTimer = setInterval(() => {
    if (!State.holdExpiry) return;
    const remaining = Math.max(0, Math.floor((new Date(State.holdExpiry) - Date.now()) / 1000));
    if (remaining === 0) {
      clearInterval(holdTimer);
      Toast.show('Your fare hold has expired. Please search again.', true);
      App.go('home');
    }
  }, 10000);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSENGERS FORM SUBMISSION
// ─────────────────────────────────────────────────────────────────────────────
const Passengers = {
  validate() {
    let ok = true;
    const total = State.pax.adults + State.pax.children;

    for (let i = 0; i < total; i++) {
      const fields = ['title','first','last','dob','nat','passport','expiry'];
      fields.forEach(f => {
        const el  = document.getElementById(`pax-${i}-${f}`);
        const err = document.getElementById(`err-pax-${i}-${f}`);
        if (el && !el.value.trim()) {
          if (err) err.textContent = 'Required';
          el.classList.add('error');
          ok = false;
        } else if (el) {
          el.classList.remove('error');
          if (err) err.textContent = '';
        }
      });
    }

    const email = document.getElementById('contact-email');
    const phone = document.getElementById('contact-phone');
    if (!email.value.trim() || !email.value.includes('@')) {
      document.getElementById('err-email').textContent = 'Valid email address required';
      email.classList.add('error'); ok = false;
    } else { email.classList.remove('error'); document.getElementById('err-email').textContent = ''; }

    if (!phone.value.trim()) {
      document.getElementById('err-phone').textContent = 'Phone number required';
      phone.classList.add('error'); ok = false;
    } else { phone.classList.remove('error'); document.getElementById('err-phone').textContent = ''; }

    return ok;
  },

  submit() {
    if (!this.validate()) {
      Toast.show('Please complete all required fields', true);
      return;
    }
    const total = State.pax.adults + State.pax.children;
    State.passengerData = [];
    for (let i = 0; i < total; i++) {
      State.passengerData.push({
        title:      document.getElementById(`pax-${i}-title`).value,
        firstName:  document.getElementById(`pax-${i}-first`).value,
        lastName:   document.getElementById(`pax-${i}-last`).value,
        dob:        document.getElementById(`pax-${i}-dob`).value,
        nationality:document.getElementById(`pax-${i}-nat`).value,
        passport:   document.getElementById(`pax-${i}-passport`).value,
        passportExpiry: document.getElementById(`pax-${i}-expiry`).value,
      });
    }
    State.contactData = {
      email:     document.getElementById('contact-email').value,
      phone:     document.getElementById('contact-phone').value,
      whatsapp:  document.getElementById('contact-whatsapp').value,
    };

    const route = `${State.selectedOut.origin} → ${State.selectedOut.destination}`;
    document.getElementById('pay-route-label').textContent = route;
    Render.bookingSummary('booking-summary-pay');

    const paxCount = State.pax.adults + State.pax.children;
    const total_fare = State.selectedOut.fare.total * paxCount;
    document.getElementById('pay-total-label').textContent = fmtMoney(total_fare);

    App.go('payment');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
const Payment = {
  formatCard(el) {
    let v = el.value.replace(/\D/g,'').substring(0,16);
    el.value = v.replace(/(.{4})/g,'$1 ').trim();
  },
  formatExpiry(el) {
    let v = el.value.replace(/\D/g,'');
    if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2,4);
    el.value = v;
  },

  validate() {
    let ok = true;
    const name   = document.getElementById('card-name');
    const number = document.getElementById('card-number');
    const expiry = document.getElementById('card-expiry');
    const cvv    = document.getElementById('card-cvv');

    const checks = [
      [name,   v => v.trim().length > 2,   'err-card-name',   'Cardholder name required'],
      [number, v => v.replace(/\s/g,'').length === 16, 'err-card-number', 'Please enter a valid 16-digit card number'],
      [expiry, v => /^\d{2}\/\d{2}$/.test(v), 'err-card-expiry', 'Please enter expiry as MM/YY'],
      [cvv,    v => v.length >= 3,          'err-card-cvv',    'CVV must be 3–4 digits'],
    ];

    checks.forEach(([el, test, errId, msg]) => {
      if (!test(el.value)) {
        document.getElementById(errId).textContent = msg;
        el.classList.add('error'); ok = false;
      } else {
        document.getElementById(errId).textContent = '';
        el.classList.remove('error');
      }
    });
    return ok;
  },

  async submit() {
    if (!this.validate()) { Toast.show('Please complete all payment details', true); return; }

    Loading.show('Processing your payment…');
    try {
      const booking = await API.confirm({
        holdRef:          State.holdRef,
        passengerDetails: State.passengerData,
        contactDetails:   State.contactData,
        paymentMethod:    'card',
      });
      State.booking = booking;
      clearInterval(holdTimer);
      Render.confirmation(booking);
      App.go('confirm');
    } catch(err) {
      Toast.show(err.message || 'Payment failed. Please try again.', true);
    } finally {
      Loading.hide();
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRMATION RENDER
// ─────────────────────────────────────────────────────────────────────────────
Render.confirmation = function(booking) {
  document.getElementById('conf-ref').textContent   = booking.bookingRef;
  document.getElementById('conf-email').textContent = booking.contact?.email || '—';
  document.getElementById('conf-pay-note').textContent = booking.paymentNote;
  document.getElementById('conf-miles').textContent = `+${booking.dreamMilesEarned?.toLocaleString()} miles`;

  const f = booking.outboundFlight;
  document.getElementById('conf-flight-details').innerHTML = `
    <div class="conf-row"><span>Route</span><strong>${f.origin} → ${f.destination}</strong></div>
    <div class="conf-row"><span>Date</span><strong>${fmtDate(f.date)}</strong></div>
    <div class="conf-row"><span>Flight</span><strong>${f.flightNumber}</strong></div>
    <div class="conf-row"><span>Departure</span><strong>${f.departure}</strong></div>
    <div class="conf-row"><span>Arrival</span><strong>${f.arrival}${f.arrivalNextDay ? ' (+1)' : ''}</strong></div>
    <div class="conf-row"><span>Aircraft</span><strong>${f.aircraft}</strong></div>
    <div class="conf-row"><span>Cabin</span><strong>${(booking.cabin||'Economy').charAt(0).toUpperCase() + (booking.cabin||'economy').slice(1)}</strong></div>`;

  document.getElementById('conf-etickets').innerHTML =
    (booking.etickets || []).map(t => `
      <div class="eticket">
        <div class="eticket-num">${t.number}</div>
        <div class="eticket-pax">${t.passenger} · Seat ${t.seat || '—'} · ${t.status}</div>
      </div>`).join('');

  const pax = (booking.passengers||[]).length || 1;
  document.getElementById('conf-price').innerHTML = `
    <div class="conf-row"><span>Base fare (×${pax})</span><strong>${fmtMoney(f.fare.base * pax)}</strong></div>
    <div class="conf-row"><span>Taxes &amp; fees</span><strong>${fmtMoney(f.fare.tax * pax)}</strong></div>
    <div class="conf-row"><span class="conf-total">Total paid</span><strong class="conf-total">${fmtMoney(f.fare.total * pax)}</strong></div>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// POPULAR DESTINATIONS (homepage)
// ─────────────────────────────────────────────────────────────────────────────
const DEST_DATA = [
  { code:'LHR', city:'London',        flag:'🇬🇧', price:'1,240,000', tag:'🔥 Trending',  tagClass:'tag-hot',   bg:'linear-gradient(135deg,#1a3a6e,#2563eb)' },
  { code:'DXB', city:'Dubai',         flag:'🇦🇪', price:'798,000',   tag:'⚡ 4 seats left',tagClass:'tag-seats', bg:'linear-gradient(135deg,#b45309,#f59e0b)' },
  { code:'NBO', city:'Nairobi',       flag:'🇰🇪', price:'229,000',   tag:'✈️ Daily',     tagClass:'tag-daily', bg:'linear-gradient(135deg,#15803d,#22c55e)' },
  { code:'BRU', city:'Brussels',      flag:'🇧🇪', price:'1,156,000', tag:null,            tagClass:'',          bg:'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { code:'JNB', city:'Johannesburg',  flag:'🇿🇦', price:'531,000',   tag:'✈️ Daily',     tagClass:'tag-daily', bg:'linear-gradient(135deg,#0f172a,#334155)' },
  { code:'BOM', city:'Mumbai',        flag:'🇮🇳', price:'965,000',   tag:'🆕 New route', tagClass:'tag-new',   bg:'linear-gradient(135deg,#c8102e,#f87171)' },
  { code:'LOS', city:'Lagos',         flag:'🇳🇬', price:'613,000',   tag:'✈️ Daily',     tagClass:'tag-daily', bg:'linear-gradient(135deg,#065f46,#059669)' },
  { code:'ADD', city:'Addis Ababa',   flag:'🇪🇹', price:'330,000',   tag:null,            tagClass:'',          bg:'linear-gradient(135deg,#9a3412,#ea580c)' },
];

function renderDestinations() {
  const grid = document.getElementById('dest-grid');
  grid.innerHTML = DEST_DATA.map(d => `
    <a class="dest-card" href="#" onclick="pickDestination('${d.code}','${d.city}');return false">
      <div class="dest-thumb" style="background:${d.bg}">${d.flag}</div>
      <div class="dest-info">
        <div class="dest-city">${d.city}</div>
        <div class="dest-price">From <strong>RWF ${d.price}</strong></div>
        ${d.tag ? `<div class="dest-tag ${d.tagClass}">${d.tag}</div>` : ''}
      </div>
    </a>`).join('');
}

function pickDestination(code, city) {
  const inp = document.getElementById('inp-dest');
  inp.value = `${city} (${code})`;
  inp.dataset.code = code;
  document.getElementById('err-dest').textContent = '';
  document.querySelector('#search-widget').scrollIntoView({ behavior:'smooth', block:'center' });
  document.getElementById('inp-depart').focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — login / register / logout / session restore
// ─────────────────────────────────────────────────────────────────────────────
const Auth = {
  user: null,

  async login() {
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl    = document.getElementById('auth-login-error');
    errEl.textContent = '';
    if (!email || !password) { errEl.textContent = 'Please fill in both fields.'; return; }
    Loading.show('Logging in…');
    try {
      const data = await API.post('/api/auth/login', { email, password });
      localStorage.setItem('rw_token', data.token);
      Auth.user = data.user;
      AuthModal.close();
      Auth._applyUI();
      Toast.show(`Welcome back, ${data.user.firstName}! ✈️`);
    } catch(err) {
      errEl.textContent = err.message || 'Login failed.';
    } finally {
      Loading.hide();
    }
  },

  async register() {
    const firstName = document.getElementById('reg-first').value.trim();
    const lastName  = document.getElementById('reg-last').value.trim();
    const email     = document.getElementById('reg-email').value.trim();
    const phone     = document.getElementById('reg-phone').value.trim();
    const password  = document.getElementById('reg-password').value;
    const errEl     = document.getElementById('auth-reg-error');
    errEl.textContent = '';
    if (!firstName || !lastName || !email || !password) { errEl.textContent = 'Please fill in all required fields.'; return; }
    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
    Loading.show('Creating account…');
    try {
      const data = await API.post('/api/auth/register', { firstName, lastName, email, phone, password });
      localStorage.setItem('rw_token', data.token);
      Auth.user = data.user;
      AuthModal.close();
      Auth._applyUI();
      Toast.show(`Welcome to DreamMiles, ${data.user.firstName}! You earned 1,000 welcome miles ✨`);
    } catch(err) {
      errEl.textContent = err.message || 'Registration failed.';
    } finally {
      Loading.hide();
    }
  },

  async logout() {
    try { await API.post('/api/auth/logout', {}); } catch(_) {}
    localStorage.removeItem('rw_token');
    Auth.user = null;
    Auth._applyUI();
    App.go('home');
    Toast.show('You have been logged out.');
  },

  async restore() {
    const token = localStorage.getItem('rw_token');
    if (!token) return;
    try {
      const data = await API.get('/api/auth/me');
      Auth.user = data;
      Auth._applyUI();
    } catch(_) {
      localStorage.removeItem('rw_token');
    }
  },

  _applyUI() {
    const loggedOut = document.getElementById('nav-loggedout');
    const loggedIn  = document.getElementById('nav-loggedin');
    if (Auth.user) {
      loggedOut.style.display = 'none';
      loggedIn.style.display  = 'block';
      const initial = (Auth.user.firstName || '?')[0].toUpperCase();
      document.getElementById('user-avatar').textContent   = initial;
      document.getElementById('user-name-nav').textContent = Auth.user.firstName;
      const header = document.getElementById('user-dropdown-header');
      if (header) {
        header.innerHTML = `
          <strong>${Auth.user.firstName} ${Auth.user.lastName}</strong>
          ${Auth.user.dreammiles ? `✨ ${Auth.user.dreammiles.balance.toLocaleString()} DreamMiles · ${Auth.user.dreammiles.tier}` : ''}`;
      }
    } else {
      loggedOut.style.display = 'block';
      loggedIn.style.display  = 'none';
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────────────────────────────────────
const AuthModal = {
  open(tab = 'login') {
    document.getElementById('auth-modal').style.display = 'flex';
    AuthModal.switchTab(tab);
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('auth-modal').style.display = 'none';
    document.body.style.overflow = '';
  },
  backdropClick(e) {
    if (e.target === document.getElementById('auth-modal')) AuthModal.close();
  },
  switchTab(tab) {
    const isLogin = (tab === 'login');
    document.getElementById('auth-login-form').style.display    = isLogin ? 'block' : 'none';
    document.getElementById('auth-register-form').style.display = isLogin ? 'none'  : 'block';
    document.getElementById('auth-tab-login').classList.toggle('active',   isLogin);
    document.getElementById('auth-tab-register').classList.toggle('active', !isLogin);
    // clear errors
    ['auth-login-error','auth-reg-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USER MENU DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const UserMenu = {
  toggle() {
    const dd = document.getElementById('user-dropdown');
    dd.classList.toggle('open');
  },
  close() {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.remove('open');
  },
};
document.addEventListener('click', e => {
  if (!e.target.closest('#user-menu')) UserMenu.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// MANAGE BOOKING
// ─────────────────────────────────────────────────────────────────────────────
const ManageBooking = {
  _lastBooking: null,
  _lastLname: '',

  async lookup() {
    const ref   = (document.getElementById('manage-ref').value || '').trim().toUpperCase();
    const lname = (document.getElementById('manage-lname').value || '').trim();
    const errEl = document.getElementById('manage-error');
    errEl.textContent = '';
    if (!ref || !lname) { errEl.textContent = 'Please enter both fields.'; return; }
    Loading.show('Retrieving booking…');
    try {
      const bk = await API.post('/api/manage', { bookingRef: ref, lastName: lname });
      ManageBooking._lastBooking = bk;
      ManageBooking._lastLname = lname;
      const result = document.getElementById('manage-result');
      result.style.display = 'block';
      const f = bk.outboundFlight;
      const isCancelled = bk.status === 'cancelled';
      const statusBadge = isCancelled
        ? '<span class="booking-status booking-status--cancelled">Cancelled</span>'
        : '<span class="booking-status booking-status--upcoming">Confirmed</span>';
      const ancList = (bk.ancillaries || []).map(a =>
        `<div class="conf-row"><span>${a.name}</span><strong>${a.price ? fmtMoney(a.price) : 'Free'}</strong></div>`
      ).join('');
      result.innerHTML = `
        <div class="manage-result-card">
          <h3>Booking ${bk.bookingRef} ${statusBadge}</h3>
          <div class="conf-row"><span>Route</span><strong>${f.origin} → ${f.destination}</strong></div>
          <div class="conf-row"><span>Date</span><strong>${fmtDate(f.date)}</strong></div>
          <div class="conf-row"><span>Flight</span><strong>${f.flightNumber}</strong></div>
          <div class="conf-row"><span>Departure</span><strong>${f.departure}</strong></div>
          <div class="conf-row"><span>Passengers</span><strong>${(bk.passengers||[]).length}</strong></div>
          <div class="conf-row"><span>Cabin</span><strong>${(bk.cabin||'economy').charAt(0).toUpperCase()+(bk.cabin||'economy').slice(1)}</strong></div>
          ${ancList ? '<div style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--border)"><strong style="font-size:.78rem;color:var(--muted)">ANCILLARIES</strong>' + ancList + '</div>' : ''}
          <div class="manage-actions">
            <button class="btn-primary" onclick="App.go('checkin')">Check In Online</button>
            <button class="btn-outline" onclick="App.go('status')">Check Flight Status</button>
            <button class="btn-outline" onclick="App.go('ancillaries')">Add Extras</button>
            ${!isCancelled ? `
              <button class="btn-outline" onclick="ManageBooking.showChangeForm()" style="border-color:var(--sky);color:var(--sky)">Change Date</button>
              <button class="btn-outline" onclick="ManageBooking.cancelBooking()" style="border-color:var(--red);color:var(--red)">Cancel Booking</button>
            ` : `
              <div style="width:100%;margin-top:.5rem;padding:.75rem;background:#fef2f2;border-radius:8px;font-size:.82rem;color:#991b1b">
                This booking was cancelled on ${bk.cancelledAt ? fmtDate(bk.cancelledAt.split('T')[0]) : '—'}.<br>
                ${bk.refundNote || 'Refund is being processed.'}
              </div>
            `}
          </div>
          <div id="manage-change-form" style="display:none;margin-top:1rem">
            <div class="form-field">
              <label>New Travel Date *</label>
              <input id="manage-new-date" type="date"/>
            </div>
            <div style="display:flex;gap:.5rem;margin-top:.5rem">
              <button class="btn-primary" onclick="ManageBooking.confirmChange()">Confirm Change</button>
              <button class="btn-outline" onclick="document.getElementById('manage-change-form').style.display='none'">Cancel</button>
            </div>
          </div>
        </div>`;
    } catch(err) {
      errEl.textContent = err.message || 'Booking not found.';
    } finally {
      Loading.hide();
    }
  },

  showChangeForm() {
    const form = document.getElementById('manage-change-form');
    if (form) {
      form.style.display = 'block';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('manage-new-date').value = tomorrow.toISOString().split('T')[0];
    }
  },

  async confirmChange() {
    const bk = ManageBooking._lastBooking;
    if (!bk) return;
    const newDate = document.getElementById('manage-new-date').value;
    if (!newDate) { Toast.show('Please select a new date.', true); return; }
    Loading.show('Changing booking date…');
    try {
      const result = await API.post('/api/bookings/change', {
        bookingRef: bk.bookingRef,
        lastName: ManageBooking._lastLname,
        newDate,
      });
      Toast.show(result.message);
      ManageBooking.lookup();
    } catch(err) {
      Toast.show(err.message || 'Change failed.', true);
    } finally {
      Loading.hide();
    }
  },

  async cancelBooking() {
    const bk = ManageBooking._lastBooking;
    if (!bk) return;
    if (!confirm(`Are you sure you want to cancel booking ${bk.bookingRef}?\n\nA cancellation fee may apply. Refunds are processed within 7-14 business days.`)) return;
    Loading.show('Cancelling booking…');
    try {
      const result = await API.post('/api/bookings/cancel', {
        bookingRef: bk.bookingRef,
        lastName: ManageBooking._lastLname,
        reason: 'Cancelled by passenger',
      });
      Toast.show(`Booking cancelled. Refund of ${fmtMoney(result.refundAmount)} is being processed.`);
      ManageBooking.lookup();
    } catch(err) {
      Toast.show(err.message || 'Cancellation failed.', true);
    } finally {
      Loading.hide();
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FLIGHT STATUS
// ─────────────────────────────────────────────────────────────────────────────
const FlightStatus = {
  mode: 'flight',

  setMode(btn, mode) {
    document.querySelectorAll('.status-tabs .stab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    FlightStatus.mode = mode;
    document.getElementById('status-flight-form').style.display = mode === 'flight' ? 'block' : 'none';
    document.getElementById('status-dep-form').style.display    = mode === 'departures' ? 'block' : 'none';
    document.getElementById('status-result').innerHTML = '';
  },

  async search() {
    const flightNo = (document.getElementById('status-flightno').value || '').trim().toUpperCase();
    const date     = document.getElementById('status-date').value;
    if (!flightNo || !date) { Toast.show('Please enter flight number and date.', true); return; }
    Loading.show('Checking flight status…');
    try {
      const data = await API.get(`/api/flightstatus?flight=${encodeURIComponent(flightNo)}&date=${encodeURIComponent(date)}`);
      FlightStatus._renderSingle(data);
    } catch(err) {
      document.getElementById('status-result').innerHTML = `<p style="color:var(--red);text-align:center">${err.message}</p>`;
    } finally {
      Loading.hide();
    }
  },

  async loadDepartures() {
    const date = document.getElementById('dep-date').value || new Date().toISOString().split('T')[0];
    Loading.show('Loading departures…');
    try {
      const data = await API.get(`/api/flightstatus/departures?date=${encodeURIComponent(date)}`);
      FlightStatus._renderDepartures(data.departures || data);
    } catch(err) {
      document.getElementById('status-result').innerHTML = `<p style="color:var(--red);text-align:center">${err.message}</p>`;
    } finally {
      Loading.hide();
    }
  },

  _badgeClass(st) {
    const map = { 'On Time':'on-time', 'Delayed':'delayed', 'Cancelled':'cancelled',
                  'Boarding':'boarding', 'Departed':'departed', 'Landed':'landed' };
    return `status-badge status-badge--${map[st] || 'on-time'}`;
  },

  _renderSingle(f) {
    document.getElementById('status-result').innerHTML = `
      <div class="status-card">
        <div class="status-card-header">
          <h3>${f.flightNumber} — ${fmtDate(f.date)}</h3>
          <span class="${FlightStatus._badgeClass(f.status)}">${f.status}</span>
        </div>
        <div class="status-route-line">
          <span>${f.origin}</span>
          <span class="arrow">✈️ ────────────</span>
          <span>${f.destination}</span>
        </div>
        <div class="status-detail-row">
          <div class="status-detail"><span>Scheduled Dep.</span><strong>${f.scheduledDep}</strong></div>
          <div class="status-detail"><span>Actual Dep.</span><strong>${f.actualDep || '—'}</strong></div>
          <div class="status-detail"><span>Scheduled Arr.</span><strong>${f.scheduledArr}</strong></div>
          <div class="status-detail"><span>Actual Arr.</span><strong>${f.actualArr || '—'}</strong></div>
          <div class="status-detail"><span>Gate</span><strong>${f.gate || '—'}</strong></div>
          <div class="status-detail"><span>Aircraft</span><strong>${f.aircraft}</strong></div>
        </div>
      </div>`;
  },

  _renderDepartures(flights) {
    const rows = flights.map(f => `
      <tr>
        <td><strong>${f.flightNumber}</strong></td>
        <td>${f.destination}</td>
        <td>${f.scheduledDep}</td>
        <td>${f.actualDep || '—'}</td>
        <td>${f.gate || '—'}</td>
        <td><span class="${FlightStatus._badgeClass(f.status)}">${f.status}</span></td>
      </tr>`).join('');
    document.getElementById('status-result').innerHTML = `
      <div class="simple-card">
        <table class="dep-table">
          <thead><tr><th>Flight</th><th>To</th><th>Sched.</th><th>Actual</th><th>Gate</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  init() {
    const today = new Date().toISOString().split('T')[0];
    const statusDate = document.getElementById('status-date');
    const depDate    = document.getElementById('dep-date');
    if (statusDate) statusDate.value = today;
    if (depDate)    depDate.value    = today;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK-IN
// ─────────────────────────────────────────────────────────────────────────────
const CheckIn = {
  _data: null,  // holds { booking, eligible, hoursToFlight } from server

  async lookup() {
    const bookingRef = (document.getElementById('ci-ref').value || '').trim().toUpperCase();
    const lastName   = (document.getElementById('ci-lname').value || '').trim();
    const errEl = document.getElementById('ci-error');
    errEl.textContent = '';
    if (!bookingRef || !lastName) { errEl.textContent = 'Please enter both fields.'; return; }
    Loading.show('Looking up booking…');
    try {
      const data = await API.post('/api/checkin/lookup', { bookingRef, lastName });
      CheckIn._data = data;
      CheckIn._renderLookup(data.booking);
    } catch(err) {
      errEl.textContent = err.message || 'Booking not found or not eligible for online check-in.';
    } finally {
      Loading.hide();
    }
  },

  _renderLookup(bk) {
    const result = document.getElementById('ci-result');
    result.style.display = 'block';
    const f = bk.outboundFlight;
    const paxRows = (bk.passengers || []).map(p => `
      <div class="conf-row"><span>${p.firstName} ${p.lastName}</span><strong>${p.eticket || bk.bookingRef}</strong></div>`).join('');
    result.innerHTML = `
      <div class="simple-card">
        <h3>Flight ${f.flightNumber} — ${fmtDate(f.date)}</h3>
        <div class="conf-row"><span>Route</span><strong>${f.origin} → ${f.destination}</strong></div>
        <div class="conf-row"><span>Departure</span><strong>${f.departure}</strong></div>
        <div style="margin-top:1rem"><h4 style="margin:0 0 .5rem">Passengers</h4>${paxRows}</div>
        <div class="notice notice--amber" style="margin-top:1rem">
          <span class="notice-icon">ℹ️</span>
          <div>Please have your passport ready. Baggage allowance: 23 kg checked, 8 kg cabin.</div>
        </div>
        <button class="btn-primary btn-full" style="margin-top:1rem" onclick="CheckIn.confirm('${bk.bookingRef}')">
          ✈️ Confirm Check-In for All Passengers
        </button>
      </div>`;
  },

  async confirm(bookingRef) {
    Loading.show('Processing check-in…');
    try {
      const result = await API.post('/api/checkin/confirm', { bookingRef });
      CheckIn._renderBoardingPasses(result.boardingPasses);
      App.go('boarding');
    } catch(err) {
      Toast.show(err.message || 'Check-in failed. Please try at the airport.', true);
    } finally {
      Loading.hide();
    }
  },

  _renderBoardingPasses(passes) {
    document.getElementById('boarding-passes').innerHTML = passes.map(bp => `
      <div class="boarding-pass">
        <div class="bp-main">
          <div class="bp-airline">RwandAir</div>
          <div class="bp-route">${bp.origin} → ${bp.destination}</div>
          <div class="bp-flight">${bp.flightNumber} · ${fmtDate(bp.date)} · Dep ${bp.departure} · Gate ${bp.gate}</div>
          <div class="bp-details">
            <div class="bp-detail"><span>Passenger</span><strong>${bp.passenger}</strong></div>
            <div class="bp-detail"><span>Boarding</span><strong>${bp.boardingTime}</strong></div>
            <div class="bp-detail"><span>Class</span><strong>${bp.seatClass || 'Economy'}</strong></div>
          </div>
        </div>
        <div class="bp-tear">BOARDING PASS</div>
        <div class="bp-stub">
          <div class="bp-seat">${bp.seat}</div>
          <div class="bp-class">Seat</div>
          <div class="bp-barcode">${bp.barcode ? bp.barcode.substring(0,20) : '||||||||||||||||||||'}</div>
        </div>
      </div>`).join('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MY BOOKINGS (logged-in)
// ─────────────────────────────────────────────────────────────────────────────
const MyBookings = {
  async load() {
    const el = document.getElementById('my-bookings-list');
    if (!el) return;
    if (!Auth.user) {
      el.innerHTML = `<div style="text-align:center;padding:3rem">
        <p style="color:var(--muted)">Please log in to view your bookings.</p>
        <button class="btn-primary" onclick="AuthModal.open('login')">Log In</button>
      </div>`;
      return;
    }
    el.innerHTML = '<div class="spinner-inline"></div>';
    try {
      const data = await API.get('/api/auth/bookings');
      if (!data.bookings || data.bookings.length === 0) {
        el.innerHTML = `<div style="text-align:center;padding:3rem">
          <p style="color:var(--muted)">No bookings found.</p>
          <button class="btn-primary" onclick="App.go('home')">Book a Flight</button>
        </div>`;
        return;
      }
      el.innerHTML = data.bookings.map(bk => {
        const f = bk.outboundFlight;
        const statusClass = bk.status === 'Confirmed' ? 'upcoming' : 'completed';
        return `
        <div class="booking-item">
          <div>
            <div class="booking-item-route">${f.origin} → ${f.destination}</div>
            <div class="booking-item-meta">
              ${fmtDate(f.date)} · ${f.flightNumber} · Ref: ${bk.bookingRef}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
            <span class="booking-status booking-status--${statusClass}">${bk.status}</span>
            <div class="booking-item-actions">
              <button class="btn-outline" onclick="App.go('checkin')">Check In</button>
            </div>
          </div>
        </div>`;
      }).join('');
    } catch(err) {
      el.innerHTML = `<p style="color:var(--red);text-align:center">${err.message}</p>`;
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DREAMMILES
// ─────────────────────────────────────────────────────────────────────────────
const DreamMiles = {
  render() {
    const el = document.getElementById('dm-content');
    if (!el) return;
    if (!Auth.user) {
      el.innerHTML = `<div style="text-align:center;padding:3rem">
        <p style="color:var(--muted)">Please log in to view your DreamMiles.</p>
        <button class="btn-primary" onclick="AuthModal.open('login')">Log In</button>
      </div>`;
      return;
    }
    const dm = Auth.user.dreammiles || { memberId:'—', tier:'Blue', balance:0, expiring:0, expiringDate:'—' };
    el.innerHTML = `
      <div class="dm-hero-card">
        <div>
          <div class="dm-balance">${dm.balance.toLocaleString()}</div>
          <div class="dm-balance-label">Miles Balance</div>
          <div style="margin-top:.75rem;font-size:.82rem;opacity:.8">Member ID: ${dm.memberId}</div>
        </div>
        <div>
          <div class="dm-tier-badge">⭐ ${dm.tier}</div>
        </div>
      </div>
      <div class="dm-info-grid">
        <div class="dm-info-tile">
          <div class="val">${dm.balance.toLocaleString()}</div>
          <div class="lbl">Available Miles</div>
        </div>
        <div class="dm-info-tile">
          <div class="val" style="color:var(--red)">${(dm.expiring||0).toLocaleString()}</div>
          <div class="lbl">Expiring by ${dm.expiringDate || '—'}</div>
        </div>
        <div class="dm-info-tile">
          <div class="val">${dm.tier}</div>
          <div class="lbl">Current Tier</div>
        </div>
      </div>
      <div class="simple-card">
        <h3>How to earn more miles</h3>
        <div class="conf-row"><span>Every flight</span><strong>Up to 10 miles / km</strong></div>
        <div class="conf-row"><span>Business class</span><strong>Double miles</strong></div>
        <div class="conf-row"><span>Partner hotels</span><strong>500–5,000 miles/stay</strong></div>
        <div class="conf-row"><span>Credit card spend</span><strong>1 mile / RWF 1,000</strong></div>
        <button class="btn-primary" onclick="App.go('home')" style="margin-top:1rem">Book a Flight to Earn Miles</button>
      </div>`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ANCILLARIES
// ─────────────────────────────────────────────────────────────────────────────
const Ancillaries = {
  _selectedType: null,

  select(type) {
    Ancillaries._selectedType = type;
    const titles = {
      lounge:'Add Airport Lounge Access', golf:'Add Golf Package', bicycle:'Add Bicycle Rental',
      'extra-baggage':'Add Extra Baggage', 'seat-selection':'Choose Your Seat',
      'travel-insurance':'Add Travel Insurance', meal:'Request Special Meal',
      'car-rental':'Book Car Rental', hotel:'Book Hotel',
    };
    document.getElementById('anc-form-title').textContent = titles[type] || 'Add to Booking';
    document.getElementById('anc-booking-form').style.display = 'block';
    document.getElementById('anc-error').textContent = '';
    document.getElementById('anc-booking-form').scrollIntoView({ behavior:'smooth', block:'center' });
  },

  cancelForm() {
    document.getElementById('anc-booking-form').style.display = 'none';
    Ancillaries._selectedType = null;
  },

  async addToBooking() {
    const ref   = (document.getElementById('anc-ref').value || '').trim().toUpperCase();
    const lname = (document.getElementById('anc-lname').value || '').trim();
    const errEl = document.getElementById('anc-error');
    errEl.textContent = '';
    if (!ref || !lname) { errEl.textContent = 'Please enter both fields.'; return; }
    if (!Ancillaries._selectedType) { errEl.textContent = 'No service selected.'; return; }
    Loading.show('Adding service…');
    try {
      const result = await API.post('/api/ancillaries/add', {
        bookingRef: ref, lastName: lname, ancillaryType: Ancillaries._selectedType,
      });
      Toast.show(result.message);
      Ancillaries.cancelForm();
    } catch(err) {
      errEl.textContent = err.message || 'Failed to add service.';
    } finally {
      Loading.hide();
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT — Full booking assistant
// ─────────────────────────────────────────────────────────────────────────────
const Chatbot = {
  _open: false,
  _messages: [],
  _step: 'idle',      // idle, awaiting_dest, awaiting_date, showing_flights, awaiting_pax, awaiting_contact, done
  _context: {},        // stores booking flow state within chatbot

  toggle() {
    Chatbot._open = !Chatbot._open;
    document.getElementById('chatbot-panel').style.display = Chatbot._open ? 'flex' : 'none';
    document.getElementById('chatbot-fab-icon').textContent = Chatbot._open ? '✕' : '💬';
    if (Chatbot._open && Chatbot._messages.length === 0) {
      Chatbot._welcome();
    }
  },

  _welcome() {
    Chatbot._addBot(`Hello! I'm your RwandAir booking assistant. I can help you with:\n\n` +
      `• Search & book flights\n• Check flight status\n• Manage your booking\n• Add ancillary services\n• Check-in online\n• DreamMiles loyalty info\n\nHow can I help you today?`);
    Chatbot._showQuick(['Book a flight', 'Flight status', 'Manage booking', 'Ancillaries', 'Check-in', 'DreamMiles']);
  },

  _addBot(text) {
    Chatbot._messages.push({ role:'bot', text });
    Chatbot._render();
  },

  _addUser(text) {
    Chatbot._messages.push({ role:'user', text });
    Chatbot._render();
  },

  _render() {
    const el = document.getElementById('chatbot-messages');
    el.innerHTML = Chatbot._messages.map(m => {
      const cls = m.role === 'user' ? 'cb-msg--user' : m.role === 'typing' ? 'cb-msg--typing' : 'cb-msg--bot';
      return `<div class="cb-msg ${cls}">${m.html || m.text.replace(/\n/g,'<br>')}</div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  },

  _showQuick(options) {
    const el = document.getElementById('chatbot-quick');
    el.innerHTML = options.map(o =>
      `<button class="cb-quick-btn" onclick="Chatbot._handleQuick('${o.replace(/'/g, "\\'")}')">${o}</button>`
    ).join('');
  },

  _clearQuick() {
    document.getElementById('chatbot-quick').innerHTML = '';
  },

  _handleQuick(text) {
    Chatbot._clearQuick();
    Chatbot.processInput(text);
  },

  send() {
    const inp = document.getElementById('chatbot-input');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    Chatbot.processInput(text);
  },

  async processInput(text) {
    Chatbot._addUser(text);
    const lower = text.toLowerCase();

    // Handle step-based flow first
    if (Chatbot._step === 'awaiting_dest') {
      return Chatbot._handleDestination(text);
    }
    if (Chatbot._step === 'awaiting_date') {
      return Chatbot._handleDate(text);
    }
    if (Chatbot._step === 'awaiting_pax_count') {
      return Chatbot._handlePaxCount(text);
    }

    // Intent detection
    if (lower.includes('book') || lower.includes('flight') || lower.includes('search') || lower.includes('fly')) {
      return Chatbot._startBookingFlow();
    }
    if (lower.includes('status')) {
      Chatbot._addBot('You can check your flight status on the Flight Status page. Let me take you there.');
      setTimeout(() => App.go('status'), 800);
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
      return;
    }
    if (lower.includes('manage') || lower.includes('cancel') || lower.includes('change')) {
      Chatbot._addBot('You can manage, change, or cancel your booking from the Manage Booking page. Let me take you there.');
      setTimeout(() => App.go('manage'), 800);
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
      return;
    }
    if (lower.includes('ancillar') || lower.includes('extra') || lower.includes('lounge') || lower.includes('golf') || lower.includes('bicycle') || lower.includes('baggage') || lower.includes('seat') || lower.includes('meal') || lower.includes('car') || lower.includes('hotel') || lower.includes('insurance')) {
      Chatbot._addBot('We have several ancillary services available including Airport Lounge, Golf, Bicycle Rental, Extra Baggage, Seat Selection, Travel Insurance, Special Meals, Car Rental and Hotel Booking. Let me show you our ancillaries page.');
      setTimeout(() => App.go('ancillaries'), 800);
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
      return;
    }
    if (lower.includes('check-in') || lower.includes('checkin') || lower.includes('check in')) {
      Chatbot._addBot('Let me take you to online check-in. You can check in from 48 hours to 2 hours before departure.');
      setTimeout(() => App.go('checkin'), 800);
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
      return;
    }
    if (lower.includes('dreammiles') || lower.includes('miles') || lower.includes('loyalty') || lower.includes('reward')) {
      Chatbot._addBot('DreamMiles is our loyalty programme! Earn miles on every flight. Log in to view your balance, or join free to start earning.');
      setTimeout(() => App.go('dreammiles'), 800);
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
      return;
    }
    if (lower.includes('menu') || lower.includes('help') || lower.includes('start') || lower.includes('hi') || lower.includes('hello')) {
      Chatbot._addBot('What would you like help with?');
      Chatbot._showQuick(['Book a flight', 'Flight status', 'Manage booking', 'Ancillaries', 'Check-in', 'DreamMiles']);
      return;
    }

    // Default response
    Chatbot._addBot("I'm not sure I understand. Let me show you what I can help with:");
    Chatbot._showQuick(['Book a flight', 'Flight status', 'Manage booking', 'Ancillaries', 'Check-in', 'DreamMiles']);
  },

  // ── BOOKING FLOW ──────────────────────────────────────
  _startBookingFlow() {
    Chatbot._step = 'awaiting_dest';
    Chatbot._context = { origin: 'KGL', originCity: 'Kigali' };
    Chatbot._addBot("Let's book a flight! Flying from Kigali (KGL).\n\nWhere would you like to go? You can type a city name like London, Nairobi, Dubai, etc.");
    Chatbot._showQuick(['London', 'Nairobi', 'Dubai', 'Brussels']);
  },

  async _handleDestination(text) {
    const lower = text.toLowerCase();
    // Map common city names to codes
    const cityMap = {
      london:'LHR', nairobi:'NBO', dubai:'DXB', brussels:'BRU', paris:'CDG',
      johannesburg:'JNB', 'cape town':'CPT', 'addis ababa':'ADD', 'addis':'ADD',
      lagos:'LOS', accra:'ACC', 'dar es salaam':'DAR', dar:'DAR', entebbe:'EBB',
      bujumbura:'BJM', mumbai:'BOM', lusaka:'LUN', harare:'HRE', mombasa:'MBA',
      mauritius:'MRU',
    };
    let destCode = null;
    let destCity = text;
    // Check direct code match
    if (text.length === 3 && text.toUpperCase().match(/^[A-Z]{3}$/)) {
      destCode = text.toUpperCase();
      destCity = text.toUpperCase();
    } else {
      // Search by city name
      for (const [city, code] of Object.entries(cityMap)) {
        if (lower.includes(city)) {
          destCode = code;
          destCity = city.charAt(0).toUpperCase() + city.slice(1);
          break;
        }
      }
    }
    if (!destCode) {
      Chatbot._addBot("I couldn't find that destination. Please try one of our cities:");
      Chatbot._showQuick(['London', 'Nairobi', 'Dubai', 'Brussels', 'Johannesburg', 'Lagos']);
      return;
    }
    Chatbot._context.dest = destCode;
    Chatbot._context.destCity = destCity;
    Chatbot._step = 'awaiting_date';
    Chatbot._addBot(`Great choice! Kigali (KGL) → ${destCity} (${destCode}).\n\nWhen would you like to travel? Enter a date (YYYY-MM-DD) or pick one:`);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const next3 = new Date(); next3.setDate(next3.getDate()+3);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate()+7);
    Chatbot._showQuick([
      tomorrow.toISOString().split('T')[0],
      next3.toISOString().split('T')[0],
      nextWeek.toISOString().split('T')[0],
    ]);
  },

  async _handleDate(text) {
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) {
      Chatbot._addBot('Please enter a valid date in YYYY-MM-DD format (e.g. 2026-03-15).');
      return;
    }
    Chatbot._context.date = dateMatch[0];
    Chatbot._step = 'awaiting_pax_count';
    Chatbot._addBot(`Departure: ${fmtDate(Chatbot._context.date)}.\n\nHow many passengers? (adults)`);
    Chatbot._showQuick(['1', '2', '3', '4']);
  },

  async _handlePaxCount(text) {
    const num = parseInt(text);
    if (isNaN(num) || num < 1 || num > 9) {
      Chatbot._addBot('Please enter a number between 1 and 9.');
      return;
    }
    Chatbot._context.pax = num;
    Chatbot._step = 'showing_flights';
    Chatbot._addBot(`Searching for ${num} passenger${num>1?'s':''} on ${fmtDate(Chatbot._context.date)}…`);
    Chatbot._clearQuick();

    try {
      const data = await API.searchFlights({
        origin: Chatbot._context.origin,
        destination: Chatbot._context.dest,
        departDate: Chatbot._context.date,
        adults: Chatbot._context.pax,
        children: 0, infants: 0,
        cabin: 'economy',
        tripType: 'one',
      });
      if (!data.outbound || data.outbound.length === 0) {
        Chatbot._addBot('No flights found for that route and date. Try another date?');
        Chatbot._step = 'awaiting_date';
        return;
      }
      Chatbot._context.flights = data.outbound;
      let html = `I found <strong>${data.outbound.length} flights</strong> from Kigali to ${Chatbot._context.destCity}:<br><br>`;
      data.outbound.forEach((f, i) => {
        html += `<div class="cb-flight-card">
          <div class="cb-flt-row"><strong>${f.flightNumber}</strong> <span>${f.departure} → ${f.arrival}</span></div>
          <div class="cb-flt-row"><span>${f.duration} · ${f.stops===0?'Direct':f.stops+' stop'}</span> <span class="cb-flt-price">${f.fare.label}</span></div>
          <button class="cb-flt-select" onclick="Chatbot._selectFlight(${i})">Select this flight</button>
        </div>`;
      });
      html += '<br>Click a flight to select it, or type the flight number.';
      Chatbot._messages.push({ role:'bot', text:'', html });
      Chatbot._render();
    } catch(err) {
      Chatbot._addBot('Sorry, the search failed. Please try again or use the main search form.');
      Chatbot._step = 'idle';
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
    }
  },

  async _selectFlight(index) {
    const flight = Chatbot._context.flights[index];
    if (!flight) return;
    Chatbot._addUser(`Selected: ${flight.flightNumber} at ${flight.departure}`);
    Chatbot._clearQuick();

    // Trigger the actual booking flow in the main app
    Chatbot._addBot(`Excellent! You selected ${flight.flightNumber} departing at ${flight.departure}.\n\nI'll now take you to the passenger details form to complete your booking. The flight will be held for 15 minutes while you fill in the details.`);

    // Set up main app state
    State.tripType = 'one';
    State.pax = { adults: Chatbot._context.pax, children: 0, infants: 0 };
    State.cabin = 'economy';
    State.results = { outbound: Chatbot._context.flights, inbound: [] };
    State.selectedOut = flight;
    State.selectedIn = null;

    Chatbot._step = 'idle';

    try {
      const hold = await API.holdFlight({
        outboundFlight: flight,
        inboundFlight: null,
        passengers: State.pax,
        cabin: 'economy',
      });
      State.holdRef = hold.holdRef;
      State.holdExpiry = hold.expiresAt;

      const route = `${flight.origin} → ${flight.destination}`;
      document.getElementById('pax-route-label').textContent = route;
      Render.passengerForms();
      Render.bookingSummary('booking-summary-pax');
      setTimeout(() => {
        App.go('passengers');
        startHoldTimer();
      }, 1000);
      Chatbot._addBot('Taking you to the passenger form now. Fill in the details and proceed to payment to complete your booking!');
      Chatbot._showQuick(['Back to menu']);
    } catch(err) {
      Chatbot._addBot('Could not hold the fare. Please try using the main search form.');
      Chatbot._showQuick(['Book a flight', 'Back to menu']);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook App.go to trigger page-specific loaders
// ─────────────────────────────────────────────────────────────────────────────
const _appGoOrig = App.go.bind(App);
App.go = function(page) {
  _appGoOrig(page);
  if (page === 'my-bookings') MyBookings.load();
  if (page === 'dreammiles')  DreamMiles.render();
  if (page === 'manage') {
    document.getElementById('manage-result').style.display = 'none';
    document.getElementById('manage-error').textContent = '';
  }
  if (page === 'checkin') {
    document.getElementById('ci-result').style.display = 'none';
    document.getElementById('ci-error').textContent = '';
  }
  if (page === 'ancillaries') {
    document.getElementById('anc-booking-form').style.display = 'none';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Cookie.init();
  renderDestinations();
  setupAutocomplete('inp-origin', 'ac-origin');
  setupAutocomplete('inp-dest',   'ac-dest');

  // Set default departure date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('inp-depart').value = tomorrow.toISOString().split('T')[0];
  document.getElementById('inp-return').value = new Date(Date.now() + 8*86400000).toISOString().split('T')[0];

  // Set origin default code
  document.getElementById('inp-origin').dataset.code = 'KGL';

  // Search form submit
  document.getElementById('search-form').addEventListener('submit', e => Search.submit(e));

  // Close pax dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#field-pax')) Pax.close();
  });

  // Nav burger
  document.getElementById('nav-burger').addEventListener('click', () => {
    const nl = document.getElementById('nav-links');
    nl.style.display = nl.style.display === 'flex' ? 'none' : 'flex';
    nl.style.flexDirection = 'column';
    nl.style.position = 'absolute';
    nl.style.top = '56px';
    nl.style.left = '0';
    nl.style.right = '0';
    nl.style.background = 'var(--navy)';
    nl.style.padding = '1rem';
    nl.style.zIndex = '99';
  });

  // Initialise status date fields
  FlightStatus.init();

  // Restore session
  Auth.restore();
});
