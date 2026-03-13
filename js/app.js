/* ============================================
   RwandAir Redesign — Application Logic
   Navigation, Search, Booking Flow, Chat, etc.
   ============================================ */

// ---- GLOBAL SETTINGS (Currency / Language / Country) ----
const CURRENCY_SYMBOLS = { RWF:'RF', USD:'$', EUR:'€', GBP:'£', KES:'KSh', AED:'د.إ' };
const COUNTRY_FLAGS = { RW:'🇷🇼', KE:'🇰🇪', UG:'🇺🇬', TZ:'🇹🇿', CD:'🇨🇩', ZA:'🇿🇦', NG:'🇳🇬', GB:'🇬🇧', AE:'🇦🇪', US:'🇺🇸', IN:'🇮🇳', FR:'🇫🇷', BE:'🇧🇪' };

let currentCurrency = 'RWF';
let currentLanguage = 'EN';
let currentCountry = 'RW';

// ---- SEO URL ROUTING ----
const PAGE_SLUGS = {
  home: '', destinations: 'destinations', travelinfo: 'travel-info',
  loyalty: 'loyalty', cargo: 'cargo', help: 'help',
  results: 'results', booking: 'booking', confirmation: 'confirmation',
  manage: 'manage', checkin: 'check-in', status: 'flight-status', about: 'about'
};
const SLUG_TO_PAGE = {};
Object.keys(PAGE_SLUGS).forEach(function(k) { SLUG_TO_PAGE[PAGE_SLUGS[k]] = k; });

const VALID_COUNTRIES = Object.keys(COUNTRY_FLAGS);
const VALID_LANGUAGES = ['EN', 'FR', 'CN'];

function buildUrl(pageId) {
  var slug = PAGE_SLUGS[pageId] !== undefined ? PAGE_SLUGS[pageId] : pageId;
  var base = '/' + currentCountry.toLowerCase() + '/' + currentLanguage.toLowerCase();
  return slug ? base + '/' + slug : base + '/';
}

function parseUrl() {
  var path = window.location.pathname;
  var match = path.match(/^\/([a-z]{2})\/([a-z]{2})\/?(.*)$/);
  if (!match) return { country: null, language: null, page: null };
  var country = match[1].toUpperCase();
  var language = match[2].toUpperCase();
  var slug = match[3].replace(/\/$/, '');

  // Check for destination detail: destinations/{city-slug}
  var destMatch = slug.match(/^destinations\/(.+)$/);
  if (destMatch) {
    var citySlug = destMatch[1];
    // Look up city from slug
    var foundCode = null, foundCity = null;
    Object.keys(destinationData).forEach(function(city) {
      if (city.toLowerCase().replace(/\s+/g, '-') === citySlug) {
        foundCode = destinationData[city].code;
        foundCity = city;
      }
    });
    return {
      country: VALID_COUNTRIES.indexOf(country) !== -1 ? country : null,
      language: VALID_LANGUAGES.indexOf(language) !== -1 ? language : null,
      page: 'destination-detail',
      destCode: foundCode, destCity: foundCity
    };
  }

  var page = SLUG_TO_PAGE[slug] !== undefined ? SLUG_TO_PAGE[slug] : (slug || 'home');
  return {
    country: VALID_COUNTRIES.indexOf(country) !== -1 ? country : null,
    language: VALID_LANGUAGES.indexOf(language) !== -1 ? language : null,
    page: document.getElementById('page-' + page) ? page : null
  };
}

var _skipPushState = false;

function getCurrentPageId() {
  var active = document.querySelector('.page.active');
  if (!active) return 'home';
  return active.id.replace('page-', '');
}

// Translation strings
const TRANSLATIONS = {
  EN: {
    roundTripPackages: 'Round-trip Packages',
    selectPackageFare: 'Select a package and fare • Prices shown per person for both flights',
    sortBy: 'Sort by:',
    best: 'Best', cheapest: 'Cheapest', quickest: 'Quickest',
    direct: 'Direct', stop: 'stop', stops: 'stops',
    from: 'from', for2flights: 'for 2 flights',
    selectBtn: 'Select →',
    chooseYourFares: 'Choose Your Fares',
    outbound: 'Outbound', return: 'Return',
    confirmSelection: 'Confirm Selection →',
    totalPerPerson: 'Total per person',
    continue: 'Continue',
    noFlights: 'No flights found',
    searchingFlights: 'Searching flights...',
    availableFlights: 'Available Flights',
    selectFlightFare: 'Select your flight and fare',
    lite: 'Lite', classic: 'Classic', business: 'Business',
    carryOn7kg: 'Carry-on 7kg', noChanges: 'No changes',
    bag23kg: '1x 23kg bag', mealIncluded: 'Meal included', changeable: 'Changeable',
    bags40kg: '2x 40kg bags', loungeAccess: 'Lounge access', premiumMeal: 'Premium meal', priorityBoarding: 'Priority boarding',
    details: 'Details',
    passenger: 'Passenger(s)',
    roundTrip: 'Round Trip', oneWay: 'One Way',
    book: 'Book', destinations: 'Destinations', travelInfo: 'Travel Info',
    loyalty: 'Loyalty', help: 'Help',
    manageBooking: 'Manage Booking', checkIn: 'Check-in', logIn: 'Log in',
    passengerDetails: 'Passenger Details',
    pleaseSelectFlight: 'Please select a flight first'
  },
  FR: {
    roundTripPackages: 'Forfaits Aller-Retour',
    selectPackageFare: 'Sélectionnez un forfait et un tarif • Prix affichés par personne pour les 2 vols',
    sortBy: 'Trier par :',
    best: 'Meilleur', cheapest: 'Moins cher', quickest: 'Plus rapide',
    direct: 'Direct', stop: 'escale', stops: 'escales',
    from: 'à partir de', for2flights: 'pour 2 vols',
    selectBtn: 'Sélectionner →',
    chooseYourFares: 'Choisissez Vos Tarifs',
    outbound: 'Aller', return: 'Retour',
    confirmSelection: 'Confirmer la sélection →',
    totalPerPerson: 'Total par personne',
    continue: 'Continuer',
    noFlights: 'Aucun vol trouvé',
    searchingFlights: 'Recherche de vols...',
    availableFlights: 'Vols Disponibles',
    selectFlightFare: 'Sélectionnez votre vol et tarif',
    lite: 'Léger', classic: 'Classique', business: 'Affaires',
    carryOn7kg: 'Bagage cabine 7kg', noChanges: 'Non modifiable',
    bag23kg: '1x bagage 23kg', mealIncluded: 'Repas inclus', changeable: 'Modifiable',
    bags40kg: '2x bagages 40kg', loungeAccess: 'Accès salon', premiumMeal: 'Repas premium', priorityBoarding: 'Embarquement prioritaire',
    details: 'Détails',
    passenger: 'Passager(s)',
    roundTrip: 'Aller-Retour', oneWay: 'Aller Simple',
    book: 'Réserver', destinations: 'Destinations', travelInfo: 'Info Voyage',
    loyalty: 'Fidélité', help: 'Aide',
    manageBooking: 'Gérer Réservation', checkIn: 'Enregistrement', logIn: 'Connexion',
    passengerDetails: 'Détails Passager',
    pleaseSelectFlight: 'Veuillez sélectionner un vol'
  },
  CN: {
    roundTripPackages: '往返套餐',
    selectPackageFare: '选择套餐和票价 • 显示每人两趟航班的价格',
    sortBy: '排序：',
    best: '最佳', cheapest: '最便宜', quickest: '最快',
    direct: '直飞', stop: '经停', stops: '经停',
    from: '起', for2flights: '两程航班',
    selectBtn: '选择 →',
    chooseYourFares: '选择您的票价',
    outbound: '去程', return: '回程',
    confirmSelection: '确认选择 →',
    totalPerPerson: '每人合计',
    continue: '继续',
    noFlights: '未找到航班',
    searchingFlights: '正在搜索航班...',
    availableFlights: '可用航班',
    selectFlightFare: '选择您的航班和票价',
    lite: '轻便', classic: '经典', business: '商务',
    carryOn7kg: '手提行李7kg', noChanges: '不可改签',
    bag23kg: '1件23kg行李', mealIncluded: '含餐食', changeable: '可改签',
    bags40kg: '2件40kg行李', loungeAccess: '贵宾室', premiumMeal: '高级餐食', priorityBoarding: '优先登机',
    details: '详情',
    passenger: '乘客',
    roundTrip: '往返', oneWay: '单程',
    book: '预订', destinations: '目的地', travelInfo: '旅行信息',
    loyalty: '忠诚度', help: '帮助',
    manageBooking: '管理预订', checkIn: '值机', logIn: '登录',
    passengerDetails: '乘客信息',
    pleaseSelectFlight: '请先选择一个航班'
  }
};

function t(key) {
  const lang = TRANSLATIONS[currentLanguage] || TRANSLATIONS.EN;
  return lang[key] || TRANSLATIONS.EN[key] || key;
}

function getFareFeatures(family) {
  return {
    lite: [t('carryOn7kg'), t('noChanges')],
    classic: [t('bag23kg'), t('mealIncluded'), t('changeable')],
    business: [t('bags40kg'), t('loungeAccess'), t('premiumMeal'), t('priorityBoarding')]
  }[family] || [];
}

// ---- PAGE NAVIGATION ----
const NAV_MAP = {
  home: 'Book', destinations: 'Destinations',
  travelinfo: 'Travel Info', loyalty: 'Loyalty', cargo: 'Cargo', help: 'Help'
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

  // Load destination detail if navigating to it
  if (pageId === 'destination-detail' && selectedDestCode) {
    loadDestinationDetail(selectedDestCode);
  }

  // SEO URL: push state unless triggered by popstate
  if (!_skipPushState) {
    var url;
    if (pageId === 'destination-detail' && selectedDestCity) {
      var citySlug = selectedDestCity.toLowerCase().replace(/\s+/g, '-');
      url = '/' + currentCountry.toLowerCase() + '/' + currentLanguage.toLowerCase() + '/destinations/' + citySlug;
    } else {
      url = buildUrl(pageId);
    }
    history.pushState({ page: pageId, destCode: selectedDestCode, destCity: selectedDestCity }, '', url);
  }

  // Track for chatbot context
  if (typeof chatRecentActions !== 'undefined') {
    chatRecentActions.push({ action: 'navigated', page: pageId, ts: Date.now() });
    if (chatRecentActions.length > 10) chatRecentActions.shift();
  }

  // Cart abandonment check
  if (typeof checkCartAbandonment === 'function') checkCartAbandonment(pageId);
}

// Handle browser Back / Forward
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) {
    if (e.state.destCode) { selectedDestCode = e.state.destCode; selectedDestCity = e.state.destCity; }
    _skipPushState = true;
    navigateTo(e.state.page);
    _skipPushState = false;
  } else {
    // Parse URL if no state (e.g. first load)
    var parsed = parseUrl();
    if (parsed.destCode) { selectedDestCode = parsed.destCode; selectedDestCity = parsed.destCity; }
    if (parsed.page) {
      _skipPushState = true;
      navigateTo(parsed.page);
      _skipPushState = false;
    }
  }
});

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

    const tabType = this.dataset.tab;
    const returnField = document.getElementById('returnField');
    const stdFields = document.getElementById('classicStdFields');
    const mcFields = document.getElementById('classicMcFields');

    if (tabType === 'multicity') {
      if (stdFields) stdFields.classList.add('hidden');
      if (mcFields) { mcFields.classList.remove('hidden'); renderClassicMulticityLegs(); }
      if (returnField) returnField.style.display = 'none';
    } else {
      if (stdFields) stdFields.classList.remove('hidden');
      if (mcFields) mcFields.classList.add('hidden');
      if (returnField) returnField.style.display = tabType === 'oneway' ? 'none' : 'flex';
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

// ---- MULTI-CITY DATA & FUNCTIONS ----
let multicityMode = false;
let nlfMcLegs = [
  { from: 'Kigali (KGL)', to: '', date: '' },
  { from: '', to: '', date: '' }
];
let classicMcLegs = [
  { from: 'Kigali (KGL)', to: '', date: '' },
  { from: '', to: '', date: '' }
];

function renderNlfMulticityLegs() {
  const container = document.getElementById('nlfMulticityLegs');
  if (!container) return;
  container.innerHTML = nlfMcLegs.map((leg, i) => {
    const fromVal = leg.from || 'type city';
    const toVal = leg.to || 'type destination';
    const dateVal = leg.date ? formatDateDisplay(leg.date) : 'type date';
    const fromClass = leg.from ? 'nlf-gap nlf-gap--filled' : 'nlf-gap nlf-gap--empty';
    const toClass = leg.to ? 'nlf-gap nlf-gap--filled' : 'nlf-gap nlf-gap--empty';
    const dateClass = leg.date ? 'nlf-gap nlf-gap--filled' : 'nlf-gap nlf-gap--empty';
    const removeBtn = nlfMcLegs.length > 2
      ? '<button class="nlf-mc-remove" onclick="removeNlfMulticityLeg(' + i + ')" title="Remove leg">&times;</button>'
      : '';
    return '<div class="nlf-mc-leg">' +
      '<span class="nlf-mc-leg-label">Leg ' + (i + 1) + '</span>' +
      '<span class="nlf-mc-leg-sentence">From ' +
      '<span class="nlf-gap-wrapper"><input type="text" class="' + fromClass + '" value="' + fromVal + '" ' +
      'onfocus="if(this.value.startsWith(\'type\'))this.value=\'\'" ' +
      'onblur="updateNlfMcLeg(' + i + ',\'from\',this.value)" ' +
      'placeholder="type city" autocomplete="off" /></span>' +
      ' to ' +
      '<span class="nlf-gap-wrapper"><input type="text" class="' + toClass + '" value="' + toVal + '" ' +
      'onfocus="if(this.value.startsWith(\'type\'))this.value=\'\'" ' +
      'onblur="updateNlfMcLeg(' + i + ',\'to\',this.value)" ' +
      'placeholder="type destination" autocomplete="off" /></span>' +
      ' on ' +
      '<span class="nlf-gap-wrapper"><input type="date" class="' + dateClass + '" value="' + (leg.date || '') + '" ' +
      'onchange="updateNlfMcLeg(' + i + ',\'date\',this.value)" /></span>' +
      '</span>' +
      removeBtn +
      '</div>';
  }).join('');

  const addBtn = document.getElementById('nlfAddLeg');
  if (addBtn) addBtn.style.display = nlfMcLegs.length >= 4 ? 'none' : '';
}

function updateNlfMcLeg(index, field, value) {
  if (value && !value.startsWith('type')) nlfMcLegs[index][field] = value;
  // Auto-fill next leg's "from" with previous leg's "to"
  if (field === 'to' && value && index + 1 < nlfMcLegs.length && !nlfMcLegs[index + 1].from) {
    nlfMcLegs[index + 1].from = value;
    renderNlfMulticityLegs();
  }
}

function addNlfMulticityLeg(e) {
  if (e) e.preventDefault();
  if (nlfMcLegs.length >= 4) return;
  const lastTo = nlfMcLegs[nlfMcLegs.length - 1].to;
  nlfMcLegs.push({ from: lastTo || '', to: '', date: '' });
  renderNlfMulticityLegs();
}

function removeNlfMulticityLeg(index) {
  if (nlfMcLegs.length <= 2) return;
  nlfMcLegs.splice(index, 1);
  renderNlfMulticityLegs();
}

function renderClassicMulticityLegs() {
  const container = document.getElementById('classicMcLegs');
  if (!container) return;
  container.innerHTML = classicMcLegs.map((leg, i) => {
    const removeBtn = classicMcLegs.length > 2
      ? '<button class="classic-mc-remove" onclick="removeClassicMulticityLeg(' + i + ')" title="Remove">&times;</button>'
      : '';
    return '<div class="classic-mc-leg">' +
      '<span class="classic-mc-leg-label">Leg ' + (i + 1) + '</span>' +
      '<div class="search-field"><label>From</label>' +
      '<input type="text" value="' + (leg.from || '') + '" placeholder="City or airport" ' +
      'onblur="classicMcLegs[' + i + '].from=this.value" autocomplete="off"/></div>' +
      '<div class="search-field"><label>To</label>' +
      '<input type="text" value="' + (leg.to || '') + '" placeholder="City or airport" ' +
      'onblur="updateClassicMcLeg(' + i + ',\'to\',this.value)" autocomplete="off"/></div>' +
      '<div class="search-field"><label>Date</label>' +
      '<input type="date" value="' + (leg.date || '') + '" ' +
      'onchange="classicMcLegs[' + i + '].date=this.value"/></div>' +
      removeBtn +
      '</div>';
  }).join('');

  const addBtns = container.parentElement.querySelectorAll('.multicity-add-btn');
  addBtns.forEach(btn => { btn.style.display = classicMcLegs.length >= 4 ? 'none' : ''; });
}

function updateClassicMcLeg(index, field, value) {
  classicMcLegs[index][field] = value;
  if (field === 'to' && value && index + 1 < classicMcLegs.length && !classicMcLegs[index + 1].from) {
    classicMcLegs[index + 1].from = value;
    renderClassicMulticityLegs();
  }
}

function addClassicMulticityLeg(e) {
  if (e) e.preventDefault();
  if (classicMcLegs.length >= 4) return;
  const lastTo = classicMcLegs[classicMcLegs.length - 1].to;
  classicMcLegs.push({ from: lastTo || '', to: '', date: '' });
  renderClassicMulticityLegs();
}

function removeClassicMulticityLeg(index) {
  if (classicMcLegs.length <= 2) return;
  classicMcLegs.splice(index, 1);
  renderClassicMulticityLegs();
}

function isMulticityActive() {
  // Check NLF mode
  if (nlfVisible) return multicityMode;
  // Check classic mode
  const activeTab = document.querySelector('.search-tab.active');
  return activeTab && activeTab.dataset.tab === 'multicity';
}

function getMulticityLegs() {
  return nlfVisible ? nlfMcLegs : classicMcLegs;
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
  // Multi-city mode
  if (isMulticityActive()) {
    return searchMulticityFlights();
  }

  const from = document.getElementById('searchFrom').value;
  const to = document.getElementById('searchTo').value;
  const depart = document.getElementById('searchDepart').value;

  // Validate
  if (!from || !to) {
    const nlfTo = document.getElementById('nlfGapTo');
    if (nlfTo && nlfVisible) {
      nlfTo.classList.add('nlf-gap--error');
      setTimeout(() => nlfTo.classList.remove('nlf-gap--error'), 600);
      nlfTo.focus();
    } else {
      showFieldError('searchTo', 'Please enter a destination city or airport');
    }
    return;
  }
  if (!depart) {
    const nlfDepart = document.getElementById('nlfGapDepart');
    if (nlfDepart && nlfVisible) {
      nlfDepart.classList.add('nlf-gap--error');
      setTimeout(() => nlfDepart.classList.remove('nlf-gap--error'), 600);
      nlfDepart.focus();
    } else {
      showFieldError('searchDepart', 'Please select a departure date');
    }
    return;
  }

  // Get pax/cabin from NLF hidden inputs or classic form
  let totalPax, cabin;
  if (nlfVisible) {
    const paxVal = document.getElementById('searchPax')?.value || '1 adult';
    const nums = paxVal.match(/\d+/g) || [1];
    totalPax = nums.reduce((a, n) => a + parseInt(n), 0);
    cabin = document.getElementById('searchClass')?.value || 'Economy';
  } else {
    totalPax = paxCounts.adult + paxCounts.child + paxCounts.infant;
    cabin = document.getElementById('cabinSummary')?.textContent || 'Economy';
  }

  // Detect trip type
  const activeTrip = document.querySelector('.nlf-trip-btn.active')?.dataset.trip
    || document.querySelector('.search-tab.active')?.dataset.tab
    || 'roundtrip';
  const tripType = activeTrip === 'oneway' ? 'oneway' : 'round';
  const returnDate = document.getElementById('searchReturn')?.value || '';

  // Extract airport codes
  const extractCode = (str) => { const m = str.match(/\(([A-Z]{3})\)/); return m ? m[1] : str.trim().toUpperCase(); };
  const originCode = extractCode(from);
  const destCode = extractCode(to);

  // Determine trip label
  const tripLabel = tripType === 'round' ? 'Round Trip' : 'One Way';

  // Update results page header
  document.getElementById('resultFrom').textContent = from;
  document.getElementById('resultTo').textContent = to || 'Nairobi (NBO)';
  document.getElementById('resultDate').textContent =
    formatDateDisplay(depart) + ' \u00b7 ' + totalPax + ' Passenger(s) \u00b7 ' + cabin + ' \u00b7 ' + tripLabel;

  // Show date selection bar, render carousel + init calendar
  const dateBar = document.getElementById('dateSelectionBar');
  if (dateBar) dateBar.style.display = '';
  const calPanel = document.getElementById('resultsCalendar');
  if (calPanel) calPanel.classList.add('hidden');
  const calBtn = document.getElementById('calToggleBtn');
  if (calBtn) calBtn.classList.remove('active');

  renderDateCarousel(depart);
  initCalendarFromDate(depart);

  // Fetch from API and render bundled/one-way results
  fetchAndRenderFlights({
    origin: originCode, destination: destCode,
    departDate: depart, returnDate: tripType === 'round' ? returnDate : '',
    tripType, cabin: cabin.toLowerCase(), totalPax
  });

  navigateTo('results');
}

function searchMulticityFlights() {
  const legs = getMulticityLegs();

  // Validate all legs
  for (let i = 0; i < legs.length; i++) {
    if (!legs[i].from || legs[i].from === 'type city') {
      alert('Please enter a departure city for Leg ' + (i + 1));
      return;
    }
    if (!legs[i].to || legs[i].to === 'type destination') {
      alert('Please enter a destination for Leg ' + (i + 1));
      return;
    }
    if (!legs[i].date) {
      alert('Please select a date for Leg ' + (i + 1));
      return;
    }
  }

  // Get pax/cabin
  let totalPax, cabin;
  if (nlfVisible) {
    const paxVal = document.getElementById('searchPax')?.value || '1 adult';
    const nums = paxVal.match(/\d+/g) || [1];
    totalPax = nums.reduce((a, n) => a + parseInt(n), 0);
    cabin = document.getElementById('searchClass')?.value || 'Economy';
  } else {
    const mcPaxEl = document.getElementById('classicMcPax');
    totalPax = mcPaxEl ? parseInt(mcPaxEl.value) || 1 : 1;
    cabin = document.getElementById('cabinSummary')?.textContent || 'Economy';
  }

  // Build summary for results page header
  const routeSummary = legs.map(l => l.from.replace(/\s*\([A-Z]{3}\)/, '') + ' → ' + l.to.replace(/\s*\([A-Z]{3}\)/, '')).join(' | ');
  document.getElementById('resultFrom').textContent = 'Multi-City';
  document.getElementById('resultTo').textContent = routeSummary;
  document.getElementById('resultDate').textContent =
    totalPax + ' Passenger(s) · ' + cabin + ' · Multi-City';

  // Hide date carousel and calendar for multi-city
  const dateBar = document.getElementById('dateSelectionBar');
  if (dateBar) dateBar.style.display = 'none';
  const calPanel = document.getElementById('resultsCalendar');
  if (calPanel) calPanel.classList.add('hidden');

  // Render per-leg flight results
  renderMulticityResults(legs);
  navigateTo('results');
}

function renderMulticityResults(legs) {
  const container = document.getElementById('flightResults');
  container.innerHTML = '';

  legs.forEach((leg, legIdx) => {
    const fromCode = chatExtractCode(leg.from) || leg.from;
    const toCode = chatExtractCode(leg.to) || leg.to;

    container.innerHTML += '<div class="mc-leg-results" id="mcLeg' + legIdx + '">' +
      '<div class="mc-leg-header">' +
        '<span class="mc-leg-badge">Leg ' + (legIdx + 1) + '</span>' +
        '<span class="mc-leg-route">' + leg.from + ' → ' + leg.to + '</span>' +
        '<span class="mc-leg-date">' + formatDateDisplay(leg.date) + '</span>' +
      '</div>' +
      '<div class="mc-leg-flights" id="mcLegFlights' + legIdx + '">' +
        '<div style="text-align:center;padding:20px;color:var(--gray-400)">Searching flights...</div>' +
      '</div>' +
    '</div>';

    // Fetch flights for this leg
    fetch('/api/flights/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: fromCode,
        destination: toCode,
        departDate: leg.date,
        adults: 1,
        cabin: 'economy',
        tripType: 'oneway'
      })
    })
    .then(r => r.json())
    .then(result => {
      const legContainer = document.getElementById('mcLegFlights' + legIdx);
      if (!result.outbound || result.outbound.length === 0) {
        legContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray-500)">No flights found for this leg. Try a different date.</div>';
        return;
      }
      legContainer.innerHTML = '';
      result.outbound.forEach((f, i) => {
        const seatsHtml = f.seatsLeft <= 5
          ? '<span class="flight-seats-left">' + f.seatsLeft + ' seats left</span>'
          : '';
        legContainer.innerHTML += `
          <div class="flight-card mc-flight-card" id="mcflight-${legIdx}-${i}" onclick="selectMulticityFlight(${legIdx},${i})">
            <div class="flight-time">
              <div class="time">${f.departure}</div>
              <div class="code">${fromCode}</div>
            </div>
            <div class="flight-route-line">
              <div class="duration">${f.duration}</div>
              <div class="line"></div>
              <div class="stops">${f.stops === 0 ? 'Direct' : f.stops + ' stop'}</div>
            </div>
            <div class="flight-time">
              <div class="time">${f.arrival}</div>
              <div class="code">${toCode}</div>
            </div>
            <div class="flight-meta">
              <span class="flight-num">${f.flightNumber}</span>
              <span>${f.aircraft}</span>
              ${seatsHtml}
            </div>
            <div class="flight-prices">
              <div class="flight-price-opt selected-price">
                <div class="price-class">Economy</div>
                <div class="price-amount">${f.fare.label}</div>
              </div>
            </div>
          </div>`;
      });
    })
    .catch(() => {
      const legContainer = document.getElementById('mcLegFlights' + legIdx);
      legContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--error)">Error loading flights for this leg.</div>';
    });
  });

  // Add continue button
  container.innerHTML += `
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <button class="btn-primary btn-lg" onclick="continueToBooking()">
        Continue with Selected Flights
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>`;
}

let mcSelectedFlights = {};

function selectMulticityFlight(legIdx, flightIdx) {
  // Deselect others in same leg
  const legContainer = document.getElementById('mcLegFlights' + legIdx);
  if (legContainer) {
    legContainer.querySelectorAll('.flight-card').forEach(c => c.classList.remove('selected'));
  }
  const card = document.getElementById('mcflight-' + legIdx + '-' + flightIdx);
  if (card) card.classList.add('selected');
  mcSelectedFlights[legIdx] = flightIdx;
}

