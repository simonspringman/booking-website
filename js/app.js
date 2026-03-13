/* ============================================
   RwandAir Redesign — Application Logic
   Navigation, Search, Booking Flow, Chat, etc.
   ============================================ */

// ---- ABANDONED BOOKINGS CART ----
let abandonedBookings = JSON.parse(localStorage.getItem('abandonedBookings') || '[]');

function toggleCartDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('cartDropdown');
  dd.classList.toggle('open');
}

function renderCart() {
  const body = document.getElementById('cartDropdownBody');
  const badge = document.getElementById('cartBadge');
  const count = abandonedBookings.length;

  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);

  if (count === 0) {
    body.innerHTML = '<p class="cart-empty-msg">No saved bookings yet.</p>';
    return;
  }

  body.innerHTML = abandonedBookings.map((b, i) => `
    <div class="cart-item">
      <div class="cart-item-route">${b.from} &rarr; ${b.to}</div>
      <div class="cart-item-details">
        <span>${b.date}</span>
        <span>${b.passengers} passenger${b.passengers > 1 ? 's' : ''}</span>
        <span>${b.class}</span>
      </div>
      <div class="cart-item-actions">
        <button class="cart-resume-btn" onclick="resumeBooking(${i})">Resume</button>
        <button class="cart-remove-btn" onclick="removeFromCart(${i})">Remove</button>
      </div>
    </div>
  `).join('');
}

function addToCart(booking) {
  abandonedBookings.push(booking);
  localStorage.setItem('abandonedBookings', JSON.stringify(abandonedBookings));
  renderCart();
}

function removeFromCart(index) {
  abandonedBookings.splice(index, 1);
  localStorage.setItem('abandonedBookings', JSON.stringify(abandonedBookings));
  renderCart();
}

function resumeBooking(index) {
  const b = abandonedBookings[index];
  document.getElementById('cartDropdown').classList.remove('open');
  navigateTo('home');
  // Pre-fill search fields if possible
  const destInput = document.getElementById('nlf-destination');
  if (destInput && b.to) destInput.value = b.to;
}

function saveCurrentBookingToCart() {
  const destInput = document.getElementById('nlf-destination');
  const depDate = document.getElementById('nlf-depart');
  const retDate = document.getElementById('nlf-return');
  const paxEl = document.getElementById('nlf-pax');

  const to = destInput ? destInput.value.trim() : '';
  if (!to) return; // nothing to save

  const booking = {
    from: 'Kigali (KGL)',
    to: to,
    date: depDate ? depDate.value : '',
    returnDate: retDate ? retDate.value : '',
    passengers: paxEl ? parseInt(paxEl.value) || 1 : 1,
    class: 'Economy',
    savedAt: new Date().toISOString()
  };
  addToCart(booking);
}

// Close cart dropdown on outside click
document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('cartWrapper');
  const dd = document.getElementById('cartDropdown');
  if (wrapper && dd && !wrapper.contains(e.target)) {
    dd.classList.remove('open');
  }
});

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
  renderCart();
});

// ---- DREAMMILES CONFIG ----
const DREAMMILES_BALANCE = 45000;
const MILES_PER_DOLLAR = 100;
const BOOKING_TOTAL = 358.50;

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
  { city: 'Doha', code: 'DOH', country: 'Qatar' },
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
  holidays: 'Holidays', loyalty: 'Loyalty', help: 'Help'
};

function navigateTo(pageId) {
  // Auto-save abandoned booking when leaving results/booking pages
  const currentPage = document.querySelector('.page.active');
  if (currentPage) {
    const currentId = currentPage.id.replace('page-', '');
    if ((currentId === 'results' || currentId === 'booking') && pageId !== 'results' && pageId !== 'booking') {
      const from = document.getElementById('resultFrom');
      const to = document.getElementById('resultTo');
      if (from && to && to.textContent.trim()) {
        const dateEl = document.getElementById('resultDate');
        const booking = {
          from: from.textContent.trim(),
          to: to.textContent.trim(),
          date: dateEl ? dateEl.textContent.split('·')[0].trim() : '',
          passengers: 1,
          class: 'Economy',
          savedAt: new Date().toISOString()
        };
        addToCart(booking);
      }
    }
  }

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
  if (isDateInPast(new Date(depart + 'T00:00:00'))) {
    if (nlfVisible) showNLFGapError('nlfGapDepart');
    else showFieldError('searchDepart', 'Departure date cannot be in the past');
    return;
  }

  // Update results page
  const returnVal = document.getElementById('searchReturn').value;
  const tripType = returnVal ? 'Round Trip' : 'One Way';
  const dateStr = returnVal
    ? formatDateDisplay(depart) + ' \u2013 ' + formatDateDisplay(returnVal)
    : formatDateDisplay(depart);
  document.getElementById('resultFrom').textContent = from;
  document.getElementById('resultTo').textContent = to || 'Nairobi (NBO)';
  document.getElementById('resultDate').textContent =
    dateStr + ' \u00b7 1 Adult \u00b7 ' + tripType;

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
function generatePriceBand(departDate) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const baseDate = new Date(departDate + 'T00:00:00');
  const band = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offset);
    // Simulate prices: base ± random variation
    const base = 145 + Math.abs(offset) * 12;
    const variation = ((d.getDate() * 7 + d.getMonth() * 13) % 30) - 15;
    const price = base + variation;
    band.push({
      date: d,
      dayName: days[d.getDay()],
      dateStr: d.getDate() + ' ' + months[d.getMonth()],
      price: price,
      isSelected: offset === 0,
      isoDate: formatDate(d)
    });
  }
  return band;
}

function renderPriceBand(departDate) {
  const band = generatePriceBand(departDate);
  const today = new Date(); today.setHours(0,0,0,0);
  let html = '<div class="price-band-toggle" onclick="togglePriceBand()">' +
    '<span>Compare nearby dates</span>' +
    '<svg class="price-band-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>' +
    '</div>';
  html += '<div class="price-band" id="priceBand">';
  html += '<button class="price-band-nav" onclick="shiftPriceBand(-7)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg></button>';
  band.forEach(d => {
    const isPast = d.date < today;
    const cls = d.isSelected ? 'price-band-day selected' : (isPast ? 'price-band-day past' : 'price-band-day');
    const onclick = isPast ? '' : `onclick="selectPriceBandDay('${d.isoDate}')"`;
    html += `<div class="${cls}" ${onclick}>
      <span class="pbd-name">${d.dayName}</span>
      <span class="pbd-date">${d.dateStr}</span>
      <span class="pbd-price">${isPast ? '—' : '$' + d.price}</span>
    </div>`;
  });
  html += '<button class="price-band-nav" onclick="shiftPriceBand(7)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg></button>';
  html += '</div>';
  return html;
}

function togglePriceBand() {
  const band = document.getElementById('priceBand');
  const toggle = document.querySelector('.price-band-toggle');
  if (band) {
    band.classList.toggle('open');
    toggle.classList.toggle('open');
  }
}

function selectPriceBandDay(isoDate) {
  document.getElementById('searchDepart').value = isoDate;
  const from = document.getElementById('searchFrom').value;
  const to = document.getElementById('searchTo').value;
  // Update display
  document.getElementById('resultDate').textContent = formatDateDisplay(isoDate) + ' \u00b7 1 Adult \u00b7 Round Trip';
  const gapDepart = document.getElementById('nlfGapDepart');
  if (gapDepart) { gapDepart.textContent = formatDateDisplay(isoDate); gapDepart.dataset.parsedDate = isoDate; gapDepart.dataset.prevValue = formatDateDisplay(isoDate); }
  renderFlightResults(from, to);
  // Re-open the band
  setTimeout(() => { const b = document.getElementById('priceBand'); const t = document.querySelector('.price-band-toggle'); if (b) { b.classList.add('open'); t.classList.add('open'); } }, 50);
}