/* ============ DESTINATION DATA MAP ============ */
var destinationData = {
  'Nairobi':       { code: 'NBO', country: 'Kenya' },
  'Dubai':         { code: 'DXB', country: 'UAE' },
  'Lagos':         { code: 'LOS', country: 'Nigeria' },
  'London':        { code: 'LHR', country: 'United Kingdom' },
  'Johannesburg':  { code: 'JNB', country: 'South Africa' },
  'Accra':         { code: 'ACC', country: 'Ghana' },
  'Entebbe':       { code: 'EBB', country: 'Uganda' },
  'Dar es Salaam': { code: 'DAR', country: 'Tanzania' },
  'Lusaka':        { code: 'LUN', country: 'Zambia' },
  'Harare':        { code: 'HRE', country: 'Zimbabwe' },
  'Kinshasa':      { code: 'FIH', country: 'DR Congo' },
  'Bujumbura':     { code: 'BJM', country: 'Burundi' },
  'Addis Ababa':   { code: 'ADD', country: 'Ethiopia' },
  'Douala':        { code: 'DLA', country: 'Cameroon' },
  'Brussels':      { code: 'BRU', country: 'Belgium' },
  'Paris':         { code: 'CDG', country: 'France' },
  'Mumbai':        { code: 'BOM', country: 'India' },
  'Guangzhou':     { code: 'CAN', country: 'China' },
  'Cape Town':     { code: 'CPT', country: 'South Africa' },
  'Mombasa':       { code: 'MBA', country: 'Kenya' },
  'Mauritius':     { code: 'MRU', country: 'Mauritius' }
};

var selectedDestCode = null;
var selectedDestCity = null;

function selectDestination(city) {
  var info = destinationData[city];
  if (!info) return;
  selectedDestCode = info.code;
  selectedDestCity = city;
  navigateTo('destination-detail');
}

/* ============ DESTINATION DETAIL PAGE ============ */
function loadDestinationDetail(code) {
  if (!code) return;
  var skeleton = document.getElementById('destDetailSkeleton');
  var content = document.getElementById('destDetailContent');
  if (skeleton) skeleton.classList.remove('hidden');
  if (content) content.classList.add('hidden');

  // Update page title for SEO
  document.title = 'Fly to ' + (selectedDestCity || code) + ' from Kigali | RwandAir';

  fetch('/api/destinations/' + code)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      renderDestinationDetail(data);
      if (skeleton) skeleton.classList.add('hidden');
      if (content) content.classList.remove('hidden');
    })
    .catch(function(err) {
      console.error('Failed to load destination:', err);
      if (skeleton) skeleton.innerHTML = '<div class="container" style="text-align:center;padding:80px 20px"><h2>Destination not available</h2><p>Sorry, we couldn\'t load this destination. <a onclick="navigateTo(\'destinations\')" style="color:var(--blue);cursor:pointer">Back to destinations</a></p></div>';
    });
}

function renderDestinationDetail(data) {
  // Hero image
  var hero = document.getElementById('destHero');
  if (hero) hero.style.backgroundImage = "url('" + data.imageUrl + "')";

  // Breadcrumb
  var bcCity = document.getElementById('destBreadcrumbCity');
  if (bcCity) bcCity.textContent = data.city;

  // Title & tagline
  var cityEl = document.getElementById('destCityName');
  if (cityEl) cityEl.textContent = data.city + ', ' + data.country;

  var taglineEl = document.getElementById('destTagline');
  if (taglineEl) taglineEl.textContent = data.tagline;

  // Hero CTA price
  var heroPrice = document.getElementById('destHeroPrice');
  if (heroPrice && data.flight) heroPrice.textContent = '— from ' + fmtPrice(data.flight.fromPrice);

  // Quick facts
  var ftEl = document.getElementById('destFlightTime');
  if (ftEl) ftEl.textContent = data.flight ? data.flight.duration : 'Check schedule';

  var fpEl = document.getElementById('destFromPrice');
  if (fpEl) fpEl.textContent = data.flight ? fmtPrice(data.flight.fromPrice) : '—';

  var wEl = document.getElementById('destWeather');
  if (wEl) wEl.textContent = data.weather ? data.weather.avg_temp + ' · ' + data.weather.climate : '—';

  var cEl = document.getElementById('destCurrency');
  if (cEl) cEl.textContent = data.currency || '—';

  // Description (HTML)
  var descEl = document.getElementById('destDescription');
  if (descEl) descEl.innerHTML = data.description || '';

  // Attractions
  var attrEl = document.getElementById('destAttractions');
  if (attrEl && data.attractions) {
    attrEl.innerHTML = data.attractions.map(function(a) {
      return '<div class="dest-attraction-card">' +
        '<div class="dest-attraction-icon">' + a.icon + '</div>' +
        '<h4>' + a.name + '</h4>' +
        '<p>' + a.desc + '</p>' +
      '</div>';
    }).join('');
  }

  // Cuisine
  var cuisineEl = document.getElementById('destCuisine');
  if (cuisineEl && data.cuisine) {
    cuisineEl.innerHTML = data.cuisine.map(function(c) {
      return '<span class="dest-cuisine-tag">🍽 ' + c + '</span>';
    }).join('');
  }

  // Travel tips
  var tipsEl = document.getElementById('destTips');
  if (tipsEl && data.travelTips) {
    tipsEl.innerHTML = data.travelTips.map(function(t) {
      return '<li>' + t + '</li>';
    }).join('');
  }

  // Sidebar: Flight card
  var flightCity = document.getElementById('destFlightCity');
  if (flightCity) flightCity.textContent = data.city;

  var flightInfo = document.getElementById('destFlightInfo');
  if (flightInfo && data.flight) {
    var stopsText = data.flight.stops === 0 ? 'Direct flight' : data.flight.stops + ' stop via ' + (data.flight.stopCity || '');
    flightInfo.innerHTML =
      '<div class="dest-flight-row"><span>Duration</span><strong>' + data.flight.duration + '</strong></div>' +
      '<div class="dest-flight-row"><span>Route</span><strong>' + stopsText + '</strong></div>' +
      '<div class="dest-flight-row"><span>Aircraft</span><strong>' + data.flight.aircraft + '</strong></div>' +
      '<div class="dest-flight-price">From ' + fmtPrice(data.flight.fromPrice) + '</div>';
  } else if (flightInfo) {
    flightInfo.innerHTML = '<p style="color:var(--gray);font-size:13px">Flight details coming soon</p>';
  }

  // Sidebar: Highlights
  var hlEl = document.getElementById('destHighlights');
  if (hlEl && data.highlights) {
    hlEl.innerHTML = data.highlights.map(function(h) {
      return '<li>' + h + '</li>';
    }).join('');
  }

  // Sidebar: Best time
  var btEl = document.getElementById('destBestTime');
  if (btEl) btEl.textContent = data.bestTimeToVisit || '';

  // Sidebar: Practical info
  var langEl = document.getElementById('destLanguage');
  if (langEl) langEl.textContent = data.language || '';
  var tzEl = document.getElementById('destTimezone');
  if (tzEl) tzEl.textContent = data.timezone || '';
  var apEl = document.getElementById('destAirport');
  if (apEl) apEl.textContent = data.airport || '';

  // Related destinations (pick 4 random from same region, excluding current)
  renderRelatedDestinations(data.code, data.region);
}

function renderRelatedDestinations(currentCode, currentRegion) {
  var regionMap = {
    'africa': ['NBO','JNB','CPT','ADD','LOS','ACC','DAR','EBB','BJM','LUN','HRE','MBA','MRU'],
    'europe': ['LHR','BRU','CDG'],
    'middle-east': ['DXB'],
    'asia': ['BOM']
  };
  // Gather candidates: prefer same region, then fill from others
  var candidates = [];
  Object.keys(regionMap).forEach(function(region) {
    regionMap[region].forEach(function(code) {
      if (code !== currentCode) {
        candidates.push({ code: code, sameRegion: region === currentRegion });
      }
    });
  });
  // Sort: same region first, then shuffle
  candidates.sort(function(a, b) { return (b.sameRegion ? 1 : 0) - (a.sameRegion ? 1 : 0) || Math.random() - 0.5; });
  var related = candidates.slice(0, 4);

  var container = document.getElementById('destRelated');
  if (!container) return;

  container.innerHTML = related.map(function(r) {
    // Find city name from destinationData
    var city = '', country = '';
    Object.keys(destinationData).forEach(function(c) {
      if (destinationData[c].code === r.code) { city = c; country = destinationData[c].country; }
    });
    if (!city) return '';
    var imgUrl = 'https://www.rwandair.com/dist/phoenix/V1.0/img/' + r.code + '.jpg';
    return '<div class="dest-related-card" onclick="selectDestination(\'' + city.replace(/'/g, "\\'") + '\')">' +
      '<img src="' + imgUrl + '" alt="' + city + '" onerror="this.style.background=\'var(--gray-200)\'">' +
      '<div class="dest-related-card-overlay">' +
        '<h4>' + city + '</h4>' +
        '<p>' + country + '</p>' +
      '</div>' +
    '</div>';
  }).join('');
}

function destSearchFlights() {
  if (!selectedDestCity || !selectedDestCode) return;
  var info = destinationData[selectedDestCity];
  if (info) {
    openSearchWidget(selectedDestCity, info.code, info.country);
  }
}

/* ============ SEARCH WIDGET MODAL ============ */
function openSearchWidget(city, code, country) {
  var overlay = document.getElementById('searchWidgetOverlay');
  var imgUrl = 'https://www.rwandair.com/dist/phoenix/V1.0/img/' + code + '.jpg';

  // Set header image + info
  document.getElementById('swmDestImg').style.backgroundImage = "url('" + imgUrl + "')";
  document.getElementById('swmDestCity').textContent = city;
  document.getElementById('swmDestMeta').textContent = country + ' \u00B7 ' + code;

  // Pre-fill the To field
  document.getElementById('swmTo').value = city + ' (' + code + ')';

  // Set default dates (tomorrow depart, +7 return)
  var today = new Date();
  var depart = new Date(today);
  depart.setDate(today.getDate() + 1);
  var ret = new Date(today);
  ret.setDate(today.getDate() + 8);
  document.getElementById('swmDepart').value = formatDateInput(depart);
  document.getElementById('swmReturn').value = formatDateInput(ret);

  // Reset trip type
  document.getElementById('swmTrip').value = 'roundtrip';
  document.getElementById('swmReturnWrap').style.display = '';

  // Reset passengers and class
  document.getElementById('swmPax').value = '1';
  document.getElementById('swmClass').value = 'economy';

  // Show modal
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSearchWidget() {
  document.getElementById('searchWidgetOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function toggleSwmReturn() {
  var trip = document.getElementById('swmTrip').value;
  document.getElementById('swmReturnWrap').style.display = (trip === 'oneway') ? 'none' : '';
}

function formatDateInput(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function searchFromWidget() {
  // Read values from widget
  var toVal = document.getElementById('swmTo').value;
  var trip = document.getElementById('swmTrip').value;
  var depart = document.getElementById('swmDepart').value;
  var ret = document.getElementById('swmReturn').value;
  var pax = parseInt(document.getElementById('swmPax').value) || 1;
  var cabin = document.getElementById('swmClass').value;

  // Transfer to main search hidden fields
  document.getElementById('searchFrom').value = 'Kigali (KGL)';
  document.getElementById('searchTo').value = toVal;
  document.getElementById('searchDepart').value = depart;
  if (trip !== 'oneway') {
    document.getElementById('searchReturn').value = ret;
  } else {
    document.getElementById('searchReturn').value = '';
  }
  document.getElementById('searchPax').value = pax + ' adult' + (pax > 1 ? 's' : '');

  // Set cabin class
  var classInput = document.getElementById('searchClass');
  if (classInput) classInput.value = cabin === 'business' ? 'Business' : 'Economy';

  // Set trip type buttons (NLF trip buttons)
  var tripBtns = document.querySelectorAll('.nlf-trip-btn');
  tripBtns.forEach(function(btn) {
    btn.classList.remove('active');
    if (btn.dataset.trip === trip || (btn.dataset.trip === 'roundtrip' && trip === 'roundtrip')) {
      btn.classList.add('active');
    }
  });

  // Also set classic search tabs if visible
  var searchTabs = document.querySelectorAll('.search-tab[data-tab]');
  searchTabs.forEach(function(tab) {
    tab.classList.remove('active');
    if (tab.dataset.tab === trip || (tab.dataset.tab === 'roundtrip' && trip === 'roundtrip')) {
      tab.classList.add('active');
    }
  });

  // Close modal
  closeSearchWidget();

  // Navigate to home if not already there, then trigger search
  navigateTo('home');

  // Small delay to ensure page is visible, then trigger search
  setTimeout(function() {
    if (typeof searchFlights === 'function') {
      searchFlights();
    }
  }, 200);
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

// ---- FLIGHT RESULTS (Package-Style Bundled Cards) ----
let lastSearchData = null;
let selectedOutbound = null;  // { flightIdx, fareFamily, flight, fare }
let selectedInbound = null;   // { flightIdx, fareFamily, flight, fare }
let currentSort = 'best';
let packages = [];
let selectedPkgIdx = null;

function parseDurationMins(str) {
  const h = str.match(/(\d+)h/); const m = str.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

// Currency conversion rates (from RWF)
const EXCHANGE_RATES = {
  RWF: 1,
  USD: 0.00073,   // ~1370 RWF = 1 USD
  EUR: 0.00067,   // ~1490 RWF = 1 EUR
  GBP: 0.00057,   // ~1750 RWF = 1 GBP
  KES: 0.094,     // ~10.6 RWF = 1 KES
  AED: 0.0027     // ~370 RWF = 1 AED
};

function convertFromRWF(amountRWF) {
  const rate = EXCHANGE_RATES[currentCurrency] || 1;
  return Math.round(amountRWF * rate * 100) / 100;
}

function fmtPrice(amountRWF) {
  const converted = convertFromRWF(amountRWF);
  const sym = CURRENCY_SYMBOLS[currentCurrency] || currentCurrency;
  if (currentCurrency === 'RWF') return 'RWF ' + Math.round(converted).toLocaleString();
  return sym + ' ' + converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Backward compat alias
function fmtRWF(amount) { return fmtPrice(amount); }

// FARE_FEATURES now uses getFareFeatures(family) for translations — see top of file
const FARE_FEATURES = {
  lite: ['Carry-on 7kg', 'No changes'],
  classic: ['1x 23kg bag', 'Meal included', 'Changeable'],
  business: ['2x 40kg bags', 'Lounge access', 'Premium meal', 'Priority boarding']
};
// Dynamic version used in rendering
function fareFeaturesTranslated(family) { return getFareFeatures(family); }

function toggleFareDetails(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden');
  if (btn) btn.textContent = el.classList.contains('hidden') ? 'Details ▾' : 'Details ▴';
}

// ---- SKELETON LOADING ----
function skeletonFlightCard() {
  return '<div class="skeleton-card">' +
    '<div style="display:flex;gap:6px;margin-bottom:10px">' +
      '<div class="skeleton-pulse skeleton-badge"></div>' +
      '<div class="skeleton-pulse skeleton-badge"></div>' +
    '</div>' +
    '<div class="skeleton-row">' +
      '<div class="skeleton-pulse skeleton-circle"></div>' +
      '<div class="skeleton-pulse skeleton-line w50 h18"></div>' +
      '<div class="skeleton-pulse skeleton-line w30"></div>' +
    '</div>' +
    '<div class="skeleton-row">' +
      '<div class="skeleton-pulse skeleton-circle"></div>' +
      '<div class="skeleton-pulse skeleton-line w50 h18"></div>' +
      '<div class="skeleton-pulse skeleton-line w30"></div>' +
    '</div>' +
    '<div class="skeleton-divider"></div>' +
    '<div class="skeleton-fares">' +
      '<div class="skeleton-fare-col">' +
        '<div class="skeleton-pulse skeleton-line w60 h10"></div>' +
        '<div class="skeleton-pulse skeleton-line w80 h20"></div>' +
        '<div class="skeleton-pulse skeleton-line w70 h10"></div>' +
        '<div class="skeleton-pulse skeleton-line w100 h40"></div>' +
      '</div>' +
      '<div class="skeleton-fare-col">' +
        '<div class="skeleton-pulse skeleton-line w60 h10"></div>' +
        '<div class="skeleton-pulse skeleton-line w80 h20"></div>' +
        '<div class="skeleton-pulse skeleton-line w70 h10"></div>' +
        '<div class="skeleton-pulse skeleton-line w100 h40"></div>' +
      '</div>' +
      '<div class="skeleton-fare-col">' +
        '<div class="skeleton-pulse skeleton-line w60 h10"></div>' +
        '<div class="skeleton-pulse skeleton-line w80 h20"></div>' +
        '<div class="skeleton-pulse skeleton-line w70 h10"></div>' +
        '<div class="skeleton-pulse skeleton-line w100 h40"></div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function skeletonResultsLoading() {
  return '<div class="skeleton-sort">' +
    '<div class="skeleton-pulse skeleton-line w60 h10" style="width:50px"></div>' +
    '<div class="skeleton-pulse skeleton-sort-btn"></div>' +
    '<div class="skeleton-pulse skeleton-sort-btn"></div>' +
    '<div class="skeleton-pulse skeleton-sort-btn"></div>' +
  '</div>' +
  skeletonFlightCard() + skeletonFlightCard() + skeletonFlightCard();
}

function skeletonDestGrid() {
  var card = '<div class="skeleton-dest-card">' +
    '<div class="skeleton-pulse skeleton-dest-img"></div>' +
    '<div class="skeleton-dest-info">' +
      '<div class="skeleton-pulse skeleton-line w60 h14"></div>' +
      '<div class="skeleton-pulse skeleton-line w40 h10"></div>' +
    '</div>' +
    '<div class="skeleton-pulse skeleton-dest-badge"></div>' +
  '</div>';
  return card + card + card + card + card + card;
}

async function fetchAndRenderFlights({ origin, destination, departDate, returnDate, tripType, cabin, totalPax }) {
  // Store params for re-triggering on date/currency change
  lastSearchParams = { origin, destination, departDate, returnDate, tripType, cabin, totalPax };

  const container = document.getElementById('flightResults');
  container.innerHTML = skeletonResultsLoading();
  selectedOutbound = null;
  selectedInbound = null;
  selectedPkgIdx = null;
  packages = [];

  try {
    const res = await fetch('/api/flights/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin, destination, departDate, returnDate,
        adults: totalPax, children: 0, infants: 0,
        cabin, tripType
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');

    lastSearchData = data;
    const isRound = data.tripType === 'round' && data.inbound && data.inbound.length > 0;

    if (isRound) {
      packages = buildPackages(data.outbound, data.inbound);
      renderPackageResults(data);
    } else {
      renderOneWayResults(data);
    }
    // Add urgency badges after render
    setTimeout(function() { addUrgencyBadges(container); }, 100);
  } catch (err) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">' +
      '<p style="font-size:16px;margin-bottom:8px">No flights found</p>' +
      '<p style="font-size:14px">' + err.message + '</p></div>';
  }
}

function buildPackages(outbound, inbound) {
  const pkgs = [];
  outbound.forEach((ob, oi) => {
    inbound.forEach((ib, ii) => {
      const fares = {};
      ['lite', 'classic', 'business'].forEach(f => {
        const obFare = ob.fares && ob.fares[f];
        const ibFare = ib.fares && ib.fares[f];
        if (obFare && ibFare) {
          fares[f] = {
            total: obFare.total + ibFare.total,
            obTotal: obFare.total,
            ibTotal: ibFare.total
          };
        }
      });
      const totalMins = parseDurationMins(ob.duration) + parseDurationMins(ib.duration);
      const totalStops = (ob.stops || 0) + (ib.stops || 0);
      pkgs.push({
        outbound: ob, inbound: ib,
        obIdx: oi, ibIdx: ii,
        fares, totalMins, totalStops,
        classicTotal: fares.classic ? fares.classic.total : Infinity,
        badges: []
      });
    });
  });

  // Assign badges
  if (pkgs.length > 0) {
    // Cheapest = lowest classic fare
    const cheapest = pkgs.reduce((a, b) => a.classicTotal < b.classicTotal ? a : b);
    cheapest.badges.push('cheapest');

    // Quickest = lowest total duration
    const quickest = pkgs.reduce((a, b) => a.totalMins < b.totalMins ? a : b);
    quickest.badges.push('quickest');

    // Best = weighted score (price 40%, duration 40%, stops 20%)
    const maxPrice = Math.max(...pkgs.map(p => p.classicTotal));
    const minPrice = Math.min(...pkgs.map(p => p.classicTotal));
    const maxMins = Math.max(...pkgs.map(p => p.totalMins));
    const minMins = Math.min(...pkgs.map(p => p.totalMins));
    const maxStops = Math.max(...pkgs.map(p => p.totalStops));
    const minStops = Math.min(...pkgs.map(p => p.totalStops));
    const norm = (v, lo, hi) => hi === lo ? 0 : (v - lo) / (hi - lo);
    pkgs.forEach(p => {
      p.score = norm(p.classicTotal, minPrice, maxPrice) * 0.4 +
                norm(p.totalMins, minMins, maxMins) * 0.4 +
                norm(p.totalStops, minStops, maxStops) * 0.2;
    });
    const best = pkgs.reduce((a, b) => a.score < b.score ? a : b);
    best.badges.push('best');
  }

  // Sort by current mode
  sortPackages(pkgs, currentSort);

  // Limit to top 8
  return pkgs.slice(0, 8);
}

function sortPackages(pkgs, mode) {
  if (mode === 'cheapest') {
    pkgs.sort((a, b) => a.classicTotal - b.classicTotal);
  } else if (mode === 'quickest') {
    pkgs.sort((a, b) => a.totalMins - b.totalMins);
  } else {
    // best
    pkgs.sort((a, b) => (a.score || 0) - (b.score || 0));
  }
}

function renderFlightRow(f, direction) {
  const stopsLabel = f.stops === 0 ? t('direct') : f.stops + ' ' + (f.stops > 1 ? t('stops') : t('stop'));
  const arrNext = f.arrivalNextDay ? '<sup>+1</sup>' : '';
  const dirIcon = direction === 'outbound'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';

  return '<div class="package-flight-row">' +
    '<div class="pfr-dir">' + dirIcon + '</div>' +
    '<div class="pfr-times"><span class="pfr-time">' + f.departure + '</span><span class="pfr-sep">–</span><span class="pfr-time">' + f.arrival + arrNext + '</span></div>' +
    '<div class="pfr-airline">' + (f.airline || f.flightNumber) + '</div>' +
    '<div class="pfr-stops">' + stopsLabel + '</div>' +
    '<div class="pfr-duration">' + f.duration + '</div>' +
    '<div class="pfr-route">' + f.origin + ' → ' + f.destination + '</div>' +
  '</div>';
}

function renderPackageResults(data) {
  const container = document.getElementById('flightResults');
  if (!packages || packages.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b"><p>' + t('noFlights') + '</p></div>';
    return;
  }

  const ob = data.outbound[0];
  const ib = data.inbound[0];

  // Header
  let html = '<div class="flight-section-header">' +
    '<h3>' + t('roundTripPackages') + ' <span style="font-weight:400;color:var(--gray)">' + ob.origin + ' ↔ ' + ob.destination + '</span></h3>' +
    '<p style="font-size:14px;color:var(--gray);margin:4px 0 0">' + t('selectPackageFare') + '</p>' +
  '</div>';

  // Sort bar
  html += '<div class="pkg-sort-bar">' +
    '<span class="pkg-sort-label">' + t('sortBy') + '</span>' +
    '<button class="pkg-sort-btn' + (currentSort === 'best' ? ' active' : '') + '" onclick="sortResults(\'best\')">' + t('best') + '</button>' +
    '<button class="pkg-sort-btn' + (currentSort === 'cheapest' ? ' active' : '') + '" onclick="sortResults(\'cheapest\')">' + t('cheapest') + '</button>' +
    '<button class="pkg-sort-btn' + (currentSort === 'quickest' ? ' active' : '') + '" onclick="sortResults(\'quickest\')">' + t('quickest') + '</button>' +
  '</div>';

  // Package cards
  packages.forEach((pkg, idx) => {
    const isSelected = selectedPkgIdx === idx;
    const badgesHtml = pkg.badges.map(b => {
      const cls = b === 'best' ? 'badge-best' : b === 'cheapest' ? 'badge-cheapest' : 'badge-quickest';
      return '<span class="package-badge ' + cls + '">' + t(b) + '</span>';
    }).join('');

    const fromPrice = pkg.fares.lite ? pkg.fares.lite.total : (pkg.fares.classic ? pkg.fares.classic.total : 0);
    // Show selected fare info if this card is selected
    let selectedInfo = '';
    let selectedFareDetails = '';
    if (isSelected && selectedOutbound && selectedInbound) {
      const obLabel = t(selectedOutbound.fareFamily);
      const ibLabel = t(selectedInbound.fareFamily);
      const total = selectedOutbound.fare.total + selectedInbound.fare.total;
      const sameFare = selectedOutbound.fareFamily === selectedInbound.fareFamily;
      selectedInfo = '<div class="pkg-selected-info">' +
        '<span class="pkg-sel-fare">' + (sameFare ? obLabel : obLabel + ' + ' + ibLabel) + '</span>' +
        '<span class="pkg-sel-total">' + fmtPrice(total) + '</span>' +
      '</div>';

      // Build fare amenities section
      const buildLegAmenities = (label, fareFamily, fare) => {
        const features = getFareFeatures(fareFamily);
        return '<div class="pkg-fare-leg">' +
          '<div class="pkg-fare-leg-header">' +
            '<span class="pkg-fare-leg-dir">' + label + '</span>' +
            '<span class="pkg-fare-leg-class">' + t(fareFamily) + '</span>' +
            '<span class="pkg-fare-leg-price">' + fmtPrice(fare.total) + '</span>' +
          '</div>' +
          '<ul class="pkg-fare-amenities">' + features.map(f => '<li>' + f + '</li>').join('') + '</ul>' +
        '</div>';
      };
      selectedFareDetails = '<div class="pkg-fare-details">' +
        buildLegAmenities(t('outbound'), selectedOutbound.fareFamily, selectedOutbound.fare) +
        buildLegAmenities(t('return'), selectedInbound.fareFamily, selectedInbound.fare) +
      '</div>';
    }

    // Fare preview columns (always shown, compact on unselected / detailed on selected)
    let farePreview = '';
    if (!isSelected) {
      // Show 3 fare columns with price + individual toggle for amenities
      farePreview = '<div class="pkg-fare-preview">';
      ['lite', 'classic', 'business'].forEach(fam => {
        const combined = pkg.fares[fam];
        if (!combined) return;
        const features = getFareFeatures(fam);
        const amenId = 'fp-amen-' + idx + '-' + fam;
        farePreview += '<div class="pkg-fp-col' + (fam === 'classic' ? ' pkg-fp-highlight' : '') + '">' +
          '<div class="pkg-fp-label">' + t(fam) + '</div>' +
          '<div class="pkg-fp-price">' + fmtPrice(combined.total) + '</div>' +
          '<div class="pkg-fp-toggle-inline" onclick="event.stopPropagation();toggleFareColAmenities(\'' + amenId + '\',this)">' +
            '<span class="pkg-fp-arrow">▾</span> ' + t('details') +
          '</div>' +
          '<ul class="pkg-fp-features hidden" id="' + amenId + '">' + features.map(f => '<li>' + f + '</li>').join('') + '</ul>' +
          '<button class="pkg-fp-btn" onclick="event.stopPropagation();openFareModalWithFare(' + idx + ',\'' + fam + '\')">' + t('selectBtn') + '</button>' +
        '</div>';
      });
      farePreview += '</div>';
    }

    html += '<div class="package-card' + (isSelected ? ' selected' : '') + '" id="pkg-' + idx + '"' + (!isSelected ? ' onclick="openFareModal(' + idx + ')"' : '') + '>' +
      // Badges
      (badgesHtml ? '<div class="package-badges">' + badgesHtml + '</div>' : '') +
      // Flight rows
      '<div class="package-flights">' +
        renderFlightRow(pkg.outbound, 'outbound') +
        '<div class="package-divider"></div>' +
        renderFlightRow(pkg.inbound, 'inbound') +
      '</div>' +
      // Fare preview (unselected) or fare details (selected)
      (isSelected ? selectedFareDetails : farePreview) +
      // Bottom bar (only when selected)
      (isSelected ? '<div class="package-bottom">' +
        selectedInfo +
        '<button class="btn-primary btn-sm pkg-select-btn" onclick="event.stopPropagation();openFareModal(' + idx + ')">' + t('selectBtn') + '</button>' +
      '</div>' : '') +
    '</div>';
  });

  // Combined total / continue bar
  html += '<div id="combinedTotalBar" class="combined-total-bar hidden"></div>';

  // Fare selection modal (hidden by default)
  html += '<div class="fare-modal-overlay hidden" id="fareModalOverlay" onclick="closeFareModal()">' +
    '<div class="fare-modal" onclick="event.stopPropagation()">' +
      '<div class="fare-modal-header">' +
        '<h3>' + t('chooseYourFares') + '</h3>' +
        '<button class="fare-modal-close" onclick="closeFareModal()">✕</button>' +
      '</div>' +
      '<div class="fare-modal-body" id="fareModalBody"></div>' +
    '</div>' +
  '</div>';

  container.innerHTML = html;
  window.scrollTo({ top: container.offsetTop - 80, behavior: 'smooth' });
}

// ---- Fare Selection Modal ----
let modalPkgIdx = null;
let modalSelections = { outbound: 'classic', inbound: 'classic' };

function toggleFareColAmenities(amenId, toggleEl) {
  const list = document.getElementById(amenId);
  if (!list) return;
  list.classList.toggle('hidden');
  const arrow = toggleEl.querySelector('.pkg-fp-arrow');
  if (arrow) arrow.textContent = list.classList.contains('hidden') ? '▾' : '▴';
}

function openFareModalWithFare(pkgIdx, family) {
  // Open modal pre-selecting a specific fare for both legs
  const pkg = packages[pkgIdx];
  if (!pkg) return;
  modalPkgIdx = pkgIdx;
  modalSelections = { outbound: family, inbound: family };
  renderFareModal();
  document.getElementById('fareModalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function openFareModal(pkgIdx) {
  const pkg = packages[pkgIdx];
  if (!pkg) return;

  modalPkgIdx = pkgIdx;
  // Default to current selection if this package was already selected
  if (selectedPkgIdx === pkgIdx && selectedOutbound && selectedInbound) {
    modalSelections = { outbound: selectedOutbound.fareFamily, inbound: selectedInbound.fareFamily };
  } else {
    modalSelections = { outbound: 'classic', inbound: 'classic' };
  }

  renderFareModal();
  document.getElementById('fareModalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeFareModal() {
  document.getElementById('fareModalOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
  modalPkgIdx = null;
}

function renderFareModal() {
  const pkg = packages[modalPkgIdx];
  if (!pkg) return;
  const body = document.getElementById('fareModalBody');
  if (!body) return;

  const families = ['lite', 'classic', 'business'];
  const stopsLabel = (f) => f.stops === 0 ? t('direct') : f.stops + ' ' + (f.stops > 1 ? t('stops') : t('stop'));

  let html = '';

  // Outbound flight info + fare selection
  html += '<div class="fm-leg">' +
    '<div class="fm-leg-header">' +
      '<span class="fm-leg-dir">' + t('outbound') + '</span>' +
      '<span class="fm-leg-route">' + pkg.outbound.origin + ' → ' + pkg.outbound.destination + ' · ' + pkg.outbound.date + '</span>' +
    '</div>' +
    '<div class="fm-leg-flight">' +
      '<span class="fm-time">' + pkg.outbound.departure + ' – ' + pkg.outbound.arrival + '</span>' +
      '<span class="fm-meta">' + pkg.outbound.flightNumber + ' · ' + stopsLabel(pkg.outbound) + ' · ' + pkg.outbound.duration + '</span>' +
    '</div>' +
    '<div class="fm-fare-options">';
  families.forEach(f => {
    const fare = pkg.outbound.fares && pkg.outbound.fares[f];
    if (!fare) return;
    const isActive = modalSelections.outbound === f;
    html += '<div class="fm-fare-card' + (isActive ? ' active' : '') + '" onclick="selectModalFare(\'outbound\',\'' + f + '\')">' +
      '<div class="fm-fare-label">' + t(f) + '</div>' +
      '<div class="fm-fare-price">' + fmtPrice(fare.total) + '</div>' +
      '<ul class="fm-fare-features">' + getFareFeatures(f).map(ft => '<li>' + ft + '</li>').join('') + '</ul>' +
      '<div class="fm-fare-radio">' + (isActive ? '●' : '○') + '</div>' +
    '</div>';
  });
  html += '</div></div>';

  // Inbound flight info + fare selection
  html += '<div class="fm-leg">' +
    '<div class="fm-leg-header">' +
      '<span class="fm-leg-dir">' + t('return') + '</span>' +
      '<span class="fm-leg-route">' + pkg.inbound.origin + ' → ' + pkg.inbound.destination + ' · ' + pkg.inbound.date + '</span>' +
    '</div>' +
    '<div class="fm-leg-flight">' +
      '<span class="fm-time">' + pkg.inbound.departure + ' – ' + pkg.inbound.arrival + '</span>' +
      '<span class="fm-meta">' + pkg.inbound.flightNumber + ' · ' + stopsLabel(pkg.inbound) + ' · ' + pkg.inbound.duration + '</span>' +
    '</div>' +
    '<div class="fm-fare-options">';
  families.forEach(f => {
    const fare = pkg.inbound.fares && pkg.inbound.fares[f];
    if (!fare) return;
    const isActive = modalSelections.inbound === f;
    html += '<div class="fm-fare-card' + (isActive ? ' active' : '') + '" onclick="selectModalFare(\'inbound\',\'' + f + '\')">' +
      '<div class="fm-fare-label">' + t(f) + '</div>' +
      '<div class="fm-fare-price">' + fmtPrice(fare.total) + '</div>' +
      '<ul class="fm-fare-features">' + getFareFeatures(f).map(ft => '<li>' + ft + '</li>').join('') + '</ul>' +
      '<div class="fm-fare-radio">' + (isActive ? '●' : '○') + '</div>' +
    '</div>';
  });
  html += '</div></div>';

  // Total + confirm
  const obTotal = pkg.outbound.fares[modalSelections.outbound]?.total || 0;
  const ibTotal = pkg.inbound.fares[modalSelections.inbound]?.total || 0;
  html += '<div class="fm-footer">' +
    '<div class="fm-total">' +
      '<div class="fm-total-breakdown">' +
        '<span>' + t('outbound') + ' ' + t(modalSelections.outbound) + ': ' + fmtPrice(obTotal) + '</span>' +
        '<span>' + t('return') + ' ' + t(modalSelections.inbound) + ': ' + fmtPrice(ibTotal) + '</span>' +
      '</div>' +
      '<div class="fm-total-amount">Total: <strong>' + fmtPrice(obTotal + ibTotal) + '</strong></div>' +
    '</div>' +
    '<button class="btn-primary btn-lg fm-confirm-btn" onclick="confirmFareModal()">' + t('confirmSelection') + '</button>' +
  '</div>';

  body.innerHTML = html;
}

function selectModalFare(leg, family) {
  modalSelections[leg] = family;
  renderFareModal();
}

function confirmFareModal() {
  const pkg = packages[modalPkgIdx];
  if (!pkg) return;

  const obFare = pkg.outbound.fares && pkg.outbound.fares[modalSelections.outbound];
  const ibFare = pkg.inbound.fares && pkg.inbound.fares[modalSelections.inbound];
  if (!obFare || !ibFare) return;

  selectedPkgIdx = modalPkgIdx;
  selectedOutbound = { flightIdx: pkg.obIdx, fareFamily: modalSelections.outbound, flight: pkg.outbound, fare: obFare };
  selectedInbound = { flightIdx: pkg.ibIdx, fareFamily: modalSelections.inbound, flight: pkg.inbound, fare: ibFare };

  closeFareModal();
  renderPackageResults(lastSearchData);
  updateCombinedTotal();
}

// ---- One-Way Results ----
function renderOneWayResults(data) {
  const container = document.getElementById('flightResults');
  const flights = data.outbound;
  if (!flights || flights.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b"><p>' + t('noFlights') + '</p></div>';
    return;
  }

  const ob = flights[0];
  let html = '<div class="flight-section-header">' +
    '<h3>' + t('availableFlights') + ' <span style="font-weight:400;color:var(--gray)">' + ob.origin + ' → ' + ob.destination + ' · ' + ob.date + '</span></h3>' +
    '<p style="font-size:14px;color:var(--gray);margin:4px 0 0">' + t('selectFlightFare') + '</p>' +
  '</div>';

  flights.forEach((f, i) => {
    const stopsLabel = f.stops === 0 ? t('direct') : f.stops + ' ' + (f.stops > 1 ? t('stops') : t('stop'));
    const arrNext = f.arrivalNextDay ? '<sup>+1</sup>' : '';
    const seatsHtml = f.seatsLeft <= 5 ? '<span class="flight-seats-left">' + f.seatsLeft + ' seats left at this price</span>' : '';
    const fares = f.fares || {};
    const isSelected = selectedOutbound && selectedOutbound.flightIdx === i;

    html += '<div class="flight-card' + (isSelected ? ' selected' : '') + '" id="flight-ow-' + i + '">' +
      '<div class="flight-info">' +
        '<div class="flight-time"><div class="time">' + f.departure + '</div><div class="code">' + f.origin + '</div></div>' +
        '<div class="flight-route-line">' +
          '<div class="duration">' + f.duration + '</div>' +
          '<div class="line"><span class="dot"></span></div>' +
          '<div class="stops">' + stopsLabel + '</div>' +
        '</div>' +
        '<div class="flight-time"><div class="time">' + f.arrival + arrNext + '</div><div class="code">' + f.destination + '</div></div>' +
        '<div class="flight-meta">' +
          '<span class="flight-num">' + f.flightNumber + '</span>' +
          '<span>' + f.aircraft + '</span>' +
          seatsHtml +
        '</div>' +
      '</div>' +
      '<div class="fare-family-row">' +
        renderOwFareOption(i, 'lite', fares.lite, 'LITE') +
        renderOwFareOption(i, 'classic', fares.classic, 'CLASSIC') +
        renderOwFareOption(i, 'business', fares.business, 'BUSINESS') +
      '</div>' +
    '</div>';
  });

  html += '<div id="combinedTotalBar" class="combined-total-bar hidden"></div>';
  container.innerHTML = html;
  window.scrollTo({ top: container.offsetTop - 80, behavior: 'smooth' });
}

function renderOwFareOption(flightIdx, family, fare, label) {
  if (!fare) return '';
  const isSelected = selectedOutbound && selectedOutbound.flightIdx === flightIdx && selectedOutbound.fareFamily === family;
  const featId = 'ow-feat-' + flightIdx + '-' + family;

  return '<div class="fare-option' + (isSelected ? ' selected-fare' : '') + '" onclick="event.stopPropagation();selectOwFare(' + flightIdx + ',\'' + family + '\')">' +
    '<div class="fare-label">' + label + '</div>' +
    '<div class="fare-price">' + fmtPrice(fare.total) + '</div>' +
    '<button class="fare-details-toggle" onclick="event.stopPropagation();toggleFareDetails(\'' + featId + '\',this)">' + t('details') + ' ▾</button>' +
    '<ul class="fare-features hidden" id="' + featId + '">' + getFareFeatures(family).map(f => '<li>' + f + '</li>').join('') + '</ul>' +
    '<button class="fare-select-btn' + (isSelected ? ' active' : '') + '">' + t('selectBtn').replace(' →', '') + '</button>' +
  '</div>';
}

function selectOwFare(flightIdx, family) {
  const data = lastSearchData;
  if (!data) return;
  const flight = data.outbound[flightIdx];
  if (!flight || !flight.fares || !flight.fares[family]) return;

  selectedOutbound = { flightIdx, fareFamily: family, flight, fare: flight.fares[family] };
  selectedInbound = null;

  // Update highlights
  renderOneWayResults(data);
  updateCombinedTotal();
}

// ---- Shared functions ----
function updateCombinedTotal() {
  const bar = document.getElementById('combinedTotalBar');
  if (!bar) return;

  const data = lastSearchData;
  const isRound = data && data.tripType === 'round' && data.inbound && data.inbound.length > 0;

  let total = 0;
  let ready = false;
  let summaryHtml = '';

  if (isRound && selectedOutbound && selectedInbound) {
    total = selectedOutbound.fare.total + selectedInbound.fare.total;
    ready = true;
    summaryHtml = '<div class="ctb-legs">' +
      '<div class="ctb-leg"><span class="ctb-dir">' + t('outbound') + '</span> ' + selectedOutbound.flight.departure + ' – ' + selectedOutbound.flight.arrival +
        ' · ' + t(selectedOutbound.fareFamily) + ' · ' + fmtPrice(selectedOutbound.fare.total) + '</div>' +
      '<div class="ctb-leg"><span class="ctb-dir">' + t('return') + '</span> ' + selectedInbound.flight.departure + ' – ' + selectedInbound.flight.arrival +
        ' · ' + t(selectedInbound.fareFamily) + ' · ' + fmtPrice(selectedInbound.fare.total) + '</div>' +
    '</div>';
  } else if (!isRound && selectedOutbound) {
    total = selectedOutbound.fare.total;
    ready = true;
    summaryHtml = '<div class="ctb-legs">' +
      '<div class="ctb-leg">' + selectedOutbound.flight.departure + ' – ' + selectedOutbound.flight.arrival +
        ' · ' + t(selectedOutbound.fareFamily) + ' · ' + fmtPrice(selectedOutbound.fare.total) + '</div>' +
    '</div>';
  }

  if (ready) {
    bar.classList.remove('hidden');
    bar.innerHTML = summaryHtml +
      '<div class="ctb-total">' +
        '<div class="ctb-total-label">' + t('totalPerPerson') + '</div>' +
        '<div class="ctb-total-price">' + fmtPrice(total) + '</div>' +
      '</div>' +
      '<button class="btn-primary btn-lg ctb-continue" onclick="continueToBooking()">' +
        t('continue') + ' <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</button>';
  } else {
    bar.classList.add('hidden');
  }
}

function sortResults(mode) {
  currentSort = mode;
  const data = lastSearchData;
  if (!data) return;
  const isRound = data.tripType === 'round' && data.inbound && data.inbound.length > 0;
  if (isRound) {
    sortPackages(packages, mode);
    // Update selectedPkgIdx to follow the selection
    if (selectedOutbound && selectedInbound) {
      selectedPkgIdx = packages.findIndex(p =>
        p.obIdx === selectedOutbound.flightIdx && p.ibIdx === selectedInbound.flightIdx);
    }
    renderPackageResults(data);
    if (selectedOutbound && selectedInbound) updateCombinedTotal();
  } else {
    renderOneWayResults(data);
    if (selectedOutbound) updateCombinedTotal();
  }
}

function continueToBooking() {
  if (!selectedOutbound) {
    alert(t('pleaseSelectFlight'));
    return;
  }

  cartItems.length = 0;

  var outboundLeg = {
    origin: selectedOutbound.flight.origin, destination: selectedOutbound.flight.destination,
    cabin: selectedOutbound.fareFamily.charAt(0).toUpperCase() + selectedOutbound.fareFamily.slice(1),
    duration: selectedOutbound.flight.duration, date: selectedOutbound.flight.date,
    departure: selectedOutbound.flight.departure, arrival: selectedOutbound.flight.arrival,
    flightNumber: selectedOutbound.flight.flightNumber, fare: selectedOutbound.fare
  };

  var inboundLeg = null;
  if (selectedInbound) {
    inboundLeg = {
      origin: selectedInbound.flight.origin, destination: selectedInbound.flight.destination,
      cabin: selectedInbound.fareFamily.charAt(0).toUpperCase() + selectedInbound.fareFamily.slice(1),
      duration: selectedInbound.flight.duration, date: selectedInbound.flight.date,
      departure: selectedInbound.flight.departure, arrival: selectedInbound.flight.arrival,
      flightNumber: selectedInbound.flight.flightNumber, fare: selectedInbound.fare
    };
  }

  // Add as a single bundled item (outbound + optional inbound)
  addToCart({
    type: inboundLeg ? 'roundtrip' : 'oneway',
    outbound: outboundLeg,
    inbound: inboundLeg
  });

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

// ---- PAYMENT METHOD SWITCHING ----
var currentPaymentMethod = 'mobile';
var activePromo = null;
var promoDiscountAmount = 0;

(function initPaymentTabs() {
  document.addEventListener('change', function(e) {
    if (e.target.name === 'payment') {
      currentPaymentMethod = e.target.value;
      // Map values to form IDs
      var formMap = { mobile:'payMobile', card:'payCard', bank:'payBank', irembo:'payIrembo', cellulant:'payCellulant', nigeriapsp:'payNigeriapsp', iatapay:'payIatapay', wallet:'payWallet', miles:'payMiles', split:'paySplit' };
      Object.values(formMap).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      var target = document.getElementById(formMap[currentPaymentMethod]);
      if (target) target.style.display = '';
      // Show miles banner for miles/split
      var mb = document.getElementById('milesBalanceBanner');
      if (mb) mb.style.display = (currentPaymentMethod === 'miles' || currentPaymentMethod === 'split') ? '' : 'none';
      // Update wallet display
      if (currentPaymentMethod === 'wallet') updateWalletDisplay();
      // Update miles calculations
      if (currentPaymentMethod === 'miles') updateMilesCalc();
      if (currentPaymentMethod === 'split') updateSplitCalc();
    }
  });
})();

// ---- MILES + CASH SLIDER ----
function getBookingTotalRWF() {
  var el = document.getElementById('totalPrice');
  return el ? parseFloat(el.getAttribute('data-rwf')) || 0 : 0;
}

function updateMilesCalc() {
  var totalRWF = getBookingTotalRWF() - promoDiscountAmount;
  var milesNeeded = Math.ceil(totalRWF / 13.7);
  var balance = loggedInUser ? (loggedInUser.dreammiles?.balance || 0) : 0;
  var remaining = balance - milesNeeded;
  var el = document.getElementById('milesRequired');
  if (el) el.textContent = milesNeeded.toLocaleString() + ' miles';
  var rem = document.getElementById('milesRemaining');
  if (rem) rem.textContent = remaining.toLocaleString() + ' miles';
  var status = document.getElementById('milesStatus');
  if (status) {
    if (!loggedInUser) {
      status.className = 'miles-status miles-status-err';
      status.innerHTML = '<span>⚠</span><span>Please log in to use DreamMiles.</span>';
    } else if (remaining >= 0) {
      status.className = 'miles-status miles-status-ok';
      status.innerHTML = '<span>✓</span><span>You have enough DreamMiles for this booking!</span>';
    } else {
      status.className = 'miles-status miles-status-err';
      status.innerHTML = '<span>⚠</span><span>Not enough miles. You need ' + Math.abs(remaining).toLocaleString() + ' more miles. Consider Split Payment instead.</span>';
    }
  }
  var mb = document.getElementById('milesBalance');
  if (mb) mb.textContent = balance.toLocaleString();
}

function updateSplitCalc() {
  var slider = document.getElementById('splitSlider');
  if (!slider) return;
  var pct = parseInt(slider.value) || 50;
  var totalRWF = getBookingTotalRWF() - promoDiscountAmount;
  var milesPortionRWF = Math.round(totalRWF * pct / 100);
  var cashPortionRWF = totalRWF - milesPortionRWF;
  var milesNeeded = Math.ceil(milesPortionRWF / 13.7);
  var balance = loggedInUser ? (loggedInUser.dreammiles?.balance || 0) : 0;

  // Enforce minimum 1000 miles
  if (pct > 0 && milesNeeded < 1000) {
    milesNeeded = 1000;
    milesPortionRWF = Math.round(milesNeeded * 13.7);
    cashPortionRWF = totalRWF - milesPortionRWF;
  }

  var mAmt = document.getElementById('splitMilesAmount');
  if (mAmt) mAmt.textContent = milesNeeded.toLocaleString() + ' miles';
  var mDol = document.getElementById('splitMilesDollar');
  if (mDol) { mDol.setAttribute('data-rwf', milesPortionRWF); mDol.textContent = fmtPrice(milesPortionRWF); }
  var cAmt = document.getElementById('splitCashAmount');
  if (cAmt) { cAmt.setAttribute('data-rwf', cashPortionRWF); cAmt.textContent = fmtPrice(cashPortionRWF); }

  var status = document.getElementById('splitStatus');
  if (status) {
    if (balance >= milesNeeded) {
      status.innerHTML = '<span>✓</span><span>You have enough miles for this split.</span>';
      status.className = 'split-status split-ok';
    } else {
      status.innerHTML = '<span>⚠</span><span>Insufficient miles. Reduce the slider or top up your miles.</span>';
      status.className = 'split-status split-warn';
    }
  }
}

// Wire up slider
document.addEventListener('DOMContentLoaded', function() {
  var slider = document.getElementById('splitSlider');
  if (slider) slider.addEventListener('input', updateSplitCalc);
});

// ---- WALLET ----
function updateWalletDisplay() {
  var walletCard = document.getElementById('walletPayCard');
  var loginPrompt = document.getElementById('walletLoginPrompt');
  if (!loggedInUser) {
    if (walletCard) walletCard.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = '';
    return;
  }
  if (walletCard) walletCard.style.display = '';
  if (loginPrompt) loginPrompt.style.display = 'none';

  var balance = loggedInUser.wallet?.balance || 0;
  var totalRWF = getBookingTotalRWF() - promoDiscountAmount;
  var deduction = Math.min(balance, totalRWF);
  var remain = totalRWF - deduction;

  var balEl = document.getElementById('walletBalance');
  if (balEl) balEl.textContent = fmtPrice(balance);
  var dedEl = document.getElementById('walletDeduction');
  if (dedEl) dedEl.textContent = '- ' + fmtPrice(deduction);
  var remEl = document.getElementById('walletRemainPay');
  if (remEl) remEl.textContent = remain > 0 ? fmtPrice(remain) : fmtPrice(0);

  var status = document.getElementById('walletStatus');
  var topup = document.getElementById('walletTopupMethod');
  if (balance >= totalRWF) {
    status.textContent = '✓ Wallet covers the full amount!';
    status.className = 'wallet-status ok';
    if (topup) topup.style.display = 'none';
  } else if (balance > 0) {
    status.textContent = '⚠ Partial coverage — pay remaining ' + fmtPrice(remain) + ' with another method.';
    status.className = 'wallet-status partial';
    if (topup) topup.style.display = '';
  } else {
    status.textContent = '✕ Your wallet is empty.';
    status.className = 'wallet-status empty';
    if (topup) topup.style.display = 'none';
  }

  // Update tab badge
  var badge = document.getElementById('walletTabBadge');
  if (badge && balance > 0) { badge.textContent = fmtPrice(balance); badge.style.display = ''; }
}

// ---- PROMO CODES ----
function togglePromoCode() {
  var f = document.getElementById('promoForm');
  if (f) f.classList.toggle('hidden');
}

function applyPromoCode() {
  var input = document.getElementById('promoInput');
  var code = (input?.value || '').trim();
  if (!code) return;
  var totalRWF = getBookingTotalRWF();

  fetch('/api/promo/validate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code, amount: totalRWF })
  }).then(function(r) { return r.json(); }).then(function(data) {
    var result = document.getElementById('promoResult');
    if (data.valid) {
      activePromo = data;
      promoDiscountAmount = data.discountAmount;
      result.textContent = '✓ ' + data.description + ' — saves ' + fmtPrice(data.discountAmount);
      result.className = 'promo-result success';
      result.classList.remove('hidden');
      // Show applied badge
      var applied = document.getElementById('promoApplied');
      var appliedText = document.getElementById('promoAppliedText');
      if (applied) { applied.classList.remove('hidden'); appliedText.textContent = '🏷 ' + data.code + ' — ' + fmtPrice(data.discountAmount) + ' off'; }
      // Update total display
      updatePaymentTotalWithPromo();
    } else {
      result.textContent = '✕ ' + (data.error || 'Invalid promo code');
      result.className = 'promo-result error';
      result.classList.remove('hidden');
    }
  }).catch(function() {
    var result = document.getElementById('promoResult');
    result.textContent = '✕ Could not validate code';
    result.className = 'promo-result error';
    result.classList.remove('hidden');
  });
}

function removePromoCode() {
  activePromo = null;
  promoDiscountAmount = 0;
  var applied = document.getElementById('promoApplied');
  if (applied) applied.classList.add('hidden');
  var result = document.getElementById('promoResult');
  if (result) result.classList.add('hidden');
  var input = document.getElementById('promoInput');
  if (input) input.value = '';
  updatePaymentTotalWithPromo();
}

function updatePaymentTotalWithPromo() {
  var totalEl = document.getElementById('totalPrice');
  var baseTotalRWF = parseFloat(totalEl?.getAttribute('data-rwf')) || 0;
  // Don't modify data-rwf, just update display
  var payBtnText = document.getElementById('payBtnText');
  var displayTotal = baseTotalRWF - promoDiscountAmount;
  if (displayTotal < 0) displayTotal = 0;
  if (payBtnText) {
    var priceSpan = payBtnText.querySelector('.dyn-price');
    if (priceSpan) { priceSpan.setAttribute('data-rwf', displayTotal); priceSpan.textContent = fmtPrice(displayTotal); }
  }
  // Update miles/split/wallet calcs if active
  if (currentPaymentMethod === 'miles') updateMilesCalc();
  if (currentPaymentMethod === 'split') updateSplitCalc();
  if (currentPaymentMethod === 'wallet') updateWalletDisplay();
}

// ---- URGENCY MESSAGING ----
function addUrgencyBadges(container) {
  if (!container) return;
  var cards = container.querySelectorAll('.package-card, .pkg-card, .flight-card, .bundle-card, .ow-card');
  cards.forEach(function(card) {
    if (card.querySelector('.urgency-row')) return; // already added
    var seats = Math.floor(Math.random() * 7) + 2;
    var viewers = Math.floor(Math.random() * 12) + 3;
    var row = document.createElement('div');
    row.className = 'urgency-row';
    row.innerHTML = '<span class="urgency-badge seats">🔥 Only ' + seats + ' seats left</span>' +
      '<span class="urgency-badge viewers">👁 ' + viewers + ' people viewing</span>';
    card.appendChild(row);
  });
}

// ---- RETARGETING ----
var _exitIntentShown = false;
var _emailCaptureShown = false;

function initRetargeting() {
  // Exit intent (desktop only)
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY < 5 && !_exitIntentShown && !loggedInUser && !sessionStorage.getItem('exitIntentDismissed')) {
      _exitIntentShown = true;
      document.getElementById('exitIntentPopup').classList.remove('hidden');
    }
  });

  // Email capture after 30s for non-logged users
  setTimeout(function() {
    if (!loggedInUser && !_emailCaptureShown && !sessionStorage.getItem('emailCaptureDismissed')) {
      _emailCaptureShown = true;
      document.getElementById('emailCapturePopup').classList.remove('hidden');
    }
  }, 30000);
}

function closeExitIntent() {
  document.getElementById('exitIntentPopup').classList.add('hidden');
  sessionStorage.setItem('exitIntentDismissed', '1');
}

function submitExitIntent() {
  var email = document.getElementById('exitIntentEmail').value;
  if (!email) return;
  fetch('/api/marketing/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email}) })
    .then(function() {
      document.getElementById('exitIntentPopup').querySelector('h2').textContent = 'You\'re all set!';
      document.getElementById('exitIntentPopup').querySelector('p').textContent = 'We\'ll send you price alerts. Check your inbox!';
      document.getElementById('exitIntentPopup').querySelector('.retarget-form').style.display = 'none';
      setTimeout(closeExitIntent, 2000);
    });
}

function closeEmailCapture() {
  document.getElementById('emailCapturePopup').classList.add('hidden');
  sessionStorage.setItem('emailCaptureDismissed', '1');
}

function submitEmailCapture() {
  var email = document.getElementById('emailCaptureInput').value;
  if (!email) return;
  fetch('/api/marketing/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email}) })
    .then(function() {
      document.getElementById('emailCapturePopup').querySelector('h2').textContent = 'Discount Code Sent!';
      document.getElementById('emailCapturePopup').querySelector('p').textContent = 'Check your inbox for code WELCOME (15% off).';
      document.getElementById('emailCapturePopup').querySelector('.retarget-form').style.display = 'none';
      setTimeout(closeEmailCapture, 3000);
    });
}

// Cart abandonment toast
var _abandonToastShown = false;
function checkCartAbandonment(newPageId) {
  if (cartItems.length > 0 && newPageId !== 'booking' && newPageId !== 'results' && !_abandonToastShown) {
    _abandonToastShown = true;
    document.getElementById('abandonToast').classList.remove('hidden');
    // Auto-hide after 8 seconds
    setTimeout(closeAbandonToast, 8000);
    // Record abandonment
    fetch('/api/retargeting/abandon', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ cartItems:cartItems.length, page:newPageId }) }).catch(function(){});
  }
}

function closeAbandonToast() {
  document.getElementById('abandonToast').classList.add('hidden');
}

function resumeBooking() {
  closeAbandonToast();
  toggleCart();
}

// Initialize retargeting on load
document.addEventListener('DOMContentLoaded', initRetargeting);

// ---- MANAGE BOOKING ----
var managedBooking = null;

function fillManageDemo(ref, last) {
  document.getElementById('manageRef').value = ref;
  document.getElementById('manageLast').value = last;
}

function retrieveBooking() {
  var ref = document.getElementById('manageRef').value.trim();
  var last = document.getElementById('manageLast').value.trim();
  var errEl = document.getElementById('manageError');
  errEl.classList.add('hidden');

  if (!ref || !last) {
    errEl.textContent = 'Please enter both booking reference and last name.';
    errEl.classList.remove('hidden');
    return;
  }

  var btn = document.querySelector('#manageLookup .btn-primary');
  btn.textContent = 'Retrieving...';
  btn.disabled = true;

  fetch('/api/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingRef: ref, lastName: last })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(result) {
    btn.textContent = 'Retrieve Booking';
    btn.disabled = false;
    if (!result.ok) {
      errEl.textContent = result.data.error || 'Booking not found.';
      errEl.classList.remove('hidden');
      return;
    }
    managedBooking = result.data;
    renderManagedBooking(result.data);
  })
  .catch(function() {
    btn.textContent = 'Retrieve Booking';
    btn.disabled = false;
    errEl.textContent = 'Network error. Please try again.';
    errEl.classList.remove('hidden');
  });
}

function renderManagedBooking(b) {
  document.getElementById('manageLookup').classList.add('hidden');
  document.getElementById('manageResult').classList.remove('hidden');

  // Status banner
  var banner = document.getElementById('manageStatusBanner');
  var icon = document.getElementById('manageStatusIcon');
  var title = document.getElementById('manageStatusTitle');
  var refP = document.getElementById('manageStatusRef');

  if (b.status === 'confirmed') {
    icon.textContent = '✅'; title.textContent = 'Booking Confirmed';
    banner.className = 'manage-status-banner confirmed';
  } else if (b.status === 'cancelled') {
    icon.textContent = '❌'; title.textContent = 'Booking Cancelled';
    banner.className = 'manage-status-banner cancelled';
  } else {
    icon.textContent = '⏳'; title.textContent = 'Booking On Hold';
    banner.className = 'manage-status-banner on_hold';
  }
  refP.innerHTML = 'Booking Ref: <strong>' + b.bookingRef + '</strong>' +
    (b.createdAt ? ' &middot; Booked ' + new Date(b.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '');

  // Flights
  var flightsEl = document.getElementById('manageFlights');
  var fhtml = '';
  if (b.outboundFlight) {
    var ob = b.outboundFlight;
    fhtml += '<div class="manage-flight-seg"><span class="mf-badge">Outbound</span>' +
      '<div class="mf-route">' +
        '<div class="mf-city"><span class="mf-time">' + ob.departure + '</span><span class="mf-code">' + ob.origin + '</span></div>' +
        '<div class="mf-arrow"><span>✈ ───────── ✈</span>' + ob.duration + ' &middot; Direct</div>' +
        '<div class="mf-city"><span class="mf-time">' + ob.arrival + '</span><span class="mf-code">' + ob.destination + '</span></div>' +
      '</div>' +
      '<div class="mf-meta"><span>✈ ' + ob.flightNumber + '</span><span>📅 ' + ob.date + '</span><span>💺 ' + (ob.cabin || b.cabin || 'Economy') + '</span>' + (ob.aircraft ? '<span>🛩 ' + ob.aircraft + '</span>' : '') + '</div></div>';
  }
  if (b.inboundFlight) {
    var ib = b.inboundFlight;
    fhtml += '<div class="manage-flight-seg"><span class="mf-badge return">Return</span>' +
      '<div class="mf-route">' +
        '<div class="mf-city"><span class="mf-time">' + ib.departure + '</span><span class="mf-code">' + ib.origin + '</span></div>' +
        '<div class="mf-arrow"><span>✈ ───────── ✈</span>' + ib.duration + ' &middot; Direct</div>' +
        '<div class="mf-city"><span class="mf-time">' + ib.arrival + '</span><span class="mf-code">' + ib.destination + '</span></div>' +
      '</div>' +
      '<div class="mf-meta"><span>✈ ' + ib.flightNumber + '</span><span>📅 ' + ib.date + '</span><span>💺 ' + (ib.cabin || b.cabin || 'Economy') + '</span></div></div>';
  }
  flightsEl.innerHTML = fhtml;

  // Passengers
  var paxEl = document.getElementById('managePassengers');
  var phtml = '';
  (b.passengers || []).forEach(function(p) {
    var initials = ((p.firstName || '')[0] + (p.lastName || '')[0]).toUpperCase();
    phtml += '<div class="manage-pax"><div class="manage-pax-avatar">' + initials + '</div>' +
      '<div class="manage-pax-info"><strong>' + (p.title || '') + ' ' + p.firstName + ' ' + p.lastName + '</strong>' +
      '<span>Seat: ' + (p.seat || 'TBA') + ' &middot; Meal: ' + (p.meal || 'Standard') + ' &middot; Passport: ' + (p.passport || 'N/A') + '</span></div></div>';
  });
  paxEl.innerHTML = phtml;

  // E-Tickets
  var tickEl = document.getElementById('manageTickets');
  var thtml = '';
  (b.etickets || []).forEach(function(t) {
    thtml += '<div class="manage-ticket"><div class="manage-ticket-left"><strong>🎫 ' + t.number + '</strong>' +
      '<span>' + t.passenger + ' &middot; Seat ' + t.seat + '</span></div>' +
      '<span class="manage-ticket-status ' + t.status + '">' + t.status.toUpperCase() + '</span></div>';
  });
  tickEl.innerHTML = thtml;

  // Ancillaries
  var ancEl = document.getElementById('manageAncillaries');
  if (b.ancillaries && b.ancillaries.length) {
    var ahtml = '';
    b.ancillaries.forEach(function(a) {
      ahtml += '<div class="manage-anc-item"><span>' + a.name + '</span><strong>' + (a.price ? fmtPrice(a.price) : 'Free') + '</strong></div>';
    });
    ancEl.innerHTML = ahtml;
  } else {
    ancEl.innerHTML = '<p class="manage-anc-none">No extras added yet.</p>';
  }

  // Fare summary
  var fareEl = document.getElementById('manageFareSummary');
  var fare = b.fare || b.outboundFlight.fare;
  var fsum = '<div class="manage-fare-row"><span>Base fare</span><span>' + fmtPrice(fare.base || 0) + '</span></div>' +
    '<div class="manage-fare-row"><span>Taxes & fees</span><span>' + fmtPrice(fare.tax || 0) + '</span></div>';
  if (b.ancillaries && b.ancillaries.length) {
    var ancTotal = b.ancillaries.reduce(function(s, a) { return s + (a.price || 0); }, 0);
    if (ancTotal) fsum += '<div class="manage-fare-row"><span>Extras</span><span>' + fmtPrice(ancTotal) + '</span></div>';
  }
  fsum += '<div class="manage-fare-row total"><span>Total</span><span>' + fmtPrice(fare.totalAllPax || fare.total || 0) + '</span></div>';
  if (b.paymentMethod) fsum += '<div style="font-size:13px;color:#64748b;margin-top:8px">Paid via ' + b.paymentMethod + '</div>';
  if (b.dreamMilesEarned) fsum += '<div style="font-size:13px;color:#f59e0b;margin-top:4px">⭐ ' + b.dreamMilesEarned + ' DreamMiles earned</div>';
  fareEl.innerHTML = fsum;

  // Actions
  var actEl = document.getElementById('manageActions');
  var actCard = document.getElementById('manageActionsCard');
  if (b.status === 'cancelled') {
    actCard.classList.add('hidden');
  } else {
    actCard.classList.remove('hidden');
    actEl.innerHTML =
      '<button class="manage-action-btn" onclick="manageAddExtra()"><span class="ma-icon">🧳</span> Add Extra Baggage / Services</button>' +
      '<button class="manage-action-btn" onclick="managePrint()"><span class="ma-icon">🖨</span> Print Itinerary</button>' +
      '<button class="manage-action-btn" onclick="manageEmail()"><span class="ma-icon">📧</span> Email Confirmation</button>' +
      '<button class="manage-action-btn danger" onclick="openCancelModal()"><span class="ma-icon">✕</span> Cancel Booking & Refund</button>';
  }

  // Refund card
  var refundCard = document.getElementById('manageRefundCard');
  if (b.status === 'cancelled') {
    refundCard.classList.remove('hidden');
    var rhtml = '<div class="manage-refund-detail">' +
      '<p><strong>Status:</strong> ' + (b.refundStatus === 'completed' ? '✅ Refund Completed' : '⏳ Refund Pending') + '</p>' +
      '<p><strong>Refund Amount:</strong> <span class="refund-amount">' + fmtPrice(b.refundAmount || 0) + '</span></p>' +
      (b.refundMethod ? '<p><strong>Refunded to:</strong> ' + (b.refundMethod === 'wallet' ? '👛 Wallet' : '💳 Original Payment Method') + '</p>' : '') +
      (b.cancelledAt ? '<p><strong>Cancelled:</strong> ' + new Date(b.cancelledAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) + '</p>' : '') +
      (b.cancellationReason ? '<p><strong>Reason:</strong> ' + b.cancellationReason + '</p>' : '') +
      (b.refundNote ? '<p style="color:#16a34a;margin-top:8px">' + b.refundNote + '</p>' : '') +
    '</div>';
    document.getElementById('manageRefundInfo').innerHTML = rhtml;
  } else {
    refundCard.classList.add('hidden');
  }

  // Wallet card
  var walletCard = document.getElementById('manageWalletCard');
  if (typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.wallet) {
    walletCard.classList.remove('hidden');
    var w = loggedInUser.wallet;
    var whtml = '<div class="manage-wallet-balance">' + fmtPrice(w.balance) + '</div>' +
      '<div style="font-size:13px;color:#64748b">Available for bookings or refunds</div>';
    if (w.transactions && w.transactions.length) {
      whtml += '<div class="manage-wallet-txns"><strong style="font-size:13px;color:#0f172a">Recent Transactions:</strong>';
      w.transactions.slice(0, 5).forEach(function(txn) {
        whtml += '<div class="manage-wallet-txn"><div><span>' + txn.reason + '</span><br><span style="color:#94a3b8;font-size:11px">' +
          new Date(txn.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + '</span></div>' +
          '<span class="' + txn.type + '">+' + fmtPrice(txn.amount) + '</span></div>';
      });
      whtml += '</div>';
    }
    document.getElementById('manageWalletInfo').innerHTML = whtml;
  } else {
    walletCard.classList.add('hidden');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToManageLookup() {
  document.getElementById('manageLookup').classList.remove('hidden');
  document.getElementById('manageResult').classList.add('hidden');
  managedBooking = null;
}

function openCancelModal() {
  if (!managedBooking) return;
  var b = managedBooking;
  var fare = b.fare || b.outboundFlight.fare;
  var total = fare.totalAllPax || fare.total || 0;
  var refundAmt = Math.round(total * 0.85);

  document.getElementById('manageCancelRefundInfo').innerHTML =
    '<p>Booking: <strong>' + b.bookingRef + '</strong></p>' +
    '<p>Total paid: ' + fmtPrice(total) + '</p>' +
    '<p>Refund amount (85%): <span class="refund-amount">' + fmtPrice(refundAmt) + '</span></p>' +
    '<p style="font-size:12px;color:#94a3b8">A 15% cancellation fee applies per RwandAir policy.</p>';

  var opts = document.querySelectorAll('.manage-refund-opt');
  opts.forEach(function(o) {
    o.onclick = function() {
      opts.forEach(function(x) { x.classList.remove('selected'); });
      o.classList.add('selected');
      o.querySelector('input').checked = true;
    };
  });
  document.getElementById('manageCancelModal').classList.remove('hidden');
}

function closeCancelModal() {
  document.getElementById('manageCancelModal').classList.add('hidden');
}

function confirmCancelBooking() {
  if (!managedBooking) return;
  var b = managedBooking;
  var reason = document.getElementById('manageCancelReason').value;
  var method = document.querySelector('input[name="refundMethod"]:checked').value;
  var lastName = b.passengers[0].lastName;
  closeCancelModal();

  if (method === 'wallet' && typeof loggedInUser !== 'undefined' && loggedInUser) {
    var token = localStorage.getItem('rwToken');
    fetch('/api/bookings/cancel-to-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ bookingRef: b.bookingRef, lastName: lastName, reason: reason })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { alert(data.error); return; }
      if (loggedInUser) {
        loggedInUser.wallet = loggedInUser.wallet || { balance: 0, currency: 'RWF', transactions: [] };
        loggedInUser.wallet.balance = data.newWalletBalance;
        loggedInUser.wallet.transactions.unshift(data.transaction);
      }
      managedBooking.status = 'cancelled';
      managedBooking.cancelledAt = data.cancelledAt;
      managedBooking.cancellationReason = reason || 'Requested by passenger';
      managedBooking.refundStatus = 'completed';
      managedBooking.refundAmount = data.refundAmount;
      managedBooking.refundMethod = 'wallet';
      managedBooking.refundNote = data.refundNote;
      renderManagedBooking(managedBooking);
    });
  } else {
    fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingRef: b.bookingRef, lastName: lastName, reason: reason })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { alert(data.error); return; }
      managedBooking.status = 'cancelled';
      managedBooking.cancelledAt = data.cancelledAt;
      managedBooking.refundStatus = 'pending';
      managedBooking.refundAmount = data.refundAmount;
      managedBooking.refundNote = data.refundNote;
      renderManagedBooking(managedBooking);
    });
  }
}

function manageAddExtra() { alert('Coming soon! Add baggage, lounge, insurance and more.'); }
function managePrint() { window.print(); }
function manageEmail() { alert('Confirmation email sent to ' + (managedBooking && managedBooking.contact ? managedBooking.contact.email : 'your email') + '!'); }

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
        // Clear cart after successful purchase
        cartItems.length = 0;
        clearCartStorage();
        renderCart();
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

// ---- TIME-TO-THINK (Hold Fare) ----
var t2tCountdownTimer = null;
var t2tHoldData = null;

function openT2TModal() {
  var modal = document.getElementById('t2tModal');
  modal.classList.remove('hidden');
  // Reset selection to 24h
  var opts = document.querySelectorAll('.t2t-option');
  opts.forEach(function(o) { o.classList.remove('selected'); });
  opts[0].classList.add('selected');
  opts[0].querySelector('input').checked = true;
  updateT2TConfirmBtn();
  // Wire up option clicks
  opts.forEach(function(o) {
    o.onclick = function() {
      opts.forEach(function(x) { x.classList.remove('selected'); });
      o.classList.add('selected');
      o.querySelector('input').checked = true;
      updateT2TConfirmBtn();
    };
  });
}

function closeT2TModal() {
  document.getElementById('t2tModal').classList.add('hidden');
}

function updateT2TConfirmBtn() {
  var selected = document.querySelector('input[name="t2tDuration"]:checked');
  var feeMap = { '24h': 15000, '48h': 25000, '72h': 35000 };
  var fee = feeMap[selected.value] || 15000;
  var el = document.getElementById('t2tConfirmText');
  el.innerHTML = 'Hold Fare for <span class="dyn-price" data-rwf="' + fee + '">' + fmtPrice(fee) + '</span>';
}

function confirmT2THold() {
  var terms = document.getElementById('termsCheck');
  if (!terms.checked) {
    closeT2TModal();
    terms.parentElement.style.color = '#ef4444';
    terms.focus();
    setTimeout(function() { terms.parentElement.style.color = ''; }, 3000);
    return;
  }

  var duration = document.querySelector('input[name="t2tDuration"]:checked').value;
  closeT2TModal();

  // Show processing modal
  var modal = document.getElementById('t2tProcessingModal');
  modal.classList.remove('hidden');
  var bar = document.getElementById('t2tProgress');
  var step = document.getElementById('t2tProcessingStep');

  var steps = [
    { pct: 30, text: 'Locking fare and seats...' },
    { pct: 60, text: 'Securing hold reservation...' },
    { pct: 90, text: 'Generating hold reference...' },
    { pct: 100, text: 'Hold confirmed!' }
  ];

  var i = 0;
  function nextStep() {
    if (i >= steps.length) {
      // Make API call
      var outFlight = typeof selectedOutbound !== 'undefined' ? selectedOutbound : null;
      var inFlight = typeof selectedInbound !== 'undefined' ? selectedInbound : null;

      fetch('/api/bookings/t2t-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outboundFlight: outFlight,
          inboundFlight: inFlight,
          passengers: 1,
          cabin: 'economy',
          duration: duration
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        modal.classList.add('hidden');
        bar.style.width = '0';
        t2tHoldData = data;
        showT2TConfirmation(data);
      })
      .catch(function() {
        modal.classList.add('hidden');
        bar.style.width = '0';
        alert('Failed to hold fare. Please try again.');
      });
      return;
    }
    bar.style.width = steps[i].pct + '%';
    step.textContent = steps[i].text;
    i++;
    setTimeout(nextStep, 700);
  }
  nextStep();
}

function showT2TConfirmation(data) {
  // Hide booking step 3 and sidebar, show confirmation card
  var step3 = document.getElementById('bookingStep3');
  var sidebar = document.querySelector('.booking-sidebar');
  var conf = document.getElementById('t2tConfirmation');

  if (step3) step3.classList.add('hidden');
  if (sidebar) sidebar.style.display = 'none';
  conf.classList.remove('hidden');

  // Populate ref
  document.getElementById('t2tHoldRef').textContent = data.holdRef;

  // Populate summary
  var summaryEl = document.getElementById('t2tHoldSummary');
  var feeMap = { '24 Hours': 15000, '48 Hours': 25000, '72 Hours': 35000 };
  var fee = feeMap[data.duration] || data.holdFee;
  summaryEl.innerHTML =
    '<div class="t2t-sum-row"><span>Hold Duration</span><strong>' + data.duration + '</strong></div>' +
    '<div class="t2t-sum-row"><span>Hold Fee (deducted at payment)</span><strong>' + fmtPrice(fee) + '</strong></div>' +
    '<div class="t2t-sum-row"><span>Expires</span><strong>' + new Date(data.expiresAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) + '</strong></div>';

  // Start countdown
  startT2TCountdown(data.expiresAt);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startT2TCountdown(expiresAt) {
  if (t2tCountdownTimer) clearInterval(t2tCountdownTimer);

  var expiry = new Date(expiresAt).getTime();

  function update() {
    var now = Date.now();
    var diff = expiry - now;

    if (diff <= 0) {
      clearInterval(t2tCountdownTimer);
      document.getElementById('t2tHours').textContent = '00';
      document.getElementById('t2tMinutes').textContent = '00';
      document.getElementById('t2tSeconds').textContent = '00';
      return;
    }

    var hours = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);

    document.getElementById('t2tHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('t2tMinutes').textContent = String(mins).padStart(2, '0');
    document.getElementById('t2tSeconds').textContent = String(secs).padStart(2, '0');
  }

  update();
  t2tCountdownTimer = setInterval(update, 1000);
}

function convertT2TToPayment() {
  // Re-show step 3 and sidebar
  var conf = document.getElementById('t2tConfirmation');
  var step3 = document.getElementById('bookingStep3');
  var sidebar = document.querySelector('.booking-sidebar');

  conf.classList.add('hidden');
  if (step3) step3.classList.remove('hidden');
  if (sidebar) sidebar.style.display = '';

  if (t2tCountdownTimer) clearInterval(t2tCountdownTimer);

  // Just show step 3 so user can pay now
  goToStep(3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- AI CHAT ASSISTANT ----
const CITY_MAP = {
  'kigali':'Kigali (KGL)','kgl':'Kigali (KGL)','nairobi':'Nairobi (NBO)','nbo':'Nairobi (NBO)',
  'dubai':'Dubai (DXB)','dxb':'Dubai (DXB)','lagos':'Lagos (LOS)','los':'Lagos (LOS)',
  'london':'London (LHR)','lhr':'London (LHR)','johannesburg':'Johannesburg (JNB)','jnb':'Johannesburg (JNB)',
  'entebbe':'Entebbe (EBB)','ebb':'Entebbe (EBB)','dar es salaam':'Dar es Salaam (DAR)','dar':'Dar es Salaam (DAR)',
  'accra':'Accra (ACC)','acc':'Accra (ACC)','addis ababa':'Addis Ababa (ADD)','add':'Addis Ababa (ADD)',
  'bujumbura':'Bujumbura (BJM)','bjm':'Bujumbura (BJM)','mumbai':'Mumbai (BOM)','bom':'Mumbai (BOM)',
  'paris':'Paris (CDG)','cdg':'Paris (CDG)','brussels':'Brussels (BRU)','bru':'Brussels (BRU)',
  'douala':'Douala (DLA)','dla':'Douala (DLA)','kinshasa':'Kinshasa (FIH)','fih':'Kinshasa (FIH)',
  'mombasa':'Mombasa (MBA)','mba':'Mombasa (MBA)','zanzibar':'Zanzibar (ZNZ)','znz':'Zanzibar (ZNZ)'
};

let chatCtx = { intent: null, step: null, data: {} };

// ---- CHAT CONTEXT AWARENESS ----
var chatRecentActions = [];
var _lastChatContextPage = null;

function getChatContext() {
  var page = getCurrentPageId();
  var searchTo = document.getElementById('searchTo') ? document.getElementById('searchTo').value : '';
  var searchFrom = document.getElementById('searchFrom') ? document.getElementById('searchFrom').value : '';
  var resultTo = document.getElementById('resultTo') ? document.getElementById('resultTo').textContent : '';
  var resultFrom = document.getElementById('resultFrom') ? document.getElementById('resultFrom').textContent : '';

  return {
    currentPage: page,
    pageName: NAV_MAP[page] || page,
    searchFrom: searchFrom || resultFrom || 'Kigali (KGL)',
    searchTo: searchTo || resultTo || '',
    hasResults: !!(typeof lastSearchData !== 'undefined' && lastSearchData && lastSearchData.outbound),
    hasSelectedFlight: !!(typeof selectedOutbound !== 'undefined' && selectedOutbound),
    currency: currentCurrency,
    country: currentCountry,
    language: currentLanguage,
    recentActions: chatRecentActions.slice(-5)
  };
}

function getPageFriendlyName(page) {
  var names = {
    home: 'the booking page', destinations: 'our destinations', travelinfo: 'travel information',
    loyalty: 'DreamMiles loyalty program', cargo: 'cargo services', help: 'the help center',
    results: 'flight search results', booking: 'the booking form',
    confirmation: 'your booking confirmation', manage: 'manage booking',
    checkin: 'online check-in', status: 'flight status', about: 'about RwandAir'
  };
  return names[page] || page;
}

function getContextGreeting() {
  var ctx = getChatContext();
  var page = ctx.currentPage;
  var dest = ctx.searchTo;

  if (page === 'results' && dest) {
    var destName = dest.replace(/\s*\([A-Z]{3}\)/, '');
    return "I see you're comparing flights to <strong>" + destName + "</strong>. I can help you pick the best option — just ask about fares, schedules, or baggage!";
  }
  if (page === 'destinations') {
    return "Browsing our destinations? I can tell you about any route, suggest the best deals, or help you book right away!";
  }
  if (page === 'booking') {
    return "I see you're filling in your booking. Need help with seat selection, extra baggage, or meal preferences? Just ask!";
  }
  if (page === 'confirmation') {
    return "Congratulations on your booking! I can share travel tips for your destination, or help with anything else.";
  }
  if (page === 'loyalty') {
    return "Exploring DreamMiles? I can explain how to earn and redeem miles, check tier benefits, or help you enroll!";
  }
  if (page === 'cargo') {
    return "Looking at cargo services? I can help you get a shipping quote, track a shipment, or explain our cargo options.";
  }
  if (page === 'travelinfo') {
    return "Need travel info? I can answer questions about baggage, visas, special assistance, or anything else for your trip.";
  }
  if (page === 'checkin') {
    return "Ready to check in? I can walk you through the process — you'll need your booking reference and passport details.";
  }
  if (page === 'status') {
    return "Checking flight status? Give me a flight number like <strong>WB-435</strong> and I'll look it up for you!";
  }
  return null;
}

function updateChatContextBar() {
  var bar = document.getElementById('chatContextBar');
  if (!bar) return;
  var ctx = getChatContext();
  var pageName = getPageFriendlyName(ctx.currentPage);
  var parts = ['📍 ' + pageName.charAt(0).toUpperCase() + pageName.slice(1)];
  if (ctx.searchTo && (ctx.currentPage === 'results' || ctx.currentPage === 'booking')) {
    parts.push('✈ ' + ctx.searchTo.replace(/\s*\([A-Z]{3}\)/, ''));
  }
  parts.push('💱 ' + ctx.currency);
  bar.textContent = parts.join('  ·  ');
}

function toggleChat() {
  const win = document.getElementById('chatWindow');
  const fab = document.getElementById('chatFab');
  win.classList.toggle('hidden');
  if (!win.classList.contains('hidden')) {
    const badge = document.getElementById('chatBadgeCount');
    if (badge) badge.style.display = 'none';
    document.getElementById('chatInput').focus();

    // Update context bar
    updateChatContextBar();

    // Proactive context-aware greeting when page has changed
    var currentPage = getCurrentPageId();
    if (_lastChatContextPage !== currentPage) {
      _lastChatContextPage = currentPage;
      var greeting = getContextGreeting();
      if (greeting) {
        setTimeout(function() {
          addBotMsg(greeting);
        }, 400);
      }
    }
  }
}

function openChat() { document.getElementById('chatWindow').classList.remove('hidden'); }

function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  addChatMessage(msg, 'user');
  input.value = '';
  const qr = document.getElementById('chatQuickReplies');
  if (qr) qr.remove();
  showTypingIndicator();
  setTimeout(() => {
    hideTypingIndicator();
    processUserMessage(msg);
  }, 800 + Math.random() * 700);
}

function chatQuickReply(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

function addChatMessage(text, sender) {
  const body = document.getElementById('chatBody');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + sender;
  div.innerHTML = '<div class="chat-bubble">' + text + '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function addBotMsg(html, actions) {
  const body = document.getElementById('chatBody');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  let actionsHtml = '';
  if (actions && actions.length) {
    actionsHtml = '<div class="chat-actions">' + actions.map(a =>
      '<button class="chat-action-btn" onclick="' + a.onclick + '">' + a.label + '</button>'
    ).join('') + '</div>';
  }
  div.innerHTML = '<div class="chat-bubble">' + html + actionsHtml + '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function addBotMsgWide(html, actions) {
  const body = document.getElementById('chatBody');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  let actionsHtml = '';
  if (actions && actions.length) {
    actionsHtml = '<div class="chat-actions">' + actions.map(a =>
      '<button class="chat-action-btn" onclick="' + a.onclick + '">' + a.label + '</button>'
    ).join('') + '</div>';
  }
  div.innerHTML = '<div class="chat-bubble chat-bubble-wide">' + html + actionsHtml + '</div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function showTypingIndicator() {
  const body = document.getElementById('chatBody');
  const existing = document.getElementById('chatTyping');
  if (existing) return;
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.id = 'chatTyping';
  div.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function hideTypingIndicator() {
  const t = document.getElementById('chatTyping');
  if (t) t.remove();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function extractCities(msg) {
  const lower = msg.toLowerCase();
  const found = [];
  // Sort keys by length descending so longer names match first
  const keys = Object.keys(CITY_MAP).sort((a,b) => b.length - a.length);
  for (const key of keys) {
    const idx = lower.indexOf(key);
    if (idx !== -1 && !found.some(f => f.value === CITY_MAP[key])) {
      found.push({ value: CITY_MAP[key], pos: idx });
    }
    if (found.length >= 2) break;
  }
  // Sort by position in message to preserve user's from→to order
  found.sort((a, b) => a.pos - b.pos);
  return found.map(f => f.value);
}

function extractDate(msg) {
  const lower = msg.toLowerCase();
  const today = new Date();
  if (lower.includes('tomorrow')) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i]) || lower.includes('next ' + days[i])) {
      const d = new Date(today);
      let diff = i - d.getDay();
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }
  // Try date patterns like "march 15", "15 march", "15/03"
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  for (let m = 0; m < months.length; m++) {
    const re = new RegExp(months[m] + '\\s+(\\d{1,2})|(\\d{1,2})\\s+' + months[m]);
    const match = lower.match(re);
    if (match) {
      const day = parseInt(match[1] || match[2]);
      const d = new Date(today.getFullYear(), m, day);
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    }
  }
  // ISO date
  const iso = msg.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  // dd/mm format
  const ddmm = msg.match(/(\d{1,2})\/(\d{1,2})/);
  if (ddmm) {
    const d = new Date(today.getFullYear(), parseInt(ddmm[2])-1, parseInt(ddmm[1]));
    if (d < today) d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  }
  return null;
}

function extractNumber(msg) {
  const m = msg.match(/(\d+)\s*(adult|passenger|pax|people|person|traveller)/i);
  if (m) return parseInt(m[1]);
  const n = msg.match(/\b(\d+)\b/);
  return n ? parseInt(n[1]) : null;
}

function extractCabin(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('business')) return 'Business';
  if (lower.includes('economy') || lower.includes('coach')) return 'Economy';
  return null;
}

function extractWeight(msg) {
  const m = msg.match(/(\d+\.?\d*)\s*kg/i);
  return m ? parseFloat(m[1]) : null;
}

function processUserMessage(msg) {
  const lower = msg.toLowerCase();
  const cities = extractCities(msg);
  const date = extractDate(msg);
  const num = extractNumber(msg);
  const cabin = extractCabin(msg);
  const weight = extractWeight(msg);

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup)/i.test(lower) && !chatCtx.intent) {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetings = [
      timeGreet + "! I'm your RwandAir AI assistant. I can help you book flights, track shipments, check flight status, and more. What can I do for you today?",
      "Hey there! Welcome to RwandAir. Whether you're planning a trip or need help with an existing booking, I'm here to help. What are you looking for?",
      timeGreet + "! I'd love to help you plan your next journey with RwandAir. You can tell me where you'd like to go, or ask me anything about our services."
    ];
    addBotMsg(greetings[Math.floor(Math.random() * greetings.length)], [
      {label:'Book a flight', onclick:"chatQuickReply('Book a flight')"},
      {label:'Ship cargo', onclick:"chatQuickReply('Ship cargo')"},
      {label:'Flight status', onclick:"chatQuickReply('Check flight status')"}
    ]);
    return;
  }

  // Cargo / Freight intent
  if ((lower.includes('cargo') || lower.includes('ship') || lower.includes('freight') || lower.includes('package') || lower.includes('parcel')) && chatCtx.intent !== 'book_flight') {
    chatCtx.intent = 'cargo';
    if (cities.length >= 1 || weight) {
      const dest = cities.length >= 2 ? cities[1] : cities[0] || '';
      let reply = "Absolutely, I can help with that! I'll set you up on our cargo booking page where you can fill in the shipment details.";
      if (weight) reply += " I've noted your package weighs around <strong>" + weight + " kg</strong> — that'll be pre-filled for you.";
      addBotMsg(reply, [
        {label:'Open Cargo Booking', onclick:"navigateTo('cargo');toggleChat()"},
        {label:'Get a quote', onclick:"chatQuickReply('How much to ship to " + (dest||'Nairobi') + "?')"}
      ]);
    } else {
      addBotMsg("Sure thing! I can help you with cargo shipping. Where would you like to send your shipment? Or if you prefer, I can take you straight to our cargo booking page.", [
        {label:'Open Cargo Page', onclick:"navigateTo('cargo');toggleChat()"},
        {label:'Get cargo quote', onclick:"chatQuickReply('Ship 50kg cargo to Nairobi')"}
      ]);
    }
    return;
  }

  // Flight status
  if (lower.includes('status') || lower.includes('track flight') || lower.includes('flight status')) {
    addBotMsg("Of course! To look up your flight status, I'll need the flight number (like <strong>WB-435</strong>) or the route and travel date. You can also check it on our dedicated Flight Status page.", [
      {label:'Go to Flight Status', onclick:"navigateTo('status');toggleChat()"}
    ]);
    return;
  }

  // Check-in
  if (lower.includes('check-in') || lower.includes('check in') || lower.includes('checkin')) {
    addBotMsg("Great — online check-in opens <strong>24 hours</strong> before your flight and closes <strong>3 hours</strong> before departure. You'll need your booking reference and passport details handy. Want me to take you there?", [
      {label:'Online Check-in', onclick:"navigateTo('checkin');toggleChat()"}
    ]);
    return;
  }

  // Baggage
  if (lower.includes('bag') || lower.includes('luggage') || lower.includes('baggage')) {
    addBotMsg("Here's a quick breakdown of our baggage allowances:<br><br>&bull; <strong>Economy Lite:</strong> 7 kg hand baggage only<br>&bull; <strong>Economy Classic:</strong> 7 kg hand + 1 &times; 23 kg checked<br>&bull; <strong>Business Class:</strong> 7 kg hand + 2 &times; 32 kg checked<br><br>If you need extra baggage, you can add it during booking or reach out to our team. Would you like to know anything else?");
    return;
  }

  // Refund / Cancel
  if (lower.includes('refund') || lower.includes('cancel')) {
    addBotMsg("I understand — refund eligibility depends on your fare type:<br><br>&bull; <strong>Business:</strong> Fully refundable<br>&bull; <strong>Economy Classic:</strong> Refundable with a small fee<br>&bull; <strong>Economy Lite:</strong> Non-refundable<br><br>If you'd like to proceed, share your booking reference and I'll guide you through it.", [
      {label:'Manage Booking', onclick:"navigateTo('manage');toggleChat()"}
    ]);
    return;
  }

  // Multi-city booking intent detection
  if (lower.includes('multi-city') || lower.includes('multicity') || lower.includes('multi city') || lower.includes('multiple cities') || lower.includes('multiple destinations')) {
    chatCtx.intent = 'book_multicity';
    chatCtx.step = 'mc_ask_legs';
    chatCtx.data = { mcLegs: [{ from: '', to: '', date: '' }], currentLeg: 0 };
    return handleMulticityChat(msg, cities, date);
  }

  // Continue multi-city flow if already in it
  if (chatCtx.intent === 'book_multicity') {
    return handleMulticityChat(msg, cities, date);
  }

  // Booking intent detection
  if (lower.includes('book') || lower.includes('fly') || lower.includes('flight') || lower.includes('travel') || cities.length > 0 || chatCtx.intent === 'book_flight') {
    if (!chatCtx.intent) chatCtx.intent = 'book_flight';
    if (chatCtx.intent !== 'book_flight') chatCtx.intent = 'book_flight';
    return handleBookingChat(msg, cities, date, num, cabin);
  }

  // DreamMiles / Loyalty
  if (lower.includes('miles') || lower.includes('loyalty') || lower.includes('dreammiles') || lower.includes('points')) {
    addBotMsg("Great question! With <strong>DreamMiles</strong>, you earn miles on every RwandAir flight — and you can redeem them for free flights, cabin upgrades, excess baggage, and more. It's free to join and your miles start accumulating from your very first flight.", [
      {label:'Explore DreamMiles', onclick:"navigateTo('loyalty');toggleChat()"}
    ]);
    return;
  }

  // Thank you / appreciation
  if (/^(thanks|thank you|thx|cheers|appreciate)/i.test(lower)) {
    const thanks = [
      "You're welcome! Is there anything else I can help you with?",
      "Happy to help! Let me know if there's anything else you need.",
      "Anytime! Feel free to ask if you have more questions."
    ];
    addBotMsg(thanks[Math.floor(Math.random() * thanks.length)]);
    return;
  }

  // ---- CONTEXT-AWARE RESPONSES ----
  var ctx = getChatContext();

  // "What is this?" / "Where am I?" / "What can I do here?"
  if (/what.*(is this|page|can i do|do here)|where am i|help me understand/i.test(lower)) {
    var pageName = getPageFriendlyName(ctx.currentPage);
    var pageHelp = {
      home: "This is our <strong>flight search</strong> page. You can search for flights by entering your destination, dates, and number of passengers. Try searching for a route, or I can help you find the best deals!",
      destinations: "You're browsing our <strong>destination network</strong> — all the cities RwandAir flies to from Kigali. Click any destination to open a quick booking widget, or ask me about a specific city!",
      results: "You're viewing <strong>flight search results</strong>" + (ctx.searchTo ? " for flights to <strong>" + ctx.searchTo.replace(/\s*\([A-Z]{3}\)/,'') + "</strong>" : "") + ". Each card shows a package with outbound and return flights. Compare fares across Lite, Classic, and Business — I can explain the differences!",
      booking: "You're on the <strong>booking page</strong> filling in passenger details and selecting extras like seats, baggage, and meals. Let me know if you need help with any section!",
      confirmation: "This is your <strong>booking confirmation</strong>. You should have received a confirmation email. Save your booking reference for check-in and future changes.",
      travelinfo: "This page has <strong>essential travel information</strong> — baggage rules, travel documents, special assistance, and airport guides. Ask me about anything specific!",
      loyalty: "Welcome to <strong>DreamMiles</strong>, our loyalty program! You earn miles on every flight and can redeem them for free tickets, upgrades, and more. Want to know how many miles you'd earn on a specific route?",
      cargo: "This is our <strong>cargo services</strong> page. You can book shipments, track packages, and get quotes. Tell me what you'd like to ship and where!",
      checkin: "This is <strong>online check-in</strong>. You can check in between 24 hours and 3 hours before departure. You'll need your booking reference and last name.",
      status: "Use this page to <strong>check flight status</strong>. Enter a flight number (like WB-435) or select a route to see real-time departure and arrival info.",
      help: "This is our <strong>help center</strong> with FAQs and contact information. But you've got me right here — just ask your question and I'll do my best to answer!",
      manage: "Here you can <strong>manage your booking</strong> — view details, change flights, add extras, or request a refund. Enter your booking reference to get started."
    };
    addBotMsg(pageHelp[ctx.currentPage] || "You're on " + pageName + ". How can I help you here?");
    return;
  }

  // "Which is better?" / "Compare" on results page
  if (ctx.currentPage === 'results' && /which.*(better|best|cheaper|cheapest)|compare|difference.*(lite|classic|business)|recommend/i.test(lower)) {
    addBotMsg("Great question! Here's a quick comparison of our fare families:<br><br>" +
      "✈ <strong>Lite</strong> — Best price, hand baggage only (7 kg). No changes or refunds. Perfect for light travelers.<br><br>" +
      "✈ <strong>Classic</strong> — Our most popular! Includes 1 × 23 kg checked bag, meals, and free date changes. Great value for most trips.<br><br>" +
      "✈ <strong>Business</strong> — Premium experience with 2 × 32 kg bags, lounge access, priority boarding, gourmet meals, and full flexibility.<br><br>" +
      "For most travelers, I'd recommend <strong>Classic</strong> — it strikes the best balance of price and comfort. Want me to help you select a specific package?");
    return;
  }

  // Price question on results page
  if (ctx.currentPage === 'results' && /cheap|price|cost|how much|afford|budget/i.test(lower)) {
    var dest = ctx.searchTo ? ctx.searchTo.replace(/\s*\([A-Z]{3}\)/,'') : 'your destination';
    addBotMsg("I can see the results for flights to <strong>" + dest + "</strong>. The packages are sorted with the best deals at the top. Look for the <strong>Cheapest</strong> badge — that's the lowest combined price for outbound and return.<br><br>💡 <strong>Pro tip:</strong> Flying mid-week (Tue/Wed) is often 10-20% cheaper than weekend flights!", [
      {label: 'Sort by cheapest', onclick: "sortResults('cheapest')"}
    ]);
    return;
  }

  // Context-aware suggestions based on current page
  if (ctx.currentPage === 'destinations' && !chatCtx.intent) {
    addBotMsg("I see you're exploring our destinations! Our most popular routes from Kigali are:<br><br>" +
      "🌟 <strong>Nairobi</strong> — Daily flights, from RWF 246,575<br>" +
      "🌟 <strong>Dubai</strong> — Daily flights, from RWF 575,342<br>" +
      "🌟 <strong>Lagos</strong> — 4× weekly, from RWF 465,753<br><br>" +
      "Click any destination card to instantly search flights, or tell me where you'd like to go!", [
      {label: 'Fly to Nairobi', onclick: "selectDestination('Nairobi');toggleChat()"},
      {label: 'Fly to Dubai', onclick: "selectDestination('Dubai');toggleChat()"}
    ]);
    return;
  }

  if (ctx.currentPage === 'booking' && /seat|window|aisle|front|extra.*leg/i.test(lower)) {
    addBotMsg("For seat selection:<br><br>" +
      "🪟 <strong>Window seats</strong> — Great for views and resting, rows 1-5 in business<br>" +
      "🚶 <strong>Aisle seats</strong> — Easy access, ideal for longer flights<br>" +
      "🦵 <strong>Extra legroom</strong> — Exit row seats (rows 12-13) for more space<br><br>" +
      "You can select your preferred seat in the 'Seat Selection' section of the booking form. Would you like tips on the best seats for your route?");
    return;
  }

  // Default helpful response — now context-aware
  var pageTip = '';
  if (ctx.currentPage === 'results') {
    pageTip = " I notice you're looking at flight results — try asking me to compare fares or find the cheapest option!";
  } else if (ctx.currentPage === 'destinations') {
    pageTip = " You're browsing destinations — tell me a city name and I'll help you search for flights!";
  }

  const defaults = [
    "I'm not quite sure I understood that." + pageTip + " Here are some things I can help with:",
    "Hmm, I didn't quite catch that." + pageTip + " I can assist with:",
    "I want to make sure I help you with the right thing." + pageTip + " Here's what I can do:"
  ];
  addBotMsg(defaults[Math.floor(Math.random() * defaults.length)], [
    {label:'Book a flight', onclick:"chatQuickReply('Book a flight')"},
    {label:'Ship cargo', onclick:"chatQuickReply('Ship cargo')"},
    {label:'Baggage info', onclick:"chatQuickReply('Baggage info')"},
    {label:'Check-in', onclick:"chatQuickReply('Check-in help')"}
  ]);
}

// ---- CHAT BOOKING HELPERS ----

function chatExtractCode(display) {
  const m = display.match(/\(([A-Z]{3})\)/);
  return m ? m[1] : '';
}

function chatGetUniqueCities() {
  const seen = new Set();
  const cities = [];
  for (const [key, val] of Object.entries(CITY_MAP)) {
    if (key.length <= 3) continue; // skip airport codes, keep city names only
    if (!seen.has(val)) { seen.add(val); cities.push(val); }
  }
  return cities;
}

function renderCityPicker(field) {
  return '<div class="chat-city-picker">' +
    '<input type="text" class="chat-city-input" id="chatCityInput_' + field + '" ' +
    'placeholder="Type a city or airport code..." ' +
    'oninput="chatCityAutosuggest(this.value,\'' + field + '\')" ' +
    'autocomplete="off" />' +
    '<div class="chat-city-suggestions" id="chatCitySugg_' + field + '"></div>' +
    '</div>';
}

function chatCityAutosuggest(query, field) {
  const container = document.getElementById('chatCitySugg_' + field);
  if (!container) return;
  const q = query.toLowerCase().trim();
  if (q.length < 1) { container.innerHTML = ''; return; }

  const allCities = chatGetUniqueCities();
  const matches = allCities.filter(c => c.toLowerCase().includes(q));

  container.innerHTML = matches.slice(0, 6).map(city => {
    const code = chatExtractCode(city);
    const name = city.replace(/\s*\([A-Z]{3}\)/, '');
    return '<div class="chat-city-item" onclick="chatSelectCity(\'' + city + '\',\'' + code + '\',\'' + field + '\')">' +
      '<span>' + name + '</span><span class="chat-city-code">' + code + '</span></div>';
  }).join('');

  // Also fetch from server for broader results
  fetch('/api/airports?q=' + encodeURIComponent(q))
    .then(r => r.json())
    .then(airports => {
      const existing = new Set(matches.map(c => chatExtractCode(c)));
      const extra = airports.filter(a => !existing.has(a.code)).slice(0, 3);
      if (extra.length) {
        container.innerHTML += extra.map(a => {
          const display = a.city + ' (' + a.code + ')';
          return '<div class="chat-city-item" onclick="chatSelectCity(\'' + display + '\',\'' + a.code + '\',\'' + field + '\')">' +
            '<span>' + a.city + '</span><span class="chat-city-code">' + a.code + '</span></div>';
        }).join('');
      }
    }).catch(() => {});
}

function chatSelectCity(display, code, field) {
  const d = chatCtx.data;
  d[field] = display;
  d[field + 'Code'] = code;
  addChatMessage(display, 'user');
  showTypingIndicator();
  setTimeout(() => {
    hideTypingIndicator();
    handleBookingChat('', [], null, null, null);
  }, 400);
}

function chatSetInputDisabled(disabled) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.disabled = disabled;
    input.placeholder = disabled ? 'Please complete the form above...' : 'Type a message...';
  }
}