function shiftPriceBand(days) {
  const currentDepart = document.getElementById('searchDepart').value;
  const d = new Date(currentDepart + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const today = new Date(); today.setHours(0,0,0,0);
  if (d < today) return;
  selectPriceBandDay(formatDate(d));
}

function renderFlightFilters() {
  return `<div class="flight-filters">
    <div class="ff-group">
      <span class="ff-label">Stops</span>
      <button class="ff-pill active" data-filter="stops" data-value="all" onclick="applyFilter('stops','all',this)">All</button>
      <button class="ff-pill" data-filter="stops" data-value="direct" onclick="applyFilter('stops','direct',this)">Direct</button>
      <button class="ff-pill" data-filter="stops" data-value="1stop" onclick="applyFilter('stops','1stop',this)">1 Stop</button>
    </div>
    <div class="ff-group">
      <span class="ff-label">Departure</span>
      <button class="ff-pill active" data-filter="time" data-value="all" onclick="applyFilter('time','all',this)">All</button>
      <button class="ff-pill" data-filter="time" data-value="morning" onclick="applyFilter('time','morning',this)">Morning</button>
      <button class="ff-pill" data-filter="time" data-value="afternoon" onclick="applyFilter('time','afternoon',this)">Afternoon</button>
      <button class="ff-pill" data-filter="time" data-value="evening" onclick="applyFilter('time','evening',this)">Evening</button>
    </div>
    <div class="ff-group">
      <span class="ff-label">Sort</span>
      <button class="ff-pill active" data-filter="sort" data-value="departure" onclick="applySort('departure',this)">Departure</button>
      <button class="ff-pill" data-filter="sort" data-value="price" onclick="applySort('price',this)">Price</button>
    </div>
  </div>`;
}

const activeFilters = { stops: 'all', time: 'all' };

function applyFilter(type, value, btn) {
  activeFilters[type] = value;
  // Update pill states
  btn.closest('.ff-group').querySelectorAll('.ff-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  filterFlights();
}

function applySort(value, btn) {
  btn.closest('.ff-group').querySelectorAll('.ff-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');

  const container = document.getElementById('flightResults');
  const cards = [...container.querySelectorAll('.flight-card')];
  if (cards.length === 0) return;

  cards.sort((a, b) => {
    if (value === 'price') {
      const priceA = parseInt(a.querySelector('.price-amount').textContent.replace('$',''));
      const priceB = parseInt(b.querySelector('.price-amount').textContent.replace('$',''));
      return priceA - priceB;
    }
    // departure (default) — sort by time text
    const timeA = a.querySelector('.time').textContent;
    const timeB = b.querySelector('.time').textContent;
    return timeA.localeCompare(timeB);
  });

  // Re-insert sorted cards before the continue button
  const continueBtn = container.querySelector('[style*="justify-content"]');
  cards.forEach(c => container.insertBefore(c, continueBtn));
}

function filterFlights() {
  document.querySelectorAll('.flight-card').forEach(card => {
    const timeText = card.querySelector('.time').textContent;
    const hour = parseInt(timeText.split(':')[0]);
    const stopsText = card.querySelector('.stops').textContent.trim().toLowerCase();

    let showStops = true;
    if (activeFilters.stops === 'direct') showStops = stopsText === 'direct';
    else if (activeFilters.stops === '1stop') showStops = stopsText !== 'direct';

    let showTime = true;
    if (activeFilters.time === 'morning') showTime = hour >= 0 && hour < 12;
    else if (activeFilters.time === 'afternoon') showTime = hour >= 12 && hour < 18;
    else if (activeFilters.time === 'evening') showTime = hour >= 18;

    card.style.display = (showStops && showTime) ? '' : 'none';
  });
}

function renderLegHtml(f) {
  return `
    <div class="flight-bundle-leg">
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
      </div>
    </div>`;
}

function renderFlightResults(from, to) {
  const container = document.getElementById('flightResults');
  const departDate = document.getElementById('searchDepart').value;
  const returnDate = document.getElementById('searchReturn').value;
  const isRoundTrip = !!returnDate;

  container.innerHTML = renderPriceBand(departDate) + renderFlightFilters();

  if (isRoundTrip) {
    // ---- BUNDLED ROUND-TRIP CARDS ----
    const bundles = generateBundles();
    const departLabel = formatDateDisplay(departDate);
    const returnLabel = formatDateDisplay(returnDate);

    container.innerHTML += '<h3 style="margin-bottom:4px">Round-Trip Flights</h3>' +
      '<p style="font-size:14px;color:#64748b;margin-bottom:16px">Each option includes your outbound and return flights</p>';

    bundles.forEach((b, i) => {
      const seatsHtml = b.seatsLeft <= 5
        ? `<span class="flight-seats-left">${b.seatsLeft} seats left at this price</span>`
        : '';

      container.innerHTML += `
        <div class="flight-bundle" id="bundle-${i}" onclick="selectBundle(${i})">
          <div class="flight-bundle-legs">
            <div class="flight-bundle-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Outbound &middot; ${departLabel}
            </div>
            ${renderLegHtml(b.outbound)}
            <div class="flight-bundle-divider"></div>
            <div class="flight-bundle-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Return &middot; ${returnLabel}
            </div>
            ${renderLegHtml(b.inbound)}
          </div>
          <div class="flight-bundle-footer">
            <div class="flight-bundle-prices">
              <div class="flight-price-opt" onclick="event.stopPropagation();selectBundlePrice(${i},'lite')">
                <div class="price-class">Lite</div>
                <div class="price-amount">$${b.priceLite}</div>
                <div class="price-note">round trip</div>
              </div>
              <div class="flight-price-opt" onclick="event.stopPropagation();selectBundlePrice(${i},'economy')">
                <div class="price-class">Economy</div>
                <div class="price-amount">$${b.priceClassic}</div>
                <div class="price-note">round trip</div>
              </div>
              <div class="flight-price-opt" onclick="event.stopPropagation();selectBundlePrice(${i},'business')">
                <div class="price-class">Business</div>
                <div class="price-amount">$${b.priceBusiness}</div>
                <div class="price-note">round trip</div>
              </div>
            </div>
            ${seatsHtml}
            <button class="btn-primary flight-bundle-select" onclick="event.stopPropagation();selectBundle(${i});continueToBooking()">
              Select <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>`;
    });

  } else {
    // ---- ONE-WAY CARDS (existing behaviour) ----
    const flights = generateFlights();
    container.innerHTML += '<h3 style="margin-bottom:4px">Outbound Flights</h3>' +
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
            <div class="flight-price-opt" onclick="event.stopPropagation();selectFlightPrice(${i},'economy')">
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

    container.innerHTML += `
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <button class="btn-primary btn-lg" onclick="continueToBooking()">
          Continue with Selected Flight
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>`;
  }
}

function generateFlights() {
  return [
    { depTime: '06:30', arrTime: '07:55', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 400', aircraft: 'Boeing 737-800', priceLite: 155, priceClassic: 210, priceBusiness: 580, seatsLeft: 4 },
    { depTime: '08:30', arrTime: '09:55', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 402', aircraft: 'Airbus A330', priceLite: 170, priceClassic: 230, priceBusiness: 620, seatsLeft: 12 },
    { depTime: '14:00', arrTime: '15:25', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 404', aircraft: 'Boeing 737-800', priceLite: 145, priceClassic: 195, priceBusiness: 550, seatsLeft: 8 },
    { depTime: '19:45', arrTime: '21:10', depCode: 'KGL', arrCode: 'NBO', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 406', aircraft: 'Boeing 737-700', priceLite: 135, priceClassic: 180, priceBusiness: 520, seatsLeft: 15 },
  ];
}

function generateReturnFlights() {
  return [
    { depTime: '09:00', arrTime: '10:25', depCode: 'NBO', arrCode: 'KGL', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 401', aircraft: 'Boeing 737-800', priceLite: 150, priceClassic: 205, priceBusiness: 570, seatsLeft: 9 },
    { depTime: '13:30', arrTime: '14:55', depCode: 'NBO', arrCode: 'KGL', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 403', aircraft: 'Airbus A330', priceLite: 165, priceClassic: 220, priceBusiness: 610, seatsLeft: 6 },
    { depTime: '17:15', arrTime: '18:40', depCode: 'NBO', arrCode: 'KGL', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 405', aircraft: 'Boeing 737-800', priceLite: 140, priceClassic: 190, priceBusiness: 540, seatsLeft: 14 },
    { depTime: '21:00', arrTime: '22:25', depCode: 'NBO', arrCode: 'KGL', duration: '1h 25m', stops: 'Direct', flightNum: 'WB 407', aircraft: 'Boeing 737-700', priceLite: 130, priceClassic: 175, priceBusiness: 510, seatsLeft: 18 },
  ];
}

function generateBundles() {
  const outbound = generateFlights();
  const inbound = generateReturnFlights();
  const bundles = [];
  // Create 6 curated pairings
  const pairs = [[0,2],[1,0],[2,1],[0,3],[3,0],[2,3]];
  pairs.forEach(([oi, ii]) => {
    const o = outbound[oi], r = inbound[ii];
    bundles.push({
      outbound: o, inbound: r,
      priceLite: o.priceLite + r.priceLite,
      priceClassic: o.priceClassic + r.priceClassic,
      priceBusiness: o.priceBusiness + r.priceBusiness,
      seatsLeft: Math.min(o.seatsLeft, r.seatsLeft)
    });
  });
  return bundles;
}

function selectFlight(i) {
  document.querySelectorAll('.flight-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('flight-' + i).classList.add('selected');
}

function selectFlightPrice(flightIdx, fareClass) {
  document.querySelectorAll('.flight-price-opt').forEach(p => p.classList.remove('selected-price'));
  const card = document.getElementById('flight-' + flightIdx);
  const classMap = { lite: 0, economy: 1, classic: 1, business: 2 };
  const opts = card.querySelectorAll('.flight-price-opt');
  opts[classMap[fareClass]].classList.add('selected-price');
  selectFlight(flightIdx);
}

function selectBundle(i) {
  document.querySelectorAll('.flight-bundle').forEach(c => c.classList.remove('selected'));
  document.getElementById('bundle-' + i).classList.add('selected');
}

function selectBundlePrice(bundleIdx, fareClass) {
  document.querySelectorAll('.flight-bundle .flight-price-opt').forEach(p => p.classList.remove('selected-price'));
  const card = document.getElementById('bundle-' + bundleIdx);
  const classMap = { lite: 0, economy: 1, classic: 1, business: 2 };
  const opts = card.querySelectorAll('.flight-price-opt');
  opts[classMap[fareClass]].classList.add('selected-price');
  selectBundle(bundleIdx);
}

function holdFare(flightIdx) {
  var flights = generateFlights();
  var f = flights[flightIdx];
  selectFlight(flightIdx);

  // Show hold confirmation modal
  var modal = document.getElementById('holdFareModal');
  if (modal) {
    document.getElementById('holdFlightInfo').textContent = f.flightNum + ' (' + f.depTime + ' - ' + f.arrTime + ')';
    document.getElementById('holdPriceLite').textContent = '$' + f.priceLite;
    document.getElementById('holdPriceClassic').textContent = '$' + f.priceClassic;
    document.getElementById('holdPriceBusiness').textContent = '$' + f.priceBusiness;
    modal.classList.remove('hidden');
  }
}

function confirmHoldFare() {
  var modal = document.getElementById('holdFareModal');
  if (modal) modal.classList.add('hidden');

  // Show success notification
  var notif = document.createElement('div');
  notif.className = 'hold-success-notif';
  notif.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>'
    + '<div><strong>Fare held for 48 hours!</strong><br>We\'ll send a reminder before it expires.</div>';
  document.body.appendChild(notif);
  setTimeout(function() { notif.classList.add('show'); }, 10);
  setTimeout(function() { notif.classList.remove('show'); setTimeout(function() { notif.remove(); }, 400); }, 4000);
}

function cancelHoldFare() {
  var modal = document.getElementById('holdFareModal');
  if (modal) modal.classList.add('hidden');
}

function holdCurrentFare() {
  var modal = document.getElementById('holdFareModal');
  if (!modal) return;

  var flights = generateFlights();
  // Find selected flight from DOM
  var selected = document.querySelector('.flight-card.selected');
  var idx = selected ? parseInt(selected.id.replace('flight-', '')) : 0;
  var f = flights[idx] || flights[0];

  document.getElementById('holdFlightInfo').textContent = f.flightNum + ' (' + f.depTime + ' - ' + f.arrTime + ')';
  document.getElementById('holdPriceLite').textContent = '$' + f.priceLite;
  document.getElementById('holdPriceClassic').textContent = '$' + f.priceClassic;
  document.getElementById('holdPriceBusiness').textContent = '$' + f.priceBusiness;
  modal.classList.remove('hidden');
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

  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

  // Show modal
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('hidden');

  const progressBar = document.getElementById('paymentProgress');
  const stepText = document.getElementById('processingStep');

  // Customize steps based on payment method
  let steps;
  if (paymentMethod === 'miles') {
    const totalMiles = Math.ceil(BOOKING_TOTAL * MILES_PER_DOLLAR);
    steps = [
      { pct: 25, text: 'Verifying DreamMiles membership...' },
      { pct: 50, text: 'Checking miles balance...' },
      { pct: 75, text: 'Redeeming ' + totalMiles.toLocaleString() + ' DreamMiles...' },
      { pct: 95, text: 'Confirming award booking...' },
      { pct: 100, text: 'Complete!' }
    ];
  } else if (paymentMethod === 'split') {
    const slider = document.getElementById('splitSlider');
    const pct = parseInt(slider.value);
    const cashPortion = BOOKING_TOTAL * (1 - pct / 100);
    steps = [
      { pct: 20, text: 'Verifying DreamMiles membership...' },
      { pct: 40, text: 'Redeeming miles portion...' },
      { pct: 60, text: 'Processing $' + cashPortion.toFixed(2) + ' payment...' },
      { pct: 80, text: 'Authorizing split payment...' },
      { pct: 95, text: 'Finalizing booking...' },
      { pct: 100, text: 'Complete!' }
    ];
  } else {
    steps = [
      { pct: 25, text: 'Verifying payment details...' },
      { pct: 50, text: 'Connecting to payment provider...' },
      { pct: 75, text: 'Authorizing payment...' },
      { pct: 95, text: 'Finalizing booking...' },
      { pct: 100, text: 'Complete!' }
    ];
  }

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

// -- Conversation State Machine --
const chatState = {
  phase: 'idle',
  data: {
    from: 'Kigali (KGL)', to: null, departDate: null, returnDate: null,
    passengers: null, travelClass: null, selectedFlight: null, selectedFare: null,
    paxTitle: null, paxFirst: null, paxLast: null, paxDob: null,
    paxNat: null, paxPassport: null, paxEmail: null, paxPhone: null,
    seatChoice: null, baggageChoice: null, mealChoice: null, paymentMethod: null
  },
  history: []
};

function setChatPhase(p) { chatState.history.push(chatState.phase); chatState.phase = p; }
function resetChatState() {
  chatState.phase = 'idle';
  chatState.data = {
    from: 'Kigali (KGL)', to: null, departDate: null, returnDate: null,
    passengers: null, travelClass: null, selectedFlight: null, selectedFare: null,
    paxTitle: null, paxFirst: null, paxLast: null, paxDob: null,
    paxNat: null, paxPassport: null, paxEmail: null, paxPhone: null,
    seatChoice: null, baggageChoice: null, mealChoice: null, paymentMethod: null
  };
  chatState.history = [];
}

// -- Core Chat UI --
function toggleChat() {
  const win = document.getElementById('chatWindow');
  const fab = document.getElementById('chatFab');
  win.classList.toggle('hidden');
  if (!win.classList.contains('hidden')) {
    var badge = fab.querySelector('.chat-badge');
    if (badge) badge.style.display = 'none';
  }
}
function openChat() { document.getElementById('chatWindow').classList.remove('hidden'); }

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function addChatMessage(text, sender) {
  removeTypingIndicator();
  var body = document.getElementById('chatBody');
  var div = document.createElement('div');
  div.className = 'chat-msg ' + sender;
  div.innerHTML = '<div class="chat-bubble">' + escapeHtml(text) + '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function addChatHtml(html, sender) {
  removeTypingIndicator();
  var body = document.getElementById('chatBody');
  var div = document.createElement('div');
  div.className = 'chat-msg ' + sender;
  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble--rich';
  bubble.innerHTML = html;
  div.appendChild(bubble);
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function showTypingIndicator() {
  removeTypingIndicator();
  var body = document.getElementById('chatBody');
  var div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.id = 'chatTyping';
  div.innerHTML = '<div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}
function removeTypingIndicator() {
  var el = document.getElementById('chatTyping');
  if (el) el.remove();
}

// -- Dynamic Quick Replies --
function showQuickReplies(options) {
  removeQuickReplies();
  var body = document.getElementById('chatBody');
  var container = document.createElement('div');
  container.className = 'chat-quick-replies';
  container.id = 'chatQuickReplies';
  options.forEach(function(text) {
    var btn = document.createElement('button');
    btn.textContent = text;
    btn.onclick = function() { chatQuickReply(text); };
    container.appendChild(btn);
  });
  body.appendChild(container);
  body.scrollTop = body.scrollHeight;
}
function removeQuickReplies() {
  var els = document.querySelectorAll('.chat-quick-replies');
  els.forEach(function(el) { el.remove(); });
}

// -- Parsing Helpers --
function matchDestination(input) {
  var q = input.toLowerCase().trim();
  var match = NLF_DESTINATIONS.find(function(d) { return d.city.toLowerCase() === q; });
  if (match) return match;
  match = NLF_DESTINATIONS.find(function(d) { return d.code.toLowerCase() === q; });
  if (match) return match;
  match = NLF_DESTINATIONS.find(function(d) { return d.city.toLowerCase().startsWith(q); });
  if (match) return match;
  match = NLF_DESTINATIONS.find(function(d) { return d.country.toLowerCase().includes(q); });
  if (match) return match;
  return null;
}

function parseChatDate(input) {
  var lower = input.toLowerCase().trim();
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  if (lower === 'today') return new Date(today);
  if (lower === 'tomorrow') { var d = new Date(today); d.setDate(d.getDate() + 1); return d; }
  if (lower === 'next week' || lower === 'in 1 week' || lower === 'in a week') { var d2 = new Date(today); d2.setDate(d2.getDate() + 7); return d2; }
  if (lower === 'in 2 weeks' || lower === 'in two weeks') { var d3 = new Date(today); d3.setDate(d3.getDate() + 14); return d3; }
  var dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var nextMatch = lower.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  if (nextMatch) {
    var targetDay = dayNames.indexOf(nextMatch[1]);
    var nd = new Date(today);
    var diff = (targetDay + 7 - nd.getDay()) % 7 || 7;
    nd.setDate(nd.getDate() + diff);
    return nd;
  }
  // Fallback to existing parseNLFDate
  if (typeof parseNLFDate === 'function') return parseNLFDate(input);
  return null;
}

function parseFlightSelection(lower) {
  var flights = generateFlights();
  for (var i = 0; i < flights.length; i++) {
    if (lower.includes(flights[i].flightNum.toLowerCase())) return i;
  }
  if (lower.includes('1') || lower.includes('first') || lower.includes('cheapest')) return 0;
  if (lower.includes('2') || lower.includes('second')) return 1;
  if (lower.includes('3') || lower.includes('third')) return 2;
  if (lower.includes('4') || lower.includes('fourth') || lower.includes('last') || lower.includes('evening')) return 3;
  return null;
}

// -- Intent Detection --
function detectBookingIntent(msg) {
  var lower = msg.toLowerCase();
  var bookingWords = ['book', 'flight', 'fly', 'travel', 'trip', 'ticket', 'affordable', 'cheap'];
  var isBooking = bookingWords.some(function(w) { return lower.includes(w); });

  // Try to extract destination from phrases like "fly to Nairobi" or "book a flight to Lagos"
  var extracted = {};
  var toMatch = lower.match(/(?:to|for)\s+([a-z\s]+?)(?:\s+on|\s+from|\s+in|\s*$)/);
  if (toMatch) {
    var dest = matchDestination(toMatch[1].trim());
    if (dest) { extracted.to = dest; isBooking = true; }
  }
  // Also check if the whole message is a city name
  if (!extracted.to) {
    var directDest = matchDestination(lower.replace(/^(i want to |i'd like to |book |fly |go )/, '').trim());
    if (directDest && isBooking) extracted.to = directDest;
  }
  return { isBooking: isBooking, extractedData: extracted };
}

function handleGeneralQuery(msg) {
  var lower = msg.toLowerCase();
  if (lower.includes('bag') || lower.includes('luggage')) {
    addChatMessage("Economy Lite includes 7 kg hand baggage. Economy Classic adds 1 x 23 kg checked bag. Business Class includes 2 x 32 kg checked bags.", 'bot');
    showQuickReplies(['Book a flight', 'More help']);
  } else if (lower.includes('refund') || lower.includes('cancel')) {
    addChatMessage("Refund eligibility depends on your fare type. Economy Classic and Business fares may be eligible. Please share your booking reference and I'll check.", 'bot');
    showQuickReplies(['Book a flight', 'More help']);
  } else if (lower.includes('check') && lower.includes('in')) {
    addChatMessage("Online check-in opens 24 hours before departure and closes 3 hours before. You'll need your booking reference and passport.", 'bot');
    showQuickReplies(['Book a flight', 'More help']);
  } else if (lower.includes('booking') || lower.includes('status') || lower.includes('reference')) {
    addChatMessage("To check your booking status, please provide your booking reference (e.g., WB-2025-NBO-78421).", 'bot');
    showQuickReplies(['Book a flight', 'More help']);
  } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    addChatMessage("Hello! I can help you search and book affordable flights. Want to get started?", 'bot');
    showQuickReplies(['Book a flight', 'Check booking status', 'Baggage info']);
  } else {
    addChatMessage("I can help you book flights, check booking status, baggage info, and more. What would you like to do?", 'bot');
    showQuickReplies(['Book a flight', 'Check booking status', 'Baggage info', 'Check-in help']);
  }
}

// -- Start Booking Flow --
function startBookingFlow(extracted) {
  if (extracted.to) {
    chatState.data.to = extracted.to.city + ' (' + extracted.to.code + ')';
    addChatMessage(extracted.to.city + ', ' + extracted.to.country + ' — great choice! When would you like to depart?', 'bot');
    setChatPhase('ask_depart_date');
    showQuickReplies(['Tomorrow', 'Next week', 'In 2 weeks']);
  } else {
    addChatMessage("Let's find you a great flight! Where would you like to fly to?", 'bot');
    setChatPhase('ask_destination');
    showQuickReplies(['Nairobi', 'Lagos', 'Dubai', 'London', 'Johannesburg']);
  }
}

// -- Flight Cards in Chat --
function addChatFlightCards(flights) {
  var html = '<div class="chat-flights">';
  flights.forEach(function(f, i) {
    var cheapest = Math.min(f.priceLite, f.priceClassic, f.priceBusiness);
    html += '<div class="chat-flight-card" onclick="chatSelectFlight(' + i + ')">'
      + '<div class="chat-flight-top">'
      + '<span class="chat-flight-time">' + f.depTime + ' - ' + f.arrTime + '</span>'
      + '<span class="chat-flight-price">from $' + cheapest + '</span>'
      + '</div>'
      + '<div class="chat-flight-detail">'
      + f.flightNum + ' &middot; ' + f.duration + ' &middot; ' + f.stops
      + (f.seatsLeft <= 5 ? ' &middot; <span class="chat-seats-warn">' + f.seatsLeft + ' seats left</span>' : '')
      + '</div></div>';
  });
  html += '</div>';
  addChatHtml(html, 'bot');
}

function chatSelectFlight(index) {
  var flights = generateFlights();
  var f = flights[index];
  chatState.data.selectedFlight = index;
  addChatMessage('Selected ' + f.flightNum + ' (' + f.depTime + ' - ' + f.arrTime + ')', 'user');

  var html = '<div class="chat-fares"><p style="margin:0 0 8px;font-weight:600">Choose your fare:</p>';
  html += '<div class="chat-fare-option" onclick="chatSelectFare(' + index + ',\'lite\')">'
    + '<strong>Lite</strong> — $' + f.priceLite + '<br><small>Hand bag only, non-refundable</small></div>';
  html += '<div class="chat-fare-option" onclick="chatSelectFare(' + index + ',\'economy\')">'
    + '<strong>Economy</strong> — $' + f.priceClassic + '<br><small>23 kg bag + seat selection</small></div>';
  html += '<div class="chat-fare-option" onclick="chatSelectFare(' + index + ',\'business\')">'
    + '<strong>Business</strong> — $' + f.priceBusiness + '<br><small>2 bags + lounge + full flexibility</small></div>';
  html += '</div>';
  addChatHtml(html, 'bot');
  setChatPhase('ask_fare');
}

function chatSelectFare(flightIdx, fare) {
  var flights = generateFlights();
  var f = flights[flightIdx];
  var prices = { lite: f.priceLite, economy: f.priceClassic, business: f.priceBusiness };
  chatState.data.selectedFare = fare;
  addChatMessage('Selected ' + fare.charAt(0).toUpperCase() + fare.slice(1) + ' — $' + prices[fare], 'user');

  // Show confirmation summary
  var d = chatState.data;
  var html = '<div class="chat-summary">'
    + '<strong>Booking Summary</strong><br>'
    + d.from + ' &rarr; ' + d.to + '<br>'
    + 'Flight: ' + f.flightNum + ' (' + f.depTime + ' - ' + f.arrTime + ')<br>'
    + 'Date: ' + formatDateDisplay(d.departDate) + '<br>'
    + 'Fare: ' + fare.charAt(0).toUpperCase() + fare.slice(1) + ' — $' + prices[fare] + '<br>'
    + 'Passengers: ' + (d.passengers || '1 adult')
    + '</div>';
  addChatHtml(html, 'bot');
  addChatMessage('Looks good? Confirm to continue with passenger details.', 'bot');
  setChatPhase('confirm_flight');
  showQuickReplies(['Confirm', 'Choose different flight', 'Cancel']);
}

// -- Search Summary --
function showSearchSummary() {
  var d = chatState.data;
  var html = '<div class="chat-summary">'
    + '<strong>Search Summary</strong><br>'
    + 'From: ' + (d.from || 'Kigali (KGL)') + '<br>'
    + 'To: ' + d.to + '<br>'
    + 'Depart: ' + formatDateDisplay(d.departDate) + '<br>'
    + (d.returnDate ? 'Return: ' + formatDateDisplay(d.returnDate) + '<br>' : 'One-way<br>')
    + 'Passengers: ' + (d.passengers || '1 adult') + '<br>'
    + 'Class: ' + (d.travelClass || 'Economy')
    + '</div>';
  addChatHtml(html, 'bot');
  addChatMessage('Ready to search? Or would you like to change anything?', 'bot');
}

// -- Booking Summary --
function showBookingSummary() {
  var d = chatState.data;
  var flights = generateFlights();
  var f = flights[d.selectedFlight] || flights[0];
  var prices = { lite: f.priceLite, economy: f.priceClassic, business: f.priceBusiness };
  var fare = d.selectedFare || 'economy';

  var html = '<div class="chat-summary">'
    + '<strong>Final Booking Summary</strong><br>'
    + d.from + ' &rarr; ' + d.to + '<br>'
    + 'Flight: ' + f.flightNum + ' on ' + formatDateDisplay(d.departDate) + '<br>'
    + 'Passenger: ' + (d.paxTitle || '') + ' ' + (d.paxFirst || '') + ' ' + (d.paxLast || '') + '<br>'
    + 'Extras: ' + (d.baggageChoice === '30' ? '+1 bag' : d.baggageChoice === '55' ? '+2 bags' : 'No extra bags') + '<br>'
    + 'Meal: ' + (d.mealChoice || 'Standard') + '<br>'
    + 'Payment: ' + (d.paymentMethod || 'Mobile Money') + '<br>'
    + '<strong>Total: $' + prices[fare] + '</strong>'
    + '</div>';
  addChatHtml(html, 'bot');
}

// -- Form Bridge Functions --
function executeChatSearch() {
  document.getElementById('searchFrom').value = chatState.data.from || 'Kigali (KGL)';
  document.getElementById('searchTo').value = chatState.data.to;
  document.getElementById('searchDepart').value = chatState.data.departDate;
  if (chatState.data.returnDate) document.getElementById('searchReturn').value = chatState.data.returnDate;
  document.getElementById('searchPax').value = chatState.data.passengers || '1 adult';
  document.getElementById('searchClass').value = chatState.data.travelClass || 'Economy';

  var flights = generateFlights();
  addChatMessage('I found ' + flights.length + ' flights for you. Here are your options, sorted by price:', 'bot');

  // Sort by cheapest
  var sorted = flights.map(function(f, i) { f._idx = i; return f; })
    .sort(function(a, b) { return a.priceLite - b.priceLite; });
  addChatFlightCards(sorted);
  setChatPhase('show_results');
}

function executeChatFlightSelection() {
  var from = chatState.data.from || 'Kigali (KGL)';
  var to = chatState.data.to;
  document.getElementById('resultFrom').textContent = from;
  document.getElementById('resultTo').textContent = to;
  document.getElementById('resultDate').textContent =
    formatDateDisplay(chatState.data.departDate) + ' \u00b7 1 Adult \u00b7 Round Trip';
  renderFlightResults(from, to);
  selectFlightPrice(chatState.data.selectedFlight, chatState.data.selectedFare);
}

function fillPassengerForm() {
  var d = chatState.data;
  var el;
  el = document.getElementById('paxTitle'); if (el && d.paxTitle) el.value = d.paxTitle;
  el = document.getElementById('paxFirst'); if (el && d.paxFirst) el.value = d.paxFirst;
  el = document.getElementById('paxLast'); if (el && d.paxLast) el.value = d.paxLast;
  el = document.getElementById('paxDob'); if (el && d.paxDob) el.value = d.paxDob;
  el = document.getElementById('paxNat'); if (el && d.paxNat) el.value = d.paxNat;
  el = document.getElementById('paxPassport'); if (el && d.paxPassport) el.value = d.paxPassport;
  el = document.getElementById('paxEmail'); if (el && d.paxEmail) el.value = d.paxEmail;
  el = document.getElementById('paxPhone'); if (el && d.paxPhone) el.value = d.paxPhone;
}

function fillExtrasAndPayment() {
  var d = chatState.data;
  var bagVal = d.baggageChoice || '0';
  var bagRadio = document.querySelector('input[name="baggage"][value="' + bagVal + '"]');
  if (bagRadio) bagRadio.checked = true;

  var payVal = d.paymentMethod || 'mobile';
  var payRadio = document.querySelector('input[name="payment"][value="' + payVal + '"]');
  if (payRadio) {
    payRadio.checked = true;
    payRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }
  document.getElementById('termsCheck').checked = true;
}

function executeFullBooking() {
  addChatMessage("Setting up your booking... one moment!", 'bot');
  showTypingIndicator();

  // 1. Sync search & results
  executeChatFlightSelection();
  continueToBooking();

  setTimeout(function() {
    // 2. Fill passenger form
    fillPassengerForm();
    goToStep(2);

    setTimeout(function() {
      // 3. Fill extras & go to payment
      goToStep(3);
      setTimeout(function() {
        fillExtrasAndPayment();
        removeTypingIndicator();
        addChatMessage("Everything is ready! Review the payment details on the page and click 'Complete Booking' when you're set.", 'bot');
        setChatPhase('complete');
        showQuickReplies(['Book another flight', 'Help']);
      }, 300);
    }, 300);
  }, 400);
}

// -- Main Conversational Engine --
function handleBookingInput(msg) {
  var lower = msg.toLowerCase().trim();

  // Universal commands
  if (lower === 'cancel' || lower === 'start over' || lower === 'quit') {
    resetChatState();
    addChatMessage("No problem! Booking cancelled. How else can I help?", 'bot');
    showQuickReplies(['Book a flight', 'Check booking status', 'Baggage info', 'Help']);
    return;
  }
  if (lower === 'back' || lower === 'go back') {
    if (chatState.history.length > 0) {
      var prev = chatState.history.pop();
      chatState.phase = prev;
      addChatMessage("Going back. Let me ask that again.", 'bot');
      promptForPhase(prev);
    } else {
      addChatMessage("You're at the start. Type 'book a flight' to begin.", 'bot');
    }
    return;
  }

  switch (chatState.phase) {

    case 'ask_destination':
      var destInput = lower.replace(/^(i want to |i'd like to |fly to |go to |travel to |heading to )/, '');
      var dest = matchDestination(destInput);
      if (!dest) {
        addChatMessage("I couldn't find that in our network. We fly to " + NLF_DESTINATIONS.length + " destinations. Try a city like Nairobi, Lagos, or Dubai.", 'bot');
        showQuickReplies(['Nairobi', 'Lagos', 'Dubai', 'London', 'Johannesburg', 'Addis Ababa']);
        return;
      }
      chatState.data.to = dest.city + ' (' + dest.code + ')';
      addChatMessage(dest.city + ', ' + dest.country + ' — great choice! When would you like to depart?', 'bot');
      setChatPhase('ask_depart_date');
      showQuickReplies(['Tomorrow', 'Next week', 'In 2 weeks']);
      break;

    case 'ask_depart_date':
      var depDate = parseChatDate(lower);
      if (!depDate) {
        addChatMessage("I couldn't understand that date. Try 'next Friday', '24 Mar', or 'in 2 weeks'.", 'bot');
        return;
      }
      var now = new Date(); now.setHours(0,0,0,0);
      if (depDate < now) {
        addChatMessage("That date is in the past. Please choose a future date.", 'bot');
        return;
      }
      chatState.data.departDate = formatDate(depDate);
      addChatMessage('Departing on ' + formatDateDisplay(chatState.data.departDate) + '. Would you like a return flight?', 'bot');
      setChatPhase('ask_return_date');
      showQuickReplies(['In 1 week', 'In 2 weeks', 'One-way only']);
      break;

    case 'ask_return_date':
      if (lower.includes('one-way') || lower.includes('one way') || lower === 'no' || lower === 'skip') {
        chatState.data.returnDate = null;
        addChatMessage("One-way trip. How many passengers?", 'bot');
      } else {
        var retDate = parseChatDate(lower);
        if (!retDate) {
          addChatMessage("Couldn't parse that date. Try 'in 1 week' or type 'one-way'.", 'bot');
          return;
        }
        chatState.data.returnDate = formatDate(retDate);
        addChatMessage('Returning on ' + formatDateDisplay(chatState.data.returnDate) + '. How many passengers?', 'bot');
      }
      setChatPhase('ask_passengers');
      showQuickReplies(['1 adult', '2 adults', '2 adults, 1 child', '1 adult, 1 child']);
      break;

    case 'ask_passengers':
      var paxMatch = NLF_PASSENGERS.find(function(p) { return lower.includes(p.toLowerCase()); });
      chatState.data.passengers = paxMatch || msg;
      addChatMessage(chatState.data.passengers + '. Economy or Business class?', 'bot');
      setChatPhase('ask_class');
      showQuickReplies(['Economy', 'Business']);
      break;

    case 'ask_class':
      chatState.data.travelClass = lower.includes('business') ? 'Business' : 'Economy';
      showSearchSummary();
      setChatPhase('confirm_search');
      showQuickReplies(['Search flights', 'Change destination', 'Change date', 'Cancel']);
      break;

    case 'confirm_search':
      if (lower.includes('search') || lower.includes('yes') || lower.includes('find') || lower.includes('go')) {
        executeChatSearch();
      } else if (lower.includes('destination') || lower.includes('city') || lower.includes('where')) {
        chatState.phase = 'ask_destination';
        addChatMessage("Where would you like to fly to?", 'bot');
        showQuickReplies(['Nairobi', 'Lagos', 'Dubai', 'London', 'Johannesburg']);
      } else if (lower.includes('date') || lower.includes('when')) {
        chatState.phase = 'ask_depart_date';
        addChatMessage("When would you like to depart?", 'bot');
        showQuickReplies(['Tomorrow', 'Next week', 'In 2 weeks']);
      } else {
        addChatMessage("Say 'search' to find flights, or tell me what you'd like to change.", 'bot');
      }
      break;

    case 'show_results':
      var flightNum = parseFlightSelection(lower);
      if (flightNum !== null) {
        chatSelectFlight(flightNum);
      } else {
        addChatMessage("Tap a flight above to select it, or type the flight number (e.g., 'WB 400').", 'bot');
      }
      break;

    case 'ask_fare':
      if (lower.includes('lite') || lower.includes('cheapest')) chatSelectFare(chatState.data.selectedFlight, 'lite');
      else if (lower.includes('business')) chatSelectFare(chatState.data.selectedFlight, 'business');
      else if (lower.includes('economy') || lower.includes('classic') || lower.includes('standard')) chatSelectFare(chatState.data.selectedFlight, 'economy');
      else addChatMessage("Please choose: Lite, Economy, or Business.", 'bot');
      break;

    case 'confirm_flight':
      if (lower.includes('confirm') || lower.includes('yes') || lower.includes('continue') || lower.includes('ok')) {
        addChatMessage("Let's get your passenger details. What is your title?", 'bot');
        setChatPhase('ask_pax_title');
        showQuickReplies(['Mr', 'Mrs', 'Ms', 'Dr']);
      } else if (lower.includes('change') || lower.includes('different') || lower.includes('back')) {
        setChatPhase('show_results');
        addChatMessage("Here are the flights again:", 'bot');
        addChatFlightCards(generateFlights());
      } else {
        addChatMessage("Say 'confirm' to proceed or 'change' to pick a different flight.", 'bot');
      }
      break;

    // -- Passenger Details --
    case 'ask_pax_title':
      var titles = ['mr', 'mrs', 'ms', 'dr'];
      var titleMatch = titles.find(function(t) { return lower.includes(t); });
      chatState.data.paxTitle = titleMatch ? titleMatch.charAt(0).toUpperCase() + titleMatch.slice(1) : msg;
      addChatMessage("First name? (as on passport)", 'bot');
      setChatPhase('ask_pax_first');
      break;

    case 'ask_pax_first':
      if (msg.length < 2) { addChatMessage("Name must be at least 2 characters.", 'bot'); return; }
      chatState.data.paxFirst = msg;
      addChatMessage("Last name?", 'bot');
      setChatPhase('ask_pax_last');
      break;

    case 'ask_pax_last':
      if (msg.length < 2) { addChatMessage("Name must be at least 2 characters.", 'bot'); return; }
      chatState.data.paxLast = msg;
      addChatMessage("Date of birth? (e.g., 15 Jan 1990)", 'bot');
      setChatPhase('ask_pax_dob');
      break;

    case 'ask_pax_dob':
      var dob = parseChatDate(lower);
      if (!dob) { addChatMessage("Couldn't parse that. Try '15 Jan 1990' or '1990-01-15'.", 'bot'); return; }
      chatState.data.paxDob = formatDate(dob);
      addChatMessage("Nationality?", 'bot');
      setChatPhase('ask_pax_nationality');
      showQuickReplies(['Rwanda', 'Kenya', 'Uganda', 'Nigeria', 'South Africa']);
      break;

    case 'ask_pax_nationality':
      chatState.data.paxNat = msg;
      addChatMessage("Passport number? (e.g., AB1234567)", 'bot');
      setChatPhase('ask_pax_passport');
      break;

    case 'ask_pax_passport':
      if (msg.length < 5) { addChatMessage("That doesn't look valid. Please try again.", 'bot'); return; }
      chatState.data.paxPassport = msg;
      addChatMessage("Email address?", 'bot');
      setChatPhase('ask_pax_email');
      break;

    case 'ask_pax_email':
      if (!msg.includes('@')) { addChatMessage("Please enter a valid email address.", 'bot'); return; }
      chatState.data.paxEmail = msg;
      addChatMessage("Phone number? (e.g., +250 7XX XXX XXX)", 'bot');
      setChatPhase('ask_pax_phone');
      break;

    case 'ask_pax_phone':
      chatState.data.paxPhone = msg;
      addChatMessage("Would you like extra baggage? Your fare includes hand baggage.", 'bot');
      setChatPhase('ask_baggage');
      showQuickReplies(['No extra', '+1 bag ($30)', '+2 bags ($55)']);
      break;

    // -- Extras --
    case 'ask_baggage':
      if (lower.includes('no') || lower.includes('skip') || lower.includes('none')) chatState.data.baggageChoice = '0';
      else if (lower.includes('2') || lower.includes('55')) chatState.data.baggageChoice = '55';
      else if (lower.includes('1') || lower.includes('30')) chatState.data.baggageChoice = '30';
      else chatState.data.baggageChoice = '0';
      addChatMessage("Meal preference?", 'bot');
      setChatPhase('ask_meal');
      showQuickReplies(['Standard', 'Vegetarian', 'Halal', 'Vegan']);
      break;

    case 'ask_meal':
      if (lower.includes('veg')) chatState.data.mealChoice = 'vegetarian';
      else if (lower.includes('halal')) chatState.data.mealChoice = 'halal';
      else if (lower.includes('vegan')) chatState.data.mealChoice = 'vegan';
      else chatState.data.mealChoice = 'standard';
      addChatMessage("How would you like to pay?", 'bot');
      setChatPhase('ask_payment');
      showQuickReplies(['Mobile Money', 'Credit Card', 'Bank Transfer']);
      break;

    case 'ask_payment':
      if (lower.includes('mobile') || lower.includes('mtn') || lower.includes('airtel') || lower.includes('momo')) chatState.data.paymentMethod = 'mobile';
      else if (lower.includes('card') || lower.includes('visa') || lower.includes('credit') || lower.includes('debit')) chatState.data.paymentMethod = 'card';
      else if (lower.includes('bank') || lower.includes('transfer')) chatState.data.paymentMethod = 'bank';
      else if (lower.includes('mile')) chatState.data.paymentMethod = 'miles';
      else chatState.data.paymentMethod = 'mobile';
      showBookingSummary();
      addChatMessage("Ready to complete your booking?", 'bot');
      setChatPhase('confirm_booking');
      showQuickReplies(['Confirm and pay', 'Review details', 'Cancel']);
      break;

    case 'confirm_booking':
      if (lower.includes('confirm') || lower.includes('pay') || lower.includes('yes') || lower.includes('complete')) {
        executeFullBooking();
      } else if (lower.includes('review')) {
        showBookingSummary();
      } else {
        addChatMessage("Say 'confirm' to proceed to payment, or 'cancel' to start over.", 'bot');
      }
      break;

    case 'complete':
      if (lower.includes('book') || lower.includes('another') || lower.includes('new')) {
        resetChatState();
        startBookingFlow({});
      } else {
        handleGeneralQuery(msg);
        resetChatState();
      }
      break;

    default:
      handleGeneralQuery(msg);
      break;
  }
}

// -- Phase Re-prompt (for back navigation) --
function promptForPhase(phase) {
  switch (phase) {
    case 'idle':
      showQuickReplies(['Book a flight', 'Check booking status', 'Baggage info', 'Help']);
      break;
    case 'ask_destination':
      addChatMessage("Where would you like to fly to?", 'bot');
      showQuickReplies(['Nairobi', 'Lagos', 'Dubai', 'London', 'Johannesburg']);
      break;
    case 'ask_depart_date':
      addChatMessage("When would you like to depart?", 'bot');
      showQuickReplies(['Tomorrow', 'Next week', 'In 2 weeks']);
      break;
    case 'ask_return_date':
      addChatMessage("Would you like a return flight? When?", 'bot');
      showQuickReplies(['In 1 week', 'In 2 weeks', 'One-way only']);
      break;
    case 'ask_passengers':
      addChatMessage("How many passengers?", 'bot');
      showQuickReplies(['1 adult', '2 adults', '2 adults, 1 child']);
      break;
    case 'ask_class':
      addChatMessage("Economy or Business?", 'bot');
      showQuickReplies(['Economy', 'Business']);
      break;
    default:
      addChatMessage("Let's continue. What would you like to do?", 'bot');
      showQuickReplies(['Book a flight', 'Cancel']);
      break;
  }
}

// -- Main Send Function (Intent Router) --
function sendChat() {
  var input = document.getElementById('chatInput');
  var msg = input.value.trim();
  if (!msg) return;

  addChatMessage(msg, 'user');
  input.value = '';
  removeQuickReplies();

  showTypingIndicator();
  setTimeout(function() {
    removeTypingIndicator();
    if (chatState.phase !== 'idle') {
      handleBookingInput(msg);
    } else {
      var intent = detectBookingIntent(msg);
      if (intent.isBooking) {
        startBookingFlow(intent.extractedData);
      } else {
        handleGeneralQuery(msg);
      }
    }
  }, 700);
}

function chatQuickReply(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
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

  // Set min date on classic form date inputs to today
  const todayStr = formatDate(today);
  const advDepart = document.getElementById('advSearchDepart');
  const advReturn = document.getElementById('advSearchReturn');
  if (advDepart) advDepart.min = todayStr;
  if (advReturn) advReturn.min = todayStr;

  // Helper: remove stray <br> nodes so CSS :empty works on contenteditable
  function cleanEmptyGap(gap) {
    if (!gap.textContent.trim()) { gap.innerHTML = ''; }
  }

  // City gap events
  ['nlfGapFrom', 'nlfGapTo'].forEach(id => {
    const gap = document.getElementById(id);
    if (!gap) return;
    // Use both focus and click to ensure suggestions appear on first interaction
    function activateGap() {
      if (gap.classList.contains('nlf-gap--empty')) {
        gap.textContent = '';
        gap.classList.remove('nlf-gap--empty');
      }
      // Select all text so gap stays visible; typing replaces selection
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(gap);
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
      cleanEmptyGap(this);
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
        // Select all so gap stays visible; typing replaces selection
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(this);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch(e) {}
      } else { this.textContent = ''; }
      hideGhost(this);
    });
    gap.addEventListener('input', function() {
      cleanEmptyGap(this);
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
      else {
        this.dataset.prevValue = this.textContent;
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(this);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch(e) {}
      }
      showOptionSuggestions(this, '', NLF_PASSENGERS, 'searchPax');
    });
    paxGap.addEventListener('input', function() {
      cleanEmptyGap(this);
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
      else {
        this.dataset.prevValue = this.textContent;
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(this);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch(e) {}
      }
      showOptionSuggestions(this, '', NLF_CLASSES, 'searchClass');
    });
    classGap.addEventListener('input', function() {
      cleanEmptyGap(this);
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

// Date parsing — returns date object (including past dates so we can show them greyed out)
function parseNLFDate(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  const today = new Date();

  // Try "24 Mar", "24 March", "Mar 24", "March 24", with optional year like "24 Mar 2027"
  for (let mi = 0; mi < 12; mi++) {
    const short = MONTH_NAMES[mi].toLowerCase();
    const full = MONTH_FULL[mi];
    // Patterns: "24 Mar 2027", "24 March 2027", "Mar 24 2027", "March 24 2027" (year optional)
    const regA = new RegExp('^(\\d{1,2})\\s*' + short + '(?:\\s+(\\d{4}))?');
    const regB = new RegExp('^(\\d{1,2})\\s*' + full + '(?:\\s+(\\d{4}))?');
    const regC = new RegExp('^' + short + '\\s*(\\d{1,2})(?:\\s+(\\d{4}))?');
    const regD = new RegExp('^' + full + '\\s*(\\d{1,2})(?:\\s+(\\d{4}))?');

    let m;
    if ((m = s.match(regA)) || (m = s.match(regB)) || (m = s.match(regC)) || (m = s.match(regD))) {
      const day = parseInt(m[1]);
      const explicitYear = m[2] ? parseInt(m[2]) : null;
      let year = explicitYear || today.getFullYear();
      const candidate = new Date(year, mi, day);
      // Only auto-bump to next year if no explicit year was given
      if (!explicitYear && candidate < today) candidate.setFullYear(year + 1);
      if (day >= 1 && day <= 31) return candidate;
    }
  }

  // Try "24/3", "24-3", "24.3", "24/3/2027"
  const slashMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1;
    let year = slashMatch[3] ? parseInt(slashMatch[3]) : today.getFullYear();
    if (year < 100) year += 2000;
    const candidate = new Date(year, month, day);
    // Only auto-bump if no explicit year
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

function isDateInPast(dateObj) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
}

function updateDateGhost(gap, query) {
  const wrapper = gap.closest('.nlf-gap-wrapper');
  let ghost = wrapper.querySelector('.nlf-ghost');
  if (!ghost) { ghost = document.createElement('span'); ghost.className = 'nlf-ghost'; wrapper.appendChild(ghost); }

  const parsed = parseNLFDate(query);
  if (parsed) {
    gap.dataset.parsedDate = formatDate(parsed);
    if (isDateInPast(parsed)) {
      ghost.textContent = ' → ' + formatDateDisplay(formatDate(parsed)) + ' (past date)';
      ghost.style.display = 'inline';
      ghost.style.color = '#dc2626';
    } else {
      ghost.textContent = ' → ' + formatDateDisplay(formatDate(parsed));
      ghost.style.display = 'inline';
      ghost.style.color = '';
    }
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
  // Block past dates
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (isDateInPast(dateObj)) {
    showNLFGapError(gap.id);
    hideGhost(gap);
    // Restore previous value
    const prev = gap.dataset.prevValue;
    if (prev) { gap.textContent = prev; gap.classList.add('nlf-gap--filled'); }
    else { gap.textContent = gap.dataset.placeholder; gap.classList.add('nlf-gap--empty'); gap.classList.remove('nlf-gap--filled'); }
    return;
  }
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
      const val = this.value;

      // Hide all conditional payment forms
      ['payMobile', 'payMiles', 'paySplit', 'milesBalanceBanner'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      // Show relevant forms
      if (val === 'mobile') {
        document.getElementById('payMobile').style.display = '';
      } else if (val === 'miles') {
        document.getElementById('milesBalanceBanner').style.display = '';
        document.getElementById('payMiles').style.display = '';
        updateMilesCalculation();
      } else if (val === 'split') {
        document.getElementById('milesBalanceBanner').style.display = '';
        document.getElementById('paySplit').style.display = '';
        updateSplitCalculation();
      }

      // Update active tab styling
      document.querySelectorAll('.payment-tab').forEach(tab => tab.classList.remove('active'));
      this.closest('.payment-tab').classList.add('active');

      // Update pay button text
      updatePayButtonText(val);
    });
  });

  // Split slider listener
  const slider = document.getElementById('splitSlider');
  if (slider) {
    slider.addEventListener('input', function() {
      updateSplitCalculation();
    });
  }

  // Split cash method toggle
  document.querySelectorAll('input[name="splitCashMethod"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const splitMobileForm = document.getElementById('splitMobileForm');
      if (splitMobileForm) {
        splitMobileForm.style.display = this.value === 'mobile' ? '' : 'none';
      }
    });
  });
}

// ---- MILES CALCULATIONS ----
function updateMilesCalculation() {
  const totalMilesNeeded = Math.ceil(BOOKING_TOTAL * MILES_PER_DOLLAR);
  const remaining = DREAMMILES_BALANCE - totalMilesNeeded;
  const hasEnough = remaining >= 0;

  document.getElementById('milesFlightTotal').textContent = '$' + BOOKING_TOTAL.toFixed(2);
  document.getElementById('milesRequired').textContent = totalMilesNeeded.toLocaleString() + ' miles';
  document.getElementById('milesRemaining').textContent =
    (hasEnough ? remaining.toLocaleString() : '(' + Math.abs(remaining).toLocaleString() + ' short)') + ' miles';

  const statusEl = document.getElementById('milesStatus');
  if (hasEnough) {
    statusEl.className = 'miles-status miles-status-ok';
    statusEl.innerHTML = '<span>&#10003;</span><span>You have enough DreamMiles for this booking!</span>';
  } else {
    statusEl.className = 'miles-status miles-status-insufficient';
    statusEl.innerHTML = '<span>&#10007;</span><span>You need ' +
      Math.abs(remaining).toLocaleString() + ' more miles. Try Split Payment instead.</span>';
  }
}

function updateSplitCalculation() {
  const slider = document.getElementById('splitSlider');
  const pct = parseInt(slider.value);

  // Update CSS custom property for slider track coloring
  slider.style.setProperty('--split-pct', pct + '%');

  const milesPortionDollars = BOOKING_TOTAL * (pct / 100);
  const cashPortion = BOOKING_TOTAL - milesPortionDollars;
  const milesNeeded = Math.ceil(milesPortionDollars * MILES_PER_DOLLAR);
  const hasEnough = milesNeeded <= DREAMMILES_BALANCE;

  document.getElementById('splitMilesAmount').textContent = milesNeeded.toLocaleString() + ' miles';
  document.getElementById('splitMilesDollar').textContent = '($' + milesPortionDollars.toFixed(2) + ')';
  document.getElementById('splitCashAmount').textContent = '$' + cashPortion.toFixed(2);

  const statusEl = document.getElementById('splitStatus');
  if (hasEnough) {
    statusEl.style.background = 'var(--green-soft)';
    statusEl.style.color = '#15803d';
    statusEl.innerHTML = '<span>&#10003;</span><span>You have enough miles for this split.</span>';
  } else {
    statusEl.style.background = '#fef2f2';
    statusEl.style.color = '#ef4444';
    statusEl.innerHTML = '<span>&#10007;</span><span>Not enough miles. Reduce the miles portion.</span>';
  }

  // Update pay button
  updatePayButtonText('split');
}

function updatePayButtonText(method) {
  const btnText = document.getElementById('payBtnText');
  if (!btnText) return;

  switch (method) {
    case 'miles':
      var totalMiles = Math.ceil(BOOKING_TOTAL * MILES_PER_DOLLAR);
      btnText.textContent = 'Redeem ' + totalMiles.toLocaleString() + ' Miles';
      break;
    case 'split':
      var slider = document.getElementById('splitSlider');
      var pct = parseInt(slider.value);
      var cashPortion = BOOKING_TOTAL * (1 - pct / 100);
      if (pct === 100) {
        btnText.textContent = 'Redeem ' + Math.ceil(BOOKING_TOTAL * MILES_PER_DOLLAR).toLocaleString() + ' Miles';
      } else if (pct === 0) {
        btnText.textContent = 'Pay $' + BOOKING_TOTAL.toFixed(2) + ' Securely';
      } else {
        btnText.textContent = 'Pay $' + cashPortion.toFixed(2) + ' + Miles';
      }
      break;
    default:
      btnText.textContent = 'Pay $' + BOOKING_TOTAL.toFixed(2) + ' Securely';
  }
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

// ---- CURRENCY SELECTOR ----
function toggleCurrencyDropdown(e) {
  e.stopPropagation();
  document.getElementById('currencyDropdown').classList.toggle('open');
}
function setCurrency(code, symbol, el) {
  document.getElementById('currencyLabel').textContent = code + ' ' + symbol;
  document.querySelectorAll('.currency-option').forEach(o => o.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('currencyDropdown').classList.remove('open');
  // Sync mobile select
  const mobileSel = document.getElementById('mobileCurrencySelect');
  if (mobileSel) mobileSel.value = code + ' ' + symbol;
}
function setCurrencyMobile(select) {
  const val = select.value;
  document.getElementById('currencyLabel').textContent = val;
  document.querySelectorAll('.currency-option').forEach(o => {
    o.classList.toggle('active', o.textContent.trim() === val);
  });
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.currency-selector')) {
    document.getElementById('currencyDropdown').classList.remove('open');
  }
});

// ---- LOGIN MODAL ----
function toggleLoginModal() {
  document.getElementById('loginModal').classList.toggle('open');
}
document.getElementById('loginModal').addEventListener('click', function(e) {
  if (e.target === this) toggleLoginModal();
});

// ---- INIT ----
initNLF();
initPaymentToggle();
initNationalitySearch();
console.log('RwandAir Prototype loaded');