// ---- CHAT FLIGHT SEARCH & RESULTS ----

function chatSearchFlights() {
  const d = chatCtx.data;
  const fromCode = d.fromCode || chatExtractCode(d.from);
  const toCode = d.toCode || chatExtractCode(d.to);

  showTypingIndicator();

  fetch('/api/flights/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: fromCode,
      destination: toCode,
      departDate: d.date,
      adults: d.passengers || 1,
      cabin: (d.cabin || 'Economy').toLowerCase(),
      tripType: 'oneway'
    })
  })
  .then(r => r.json())
  .then(result => {
    hideTypingIndicator();
    if (!result.outbound || result.outbound.length === 0) {
      addBotMsg("Sorry, no flights found for this route and date. Try a different date?", [
        { label: 'Start Over', onclick: "chatResetBooking()" }
      ]);
      return;
    }
    d.flights = result.outbound;
    chatCtx.step = 'select_flight';

    let cardsHtml = '<div class="chat-flights-list">';
    result.outbound.forEach((f, i) => {
      cardsHtml += '<div class="chat-flight-card" onclick="chatSelectFlight(' + i + ')">';
      if (f.isBestValue) cardsHtml += '<div class="chat-flight-badge">Best Value</div>';
      cardsHtml += '<div class="chat-flight-top">' +
        '<div class="chat-flight-times"><span>' + f.departure + '</span>' +
        '<span class="chat-flight-arrow">&rarr;</span><span>' + f.arrival + '</span></div>' +
        '<div class="chat-flight-price">' + f.fare.label + '</div></div>' +
        '<div class="chat-flight-info">' + f.flightNumber + ' &middot; ' + f.duration +
        ' &middot; ' + (f.stops === 0 ? 'Direct' : f.stops + ' stop') +
        ' &nbsp; <span class="chat-flight-seats">' + f.seatsLeft + ' seats left</span></div>' +
        '</div>';
    });
    cardsHtml += '</div>';

    const count = result.outbound.length;
    const resultMsgs = [
      "Here's what I found — <strong>" + count + " flights</strong> available from " + d.from + " to " + d.to + ". Tap any flight to see the fare options:",
      "Good news! I found <strong>" + count + " flights</strong> on your route. The prices shown include taxes. Pick one to see more details:",
      "I've got <strong>" + count + " options</strong> for you! Here are the available flights — tap the one that works best:"
    ];
    addBotMsgWide(resultMsgs[Math.floor(Math.random() * resultMsgs.length)] + cardsHtml);
  })
  .catch(() => {
    hideTypingIndicator();
    addBotMsg("Sorry, there was an error searching for flights. Please try again.", [
      { label: 'Retry', onclick: "chatSearchFlights()" },
      { label: 'Start Over', onclick: "chatResetBooking()" }
    ]);
  });
}

function chatSelectFlight(index) {
  const d = chatCtx.data;
  const flight = d.flights[index];
  d.selectedFlight = flight;
  chatCtx.step = 'select_fare';

  addChatMessage(flight.departure + ' → ' + flight.arrival + ' (' + flight.flightNumber + ')', 'user');

  // Calculate fare variants: Lite (0.82x), Classic (1.0x), Business (3.2x of economy base)
  const baseFare = flight.fare.base;
  const taxRate = 0.18;
  const fares = {
    lite: { base: Math.round(baseFare * 0.82), features: ['7kg hand baggage only', 'No changes allowed', 'No refund'] },
    classic: { base: baseFare, features: ['1x 23kg checked bag', 'Free date changes', 'Meal included'] },
    flex: { base: Math.round(baseFare * 1.35), features: ['2x 23kg checked bags', 'Free changes & cancel', 'Meal + seat selection', 'Priority boarding'] }
  };

  Object.keys(fares).forEach(k => {
    fares[k].tax = Math.round(fares[k].base * taxRate);
    fares[k].total = fares[k].base + fares[k].tax;
    fares[k].label = 'RWF ' + fares[k].total.toLocaleString();
  });
  d.fareOptions = fares;

  showTypingIndicator();
  setTimeout(() => {
    hideTypingIndicator();
    let html = '<strong>' + flight.flightNumber + '</strong> &middot; ' + flight.departure + ' → ' + flight.arrival +
      '<br><span style="font-size:11px;color:var(--gray-500)">' + flight.duration + ' &middot; ' + flight.aircraft + '</span>';
    html += '<div class="chat-fare-options">';

    html += '<div class="chat-fare-option" onclick="chatSelectFare(\'lite\')">' +
      '<div class="chat-fare-head"><span class="chat-fare-name">Lite</span><span class="chat-fare-price">' + fares.lite.label + '</span></div>' +
      '<ul class="chat-fare-features">' + fares.lite.features.map(f => '<li>' + f + '</li>').join('') + '</ul></div>';

    html += '<div class="chat-fare-option chat-fare-recommended" onclick="chatSelectFare(\'classic\')">' +
      '<div class="chat-fare-tag">Recommended</div>' +
      '<div class="chat-fare-head"><span class="chat-fare-name">Classic</span><span class="chat-fare-price">' + fares.classic.label + '</span></div>' +
      '<ul class="chat-fare-features">' + fares.classic.features.map(f => '<li>' + f + '</li>').join('') + '</ul></div>';

    html += '<div class="chat-fare-option" onclick="chatSelectFare(\'flex\')">' +
      '<div class="chat-fare-head"><span class="chat-fare-name">Flex</span><span class="chat-fare-price">' + fares.flex.label + '</span></div>' +
      '<ul class="chat-fare-features">' + fares.flex.features.map(f => '<li>' + f + '</li>').join('') + '</ul></div>';

    html += '</div>';
    addBotMsgWide("Here are your fare options for this flight. Each one comes with different flexibility and perks — pick the one that suits you best:" + html);
  }, 500);
}

function chatSelectFare(fareType) {
  const d = chatCtx.data;
  d.selectedFare = fareType;
  const fare = d.fareOptions[fareType];
  d.selectedFareObj = {
    base: fare.base, tax: fare.tax, total: fare.total,
    totalAllPax: fare.total * (d.passengers || 1),
    currency: 'RWF', label: fare.label,
    labelTotal: 'RWF ' + (fare.total * (d.passengers || 1)).toLocaleString()
  };

  addChatMessage(fareType.charAt(0).toUpperCase() + fareType.slice(1) + ' — ' + fare.label, 'user');
  showTypingIndicator();

  // Hold the flight
  const holdFlight = { ...d.selectedFlight, fare: d.selectedFareObj };
  fetch('/api/bookings/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outboundFlight: holdFlight,
      passengers: d.passengers || 1,
      cabin: (d.cabin || 'economy').toLowerCase()
    })
  })
  .then(r => r.json())
  .then(result => {
    hideTypingIndicator();
    d.holdRef = result.holdRef;
    d.holdExpiry = result.expiresAt;
    chatCtx.step = 'pax_details';
    d.paxList = [];
    d.currentPax = 0;

    addBotMsg("Excellent choice! I've reserved your seat for the next <strong>15 minutes</strong>. Now I just need a few details about the passenger" + ((d.passengers || 1) > 1 ? 's' : '') + " to complete the booking.");
    setTimeout(() => chatRenderPaxForm(), 600);
  })
  .catch(() => {
    hideTypingIndicator();
    addBotMsg("Sorry, couldn't hold this flight. Please try again.", [
      { label: 'Retry', onclick: "chatSelectFare('" + fareType + "')" },
      { label: 'Start Over', onclick: "chatResetBooking()" }
    ]);
  });
}

// ---- PASSENGER DETAILS FORM ----

function chatRenderPaxForm() {
  const d = chatCtx.data;
  const paxNum = d.currentPax + 1;
  const total = d.passengers || 1;
  chatSetInputDisabled(true);

  const html = '<div class="chat-form" id="chatPaxForm">' +
    '<div class="chat-form-title">Passenger ' + paxNum + ' of ' + total + '</div>' +
    '<select class="chat-input" id="chatPaxTitle">' +
    '<option value="">Title</option><option>Mr</option><option>Mrs</option><option>Ms</option><option>Miss</option></select>' +
    '<div class="chat-form-row">' +
    '<input class="chat-input" id="chatPaxFirst" placeholder="First name" />' +
    '<input class="chat-input" id="chatPaxLast" placeholder="Last name" /></div>' +
    '<input class="chat-input" id="chatPaxDob" type="date" placeholder="Date of birth" />' +
    '<input class="chat-input" id="chatPaxPassport" placeholder="Passport number" />' +
    '<div class="chat-form-error" id="chatPaxError" style="display:none"></div>' +
    '<button class="chat-form-btn" onclick="chatSubmitPax()">Continue</button>' +
    '</div>';
  addBotMsgWide(html);
}

function chatSubmitPax() {
  const title = document.getElementById('chatPaxTitle').value;
  const first = document.getElementById('chatPaxFirst').value.trim();
  const last = document.getElementById('chatPaxLast').value.trim();
  const dob = document.getElementById('chatPaxDob').value;
  const passport = document.getElementById('chatPaxPassport').value.trim();
  const errEl = document.getElementById('chatPaxError');

  if (!title || !first || !last) {
    errEl.textContent = 'Please fill in title, first name and last name.';
    errEl.style.display = 'block';
    return;
  }

  const d = chatCtx.data;
  d.paxList.push({ title, firstName: first, lastName: last, dob, passport });
  addChatMessage(title + ' ' + first + ' ' + last, 'user');

  d.currentPax++;
  if (d.currentPax < (d.passengers || 1)) {
    showTypingIndicator();
    setTimeout(() => { hideTypingIndicator(); chatRenderPaxForm(); }, 500);
  } else {
    chatCtx.step = 'contact';
    showTypingIndicator();
    setTimeout(() => { hideTypingIndicator(); chatRenderContactForm(); }, 500);
  }
}

// ---- CONTACT DETAILS FORM ----

function chatRenderContactForm() {
  chatSetInputDisabled(true);
  const html = '<div class="chat-form" id="chatContactForm">' +
    '<div class="chat-form-title">Contact Information</div>' +
    '<input class="chat-input" id="chatContactEmail" type="email" placeholder="Email address" />' +
    '<input class="chat-input" id="chatContactPhone" type="tel" placeholder="Phone (+250...)" />' +
    '<div class="chat-form-error" id="chatContactError" style="display:none"></div>' +
    '<button class="chat-form-btn" onclick="chatSubmitContact()">Continue to Payment</button>' +
    '</div>';
  addBotMsgWide("You're almost there! I just need your contact details so we can send you the booking confirmation and any flight updates." + html);
}

function chatSubmitContact() {
  const email = document.getElementById('chatContactEmail').value.trim();
  const phone = document.getElementById('chatContactPhone').value.trim();
  const errEl = document.getElementById('chatContactError');

  if (!email || !email.includes('@')) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block';
    return;
  }
  if (!phone) {
    errEl.textContent = 'Please enter a phone number.';
    errEl.style.display = 'block';
    return;
  }

  const d = chatCtx.data;
  d.contact = { email, phone };
  addChatMessage(email, 'user');
  chatCtx.step = 'payment';
  showTypingIndicator();
  setTimeout(() => { hideTypingIndicator(); chatRenderPaymentForm(); }, 500);
}

// ---- PAYMENT FORM ----

function chatRenderPaymentForm() {
  const d = chatCtx.data;
  const flight = d.selectedFlight;
  const fare = d.selectedFareObj;
  chatSetInputDisabled(true);

  let summary;
  if (d.mcLegs && d.mcLegs.length > 0) {
    // Multi-city summary
    summary = '<div class="chat-pay-summary">';
    d.mcLegs.forEach((l, i) => {
      const fl = d.mcSelectedFlights[i];
      summary += '<div style="margin-bottom:4px">' + fl.flightNumber + ': ' + l.from + ' &rarr; ' + l.to +
        ' &middot; ' + fl.departure + ' &mdash; ' + fl.arrival + '</div>';
    });
    summary += '<strong>Total: ' + fare.labelTotal + '</strong></div>';
  } else {
    summary = '<div class="chat-pay-summary">' +
      flight.flightNumber + ': ' + d.from + ' &rarr; ' + d.to + '<br>' +
      flight.departure + ' &mdash; ' + flight.arrival + ' &middot; ' + flight.duration + '<br>' +
      '<strong>Total: ' + fare.labelTotal + '</strong></div>';
  }

  const html = '<div class="chat-form" id="chatPaymentForm">' +
    '<div class="chat-form-title">Payment</div>' +
    summary +
    '<div class="chat-pay-methods">' +
    '<button class="chat-pay-method active" id="chatPayCard" onclick="chatPayMethod(\'card\')">Card</button>' +
    '<button class="chat-pay-method" id="chatPayMomo" onclick="chatPayMethod(\'momo\')">Mobile Money</button>' +
    '</div>' +
    '<div id="chatPayFields">' +
    '<input class="chat-input" id="chatCardNumber" placeholder="Card number" maxlength="19" />' +
    '<div class="chat-form-row">' +
    '<input class="chat-input" id="chatCardExpiry" placeholder="MM/YY" maxlength="5" />' +
    '<input class="chat-input" id="chatCardCvv" placeholder="CVV" maxlength="4" type="password" /></div>' +
    '<input class="chat-input" id="chatCardName" placeholder="Name on card" />' +
    '</div>' +
    '<div class="chat-form-error" id="chatPayError" style="display:none"></div>' +
    '<button class="chat-form-btn" onclick="chatSubmitPayment()">Pay &amp; Confirm Booking</button>' +
    '</div>';
  addBotMsgWide(html);
}

function chatPayMethod(method) {
  const cardBtn = document.getElementById('chatPayCard');
  const momoBtn = document.getElementById('chatPayMomo');
  const fields = document.getElementById('chatPayFields');

  if (method === 'card') {
    cardBtn.classList.add('active'); momoBtn.classList.remove('active');
    fields.innerHTML = '<input class="chat-input" id="chatCardNumber" placeholder="Card number" maxlength="19" />' +
      '<div class="chat-form-row">' +
      '<input class="chat-input" id="chatCardExpiry" placeholder="MM/YY" maxlength="5" />' +
      '<input class="chat-input" id="chatCardCvv" placeholder="CVV" maxlength="4" type="password" /></div>' +
      '<input class="chat-input" id="chatCardName" placeholder="Name on card" />';
  } else {
    momoBtn.classList.add('active'); cardBtn.classList.remove('active');
    fields.innerHTML = '<select class="chat-input" id="chatMomoProvider">' +
      '<option value="">Select provider</option>' +
      '<option>MTN Mobile Money</option><option>Airtel Money</option></select>' +
      '<input class="chat-input" id="chatMomoPhone" type="tel" placeholder="Mobile Money number" />';
  }
  chatCtx.data.paymentMethod = method;
}

function chatSubmitPayment() {
  const d = chatCtx.data;
  const errEl = document.getElementById('chatPayError');
  const method = d.paymentMethod || 'card';

  if (method === 'card') {
    const num = (document.getElementById('chatCardNumber') || {}).value || '';
    const exp = (document.getElementById('chatCardExpiry') || {}).value || '';
    const name = (document.getElementById('chatCardName') || {}).value || '';
    if (num.replace(/\s/g, '').length < 13 || !exp || !name.trim()) {
      errEl.textContent = 'Please fill in all card details.';
      errEl.style.display = 'block';
      return;
    }
  } else {
    const provider = (document.getElementById('chatMomoProvider') || {}).value || '';
    const phone = (document.getElementById('chatMomoPhone') || {}).value || '';
    if (!provider || !phone) {
      errEl.textContent = 'Please select a provider and enter your number.';
      errEl.style.display = 'block';
      return;
    }
  }

  chatSetInputDisabled(true);
  chatCtx.step = 'confirm';

  addBotMsgWide('<div class="chat-processing"><div class="chat-spinner"></div> Processing your booking...</div>');

  fetch('/api/bookings/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      holdRef: d.holdRef,
      passengerDetails: d.paxList,
      contactDetails: d.contact
    })
  })
  .then(r => r.json())
  .then(booking => {
    d.booking = booking;
    chatCtx.step = 'done';

    const ticketHtml = (booking.etickets || []).map(t =>
      '<div>' + t.number + ' &middot; ' + t.passenger + ' &middot; Seat ' + t.seat + '</div>'
    ).join('');

    let routeHtml;
    if (d.mcLegs && d.mcLegs.length > 0) {
      routeHtml = d.mcLegs.map((l, i) => {
        const fl = d.mcSelectedFlights[i];
        return '<div>' + l.from + ' &rarr; ' + l.to + ' &middot; ' + fl.flightNumber + '</div>';
      }).join('');
    } else {
      routeHtml = d.from + ' &rarr; ' + d.to + '<br>' +
        booking.outboundFlight.flightNumber + ' &middot; ' +
        new Date(booking.outboundFlight.date).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'}) +
        ' &middot; ' + booking.outboundFlight.departure;
    }

    const html = '<div class="chat-booking-confirmed">' +
      '<div class="chat-confirm-icon">&#10003;</div>' +
      '<div class="chat-confirm-title">Booking Confirmed!</div>' +
      '<div class="chat-confirm-ref">PNR: <strong>' + booking.pnr + '</strong></div>' +
      '<div class="chat-confirm-route">' + routeHtml + '</div>' +
      '<div class="chat-confirm-pax">' + ticketHtml + '</div>' +
      '<div class="chat-confirm-total">Total: ' + (booking.fare ? booking.fare.labelTotal : d.selectedFareObj.labelTotal) + '</div>' +
      (booking.dreamMilesEarned ? '<div style="font-size:12px;color:var(--green);margin-bottom:6px">+' + booking.dreamMilesEarned + ' DreamMiles earned</div>' : '') +
      '<div class="chat-confirm-note">' + (booking.paymentNote || '') + '</div>' +
      '</div>';

    addBotMsgWide(html, [
      { label: 'Book Another', onclick: "chatResetBooking()" },
      { label: 'Close', onclick: "toggleChat()" }
    ]);
    chatSetInputDisabled(false);
  })
  .catch(() => {
    addBotMsg("Sorry, there was an error confirming your booking. Please try again.", [
      { label: 'Retry', onclick: "chatSubmitPayment()" },
      { label: 'Start Over', onclick: "chatResetBooking()" }
    ]);
    chatSetInputDisabled(false);
  });
}

function chatResetBooking() {
  chatCtx = { intent: null, step: null, data: {} };
  chatSetInputDisabled(false);
  chatQuickReply('Book a flight');
}

// ---- MAIN BOOKING CHAT STATE MACHINE ----

function handleBookingChat(msg, cities, date, num, cabin) {
  const d = chatCtx.data;

  // Extract entities into context (from freeform text)
  if (cities.length >= 2) {
    d.from = cities[0]; d.fromCode = chatExtractCode(cities[0]);
    d.to = cities[1]; d.toCode = chatExtractCode(cities[1]);
  } else if (cities.length === 1 && !d.from) {
    d.from = cities[0]; d.fromCode = chatExtractCode(cities[0]);
  } else if (cities.length === 1 && d.from && !d.to) {
    d.to = cities[0]; d.toCode = chatExtractCode(cities[0]);
  }
  if (date) d.date = date;
  if (num && num > 0 && num <= 9) d.passengers = num;
  if (cabin) d.cabin = cabin;

  // Determine step
  if (!chatCtx.step) chatCtx.step = 'ask_from';

  // Step: ask_from
  if (chatCtx.step === 'ask_from') {
    if (d.from) { chatCtx.step = 'ask_to'; }
    else {
      const fromPrompts = [
        "I'd love to help you find a flight! Let's start with your departure city — where will you be flying <strong>from</strong>?",
        "Let's get you booked! First, where are you departing <strong>from</strong>? Start typing and I'll suggest airports.",
        "Awesome, let's find you a great fare. Which city or airport are you flying <strong>from</strong>?"
      ];
      addBotMsgWide(fromPrompts[Math.floor(Math.random() * fromPrompts.length)] +
        renderCityPicker('from'));
      setTimeout(() => {
        const inp = document.getElementById('chatCityInput_from');
        if (inp) inp.focus();
      }, 100);
      return;
    }
  }

  // Step: ask_to
  if (chatCtx.step === 'ask_to') {
    if (d.to) { chatCtx.step = 'ask_date'; }
    else {
      const toPrompts = [
        "Perfect, departing from <strong>" + d.from + "</strong>. And where would you like to fly to?",
        "Got it — <strong>" + d.from + "</strong>. Now, what's your destination?",
        "Great choice! Flying from <strong>" + d.from + "</strong>. Where are you headed?"
      ];
      addBotMsgWide(toPrompts[Math.floor(Math.random() * toPrompts.length)] +
        renderCityPicker('to'));
      setTimeout(() => {
        const inp = document.getElementById('chatCityInput_to');
        if (inp) inp.focus();
      }, 100);
      return;
    }
  }

  // Step: ask_date
  if (chatCtx.step === 'ask_date') {
    if (d.date) { chatCtx.step = 'ask_cabin'; }
    else {
      const datePrompts = [
        d.from + " to <strong>" + d.to + "</strong> — great route! When are you looking to travel? You can say something like <em>\"next Friday\"</em>, <em>\"March 25\"</em>, or even <em>\"tomorrow\"</em>.",
        "Lovely, " + d.from + " &rarr; <strong>" + d.to + "</strong>. What date works best for you? Just type a date like <em>\"March 25\"</em> or <em>\"next Monday\"</em>.",
        d.from + " to <strong>" + d.to + "</strong> — I have plenty of options on that route! When would you like to depart?"
      ];
      addBotMsg(datePrompts[Math.floor(Math.random() * datePrompts.length)]);
      return;
    }
  }

  // Step: ask_cabin
  if (chatCtx.step === 'ask_cabin') {
    if (!d.passengers) d.passengers = 1;
    if (d.cabin) { chatCtx.step = 'search'; }
    else {
      addBotMsg("Almost there! Which cabin class would you prefer? Economy is great value, and Business gives you extra comfort with lounge access and premium dining.", [
        { label: 'Economy', onclick: "chatCtx.data.cabin='Economy';chatCtx.step='search';handleBookingChat('',[], null, null, null)" },
        { label: 'Business', onclick: "chatCtx.data.cabin='Business';chatCtx.step='search';handleBookingChat('',[], null, null, null)" }
      ]);
      return;
    }
  }

  // Step: search
  if (chatCtx.step === 'search') {
    const dateObj = new Date(d.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    addBotMsg("Let me search for the best fares for you...<br><br>" +
      "<strong>" + d.from + "</strong> &rarr; <strong>" + d.to + "</strong><br>" +
      dateStr + " &middot; " + (d.passengers || 1) + " passenger" + ((d.passengers || 1) > 1 ? 's' : '') +
      " &middot; " + d.cabin);
    setTimeout(() => chatSearchFlights(), 800);
    return;
  }

  // Later steps (select_flight, select_fare, pax_details, etc.) are handled
  // by their respective onclick handlers — not through the text input
}

// ---- MULTI-CITY CHAT FLOW ----

function handleMulticityChat(msg, cities, date) {
  const d = chatCtx.data;
  const lower = (msg || '').toLowerCase();
  const leg = d.mcLegs[d.currentLeg];

  // Step: mc_ask_legs — intro, ask for first leg's origin
  if (chatCtx.step === 'mc_ask_legs') {
    chatCtx.step = 'mc_ask_from';
    const intros = [
      "Multi-city trip — great idea! Let's build your itinerary leg by leg. Where does your first flight depart <strong>from</strong>?",
      "I'd love to help you plan a multi-city journey! Let's start with <strong>Leg 1</strong>. Where are you flying from?",
      "Multi-city booking coming right up! Tell me the departure city for your <strong>first leg</strong>."
    ];
    addBotMsgWide(intros[Math.floor(Math.random() * intros.length)] + renderCityPicker('mc_from'));
    setTimeout(() => { const inp = document.getElementById('chatCityInput_mc_from'); if (inp) inp.focus(); }, 100);
    return;
  }

  // Step: mc_ask_from
  if (chatCtx.step === 'mc_ask_from') {
    if (d.mc_from) {
      leg.from = d.mc_from;
      leg.fromCode = d.mc_fromCode;
      delete d.mc_from; delete d.mc_fromCode;
      chatCtx.step = 'mc_ask_to';
    } else if (cities.length >= 1) {
      leg.from = cities[0];
      leg.fromCode = chatExtractCode(cities[0]);
      chatCtx.step = 'mc_ask_to';
    } else {
      addBotMsgWide("I didn't catch that city. Please select your departure city for Leg " + (d.currentLeg + 1) + ":" + renderCityPicker('mc_from'));
      return;
    }
  }

  // Step: mc_ask_to
  if (chatCtx.step === 'mc_ask_to') {
    if (d.mc_to) {
      leg.to = d.mc_to;
      leg.toCode = d.mc_toCode;
      delete d.mc_to; delete d.mc_toCode;
      chatCtx.step = 'mc_ask_date';
    } else if (cities.length >= 1 && !leg.to) {
      const city = cities.length >= 2 ? cities[1] : cities[0];
      if (city !== leg.from) {
        leg.to = city;
        leg.toCode = chatExtractCode(city);
        chatCtx.step = 'mc_ask_date';
      }
    }
    if (chatCtx.step === 'mc_ask_to') {
      const toPrompts = [
        "Got it — Leg " + (d.currentLeg + 1) + " from <strong>" + leg.from + "</strong>. Where to?",
        "Flying from <strong>" + leg.from + "</strong> for Leg " + (d.currentLeg + 1) + ". What's the destination?",
        "Departure: <strong>" + leg.from + "</strong>. And where would you like this leg to go?"
      ];
      addBotMsgWide(toPrompts[Math.floor(Math.random() * toPrompts.length)] + renderCityPicker('mc_to'));
      setTimeout(() => { const inp = document.getElementById('chatCityInput_mc_to'); if (inp) inp.focus(); }, 100);
      return;
    }
  }

  // Step: mc_ask_date
  if (chatCtx.step === 'mc_ask_date') {
    if (d.mc_date) {
      leg.date = d.mc_date;
      delete d.mc_date;
      chatCtx.step = 'mc_ask_more';
    } else if (date) {
      leg.date = date;
      chatCtx.step = 'mc_ask_more';
    } else {
      addBotMsg("When do you want to fly <strong>" + leg.from + "</strong> → <strong>" + leg.to + "</strong>? " +
        "You can say something like <em>\"March 25\"</em>, <em>\"next Friday\"</em>, or type a date.");
      return;
    }
  }

  // Step: mc_ask_more — ask if they want another leg
  if (chatCtx.step === 'mc_ask_more') {
    if (lower.includes('yes') || lower.includes('add') || lower.includes('another') || lower === '') {
      // Show summary so far
      let summary = '<div style="margin-bottom:10px">';
      d.mcLegs.forEach((l, i) => {
        if (l.from && l.to && l.date) {
          summary += '<div class="chat-mc-leg-summary"><span class="chat-mc-leg-label">Leg ' + (i + 1) + '</span> ' +
            l.from + ' → ' + l.to + ' · ' + formatDateDisplay(l.date) + '</div>';
        }
      });
      summary += '</div>';

      if (d.mcLegs.length >= 4) {
        chatCtx.step = 'mc_search';
        addBotMsg(summary + "That's the maximum of 4 legs. Let me search for flights on all legs!");
        setTimeout(() => chatSearchMulticityFlights(), 800);
        return;
      }

      addBotMsg(summary + "Leg " + (d.currentLeg + 1) + " is set! Would you like to add another leg, or shall I search for flights?", [
        { label: 'Add another leg', onclick: "chatAddMulticityLeg()" },
        { label: 'Search flights', onclick: "chatStartMulticitySearch()" }
      ]);
      return;
    }
    if (lower.includes('search') || lower.includes('find') || lower.includes('no') || lower.includes('done') || lower.includes('that')) {
      chatCtx.step = 'mc_search';
      chatStartMulticitySearch();
      return;
    }
    // Default: show the options again
    addBotMsg("Would you like to add another flight leg, or should I search?", [
      { label: 'Add another leg', onclick: "chatAddMulticityLeg()" },
      { label: 'Search flights', onclick: "chatStartMulticitySearch()" }
    ]);
    return;
  }

  // Step: mc_search
  if (chatCtx.step === 'mc_search') {
    chatSearchMulticityFlights();
    return;
  }
}

function chatAddMulticityLeg() {
  const d = chatCtx.data;
  const lastLeg = d.mcLegs[d.mcLegs.length - 1];
  d.mcLegs.push({ from: lastLeg.to || '', fromCode: lastLeg.toCode || '', to: '', date: '' });
  d.currentLeg = d.mcLegs.length - 1;
  chatCtx.step = 'mc_ask_from';

  // If we auto-filled the from, skip to ask_to
  if (d.mcLegs[d.currentLeg].from) {
    addChatMessage('Add another leg', 'user');
    chatCtx.step = 'mc_ask_to';
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      const leg = d.mcLegs[d.currentLeg];
      addBotMsgWide("Leg " + (d.currentLeg + 1) + " — continuing from <strong>" + leg.from + "</strong>. Where to next?" +
        renderCityPicker('mc_to'));
      setTimeout(() => { const inp = document.getElementById('chatCityInput_mc_to'); if (inp) inp.focus(); }, 100);
    }, 400);
  } else {
    addChatMessage('Add another leg', 'user');
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      addBotMsgWide("Leg " + (d.currentLeg + 1) + " — where are you flying from?" +
        renderCityPicker('mc_from'));
      setTimeout(() => { const inp = document.getElementById('chatCityInput_mc_from'); if (inp) inp.focus(); }, 100);
    }, 400);
  }
}

function chatStartMulticitySearch() {
  addChatMessage('Search flights', 'user');
  chatCtx.step = 'mc_search';
  const d = chatCtx.data;

  let summary = '';
  d.mcLegs.forEach((l, i) => {
    summary += '<div class="chat-mc-leg-summary"><span class="chat-mc-leg-label">Leg ' + (i + 1) + '</span> ' +
      l.from + ' → ' + l.to + ' · ' + formatDateDisplay(l.date) + '</div>';
  });

  addBotMsg("Searching flights for your multi-city trip..." + summary);
  setTimeout(() => chatSearchMulticityFlights(), 800);
}

function chatSearchMulticityFlights() {
  const d = chatCtx.data;
  const legs = d.mcLegs;
  d.mcFlightResults = [];
  d.mcSelectedFlights = [];
  let completed = 0;

  showTypingIndicator();

  legs.forEach((leg, legIdx) => {
    const fromCode = leg.fromCode || chatExtractCode(leg.from);
    const toCode = leg.toCode || chatExtractCode(leg.to);

    fetch('/api/flights/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: fromCode, destination: toCode,
        departDate: leg.date, adults: 1,
        cabin: 'economy', tripType: 'oneway'
      })
    })
    .then(r => r.json())
    .then(result => {
      d.mcFlightResults[legIdx] = result.outbound || [];
      completed++;
      if (completed === legs.length) {
        hideTypingIndicator();
        chatRenderMulticityResults();
      }
    })
    .catch(() => {
      d.mcFlightResults[legIdx] = [];
      completed++;
      if (completed === legs.length) {
        hideTypingIndicator();
        chatRenderMulticityResults();
      }
    });
  });
}

function chatRenderMulticityResults() {
  const d = chatCtx.data;
  chatCtx.step = 'mc_select_flights';
  d.mcSelectedFlights = new Array(d.mcLegs.length).fill(null);
  d.mcCurrentSelectLeg = 0;

  chatRenderLegFlights(0);
}

function chatRenderLegFlights(legIdx) {
  const d = chatCtx.data;
  const leg = d.mcLegs[legIdx];
  const flights = d.mcFlightResults[legIdx];

  if (!flights || flights.length === 0) {
    addBotMsg("No flights found for <strong>Leg " + (legIdx + 1) + "</strong> (" + leg.from + " → " + leg.to + "). " +
      "Try different dates?", [
      { label: 'Start Over', onclick: "chatResetBooking()" }
    ]);
    return;
  }

  let cardsHtml = '<div class="chat-flights-list">';
  flights.forEach((f, i) => {
    cardsHtml += '<div class="chat-flight-card" onclick="chatSelectMcFlight(' + legIdx + ',' + i + ')">';
    if (f.isBestValue) cardsHtml += '<div class="chat-flight-badge">Best Value</div>';
    cardsHtml += '<div class="chat-flight-top">' +
      '<div class="chat-flight-times"><span>' + f.departure + '</span>' +
      '<span class="chat-flight-arrow">&rarr;</span><span>' + f.arrival + '</span></div>' +
      '<div class="chat-flight-price">' + f.fare.label + '</div></div>' +
      '<div class="chat-flight-info">' + f.flightNumber + ' &middot; ' + f.duration +
      ' &middot; ' + (f.stops === 0 ? 'Direct' : f.stops + ' stop') +
      ' &nbsp; <span class="chat-flight-seats">' + f.seatsLeft + ' seats left</span></div>' +
      '</div>';
  });
  cardsHtml += '</div>';

  addBotMsgWide('<div class="chat-mc-leg-summary"><span class="chat-mc-leg-label">Leg ' + (legIdx + 1) + '</span> ' +
    leg.from + ' → ' + leg.to + ' · ' + formatDateDisplay(leg.date) + '</div>' +
    "Pick a flight for this leg:" + cardsHtml);
}

function chatSelectMcFlight(legIdx, flightIdx) {
  const d = chatCtx.data;
  const flight = d.mcFlightResults[legIdx][flightIdx];
  d.mcSelectedFlights[legIdx] = flight;

  addChatMessage('Leg ' + (legIdx + 1) + ': ' + flight.departure + ' → ' + flight.arrival + ' (' + flight.flightNumber + ')', 'user');

  // Check if more legs need selection
  const nextLeg = legIdx + 1;
  if (nextLeg < d.mcLegs.length) {
    d.mcCurrentSelectLeg = nextLeg;
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      chatRenderLegFlights(nextLeg);
    }, 500);
  } else {
    // All legs selected — show fare options for each, then proceed to combined booking
    chatCtx.step = 'mc_fare';
    d.mcCurrentFareLeg = 0;
    d.mcFareSelections = [];

    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      chatRenderMcFareOptions(0);
    }, 500);
  }
}

function chatRenderMcFareOptions(legIdx) {
  const d = chatCtx.data;
  const flight = d.mcSelectedFlights[legIdx];
  const leg = d.mcLegs[legIdx];
  const baseFare = flight.fare.base;
  const taxRate = 0.18;
  const fares = {
    lite: { base: Math.round(baseFare * 0.82), features: ['7kg hand baggage only', 'No changes allowed', 'No refund'] },
    classic: { base: baseFare, features: ['1x 23kg checked bag', 'Free date changes', 'Meal included'] },
    flex: { base: Math.round(baseFare * 1.35), features: ['2x 23kg checked bags', 'Free changes & cancel', 'Meal + seat selection'] }
  };
  Object.keys(fares).forEach(k => {
    fares[k].tax = Math.round(fares[k].base * taxRate);
    fares[k].total = fares[k].base + fares[k].tax;
    fares[k].label = 'RWF ' + fares[k].total.toLocaleString();
  });

  d.mcFareOptionsPerLeg = d.mcFareOptionsPerLeg || [];
  d.mcFareOptionsPerLeg[legIdx] = fares;

  let html = '<div class="chat-mc-leg-summary"><span class="chat-mc-leg-label">Leg ' + (legIdx + 1) + '</span> ' +
    leg.from + ' → ' + leg.to + ' · ' + flight.flightNumber + '</div>';
  html += '<div class="chat-fare-options">';

  html += '<div class="chat-fare-option" onclick="chatSelectMcFare(' + legIdx + ',\'lite\')">' +
    '<div class="chat-fare-head"><span class="chat-fare-name">Lite</span><span class="chat-fare-price">' + fares.lite.label + '</span></div>' +
    '<ul class="chat-fare-features">' + fares.lite.features.map(f => '<li>' + f + '</li>').join('') + '</ul></div>';

  html += '<div class="chat-fare-option chat-fare-recommended" onclick="chatSelectMcFare(' + legIdx + ',\'classic\')">' +
    '<div class="chat-fare-tag">Recommended</div>' +
    '<div class="chat-fare-head"><span class="chat-fare-name">Classic</span><span class="chat-fare-price">' + fares.classic.label + '</span></div>' +
    '<ul class="chat-fare-features">' + fares.classic.features.map(f => '<li>' + f + '</li>').join('') + '</ul></div>';

  html += '<div class="chat-fare-option" onclick="chatSelectMcFare(' + legIdx + ',\'flex\')">' +
    '<div class="chat-fare-head"><span class="chat-fare-name">Flex</span><span class="chat-fare-price">' + fares.flex.label + '</span></div>' +
    '<ul class="chat-fare-features">' + fares.flex.features.map(f => '<li>' + f + '</li>').join('') + '</ul></div>';

  html += '</div>';
  addBotMsgWide("Choose a fare for Leg " + (legIdx + 1) + ":" + html);
}

function chatSelectMcFare(legIdx, fareType) {
  const d = chatCtx.data;
  const fare = d.mcFareOptionsPerLeg[legIdx][fareType];
  d.mcFareSelections[legIdx] = { type: fareType, ...fare };

  addChatMessage('Leg ' + (legIdx + 1) + ': ' + fareType.charAt(0).toUpperCase() + fareType.slice(1) + ' — ' + fare.label, 'user');

  const nextLeg = legIdx + 1;
  if (nextLeg < d.mcLegs.length) {
    d.mcCurrentFareLeg = nextLeg;
    showTypingIndicator();
    setTimeout(() => { hideTypingIndicator(); chatRenderMcFareOptions(nextLeg); }, 500);
  } else {
    // All fares selected — calculate total and hold flights
    chatCtx.step = 'mc_hold';
    let grandTotal = 0;
    d.mcFareSelections.forEach(f => { grandTotal += f.total; });
    d.mcGrandTotal = grandTotal;

    showTypingIndicator();

    // Hold the first flight (for demo — in real app would hold all)
    const holdFlight = {
      ...d.mcSelectedFlights[0],
      fare: { base: grandTotal, tax: 0, total: grandTotal, totalAllPax: grandTotal, currency: 'RWF', label: 'RWF ' + grandTotal.toLocaleString(), labelTotal: 'RWF ' + grandTotal.toLocaleString() }
    };

    fetch('/api/bookings/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outboundFlight: holdFlight, passengers: 1, cabin: 'economy' })
    })
    .then(r => r.json())
    .then(result => {
      hideTypingIndicator();
      d.holdRef = result.holdRef;
      d.passengers = 1;
      d.selectedFareObj = { base: grandTotal, tax: 0, total: grandTotal, totalAllPax: grandTotal, currency: 'RWF', label: 'RWF ' + grandTotal.toLocaleString(), labelTotal: 'RWF ' + grandTotal.toLocaleString() };

      // Build summary
      let summary = '<div style="margin-bottom:8px">';
      d.mcLegs.forEach((l, i) => {
        const fl = d.mcSelectedFlights[i];
        const fr = d.mcFareSelections[i];
        summary += '<div class="chat-mc-leg-summary"><span class="chat-mc-leg-label">Leg ' + (i + 1) + '</span> ' +
          l.from + ' → ' + l.to + ' · ' + fl.flightNumber + ' · ' +
          fr.type.charAt(0).toUpperCase() + fr.type.slice(1) + ' — ' + fr.label + '</div>';
      });
      summary += '<div style="font-weight:700;margin-top:6px">Total: RWF ' + grandTotal.toLocaleString() + '</div></div>';

      addBotMsg(summary + "I've reserved your flights for 15 minutes. Now let's get the passenger details.");

      // Transition to existing pax flow
      chatCtx.intent = 'book_multicity';
      chatCtx.step = 'pax_details';
      d.paxList = [];
      d.currentPax = 0;
      // Store from/to for confirmation display
      d.from = d.mcLegs[0].from;
      d.to = d.mcLegs[d.mcLegs.length - 1].to;
      d.selectedFlight = d.mcSelectedFlights[0];
      setTimeout(() => chatRenderPaxForm(), 600);
    })
    .catch(() => {
      hideTypingIndicator();
      addBotMsg("Sorry, couldn't hold these flights. Please try again.", [
        { label: 'Retry', onclick: "chatStartMulticitySearch()" },
        { label: 'Start Over', onclick: "chatResetBooking()" }
      ]);
    });
  }
}

// Override chatSelectCity to handle mc_ fields
const _origChatSelectCity = chatSelectCity;
chatSelectCity = function(display, code, field) {
  if (field.startsWith('mc_')) {
    const d = chatCtx.data;
    d[field] = display;
    d[field + 'Code'] = code;
    addChatMessage(display, 'user');
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      handleMulticityChat('', [], null);
    }, 400);
  } else {
    _origChatSelectCity(display, code, field);
  }
};

// ---- STICKY TOPBAR SHADOW ----
window.addEventListener('scroll', () => {
  const topbar = document.getElementById('topbar');
  if (window.scrollY > 10) {
    topbar.style.boxShadow = '0 2px 12px rgba(0,0,0,.1)';
  } else {
    topbar.style.boxShadow = 'var(--shadow-sm)';
  }
});

// ---- PASSENGER STEPPER ----
const paxCounts = { adult: 1, child: 0, infant: 0 };

function changePax(type, delta) {
  const newVal = paxCounts[type] + delta;
  if (type === 'adult' && (newVal < 1 || newVal > 9)) return;
  if (type === 'child' && (newVal < 0 || newVal > 8)) return;
  if (type === 'infant' && (newVal < 0 || newVal > paxCounts.adult)) return;

  paxCounts[type] = newVal;
  document.getElementById('pax' + type.charAt(0).toUpperCase() + type.slice(1)).textContent = newVal;
  updatePaxSummary();
}

function updatePaxSummary() {
  const total = paxCounts.adult + paxCounts.child + paxCounts.infant;
  document.getElementById('paxSummary').textContent = total + ' Passenger(s)';
}

function togglePaxDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('paxDropdown');
  const cabinDd = document.getElementById('cabinDropdown');
  cabinDd.classList.add('hidden');
  dd.classList.toggle('hidden');
}

// ---- CABIN CLASS ----
function toggleCabinDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('cabinDropdown');
  const paxDd = document.getElementById('paxDropdown');
  paxDd.classList.add('hidden');
  dd.classList.toggle('hidden');
}

function selectCabin(name) {
  document.getElementById('cabinSummary').textContent = name;
  document.getElementById('cabinDropdown').classList.add('hidden');
}

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  const paxDd = document.getElementById('paxDropdown');
  const cabinDd = document.getElementById('cabinDropdown');
  if (paxDd && !e.target.closest('#paxFilter') && !e.target.closest('#paxDropdown')) {
    paxDd.classList.add('hidden');
  }
  if (cabinDd && !e.target.closest('#cabinFilter') && !e.target.closest('#cabinDropdown')) {
    cabinDd.classList.add('hidden');
  }
});

// ---- PROMO CODE ----
function togglePromoCode() {
  const field = document.getElementById('promoField');
  field.classList.toggle('hidden');
  if (!field.classList.contains('hidden')) {
    document.getElementById('promoInput').focus();
  }
}

function applyPromo() {
  const code = document.getElementById('promoInput').value.trim();
  if (code) {
    alert('Promo code "' + code + '" applied! (Demo)');
  }
}

// ---- CART (legacy bridge removed — using addToCart directly with API data) ----
let cartFlight = null;

// ---- DATE CAROUSEL ----
let dateCarouselOffset = 0;

// Store last search params for re-triggering on date change
let lastSearchParams = null;

function renderDateCarousel(departDate) {
  const container = document.getElementById('dateCarousel');
  if (!container) return;

  const baseDate = new Date(departDate + 'T00:00:00');
  container.innerHTML = '';

  for (let i = -3; i <= 3; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i + dateCarouselOffset);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Simulate price variation in RWF, display in current currency
    const basePriceRWF = 188000 + Math.floor(Math.abs(Math.sin(d.getDate() * 1.5)) * 80000);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const isActive = dateStr === departDate;

    const item = document.createElement('div');
    item.className = 'date-carousel-item' + (isActive ? ' active' : '');
    item.innerHTML = '<div class="date-day">' + days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + String(d.getDate()).padStart(2,'0') + '</div>' +
      '<div class="date-price">' + t('from') + '<br><strong>' + fmtPrice(basePriceRWF) + '</strong></div>';
    item.setAttribute('data-date', dateStr);
    item.onclick = function() {
      selectCarouselDate(dateStr);
    };
    container.appendChild(item);
  }
}

function selectCarouselDate(dateStr) {
  // Update active state
  const container = document.getElementById('dateCarousel');
  if (container) container.querySelectorAll('.date-carousel-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-date') === dateStr);
  });

  // Update hidden input
  document.getElementById('searchDepart').value = dateStr;
  calendarSelectedDate = dateStr;
  initCalendarFromDate(dateStr);

  // Re-trigger flight search with new date
  if (lastSearchParams) {
    const params = { ...lastSearchParams, departDate: dateStr };
    fetchAndRenderFlights(params);
  }
}

function shiftDateCarousel(dir) {
  dateCarouselOffset += dir * 3;
  const departDate = document.getElementById('searchDepart').value;
  renderDateCarousel(departDate);
}

// ---- RESULTS CALENDAR ----
let calendarYear = 2026;
let calendarMonth = 2; // 0-indexed
let calendarSelectedDate = '';

function toggleResultsCalendar() {
  const cal = document.getElementById('resultsCalendar');
  const btn = document.getElementById('calToggleBtn');
  if (!cal) return;
  cal.classList.toggle('hidden');
  if (btn) btn.classList.toggle('active');
  if (!cal.classList.contains('hidden')) {
    renderResultsCalendar(calendarSelectedDate);
  }
}

function initCalendarFromDate(dateStr) {
  if (!dateStr) return;
  const d = new Date(dateStr + 'T00:00:00');
  calendarYear = d.getFullYear();
  calendarMonth = d.getMonth();
  calendarSelectedDate = dateStr;
}

function shiftCalendarMonth(dir) {
  calendarMonth += dir;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderResultsCalendar(calendarSelectedDate);
}

function getSimulatedPrice(day) {
  return 135 + Math.floor(Math.abs(Math.sin(day * 1.5)) * 80);
}

function getPriceLevel(price) {
  if (price <= 160) return 'low';
  if (price <= 190) return 'mid';
  return 'high';
}

function renderResultsCalendar(selectedDate) {
  const container = document.getElementById('resultsCalendar');
  if (!container) return;

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  let html = '<div class="cal-header">' +
    '<button class="cal-nav" onclick="shiftCalendarMonth(-1)">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' +
    '<span class="cal-header-title">' + monthNames[calendarMonth] + ' ' + calendarYear + '</span>' +
    '<button class="cal-nav" onclick="shiftCalendarMonth(1)">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>' +
    '</div>';

  html += '<div class="cal-grid">';
  dayNames.forEach(function(d) { html += '<div class="cal-day-header">' + d + '</div>'; });

  for (var i = 0; i < startDow; i++) { html += '<div class="cal-day cal-empty"></div>'; }

  for (var day = 1; day <= daysInMonth; day++) {
    var cellDate = new Date(calendarYear, calendarMonth, day);
    var dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var isPast = cellDate < today;
    var isSelected = dateStr === selectedDate;
    var price = getSimulatedPrice(day);
    var level = getPriceLevel(price);

    var cls = 'cal-day';
    if (isPast) cls += ' cal-past';
    if (isSelected) cls += ' cal-active';

    var dotHtml = isPast ? '' : '<span class="cal-price-dot price-' + level + '"></span>';
    var onclick = isPast ? '' : ' onclick="selectCalendarDate(\'' + dateStr + '\')"';

    html += '<div class="' + cls + '"' + onclick + '>' +
      '<span class="cal-day-num">' + day + '</span>' + dotHtml + '</div>';
  }

  html += '</div>';
  html += '<div class="cal-legend">' +
    '<div class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--green)"></span> Low</div>' +
    '<div class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--yellow)"></span> Mid</div>' +
    '<div class="cal-legend-item"><span class="cal-legend-dot" style="background:#ef4444"></span> High</div>' +
    '</div>';

  container.innerHTML = html;
}

function selectCalendarDate(dateStr) {
  calendarSelectedDate = dateStr;
  document.getElementById('searchDepart').value = dateStr;
  dateCarouselOffset = 0;
  renderDateCarousel(dateStr);
  renderResultsCalendar(dateStr);

  // Update the results header date
  var resultDate = document.getElementById('resultDate');
  if (resultDate) {
    var parts = resultDate.textContent.split(' \u00b7 ');
    parts[0] = formatDateDisplay(dateStr);
    resultDate.textContent = parts.join(' \u00b7 ');
  }

  // Re-trigger flight search with new departure date
  if (lastSearchParams) {
    var params = Object.assign({}, lastSearchParams, { departDate: dateStr });
    fetchAndRenderFlights(params);
  }
}

// ---- NOTIFICATION / AD BANNER SYSTEM ----
const notifications = [
  { type:'alert', label:'Alert:', text:'Check-in and airport processing times — Please arrive at least 3 hours before international departures.', icon:'warning', actionLabel:null, actionTarget:null },
  { type:'promo', label:'Spring Sale!', text:'Fly to Dubai from $399 round trip — Book by March 31 and save up to 30%!', icon:'tag', actionLabel:'Book Now', actionTarget:'home' },
  { type:'deal', label:'DreamMiles:', text:'Earn double miles on all Business Class bookings this month. Join for free!', icon:'gift', actionLabel:'Join Now', actionTarget:'loyalty' },
  { type:'promo', label:'New!', text:'RwandAir Cargo — Ship freight across 30+ destinations in Africa and beyond.', icon:'plane', actionLabel:'Ship Now', actionTarget:'cargo' },
  { type:'ad', label:'Zanzibar:', text:'Direct flights to paradise! Fly RwandAir to your island escape from $280 return.', icon:'plane', actionLabel:'Explore', actionTarget:'home' },
  { type:'alert', label:'Travel Advisory:', text:'Updated entry requirements for passengers travelling to South Africa — check before you fly.', icon:'warning', actionLabel:'Learn More', actionTarget:'travelinfo' }
];
let currentNotifIdx = 0, notifTimer = null, notifPaused = false;

function initNotifications() {
  if (!notifications.length) return;
  renderNotifDots();
  showNotification(0);
  startNotifRotation();
}

function renderNotifDots() {
  const dots = document.getElementById('notifDots');
  if (!dots) return;
  dots.innerHTML = notifications.map((_, i) =>
    '<span class="notif-dot' + (i===0?' active':'') + '" onclick="goToNotification(' + i + ')"></span>'
  ).join('');
}

function showNotification(idx) {
  currentNotifIdx = idx;
  const n = notifications[idx];
  const banner = document.getElementById('notifBanner');
  const label = document.getElementById('notifLabel');
  const text = document.getElementById('notifText');
  const icon = document.getElementById('notifIcon');
  const btn = document.getElementById('notifActionBtn');

  // Fade out
  text.classList.add('notif-fade');
  setTimeout(() => {
    banner.className = 'notif-banner notif-' + n.type;
    label.textContent = n.label;
    text.textContent = n.text;
    icon.innerHTML = getNotifIcon(n.icon);
    if (n.actionLabel) { btn.textContent = n.actionLabel; btn.classList.remove('hidden'); }
    else { btn.classList.add('hidden'); }
    text.classList.remove('notif-fade');
    // Update dots
    document.querySelectorAll('.notif-dot').forEach((d,i) => d.classList.toggle('active', i===idx));
    // Reset progress
    const prog = document.getElementById('notifProgress');
    if (prog) { prog.style.transition = 'none'; prog.style.width = '0'; requestAnimationFrame(() => { prog.style.transition = 'width 5s linear'; prog.style.width = '100%'; }); }
  }, 250);
}

function nextNotification() { showNotification((currentNotifIdx + 1) % notifications.length); resetNotifTimer(); }
function prevNotification() { showNotification((currentNotifIdx - 1 + notifications.length) % notifications.length); resetNotifTimer(); }
function goToNotification(i) { showNotification(i); resetNotifTimer(); }
function handleNotifAction() { const n = notifications[currentNotifIdx]; if (n.actionTarget) navigateTo(n.actionTarget); }
function dismissNotification() { document.getElementById('notifBanner').style.display = 'none'; clearInterval(notifTimer); }
function pauseNotifRotation() { notifPaused = true; const p = document.getElementById('notifProgress'); if(p) p.style.animationPlayState = 'paused'; }
function resumeNotifRotation() { notifPaused = false; const p = document.getElementById('notifProgress'); if(p) p.style.animationPlayState = 'running'; }
function startNotifRotation() { notifTimer = setInterval(() => { if (!notifPaused) nextNotification(); }, 5000); }
function resetNotifTimer() { clearInterval(notifTimer); startNotifRotation(); }

function getNotifIcon(type) {
  const icons = {
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    tag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    gift: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>',
    plane: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    megaphone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>'
  };
  return icons[type] || icons.warning;
}

function addNotification(notif) { notifications.push(notif); renderNotifDots(); }
function removeNotification(idx) {
  notifications.splice(idx, 1);
  if (currentNotifIdx >= notifications.length) currentNotifIdx = 0;
  renderNotifDots();
  if (notifications.length) showNotification(currentNotifIdx);
  else dismissNotification();
}

// ---- CARGO / FREIGHT ----
function switchCargoTab(tab) {
  document.querySelectorAll('[data-cargo-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.cargoTab === tab));
  document.getElementById('cargoBookTab').style.display = tab === 'book' ? '' : 'none';
  document.getElementById('cargoTrackTab').style.display = tab === 'track' ? '' : 'none';
}

const CARGO_RATES = {
  regional: 2.50,  // within East Africa
  continental: 4.20, // within Africa
  intercontinental: 8.50 // outside Africa
};
const CARGO_SURCHARGES = {
  general: 0, perishable: 0.80, pharma: 1.20, live_animal: 2.50,
  dangerous: 3.00, valuable: 5.00, human_remains: 4.00, oversized: 1.50
};
const REGIONAL = ['KGL','NBO','EBB','DAR','BJM'];
const AFRICAN = ['KGL','NBO','EBB','DAR','BJM','JNB','LOS','ACC'];

function calculateCargoRate() {
  const from = document.getElementById('cargoFrom').value;
  const to = document.getElementById('cargoTo').value;
  const weight = parseFloat(document.getElementById('cargoWeight').value) || 0;
  const type = document.getElementById('cargoType').value;
  const l = parseFloat(document.getElementById('cargoLength').value) || 0;
  const w = parseFloat(document.getElementById('cargoWidth').value) || 0;
  const h = parseFloat(document.getElementById('cargoHeight').value) || 0;

  if (!from || !to || weight <= 0) {
    document.getElementById('cargoRateEmpty').classList.remove('hidden');
    document.getElementById('cargoRateDetails').classList.add('hidden');
    return;
  }

  const volWeight = (l * w * h) / 6000;
  const chargeableWeight = Math.max(weight, volWeight);

  let ratePerKg = CARGO_RATES.intercontinental;
  if (REGIONAL.includes(from) && REGIONAL.includes(to)) ratePerKg = CARGO_RATES.regional;
  else if (AFRICAN.includes(from) && AFRICAN.includes(to)) ratePerKg = CARGO_RATES.continental;

  const base = chargeableWeight * ratePerKg;
  const surcharge = chargeableWeight * (CARGO_SURCHARGES[type] || 0);
  const fuel = base * 0.12;
  const total = base + surcharge + fuel;

  document.getElementById('crRoute').textContent = from + ' → ' + to;
  document.getElementById('crWeight').textContent = chargeableWeight.toFixed(1) + ' kg' + (volWeight > weight ? ' (vol.)' : '');
  document.getElementById('crRateKg').textContent = '$' + ratePerKg.toFixed(2);
  document.getElementById('crBase').textContent = '$' + base.toFixed(2);
  document.getElementById('crSurcharge').textContent = '$' + surcharge.toFixed(2);
  document.getElementById('crFuel').textContent = '$' + fuel.toFixed(2);
  document.getElementById('crTotal').textContent = '$' + total.toFixed(2);

  document.getElementById('cargoRateEmpty').classList.add('hidden');
  document.getElementById('cargoRateDetails').classList.remove('hidden');
}

function submitCargoBooking() {
  const from = document.getElementById('cargoFrom').value;
  const to = document.getElementById('cargoTo').value;
  const dt = document.getElementById('cargoDate').value;
  const shipper = document.getElementById('shipperName').value;
  const weight = document.getElementById('cargoWeight').value;

  if (!from || !to || !dt || !shipper || !weight) {
    alert('Please fill in all required fields.');
    return;
  }

  // Generate AWB
  const awb = '459-' + String(Math.floor(10000000 + Math.random()*90000000));
  const total = document.getElementById('crTotal').textContent || '$0.00';

  document.getElementById('cargoAwbConfirm').textContent = awb;
  document.getElementById('cargoRouteConfirm').textContent = from + ' → ' + to;
  document.getElementById('cargoDateConfirm').textContent = new Date(dt).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'});
  document.getElementById('cargoTotalConfirm').textContent = total;

  // Show confirmation, hide form
  document.querySelector('#page-cargo .container.section').style.display = 'none';
  document.getElementById('cargoConfirmation').classList.remove('hidden');
  window.scrollTo({top:0, behavior:'smooth'});
}

function trackCargo() {
  const awb = document.getElementById('cargoAwbInput').value.trim();
  if (!awb) { alert('Please enter an AWB number.'); return; }

  const result = document.getElementById('cargoTrackResult');
  result.classList.remove('hidden');

  const steps = [
    {label:'Booking Confirmed', detail:'Shipment booked and awaiting pickup', done:true, time:'Mar 8, 09:30'},
    {label:'Picked Up', detail:'Cargo collected from shipper', done:true, time:'Mar 8, 14:15'},
    {label:'At Origin Hub (KGL)', detail:'Received at Kigali cargo warehouse', done:true, time:'Mar 8, 18:00'},
    {label:'In Transit', detail:'On flight WB-435 to destination', done:true, time:'Mar 9, 06:20'},
    {label:'At Destination Hub', detail:'Arrived and clearing customs', done:false, time:'Estimated Mar 9, 12:00'},
    {label:'Out for Delivery', detail:'Dispatched to consignee address', done:false, time:'Pending'},
    {label:'Delivered', detail:'Successfully delivered to receiver', done:false, time:'Pending'}
  ];

  result.innerHTML = '<h3 style="margin:20px 0 16px">Tracking: <strong>' + escapeHtml(awb) + '</strong></h3>' +
    '<div class="cargo-track-timeline">' + steps.map((s,i) =>
      '<div class="cargo-track-step ' + (s.done ? 'done' : '') + (i === steps.findIndex(x => !x.done) ? ' current' : '') + '">' +
        '<div class="cargo-track-dot"></div>' +
        '<div class="cargo-track-info"><strong>' + s.label + '</strong><span>' + s.detail + '</span><small>' + s.time + '</small></div>' +
      '</div>'
    ).join('') + '</div>';
}

// Special handling toggle
document.addEventListener('DOMContentLoaded', () => {
  const cb = document.getElementById('cargoSpecialHandling');
  if (cb) cb.addEventListener('change', () => {
    document.getElementById('cargoSpecialNotes').classList.toggle('hidden', !cb.checked);
  });
});

// Initialize dynamic prices on load
document.addEventListener('DOMContentLoaded', function() { updateDynamicPrices(); });

// ---- SEO URL: Initialize from URL on first load ----
document.addEventListener('DOMContentLoaded', function() {
  var parsed = parseUrl();
  if (parsed.country && parsed.language && parsed.page) {
    // Valid SEO URL — apply settings and navigate
    currentCountry = parsed.country;
    currentLanguage = parsed.language;
    refreshSettingsUI();
    // Restore destination detail state if applicable
    if (parsed.destCode) { selectedDestCode = parsed.destCode; selectedDestCity = parsed.destCity; }
    _skipPushState = true;
    navigateTo(parsed.page);
    _skipPushState = false;
    // Replace state so popstate works on this entry
    if (parsed.page === 'destination-detail' && parsed.destCity) {
      var citySlug = parsed.destCity.toLowerCase().replace(/\s+/g, '-');
      var destUrl = '/' + currentCountry.toLowerCase() + '/' + currentLanguage.toLowerCase() + '/destinations/' + citySlug;
      history.replaceState({ page: parsed.page, destCode: parsed.destCode, destCity: parsed.destCity }, '', destUrl);
    } else {
      history.replaceState({ page: parsed.page }, '', buildUrl(parsed.page));
    }
  } else if (window.location.pathname === '/' || window.location.pathname === '') {
    // Root URL — redirect to default locale
    history.replaceState({ page: 'home' }, '', buildUrl('home'));
  } else {
    // Unknown URL — go home with default locale
    history.replaceState({ page: 'home' }, '', buildUrl('home'));
  }
});

// ============ SETTINGS (Currency / Language / Country) ============
// (CURRENCY_SYMBOLS, COUNTRY_FLAGS, currentCurrency/Language/Country defined at top of file)

/* ---- Topbar dropdown toggles ---- */
function toggleTopbarDrop(id) {
  var el = document.getElementById(id);
  var wasOpen = el.classList.contains('open');
  // close all dropdowns first
  document.querySelectorAll('.topbar-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
  if (!wasOpen) {
    el.classList.add('open');
    if (id === 'settingsDropdown') syncStagedToPanel();
  }
}
// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.topbar-dropdown')) {
    document.querySelectorAll('.topbar-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
  }
});

function refreshSettingsUI() {
  var sym = CURRENCY_SYMBOLS[currentCurrency] || currentCurrency;
  var flag = COUNTRY_FLAGS[currentCountry] || '🌍';
  document.getElementById('currencyLabel').textContent = sym + ' ' + currentCurrency;
  var flagEl = document.getElementById('regionFlag');
  if (flagEl) flagEl.textContent = flag;
  document.getElementById('langLabel').textContent = currentCountry + '-' + currentLanguage;

  updateNavLabels();

  if (lastSearchData) {
    var isRound = lastSearchData.tripType === 'round' && lastSearchData.inbound && lastSearchData.inbound.length > 0;
    if (isRound && packages.length > 0) {
      renderPackageResults(lastSearchData);
      if (selectedOutbound && selectedInbound) updateCombinedTotal();
    } else if (lastSearchData.outbound) {
      renderOneWayResults(lastSearchData);
    }
  }
  var departDate = document.getElementById('searchDepart')?.value;
  if (departDate) renderDateCarousel(departDate);
  var cal = document.getElementById('resultsCalendar');
  if (cal && !cal.classList.contains('hidden')) renderResultsCalendar(calendarSelectedDate);
  if (typeof renderCart === 'function') renderCart();

  // Update all dynamic price elements across all pages
  updateDynamicPrices();
}

/* Update all elements with class dyn-price and data-rwf attribute */
function updateDynamicPrices() {
  document.querySelectorAll('.dyn-price[data-rwf]').forEach(function(el) {
    var rwf = parseFloat(el.getAttribute('data-rwf'));
    if (!isNaN(rwf)) el.textContent = fmtPrice(rwf);
  });
  // Update currency note if present
  var noteEl = document.getElementById('priceNoteCurrency');
  if (noteEl) noteEl.textContent = currentCurrency;
}

function setGroupActive(group, val) {
  document.querySelectorAll('#settingsPanel .topbar-drop-item[data-group="' + group + '"]').forEach(function(it) {
    it.classList.toggle('active', it.getAttribute('data-val') === val);
  });
}

/* Staged settings — only applied when user clicks Apply */
var _stagedCurrency = currentCurrency;
var _stagedCountry = currentCountry;
var _stagedLanguage = currentLanguage;

function pickCurrency(val) {
  _stagedCurrency = val;
  setGroupActive('currency', val);
}

function pickCountryFromSelect(sel) {
  var opt = sel.options[sel.selectedIndex];
  _stagedCountry = opt.value;
}

function pickCountry(val, flag) {
  _stagedCountry = val;
  var sel = document.getElementById('countryDropSelect');
  if (sel) sel.value = val;
}

function pickLanguage(val) {
  _stagedLanguage = val;
  setGroupActive('language', val);
}

function applyDropdownSettings() {
  currentCurrency = _stagedCurrency;
  currentCountry = _stagedCountry;
  currentLanguage = _stagedLanguage;
  refreshSettingsUI();
  document.getElementById('settingsDropdown').classList.remove('open');
  // Update URL with new country/language (replaceState to avoid extra history entry)
  var currentPage = getCurrentPageId();
  history.replaceState({ page: currentPage }, '', buildUrl(currentPage));
}

/* Sync staged values when dropdown opens */
function syncStagedToPanel() {
  _stagedCurrency = currentCurrency;
  _stagedCountry = currentCountry;
  _stagedLanguage = currentLanguage;
  setGroupActive('currency', currentCurrency);
  setGroupActive('language', currentLanguage);
  var sel = document.getElementById('countryDropSelect');
  if (sel) sel.value = currentCountry;
}

/* Keep backward compat aliases */
function toggleSettingsModal() {}
function applySettings() {
  refreshSettingsUI();
  var currentPage = getCurrentPageId();
  history.replaceState({ page: currentPage }, '', buildUrl(currentPage));
}
function updateCurrency() {}
function updateLanguage() {}
function updateCountry() {}

function updateNavLabels() {
  // Update nav bar items with translations
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  const navKeys = ['book', 'destinations', 'travelInfo', 'loyalty', null, 'help']; // skip cargo
  navItems.forEach((item, i) => {
    if (navKeys[i]) item.textContent = t(navKeys[i]);
  });

  // Update topbar buttons
  const manageBtn = document.querySelector('.topbar-btn');
  if (manageBtn) manageBtn.innerHTML = manageBtn.innerHTML.replace(/Manage[\s\S]*?Booking/, t('manageBooking'));
}

// ============ LOGIN ============

let loggedInUser = null;

function toggleLoginModal() {
  document.getElementById('loginOverlay').classList.toggle('hidden');
}

function togglePasswordVisibility() {
  const input = document.getElementById('loginPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!username || !password) return;

  // Call mock API
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username.includes('@') ? username : 'demo@rwandair.com', password: password || 'demo123' })
  })
  .then(r => r.json())
  .then(data => {
    if (data.token) {
      loggedInUser = data.user;
      localStorage.setItem('authToken', data.token);
      showLoggedInState(data.user);
    } else {
      // Show error
      document.getElementById('loginPassword').style.borderColor = 'var(--error)';
      setTimeout(() => document.getElementById('loginPassword').style.borderColor = '', 1500);
    }
  })
  .catch(() => {
    // Fallback: mock login
    loggedInUser = { firstName: 'Demo', lastName: 'User', dreammiles: { tier:'Silver', balance:48500, expiring:5000, expiringDate:'2026-09-30' } };
    showLoggedInState(loggedInUser);
  });
}

function showLoggedInState(user) {
  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
  document.getElementById('userAvatar').textContent = initials.toUpperCase();
  document.getElementById('userName').textContent = (user.firstName || '') + ' ' + (user.lastName || '');
  document.getElementById('userTier').textContent = (user.dreammiles?.tier || 'Blue') + ' Member';
  document.getElementById('milesBalance').textContent = (user.dreammiles?.balance || 0).toLocaleString();
  if (user.dreammiles?.expiring) {
    document.getElementById('milesExpiring').textContent =
      user.dreammiles.expiring.toLocaleString() + ' miles expiring ' +
      (user.dreammiles.expiringDate ? new Date(user.dreammiles.expiringDate).toLocaleDateString('en-US', {month:'short', year:'numeric'}) : '');
  }

  // Switch views
  document.querySelector('.login-modal .modal-body').classList.add('hidden');
  document.getElementById('loggedInView').classList.remove('hidden');

  // Update topbar
  document.getElementById('loginText').textContent = user.firstName || 'Account';

  // Fetch wallet balance
  var token = localStorage.getItem('authToken');
  if (token) {
    fetch('/api/wallet/balance', { headers:{ 'Authorization':'Bearer '+token } })
      .then(function(r) { return r.json(); })
      .then(function(w) {
        if (loggedInUser) loggedInUser.wallet = w;
        // Update wallet tab badge
        var badge = document.getElementById('walletTabBadge');
        if (badge && w.balance > 0) { badge.textContent = fmtPrice(w.balance); badge.style.display = ''; }
      }).catch(function(){});
  }
}

function doLogout() {
  const token = localStorage.getItem('authToken');
  if (token) {
    fetch('/api/auth/logout', { method:'POST', headers:{ 'Authorization':'Bearer '+token } }).catch(() => {});
    localStorage.removeItem('authToken');
  }
  loggedInUser = null;
  document.querySelector('.login-modal .modal-body').classList.remove('hidden');
  document.getElementById('loggedInView').classList.add('hidden');
  document.getElementById('loginText').textContent = 'Log in';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  toggleLoginModal();
}

// ============ CART ============

const cartItems = [];

// Restore cart from sessionStorage on load
(function loadCart() {
  try {
    var saved = localStorage.getItem('rwandair_cart');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) parsed.forEach(function(item) { cartItems.push(item); });
    }
  } catch(e) {}
})();

function saveCart() {
  try { localStorage.setItem('rwandair_cart', JSON.stringify(cartItems)); } catch(e) {}
}

function clearCartStorage() {
  try { localStorage.removeItem('rwandair_cart'); } catch(e) {}
}

function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('hidden');
}

function addToCart(flight) {
  cartItems.push(flight);
  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cartItems.splice(index, 1);
  saveCart();
  renderCart();
}

function renderCart() {
  const badge = document.getElementById('cartBadge');
  const empty = document.getElementById('cartEmpty');
  const items = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  var continueBtn = footer ? footer.querySelector('.btn-primary') : null;

  if (cartItems.length === 0) {
    badge.classList.add('hidden');
    empty.classList.remove('hidden');
    items.classList.add('hidden');
    footer.classList.remove('hidden');
    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.classList.add('btn-disabled');
      continueBtn.textContent = 'Select a flight to continue';
    }
    // Hide price rows when empty
    var priceRows = footer.querySelectorAll('.cart-total-row');
    priceRows.forEach(function(r) { r.style.display = 'none'; });
    return;
  }

  badge.classList.remove('hidden');
  badge.textContent = cartItems.length;
  empty.classList.add('hidden');
  items.classList.remove('hidden');
  footer.classList.remove('hidden');
  if (continueBtn) {
    continueBtn.disabled = false;
    continueBtn.classList.remove('btn-disabled');
    continueBtn.textContent = 'Continue Booking';
  }
  // Show price rows
  var priceRows = footer.querySelectorAll('.cart-total-row');
  priceRows.forEach(function(r) { r.style.display = ''; });

  let totalBase = 0, totalTax = 0;
  items.innerHTML = cartItems.map((item, i) => {
    // Support new bundled format and legacy flat format
    if (item.outbound) {
      // Bundled item (roundtrip or oneway)
      var ob = item.outbound;
      var ib = item.inbound;
      var obBase = ob.fare?.base || 0, obTax = ob.fare?.tax || 0;
      var ibBase = ib ? (ib.fare?.base || 0) : 0, ibTax = ib ? (ib.fare?.tax || 0) : 0;
      totalBase += obBase + ibBase;
      totalTax += obTax + ibTax;

      var tripLabel = ib ? 'Round Trip' : 'One Way';
      var route = ob.origin + ' ↔ ' + ob.destination;
      var totalPrice = (ob.fare?.total || 0) + (ib ? (ib.fare?.total || 0) : 0);

      var html = '<div class="cart-item cart-item-bundle">' +
        '<div class="cart-item-header">' +
          '<span class="cart-item-route">' + route + '</span>' +
          '<button class="cart-item-delete" onclick="removeFromCart(' + i + ')" title="Remove">🗑</button>' +
        '</div>' +
        '<div class="cart-item-trip-badge">' + tripLabel + '</div>' +
        '<div class="cart-item-leg">' +
          '<span class="cart-leg-dir">OUTBOUND</span>' +
          '<div class="cart-leg-details">' + ob.departure + ' → ' + ob.arrival + ' · ' + (ob.flightNumber || '') + ' · ' + (ob.duration || '') + '</div>' +
          '<div class="cart-leg-meta">' + (ob.cabin || '') + ' · ' + (ob.date || '') + ' · ' + fmtPrice(ob.fare?.total || 0) + '</div>' +
        '</div>';

      if (ib) {
        html += '<div class="cart-item-leg">' +
          '<span class="cart-leg-dir">RETURN</span>' +
          '<div class="cart-leg-details">' + ib.departure + ' → ' + ib.arrival + ' · ' + (ib.flightNumber || '') + ' · ' + (ib.duration || '') + '</div>' +
          '<div class="cart-leg-meta">' + (ib.cabin || '') + ' · ' + (ib.date || '') + ' · ' + fmtPrice(ib.fare?.total || 0) + '</div>' +
        '</div>';
      }

      html += '<div class="cart-item-total">' + fmtPrice(totalPrice) + '</div>';
      html += '</div>';
      return html;
    } else {
      // Legacy flat format
      var base = item.fare?.base || 0;
      var tax = item.fare?.tax || 0;
      totalBase += base;
      totalTax += tax;
      return '<div class="cart-item">' +
        '<div class="cart-item-header">' +
          '<span class="cart-item-route">' + item.origin + ' - ' + item.destination + '</span>' +
          '<button class="cart-item-delete" onclick="removeFromCart(' + i + ')" title="Remove">🗑</button>' +
        '</div>' +
        '<div class="cart-item-price">' + (item.fare?.label || '') + '</div>' +
        '<div class="cart-item-details">' + (item.cabin || 'Economy') + ' · ' + (item.duration || '') + ' · ' + (item.date || '') + '</div>' +
        '<div class="cart-item-details">' + (item.departure || '') + ' → ' + (item.arrival || '') + ' · ' + (item.flightNumber || '') + '</div>' +
      '</div>';
    }
  }).join('');

  document.getElementById('cartBaseFare').textContent = fmtPrice(totalBase);
  document.getElementById('cartTaxes').textContent = fmtPrice(totalTax);
  document.getElementById('cartTotal').textContent = fmtPrice(totalBase + totalTax);
}

function continueBookingFromCart() {
  if (cartItems.length > 0) {
    toggleCart();
    navigateTo('results');
  }
}

// Check for saved session on load
function checkSavedSession() {
  const token = localStorage.getItem('authToken');
  if (token) {
    fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => {
        loggedInUser = user;
        showLoggedInState(user);
      })
      .catch(() => localStorage.removeItem('authToken'));
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', initNotifications);
document.addEventListener('DOMContentLoaded', initNLF);
document.addEventListener('DOMContentLoaded', checkSavedSession);
document.addEventListener('DOMContentLoaded', renderCart);
console.log('RwandAir Prototype loaded');

// ============ NATURAL LANGUAGE FORM (NLF) ============

const AIRPORTS_NLF = [
  { city: 'Nairobi', code: 'NBO', country: 'Kenya' },
  { city: 'Dubai', code: 'DXB', country: 'UAE' },
  { city: 'London', code: 'LHR', country: 'United Kingdom' },
  { city: 'Lagos', code: 'LOS', country: 'Nigeria' },
  { city: 'Johannesburg', code: 'JNB', country: 'South Africa' },
  { city: 'Addis Ababa', code: 'ADD', country: 'Ethiopia' },
  { city: 'Dar es Salaam', code: 'DAR', country: 'Tanzania' },
  { city: 'Entebbe', code: 'EBB', country: 'Uganda' },
  { city: 'Bujumbura', code: 'BJM', country: 'Burundi' },
  { city: 'Brussels', code: 'BRU', country: 'Belgium' },
  { city: 'Paris', code: 'CDG', country: 'France' },
  { city: 'Mumbai', code: 'BOM', country: 'India' },
  { city: 'Accra', code: 'ACC', country: 'Ghana' },
  { city: 'Cape Town', code: 'CPT', country: 'South Africa' },
  { city: 'Lusaka', code: 'LUN', country: 'Zambia' },
  { city: 'Harare', code: 'HRE', country: 'Zimbabwe' },
  { city: 'Mombasa', code: 'MBA', country: 'Kenya' },
  { city: 'Mauritius', code: 'MRU', country: 'Mauritius' },
  { city: 'Kigali', code: 'KGL', country: 'Rwanda' },
];

let nlfVisible = true;

function initNLF() {
  const nlfCard = document.getElementById('nlfCard');
  if (!nlfCard) return;

  // Set default dates
  const today = new Date();
  const depart = new Date(today);
  depart.setDate(depart.getDate() + 14);
  const ret = new Date(depart);
  ret.setDate(ret.getDate() + 7);

  const gapDepart = document.getElementById('nlfGapDepart');
  const gapReturn = document.getElementById('nlfGapReturn');
  if (gapDepart) {
    const departISO = depart.toISOString().split('T')[0];
    gapDepart.textContent = formatDateDisplay(departISO);
    gapDepart.classList.remove('nlf-gap--empty');
    gapDepart.classList.add('nlf-gap--filled');
    document.getElementById('searchDepart').value = departISO;
  }
  if (gapReturn) {
    const retISO = ret.toISOString().split('T')[0];
    gapReturn.textContent = formatDateDisplay(retISO);
    gapReturn.classList.remove('nlf-gap--empty');
    gapReturn.classList.add('nlf-gap--filled');
    document.getElementById('searchReturn').value = retISO;
  }

  // Trip toggle buttons
  nlfCard.querySelectorAll('.nlf-trip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nlfCard.querySelectorAll('.nlf-trip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tripType = btn.dataset.trip;
      const returnClause = document.getElementById('nlfReturnClause');
      const sentence = document.getElementById('nlfSentence');
      const mcSection = document.getElementById('nlfMulticity');

      if (tripType === 'multicity') {
        multicityMode = true;
        if (sentence) sentence.classList.add('hidden');
        if (mcSection) { mcSection.classList.remove('hidden'); renderNlfMulticityLegs(); }
        if (returnClause) returnClause.style.display = 'none';
      } else {
        multicityMode = false;
        if (sentence) sentence.classList.remove('hidden');
        if (mcSection) mcSection.classList.add('hidden');
        if (returnClause) returnClause.style.display = tripType === 'oneway' ? 'none' : '';
      }
    });
  });

  // City gaps (From / To)
  setupCityGap('nlfGapFrom', 'searchFrom');
  setupCityGap('nlfGapTo', 'searchTo');

  // Date gaps
  setupDateGap('nlfGapDepart', 'searchDepart');
  setupDateGap('nlfGapReturn', 'searchReturn');

  // Passenger gap
  setupOptionGap('nlfGapPax', 'searchPax', [
    '1 adult', '2 adults', '3 adults',
    '1 adult, 1 child', '2 adults, 1 child', '2 adults, 2 children'
  ]);

  // Class gap
  setupOptionGap('nlfGapClass', 'searchClass', ['Economy', 'Business']);
}

function setupCityGap(gapId, hiddenId) {
  const gap = document.getElementById(gapId);
  if (!gap) return;

  const wrapper = gap.closest('.nlf-gap-wrapper');
  let sugBox = wrapper.querySelector('.nlf-suggestions');
  if (!sugBox) {
    sugBox = document.createElement('div');
    sugBox.className = 'nlf-suggestions';
    wrapper.appendChild(sugBox);
  }

  let activeIdx = -1;

  gap.addEventListener('focus', () => {
    cleanEmptyGap(gap);
    showCitySuggestions(gap, sugBox, '');
  });

  gap.addEventListener('input', () => {
    const q = gap.textContent.trim();
    showCitySuggestions(gap, sugBox, q);
  });

  gap.addEventListener('keydown', (e) => {
    const items = sugBox.querySelectorAll('.nlf-suggestion-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      updateActiveSuggestion(items, activeIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      updateActiveSuggestion(items, activeIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) {
        acceptCitySuggestion(gap, hiddenId, items[activeIdx], sugBox);
      }
      activeIdx = -1;
    } else if (e.key === 'Escape') {
      sugBox.style.display = 'none';
      gap.blur();
    } else if (e.key === 'Tab') {
      if (activeIdx >= 0 && items[activeIdx]) {
        e.preventDefault();
        acceptCitySuggestion(gap, hiddenId, items[activeIdx], sugBox);
      }
      sugBox.style.display = 'none';
      activeIdx = -1;
    }
  });

  gap.addEventListener('blur', () => {
    setTimeout(() => { sugBox.style.display = 'none'; activeIdx = -1; }, 200);
  });
}

function showCitySuggestions(gap, sugBox, query) {
  const q = query.toLowerCase();
  const matches = AIRPORTS_NLF.filter(a =>
    a.city.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q)
  ).slice(0, 6);

  if (matches.length === 0) { sugBox.style.display = 'none'; return; }

  sugBox.innerHTML = matches.map(a =>
    `<div class="nlf-suggestion-item" data-city="${a.city}" data-code="${a.code}">
      <span>${a.city}, ${a.country}</span>
      <span class="nlf-suggestion-code">${a.code}</span>
    </div>`
  ).join('');
  sugBox.style.display = 'block';

  sugBox.querySelectorAll('.nlf-suggestion-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      acceptCitySuggestion(gap, gap.id === 'nlfGapFrom' ? 'searchFrom' : 'searchTo', item, sugBox);
    });
  });
}

function acceptCitySuggestion(gap, hiddenId, item, sugBox) {
  const city = item.dataset.city;
  const code = item.dataset.code;
  gap.textContent = `${city} (${code})`;
  gap.classList.remove('nlf-gap--empty');
  gap.classList.add('nlf-gap--filled');
  document.getElementById(hiddenId).value = `${city} (${code})`;
  sugBox.style.display = 'none';

  // Auto-advance to next gap
  const nextGap = gap.closest('.nlf-sentence')?.querySelector('.nlf-gap--empty');
  if (nextGap) setTimeout(() => nextGap.focus(), 100);
}

function updateActiveSuggestion(items, idx) {
  items.forEach((it, i) => {
    it.classList.toggle('nlf-suggestion-item--active', i === idx);
  });
}

function setupDateGap(gapId, hiddenId) {
  const gap = document.getElementById(gapId);
  if (!gap) return;

  gap.addEventListener('focus', () => { cleanEmptyGap(gap); });

  gap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = parseNLFDate(gap.textContent.trim());
      if (parsed) {
        acceptDate(gap, hiddenId, parsed);
      } else {
        gap.classList.add('nlf-gap--error');
        setTimeout(() => gap.classList.remove('nlf-gap--error'), 600);
      }
    }
  });

  gap.addEventListener('blur', () => {
    const text = gap.textContent.trim();
    if (!text || text === gap.dataset.placeholder) {
      gap.textContent = gap.dataset.placeholder;
      gap.classList.add('nlf-gap--empty');
      gap.classList.remove('nlf-gap--filled');
      return;
    }
    const parsed = parseNLFDate(text);
    if (parsed) {
      acceptDate(gap, hiddenId, parsed);
    }
  });
}

function parseNLFDate(input) {
  if (!input) return null;
  const clean = input.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  // Try native Date parse first
  let d = new Date(clean);
  if (!isNaN(d) && d.getFullYear() > 2020) return d;

  // Try "26 Mar 2026" or "Mar 26 2026"
  const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
  const parts = clean.split(/[\s\-\/]+/);
  if (parts.length >= 2) {
    for (let i = 0; i < parts.length; i++) {
      const m = months[parts[i].toLowerCase().substring(0, 3)];
      if (m !== undefined) {
        const dayStr = parts[i - 1] || parts[i + 1];
        const yearStr = parts[i + 2] || parts[i + 1];
        const day = parseInt(dayStr);
        let year = parseInt(yearStr);
        if (isNaN(year) || year < 100) year = new Date().getFullYear();
        if (year < 100) year += 2000;
        if (day >= 1 && day <= 31) return new Date(year, m, day);
      }
    }
  }

  // Try relative: "tomorrow", "next week", "+7 days"
  const today = new Date();
  const lower = clean.toLowerCase();
  if (lower === 'tomorrow') { today.setDate(today.getDate() + 1); return today; }
  if (lower === 'next week') { today.setDate(today.getDate() + 7); return today; }
  const plusMatch = lower.match(/\+\s*(\d+)\s*d/);
  if (plusMatch) { today.setDate(today.getDate() + parseInt(plusMatch[1])); return today; }

  return null;
}

function acceptDate(gap, hiddenId, date) {
  const iso = date.toISOString().split('T')[0];
  gap.textContent = formatDateDisplay(iso);
  gap.classList.remove('nlf-gap--empty', 'nlf-gap--error');
  gap.classList.add('nlf-gap--filled');
  document.getElementById(hiddenId).value = iso;

  const nextGap = gap.closest('.nlf-sentence')?.querySelector('.nlf-gap--empty');
  if (nextGap) setTimeout(() => nextGap.focus(), 100);
}

function setupOptionGap(gapId, hiddenId, options) {
  const gap = document.getElementById(gapId);
  if (!gap) return;

  const wrapper = gap.closest('.nlf-gap-wrapper');
  let sugBox = wrapper.querySelector('.nlf-suggestions');
  if (!sugBox) {
    sugBox = document.createElement('div');
    sugBox.className = 'nlf-suggestions';
    wrapper.appendChild(sugBox);
  }

  let activeIdx = -1;

  function showOptions() {
    sugBox.innerHTML = options.map(opt =>
      `<div class="nlf-suggestion-item" data-value="${opt}"><span>${opt}</span></div>`
    ).join('');
    sugBox.style.display = 'block';

    sugBox.querySelectorAll('.nlf-suggestion-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        gap.textContent = item.dataset.value;
        gap.classList.remove('nlf-gap--empty');
        gap.classList.add('nlf-gap--filled');
        document.getElementById(hiddenId).value = item.dataset.value;
        sugBox.style.display = 'none';
        const nextGap = gap.closest('.nlf-sentence')?.querySelector('.nlf-gap--empty');
        if (nextGap) setTimeout(() => nextGap.focus(), 100);
      });
    });
  }

  gap.addEventListener('focus', () => { cleanEmptyGap(gap); showOptions(); });
  gap.addEventListener('blur', () => {
    setTimeout(() => { sugBox.style.display = 'none'; activeIdx = -1; }, 200);
  });

  gap.addEventListener('keydown', (e) => {
    const items = sugBox.querySelectorAll('.nlf-suggestion-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      updateActiveSuggestion(items, activeIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      updateActiveSuggestion(items, activeIdx);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) {
        items[activeIdx].dispatchEvent(new Event('mousedown'));
      }
      sugBox.style.display = 'none';
      activeIdx = -1;
    }
  });
}

function cleanEmptyGap(gap) {
  const text = gap.textContent.trim();
  if (text === gap.dataset.placeholder || gap.classList.contains('nlf-gap--empty')) {
    gap.textContent = '';
  }
}

function toggleAdvancedSearch(e) {
  if (e) e.preventDefault();
  const nlfCard = document.getElementById('nlfCard');
  const searchCard = document.getElementById('searchCard');
  if (!nlfCard || !searchCard) return;

  nlfVisible = !nlfVisible;
  nlfCard.classList.toggle('hidden', !nlfVisible);
  searchCard.classList.toggle('hidden', nlfVisible);

  // Sync values when switching to classic
  if (!nlfVisible) {
    const from = document.getElementById('searchFrom')?.value || '';
    const to = document.getElementById('searchTo')?.value || '';
    const depart = document.getElementById('searchDepart')?.value || '';
    const ret = document.getElementById('searchReturn')?.value || '';
    const advFrom = document.getElementById('advSearchFrom');
    const advTo = document.getElementById('advSearchTo');
    const advDepart = document.getElementById('advSearchDepart');
    const advReturn = document.getElementById('advSearchReturn');
    if (advFrom) advFrom.value = from;
    if (advTo) advTo.value = to;
    if (advDepart) advDepart.value = depart;
    if (advReturn) advReturn.value = ret;
  }
}
