/**
 * RwandAir Mock Backend — server.js
 * Simulates the actual booking.rwandair.com / api-book.rwandair.com behaviour
 * including realistic pricing, routes, holds, PNR generation and the
 * documented 24-72hr payment-settlement delay.
 */

const express = require('express');
const path    = require('path');
const crypto  = require('crypto');
const os      = require('os');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─────────────────────────────────────────────────────────────────────────────
// AUTH STORE
// ─────────────────────────────────────────────────────────────────────────────
const USERS = new Map([
  ['demo@rwandair.com', {
    id:'USR001', email:'demo@rwandair.com', password:'demo123',
    firstName:'Jean', lastName:'Uwimana', phone:'+250788123456',
    dreammiles:{ memberId:'DM-123456', tier:'Silver', balance:48500, expiring:5000, expiringDate:'2026-09-30' },
    wallet:{ balance:125000, currency:'RWF', transactions:[
      { id:'TXN001', type:'credit', amount:125000, currency:'RWF', reason:'Partial refund from exchange PNR 7HAN7N', bookingRef:'WB-2025-DXB-44210', date:'2026-02-20T10:30:00Z' },
    ]}
  }],
]);

// ── ADMIN USERS ──
const ADMIN_USERS = new Map([
  ['admin@rwandair.com', { id:'ADM001', email:'admin@rwandair.com', password:'admin123', firstName:'Alice', lastName:'Mukamana', role:'super_admin' }],
  ['ops@rwandair.com', { id:'ADM002', email:'ops@rwandair.com', password:'ops123', firstName:'Bob', lastName:'Nshimiyimana', role:'manager' }],
  ['finance@rwandair.com', { id:'ADM003', email:'finance@rwandair.com', password:'fin123', firstName:'Claire', lastName:'Ingabire', role:'finance' }],
  ['viewer@rwandair.com', { id:'ADM004', email:'viewer@rwandair.com', password:'view123', firstName:'David', lastName:'Habimana', role:'viewer' }],
]);
const ADMIN_SESSIONS = new Map();

// ── PROMO CODES ──
const PROMO_CODES = {
  'DREAM10': { discount:10, type:'percent', description:'10% off with DreamMiles', minAmount:50000, active:true },
  'FIRST20': { discount:20, type:'percent', description:'20% off first booking', minAmount:0, active:true },
  'SAVE50K': { discount:50000, type:'fixed', description:'RWF 50,000 off', minAmount:200000, active:true },
  'WELCOME': { discount:15, type:'percent', description:'15% welcome discount', minAmount:0, active:true },
};

// ── CMS DATA ──
const CMS_DATA = {
  text: new Map([
    ['txt-001', { id:'txt-001', title:'About RwandAir', section:'about', body:'RwandAir is the national carrier of Rwanda...', status:'published', updatedAt:'2026-01-15' }],
    ['txt-002', { id:'txt-002', title:'Baggage Policy', section:'travel-info', body:'Each passenger is entitled to carry-on and checked luggage...', status:'published', updatedAt:'2026-02-01' }],
  ]),
  banners: new Map([
    ['ban-001', { id:'ban-001', title:'Dream Destinations Sale', imageUrl:'https://www.rwandair.com/dist/phoenix/V1.0/img/DXB.jpg', link:'/destinations', position:'hero', status:'active', startDate:'2026-03-01', endDate:'2026-04-30' }],
    ['ban-002', { id:'ban-002', title:'Fly to London from $499', imageUrl:'https://www.rwandair.com/dist/phoenix/V1.0/img/LHR.jpg', link:'/results', position:'hero', status:'active', startDate:'2026-03-01', endDate:'2026-05-15' }],
  ]),
  menus: new Map([
    ['menu-001', { id:'menu-001', label:'Book', slug:'book', parentId:null, position:1, children:['Search Flights','Multi-City','Manage Booking'] }],
    ['menu-002', { id:'menu-002', label:'Destinations', slug:'destinations', parentId:null, position:2, children:['Africa','Middle East','Europe','Asia'] }],
  ]),
  careers: new Map([
    ['car-001', { id:'car-001', title:'Senior Software Engineer', department:'IT', location:'Kigali', type:'Full-time', description:'Join our digital transformation team...', deadline:'2026-04-30', status:'open' }],
    ['car-002', { id:'car-002', title:'Cabin Crew', department:'Operations', location:'Kigali', type:'Full-time', description:'Deliver world-class in-flight service...', deadline:'2026-05-15', status:'open' }],
  ]),
  faqs: new Map([
    ['faq-001', { id:'faq-001', question:'How do I check in online?', answer:'You can check in online 24 hours before departure via our website or mobile app.', category:'Check-in', order:1 }],
    ['faq-002', { id:'faq-002', question:'What is the baggage allowance?', answer:'Economy: 23kg checked + 7kg cabin. Business: 2×32kg checked + 10kg cabin.', category:'Baggage', order:2 }],
    ['faq-003', { id:'faq-003', question:'Can I change my flight?', answer:'Yes, via Manage Booking. Change fees may apply depending on fare type.', category:'Booking', order:3 }],
    ['faq-004', { id:'faq-004', question:'How do I earn DreamMiles?', answer:'DreamMiles are earned on every flight. Silver tier earns 1 mile per RWF 1,370 spent.', category:'Loyalty', order:4 }],
  ]),
  offices: new Map([
    ['off-001', { id:'off-001', name:'Kigali Head Office', address:'KN 4 Ave, Kigali, Rwanda', phone:'+250 788 177 000', email:'info@rwandair.com', hours:'Mon-Fri 8:00-17:00' }],
    ['off-002', { id:'off-002', name:'Nairobi Office', address:'Loita St, Nairobi, Kenya', phone:'+254 20 271 7777', email:'nairobi@rwandair.com', hours:'Mon-Fri 8:30-17:30' }],
    ['off-003', { id:'off-003', name:'Dubai Office', address:'Deira, Dubai, UAE', phone:'+971 4 295 4222', email:'dubai@rwandair.com', hours:'Sun-Thu 9:00-18:00' }],
  ]),
  'payment-methods': new Map([
    ['pm-001', { id:'pm-001', name:'MTN Mobile Money', provider:'MTN', countries:['RW','UG','CM'], status:'active', icon:'📱' }],
    ['pm-002', { id:'pm-002', name:'Airtel Money', provider:'Airtel', countries:['RW','KE','UG'], status:'active', icon:'📱' }],
    ['pm-003', { id:'pm-003', name:'Irembo', provider:'Irembo', countries:['RW'], status:'active', icon:'🏛' }],
    ['pm-004', { id:'pm-004', name:'Cellulant', provider:'Cellulant', countries:['KE','NG','TZ','GH'], status:'active', icon:'💳' }],
  ]),
  'fare-matrix': new Map([
    ['fm-001', { id:'fm-001', route:'KGL-NBO', lite:246575, classic:290000, business:1160000, currency:'RWF' }],
    ['fm-002', { id:'fm-002', route:'KGL-DXB', lite:658000, classic:774000, business:3096000, currency:'RWF' }],
    ['fm-003', { id:'fm-003', route:'KGL-LHR', lite:890000, classic:1047000, business:4188000, currency:'RWF' }],
  ]),
  t2f: new Map([
    ['t2f-001', { id:'t2f-001', title:'Arrive Early', body:'We recommend arriving 3 hours before international flights.', order:1 }],
    ['t2f-002', { id:'t2f-002', title:'Travel Documents', body:'Ensure passport is valid for at least 6 months beyond travel date.', order:2 }],
  ]),
};
const SESSIONS = new Map(); // token -> userId

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.replace('Bearer ','').trim();
  const userId = SESSIONS.get(token);
  if (!userId) return res.status(401).json({ error:'Not authenticated' });
  req.user = [...USERS.values()].find(u => u.id === userId);
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const AIRPORTS = [
  { code:'KGL', name:'Kigali International Airport',                        city:'Kigali',        country:'Rwanda' },
  { code:'LHR', name:'Heathrow Airport',                                    city:'London',        country:'United Kingdom' },
  { code:'BRU', name:'Brussels Airport',                                    city:'Brussels',      country:'Belgium' },
  { code:'CDG', name:'Charles de Gaulle Airport',                           city:'Paris',         country:'France' },
  { code:'DXB', name:'Dubai International Airport',                         city:'Dubai',         country:'UAE' },
  { code:'NBO', name:'Jomo Kenyatta International Airport',                 city:'Nairobi',       country:'Kenya' },
  { code:'JNB', name:'OR Tambo International Airport',                      city:'Johannesburg',  country:'South Africa' },
  { code:'CPT', name:'Cape Town International Airport',                     city:'Cape Town',     country:'South Africa' },
  { code:'ADD', name:'Bole International Airport',                          city:'Addis Ababa',   country:'Ethiopia' },
  { code:'LOS', name:'Murtala Muhammed International Airport',              city:'Lagos',         country:'Nigeria' },
  { code:'ACC', name:'Kotoka International Airport',                        city:'Accra',         country:'Ghana' },
  { code:'DAR', name:'Julius Nyerere International Airport',                city:'Dar es Salaam', country:'Tanzania' },
  { code:'EBB', name:'Entebbe International Airport',                       city:'Entebbe',       country:'Uganda' },
  { code:'BJM', name:'Bujumbura International Airport',                     city:'Bujumbura',     country:'Burundi' },
  { code:'BOM', name:'Chhatrapati Shivaji Maharaj International Airport',   city:'Mumbai',        country:'India' },
  { code:'LUN', name:'Kenneth Kaunda International Airport',                city:'Lusaka',        country:'Zambia' },
  { code:'HRE', name:'Robert Gabriel Mugabe International Airport',         city:'Harare',        country:'Zimbabwe' },
  { code:'MBA', name:'Moi International Airport',                           city:'Mombasa',       country:'Kenya' },
  { code:'MRU', name:'Sir Seewoosagur Ramgoolam International Airport',     city:'Mauritius',     country:'Mauritius' },
];

// Route config: key = ORIGIN-DEST (always KGL-based)
// baseEco / baseBus = price before tax in RWF
const ROUTES = {
  'KGL-LHR': { duration:'8h 45m', mins:525,  stops:0, stopCode:null,  aircraft:'Boeing 787-8 Dreamliner', baseEco:1050000, baseBus:4200000 },
  'KGL-BRU': { duration:'8h 30m', mins:510,  stops:0, stopCode:null,  aircraft:'Boeing 737 MAX 8',         baseEco:980000,  baseBus:3900000 },
  'KGL-CDG': { duration:'10h 20m',mins:620,  stops:1, stopCode:'BRU', aircraft:'Boeing 737 MAX 8',         baseEco:920000,  baseBus:3700000 },
  'KGL-DXB': { duration:'5h 30m', mins:330,  stops:0, stopCode:null,  aircraft:'Boeing 737 MAX 8',         baseEco:680000,  baseBus:2700000 },
  'KGL-NBO': { duration:'1h 45m', mins:105,  stops:0, stopCode:null,  aircraft:'Bombardier CRJ-900',       baseEco:195000,  baseBus:780000  },
  'KGL-JNB': { duration:'3h 20m', mins:200,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:450000,  baseBus:1800000 },
  'KGL-CPT': { duration:'5h 10m', mins:310,  stops:1, stopCode:'JNB', aircraft:'Boeing 737-800',           baseEco:530000,  baseBus:2120000 },
  'KGL-ADD': { duration:'2h 15m', mins:135,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:280000,  baseBus:1120000 },
  'KGL-LOS': { duration:'4h 30m', mins:270,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:520000,  baseBus:2080000 },
  'KGL-ACC': { duration:'5h 15m', mins:315,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:580000,  baseBus:2320000 },
  'KGL-DAR': { duration:'1h 30m', mins:90,   stops:0, stopCode:null,  aircraft:'Bombardier CRJ-900',       baseEco:175000,  baseBus:700000  },
  'KGL-EBB': { duration:'0h 45m', mins:45,   stops:0, stopCode:null,  aircraft:'Bombardier CRJ-200',       baseEco:95000,   baseBus:380000  },
  'KGL-BJM': { duration:'0h 35m', mins:35,   stops:0, stopCode:null,  aircraft:'Bombardier CRJ-200',       baseEco:75000,   baseBus:300000  },
  'KGL-BOM': { duration:'9h 15m', mins:555,  stops:1, stopCode:'DXB', aircraft:'Boeing 737 MAX 8',         baseEco:820000,  baseBus:3280000 },
  'KGL-LUN': { duration:'3h 45m', mins:225,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:395000,  baseBus:1580000 },
  'KGL-HRE': { duration:'3h 30m', mins:210,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:370000,  baseBus:1480000 },
  'KGL-MBA': { duration:'1h 55m', mins:115,  stops:0, stopCode:null,  aircraft:'Bombardier CRJ-900',       baseEco:210000,  baseBus:840000  },
  'KGL-MRU': { duration:'4h 10m', mins:250,  stops:0, stopCode:null,  aircraft:'Boeing 737-800',           baseEco:490000,  baseBus:1960000 },
};

const DEPARTURE_SLOTS = [
  { h:6,  m:30, num:'01', seats:4  },
  { h:10, m:0,  num:'05', seats:12 },
  { h:14, m:45, num:'07', seats:7  },
  { h:19, m:15, num:'09', seats:18 },
];

const RETURN_SLOTS = [
  { h:7,  m:0,  num:'02', seats:9  },
  { h:11, m:30, num:'06', seats:14 },
  { h:16, m:0,  num:'08', seats:5  },
  { h:21, m:0,  num:'10', seats:21 },
];

// In-memory stores
const holds    = new Map();
const bookings = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function addMins(h, m, mins) {
  const t = h * 60 + m + mins;
  return { h: Math.floor(t / 60) % 24, m: t % 60, nextDay: t >= 1440 };
}

function fmtTime(h, m, nextDay) {
  return `${pad(h)}:${pad(m)}${nextDay ? '<sup>+1</sup>' : ''}`;
}

function fmtMoney(n) {
  return 'RWF ' + n.toLocaleString('en-US');
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function generateRef() {
  return 'WB' + Date.now().toString(36).toUpperCase().slice(-5) +
         Math.random().toString(36).toUpperCase().slice(2, 4);
}

function getRoute(origin, dest) {
  return ROUTES[`${origin}-${dest}`] || ROUTES[`${dest}-${origin}`] || null;
}

function buildFlights(origin, dest, date, cabin, pax) {
  const route = getRoute(origin, dest);
  if (!route) return [];

  const isReturn = origin !== 'KGL' && dest === 'KGL';
  const slots    = isReturn ? RETURN_SLOTS : DEPARTURE_SLOTS;
  const TAX_RATE  = 0.18;
  const priceFactors = [1.0, 0.88, 1.12, 0.82];
  const paxCount = (pax.adults||1) + (pax.children||0);

  // Fare family multipliers relative to economy base
  const fareMultipliers = {
    lite:     0.85,   // ~15% cheaper than classic
    classic:  1.0,    // base economy price
    business: 4.0     // ~4x economy (based on baseBus/baseEco ratio)
  };

  return slots.map((slot, i) => {
    const arr = addMins(slot.h, slot.m, route.mins);
    const ecoBase = Math.round(route.baseEco * priceFactors[i]);

    // Build fares for all families
    const fares = {};
    for (const [family, mult] of Object.entries(fareMultipliers)) {
      const base  = Math.round(ecoBase * mult);
      const tax   = Math.round(base * TAX_RATE);
      const total = base + tax;
      fares[family] = {
        base, tax, total,
        totalAllPax: total * paxCount,
        currency: 'RWF',
        label: fmtMoney(total),
        labelTotal: fmtMoney(total * paxCount),
      };
    }

    // Primary fare for the searched cabin (backward compat)
    const primaryFare = cabin === 'business' ? fares.business : fares.classic;

    return {
      id:           `WB${slot.num}-${origin}-${dest}-${date.replace(/-/g,'')}`,
      flightNumber: `WB ${slot.num}${i+1}`,
      origin,
      destination:  dest,
      date,
      departure:    `${pad(slot.h)}:${pad(slot.m)}`,
      arrival:      `${pad(arr.h)}:${pad(arr.m)}`,
      arrivalNextDay: arr.nextDay,
      duration:     route.duration,
      stops:        route.stops,
      stopCity:     route.stopCode,
      aircraft:     route.aircraft,
      cabin,
      seatsLeft:    slot.seats,
      fare: primaryFare,
      fares,          // all fare families
      amenities: cabin === 'business'
        ? ['Lie-flat seat','Premium dining','Priority boarding','2x 40kg baggage','Lounge access']
        : ['1x 23kg baggage','Meal included','USB charging','Carry-on 7kg'],
      isBestValue: i === 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/* GET /api/health */
app.get('/api/health', (_req, res) => {
  res.json({ status:'ok', version:'1.0.0', ts: new Date().toISOString() });
});

/* GET /api/airports?q=lon  — autocomplete */
app.get('/api/airports', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (q.length < 2) return res.json([]);
  const results = AIRPORTS.filter(a =>
    a.code.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q)
  ).slice(0, 8);
  res.json(results);
});

/* GET /api/airports/:code */
app.get('/api/airports/:code', (req, res) => {
  const a = AIRPORTS.find(x => x.code === req.params.code.toUpperCase());
  if (!a) return res.status(404).json({ error:'Airport not found' });
  res.json(a);
});

/* GET /api/routes — all available routes */
app.get('/api/routes', (_req, res) => {
  const list = Object.entries(ROUTES).map(([key, r]) => {
    const [o, d] = key.split('-');
    return { origin:o, destination:d, ...r };
  });
  res.json(list);
});

/* POST /api/flights/search */
app.post('/api/flights/search', (req, res) => {
  const {
    origin, destination, departDate, returnDate,
    adults=1, children=0, infants=0,
    cabin='economy', tripType='round'
  } = req.body;

  if (!origin || !destination || !departDate)
    return res.status(400).json({ error:'origin, destination and departDate are required' });

  const O = origin.toUpperCase(), D = destination.toUpperCase();
  const pax = { adults:+adults, children:+children, infants:+infants };

  if (!getRoute(O, D))
    return res.json({
      outbound:[], inbound:[],
      message:`RwandAir does not currently operate on the ${O}–${D} route. All routes operate via Kigali hub.`
    });

  const outbound = buildFlights(O, D, departDate, cabin, pax);
  const inbound  = (tripType === 'round' && returnDate)
    ? buildFlights(D, O, returnDate, cabin, pax)
    : [];

  // Simulate network latency
  setTimeout(() => res.json({
    outbound, inbound,
    searchId:    crypto.randomUUID(),
    passengers:  pax,
    cabin,
    tripType,
  }), 700);
});

/* POST /api/bookings/hold — create a 15-min PNR hold */
app.post('/api/bookings/hold', (req, res) => {
  const { outboundFlight, inboundFlight, passengers, cabin } = req.body;
  if (!outboundFlight) return res.status(400).json({ error:'outboundFlight required' });

  const holdRef   = generateRef();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  holds.set(holdRef, {
    holdRef, expiresAt, outboundFlight,
    inboundFlight: inboundFlight || null,
    passengers, cabin, status:'on_hold',
    createdAt: new Date().toISOString(),
  });

  setTimeout(() => res.json({ holdRef, expiresAt, status:'on_hold' }), 350);
});

/* GET /api/bookings/hold/:ref */
app.get('/api/bookings/hold/:ref', (req, res) => {
  const hold = holds.get(req.params.ref.toUpperCase());
  if (!hold) return res.status(404).json({ error:'Hold not found or expired' });
  const expired = new Date() > new Date(hold.expiresAt);
  res.json({ ...hold, expired });
});

/* POST /api/bookings/confirm — payment & ticket issuance */
app.post('/api/bookings/confirm', (req, res) => {
  const { holdRef, passengerDetails, contactDetails } = req.body;
  const hold = holds.get((holdRef||'').toUpperCase());
  if (!hold) return res.status(404).json({ error:'Hold not found or expired. Please start a new search.' });

  const bookingRef = generateRef();
  const paxCount   = (passengerDetails||[]).length || 1;
  const fare       = hold.outboundFlight.fare;

  const booking = {
    bookingRef,
    pnr:           bookingRef,
    status:        'confirmed',
    holdRef,
    outboundFlight: hold.outboundFlight,
    inboundFlight:  hold.inboundFlight,
    passengers:    passengerDetails || [],
    contact:       contactDetails || {},
    cabin:         hold.cabin,
    fare: {
      ...fare,
      totalAllPax: fare.total * paxCount,
      labelTotal:  fmtMoney(fare.total * paxCount),
    },
    // Simulate real RwandAir payment delay (documented in audit)
    paymentStatus: 'pending_settlement',
    paymentNote:   'Payment is processing and may take 24–72 hours to appear on your bank statement. Your booking is confirmed and your e-ticket is valid.',
    etickets: (passengerDetails||[{firstName:'Passenger',lastName:'1'}]).map((p, i) => ({
      number:    `232-${Date.now().toString().slice(-7)}${i}`,
      passenger: `${p.firstName||''} ${p.lastName||''}`.trim(),
      status:    'issued',
      seat:      `${String.fromCharCode(65 + Math.floor(Math.random()*6))}${Math.floor(Math.random()*30)+1}`,
    })),
    dreamMilesEarned: Math.round(fare.base * 0.001),
    checkinOpensAt: null,
    createdAt: new Date().toISOString(),
  };

  bookings.set(bookingRef, booking);
  holds.delete(holdRef);

  // Simulate processing time
  setTimeout(() => res.json(booking), 1400);
});

/* POST /api/bookings/t2t-hold — Time-to-Think extended hold (24h/48h/72h) */
const T2T_OPTIONS = {
  '24h': { hours: 24, fee: 15000, label: '24 Hours' },
  '48h': { hours: 48, fee: 25000, label: '48 Hours' },
  '72h': { hours: 72, fee: 35000, label: '72 Hours' },
};

app.post('/api/bookings/t2t-hold', (req, res) => {
  const { outboundFlight, inboundFlight, passengers, cabin, duration, passengerDetails, contactDetails } = req.body;
  if (!outboundFlight) return res.status(400).json({ error: 'outboundFlight required' });
  if (!duration || !T2T_OPTIONS[duration]) return res.status(400).json({ error: 'Invalid duration. Use 24h, 48h, or 72h' });

  const option = T2T_OPTIONS[duration];
  const holdRef = 'T2T-' + generateRef();
  const expiresAt = new Date(Date.now() + option.hours * 60 * 60 * 1000).toISOString();

  holds.set(holdRef, {
    holdRef,
    type: 'time-to-think',
    expiresAt,
    duration: option.label,
    holdFee: option.fee,
    holdFeeLabel: fmtMoney(option.fee),
    outboundFlight,
    inboundFlight: inboundFlight || null,
    passengers,
    passengerDetails: passengerDetails || [],
    contactDetails: contactDetails || {},
    cabin,
    status: 'on_hold',
    createdAt: new Date().toISOString(),
  });

  setTimeout(() => res.json({
    holdRef,
    expiresAt,
    duration: option.label,
    holdFee: option.fee,
    holdFeeLabel: fmtMoney(option.fee),
    status: 'on_hold',
    message: `Your fare is held for ${option.label}. Pay the full amount before ${new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} to confirm your booking.`
  }), 800);
});

/* GET /api/t2t-options — return T2T pricing */
app.get('/api/t2t-options', (req, res) => {
  res.json({ options: Object.entries(T2T_OPTIONS).map(([key, val]) => ({ key, ...val, feeLabel: fmtMoney(val.fee) })) });
});

/* GET /api/bookings/:ref */
app.get('/api/bookings/:ref', (req, res) => {
  const b = bookings.get(req.params.ref.toUpperCase());
  if (!b) return res.status(404).json({ error:'Booking not found' });
  res.json(b);
});

/* POST /api/dreammiles/lookup */
app.post('/api/dreammiles/lookup', (req, res) => {
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ error:'memberId required' });
  setTimeout(() => res.json({
    memberId, tier:'Silver', name:'DEMO MEMBER',
    balance:48500, expiring:5000, expiringDate:'2026-06-30',
  }), 400);
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/* POST /api/auth/login */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error:'Email and password required' });
  const user = USERS.get(email.toLowerCase().trim());
  if (!user || user.password !== password)
    return res.status(401).json({ error:'Invalid email or password' });
  const token = crypto.randomBytes(32).toString('hex');
  SESSIONS.set(token, user.id);
  setTimeout(() => res.json({
    token,
    user: { id:user.id, email:user.email, firstName:user.firstName, lastName:user.lastName, dreammiles:user.dreammiles }
  }), 500);
});

/* POST /api/auth/register */
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  if (!firstName || !lastName || !email || !password)
    return res.status(400).json({ error:'All fields are required' });
  if (USERS.has(email.toLowerCase()))
    return res.status(409).json({ error:'An account with this email already exists' });
  const id = 'USR' + Date.now().toString(36).toUpperCase();
  const memberId = 'DM-' + Math.random().toString(36).toUpperCase().slice(2,8);
  const user = {
    id, email:email.toLowerCase(), password, firstName, lastName, phone:phone||'',
    dreammiles:{ memberId, tier:'Blue', balance:0, expiring:0, expiringDate:null }
  };
  USERS.set(email.toLowerCase(), user);
  const token = crypto.randomBytes(32).toString('hex');
  SESSIONS.set(token, user.id);
  setTimeout(() => res.status(201).json({
    token,
    user: { id:user.id, email:user.email, firstName:user.firstName, lastName:user.lastName, dreammiles:user.dreammiles }
  }), 600);
});

/* POST /api/auth/logout */
app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers['authorization']||'').replace('Bearer ','').trim();
  SESSIONS.delete(token);
  res.json({ success:true });
});

/* GET /api/auth/me */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user;
  res.json({ id:u.id, email:u.email, firstName:u.firstName, lastName:u.lastName, phone:u.phone, dreammiles:u.dreammiles });
});

/* GET /api/auth/bookings — user's booking history */
app.get('/api/auth/bookings', authMiddleware, (req, res) => {
  const userBookings = [...bookings.values()]
    .filter(b => b.contact?.email === req.user.email)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userBookings);
});

// ─────────────────────────────────────────────────────────────────────────────
// MANAGE BOOKING
// ─────────────────────────────────────────────────────────────────────────────

/* POST /api/manage — retrieve booking by ref + last name */
app.post('/api/manage', (req, res) => {
  const { bookingRef, lastName } = req.body;
  if (!bookingRef || !lastName)
    return res.status(400).json({ error:'Booking reference and last name required' });
  const b = bookings.get(bookingRef.toUpperCase().trim());
  if (!b) return res.status(404).json({ error:'Booking not found. Please check your reference number.' });
  const match = b.passengers?.some(p =>
    p.lastName?.toLowerCase() === lastName.toLowerCase().trim()
  );
  if (!match) return res.status(401).json({ error:'Last name does not match this booking.' });
  setTimeout(() => res.json(b), 400);
});

// ─────────────────────────────────────────────────────────────────────────────
// FLIGHT STATUS
// ─────────────────────────────────────────────────────────────────────────────

const FLIGHT_STATUSES = ['Scheduled','On Time','Boarding','Departed','In Flight','Landed','Arrived'];
const GATES = ['A2','A4','B1','B3','B7','C2','C5','D1'];

app.get('/api/flightstatus', (req, res) => {
  const { flight, date } = req.query;
  if (!flight) return res.status(400).json({ error:'Flight number required' });

  // Derive route from flight number prefix + match routes
  const num = parseInt((flight.replace(/\D/g,'')||'11')) || 11;
  const routeKeys = Object.keys(ROUTES);
  const route     = ROUTES[routeKeys[num % routeKeys.length]];
  const [orig, dest] = routeKeys[num % routeKeys.length].split('-');
  const slot  = DEPARTURE_SLOTS[num % DEPARTURE_SLOTS.length];
  const arr   = addMins(slot.h, slot.m, route.mins);
  const delay = (num % 3 === 0) ? 25 : 0; // every 3rd flight is delayed
  const statusIdx = Math.min(Math.floor(Date.now() / 3600000) % FLIGHT_STATUSES.length, FLIGHT_STATUSES.length-1);
  const status = delay > 0 ? 'Delayed' : FLIGHT_STATUSES[statusIdx];

  setTimeout(() => res.json({
    flightNumber: flight.toUpperCase(),
    date: date || new Date().toISOString().split('T')[0],
    origin:      orig, originCity:      (AIRPORTS.find(a=>a.code===orig)||{}).city||orig,
    destination: dest, destinationCity: (AIRPORTS.find(a=>a.code===dest)||{}).city||dest,
    scheduledDep: `${pad(slot.h)}:${pad(slot.m)}`,
    scheduledArr: `${pad(arr.h)}:${pad(arr.m)}`,
    actualDep:    delay ? `${pad(slot.h)}:${pad(slot.m+delay)}` : `${pad(slot.h)}:${pad(slot.m)}`,
    status,
    delay,
    gate:      GATES[num % GATES.length],
    terminal:  (num % 2) + 1,
    aircraft:  route.aircraft,
    duration:  route.duration,
    stops:     route.stops,
  }), 500);
});

/* GET /api/flightstatus/search?origin=KGL&date=2026-03-11 */
app.get('/api/flightstatus/departures', (req, res) => {
  const { origin='KGL', date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const flights = Object.entries(ROUTES)
    .filter(([k]) => k.startsWith(origin))
    .flatMap(([key, route], ri) => {
      const [orig, dest] = key.split('-');
      return DEPARTURE_SLOTS.slice(0,2).map((slot, si) => {
        const arr   = addMins(slot.h, slot.m, route.mins);
        const num   = `${ri+1}${si+1}`;
        const delay = (ri+si) % 4 === 0 ? 20 : 0;
        return {
          flightNumber: `WB ${pad(ri+1)}${si+1}`,
          date: targetDate, origin:orig, destination:dest,
          destinationCity: (AIRPORTS.find(a=>a.code===dest)||{}).city||dest,
          scheduledDep: `${pad(slot.h)}:${pad(slot.m)}`,
          scheduledArr: `${pad(arr.h)}:${pad(arr.m)}`,
          status: delay ? 'Delayed' : 'On Time',
          delay, gate: GATES[(ri+si) % GATES.length],
          aircraft: route.aircraft,
        };
      });
    }).slice(0,10);
  res.json({ date:targetDate, origin, departures:flights });
});

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE CHECK-IN
// ─────────────────────────────────────────────────────────────────────────────

const checkedIn = new Map();

/* POST /api/checkin/lookup */
app.post('/api/checkin/lookup', (req, res) => {
  const { bookingRef, lastName } = req.body;
  if (!bookingRef || !lastName)
    return res.status(400).json({ error:'Booking reference and last name required' });
  const b = bookings.get(bookingRef.toUpperCase().trim());
  if (!b) return res.status(404).json({ error:'Booking not found.' });
  const pax = b.passengers?.filter(p => p.lastName?.toLowerCase() === lastName.toLowerCase().trim());
  if (!pax?.length) return res.status(401).json({ error:'Last name does not match this booking.' });

  const f = b.outboundFlight;
  const hoursToFlight = (new Date(`${f.date}T${f.departure}:00`) - Date.now()) / 3600000;
  // Check-in window: opens 48h before, closes 2h before departure
  if (hoursToFlight > 48) return res.status(400).json({
    error:`Online check-in opens 48 hours before departure (on ${fmtDate(f.date)} at ${f.departure}).`,
    opensAt: new Date(new Date(`${f.date}T${f.departure}:00`) - 48*3600000).toISOString()
  });
  if (hoursToFlight < 2) return res.status(400).json({
    error:'Online check-in has closed for this flight. Please check in at the airport.'
  });

  setTimeout(() => res.json({ booking:b, eligible:true, hoursToFlight: Math.max(0, hoursToFlight) }), 500);
});

/* POST /api/checkin/confirm */
app.post('/api/checkin/confirm', (req, res) => {
  const { bookingRef, passengerIndexes, seatPreference } = req.body;
  const b = bookings.get((bookingRef||'').toUpperCase());
  if (!b) return res.status(404).json({ error:'Booking not found' });
  if (checkedIn.has(bookingRef)) return res.json(checkedIn.get(bookingRef));

  const seats = ['14A','14C','21F','21D','07B','07E','32A','18C','22F','11B'];
  const boardingPasses = (b.passengers||[]).map((p, i) => {
    const seat = seatPreference || seats[i % seats.length];
    return {
      passenger: `${p.title||''} ${p.firstName} ${p.lastName}`.trim(),
      seat, seatClass: b.cabin||'Economy',
      flightNumber: b.outboundFlight.flightNumber,
      date:         b.outboundFlight.date,
      origin:       b.outboundFlight.origin,
      destination:  b.outboundFlight.destination,
      departure:    b.outboundFlight.departure,
      gate:         GATES[i % GATES.length],
      terminal:     '2',
      boardingTime: (() => { const [h,m] = b.outboundFlight.departure.split(':'); return `${pad(+h-0)}:${pad(Math.max(0,+m-45))}`; })(),
      barcode:      crypto.randomBytes(12).toString('hex').toUpperCase(),
      bookingRef,
    };
  });
  const result = { status:'checked_in', boardingPasses, checkinRef:'CI-'+generateRef() };
  checkedIn.set(bookingRef, result);
  setTimeout(() => res.json(result), 800);
});

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL BOOKING
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/bookings/cancel', (req, res) => {
  const { bookingRef, lastName, reason } = req.body;
  if (!bookingRef || !lastName)
    return res.status(400).json({ error:'Booking reference and last name required' });
  const b = bookings.get(bookingRef.toUpperCase().trim());
  if (!b) return res.status(404).json({ error:'Booking not found.' });
  const match = b.passengers?.some(p =>
    p.lastName?.toLowerCase() === lastName.toLowerCase().trim()
  );
  if (!match) return res.status(401).json({ error:'Last name does not match this booking.' });
  if (b.status === 'cancelled')
    return res.status(400).json({ error:'This booking has already been cancelled.' });

  b.status = 'cancelled';
  b.cancelledAt = new Date().toISOString();
  b.cancellationReason = reason || 'Requested by passenger';
  b.refundStatus = 'pending';
  b.refundAmount = Math.round(b.outboundFlight.fare.total * (b.passengers||[]).length * 0.85);
  b.refundNote = 'A refund of 85% of the fare will be processed within 7–14 business days to your original payment method.';

  setTimeout(() => res.json({
    bookingRef: b.bookingRef,
    status: b.status,
    refundAmount: b.refundAmount,
    refundNote: b.refundNote,
    cancelledAt: b.cancelledAt,
  }), 600);
});

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE BOOKING
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/bookings/change', (req, res) => {
  const { bookingRef, lastName, newDate } = req.body;
  if (!bookingRef || !lastName || !newDate)
    return res.status(400).json({ error:'Booking reference, last name and new date required' });
  const b = bookings.get(bookingRef.toUpperCase().trim());
  if (!b) return res.status(404).json({ error:'Booking not found.' });
  const match = b.passengers?.some(p =>
    p.lastName?.toLowerCase() === lastName.toLowerCase().trim()
  );
  if (!match) return res.status(401).json({ error:'Last name does not match this booking.' });
  if (b.status === 'cancelled')
    return res.status(400).json({ error:'Cannot change a cancelled booking.' });

  const oldDate = b.outboundFlight.date;
  b.outboundFlight.date = newDate;
  b.changeHistory = b.changeHistory || [];
  b.changeHistory.push({ from: oldDate, to: newDate, changedAt: new Date().toISOString() });
  const changeFee = 25000;
  b.changeFee = changeFee;

  setTimeout(() => res.json({
    bookingRef: b.bookingRef,
    status: 'confirmed',
    oldDate,
    newDate,
    changeFee,
    changeFeeLabel: fmtMoney(changeFee),
    message: `Booking date changed from ${fmtDate(oldDate)} to ${fmtDate(newDate)}. A change fee of ${fmtMoney(changeFee)} applies.`,
  }), 600);
});

// ─────────────────────────────────────────────────────────────────────────────
// ANCILLARIES
// ─────────────────────────────────────────────────────────────────────────────

const ANCILLARIES = {
  'lounge':           { name:'Airport Lounge Access',   price:45000  },
  'golf':             { name:'Golf Package',            price:85000  },
  'bicycle':          { name:'Bicycle Rental (1 day)',  price:25000  },
  'extra-baggage':    { name:'Extra Baggage (10kg)',    price:35000  },
  'seat-selection':   { name:'Seat Selection',          price:15000  },
  'travel-insurance': { name:'Travel Insurance',        price:20000  },
  'meal':             { name:'Special Meal Request',    price:0      },
  'car-rental':       { name:'Car Rental (1 day)',      price:60000  },
  'hotel':            { name:'Hotel Booking',           price:0      },
};

app.post('/api/ancillaries/add', (req, res) => {
  const { bookingRef, lastName, ancillaryType } = req.body;
  if (!bookingRef || !lastName || !ancillaryType)
    return res.status(400).json({ error:'Booking reference, last name and ancillary type required' });
  const b = bookings.get(bookingRef.toUpperCase().trim());
  if (!b) return res.status(404).json({ error:'Booking not found.' });
  const match = b.passengers?.some(p =>
    p.lastName?.toLowerCase() === lastName.toLowerCase().trim()
  );
  if (!match) return res.status(401).json({ error:'Last name does not match this booking.' });
  const anc = ANCILLARIES[ancillaryType];
  if (!anc) return res.status(400).json({ error:'Unknown ancillary service.' });

  b.ancillaries = b.ancillaries || [];
  b.ancillaries.push({ type: ancillaryType, name: anc.name, price: anc.price, addedAt: new Date().toISOString() });

  setTimeout(() => res.json({
    bookingRef: b.bookingRef,
    ancillary: { type: ancillaryType, name: anc.name, price: anc.price, priceLabel: anc.price ? fmtMoney(anc.price) : 'Free' },
    message: anc.price
      ? `${anc.name} added to booking ${b.bookingRef}. Charge: ${fmtMoney(anc.price)}.`
      : `${anc.name} requested for booking ${b.bookingRef}. No additional charge.`,
  }), 500);
});

app.get('/api/ancillaries', (_req, res) => {
  const list = Object.entries(ANCILLARIES).map(([key, v]) => ({
    type: key, name: v.name, price: v.price, priceLabel: v.price ? fmtMoney(v.price) : 'Free',
  }));
  res.json(list);
});

// ─────────────────────────────────────────────────────────────────────────────
// MILES DEDUCTION
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/dreammiles/deduct', authMiddleware, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error:'Invalid miles amount' });
  const user = req.user;
  if (!user.dreammiles) return res.status(400).json({ error:'No DreamMiles account' });
  if (user.dreammiles.balance < amount) return res.status(400).json({ error:'Insufficient miles', balance:user.dreammiles.balance });
  user.dreammiles.balance -= amount;
  setTimeout(() => res.json({ success:true, deducted:amount, newBalance:user.dreammiles.balance }), 300);
});

// ─────────────────────────────────────────────────────────────────────────────
// WALLET ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/wallet/balance', authMiddleware, (req, res) => {
  const w = req.user.wallet || { balance:0, currency:'RWF', transactions:[] };
  res.json(w);
});

app.get('/api/wallet/transactions', authMiddleware, (req, res) => {
  const w = req.user.wallet || { balance:0, currency:'RWF', transactions:[] };
  res.json({ transactions: w.transactions, total: w.transactions.length });
});

app.post('/api/wallet/credit', authMiddleware, (req, res) => {
  const { amount, currency, reason, bookingRef } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error:'Invalid amount' });
  if (!req.user.wallet) req.user.wallet = { balance:0, currency:currency||'RWF', transactions:[] };
  const txn = { id:'TXN'+Date.now().toString(36), type:'credit', amount, currency:currency||req.user.wallet.currency, reason:reason||'Refund credit', bookingRef:bookingRef||'', date:new Date().toISOString() };
  req.user.wallet.balance += amount;
  req.user.wallet.transactions.unshift(txn);
  setTimeout(() => res.json({ success:true, newBalance:req.user.wallet.balance, transaction:txn }), 300);
});

app.post('/api/wallet/debit', authMiddleware, (req, res) => {
  const { amount, bookingRef } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error:'Invalid amount' });
  const w = req.user.wallet || { balance:0, currency:'RWF', transactions:[] };
  if (w.balance < amount) return res.status(400).json({ error:'Insufficient wallet balance', balance:w.balance });
  w.balance -= amount;
  const txn = { id:'TXN'+Date.now().toString(36), type:'debit', amount, currency:w.currency, reason:'Booking payment', bookingRef:bookingRef||'', date:new Date().toISOString() };
  w.transactions.unshift(txn);
  if (!req.user.wallet) req.user.wallet = w;
  setTimeout(() => res.json({ success:true, newBalance:w.balance, transaction:txn }), 300);
});

// ─────────────────────────────────────────────────────────────────────────────
// PROMO CODE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/promo/validate', (req, res) => {
  const { code, amount } = req.body;
  if (!code) return res.status(400).json({ error:'Promo code required' });
  const promo = PROMO_CODES[code.toUpperCase().trim()];
  if (!promo || !promo.active) return res.status(404).json({ error:'Invalid or expired promo code', valid:false });
  if (amount && amount < promo.minAmount) return res.status(400).json({ error:`Minimum booking amount: ${fmtMoney(promo.minAmount)}`, valid:false });
  let discountAmount = 0;
  if (promo.type === 'percent') discountAmount = Math.round((amount||500000) * promo.discount / 100);
  else discountAmount = promo.discount;
  setTimeout(() => res.json({ valid:true, code:code.toUpperCase(), discount:promo.discount, type:promo.type, description:promo.description, discountAmount }), 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING / RETARGETING
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/marketing/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error:'Email required' });
  setTimeout(() => res.json({ success:true, message:'Subscribed successfully! Check your inbox for a 10% welcome discount.' }), 300);
});

app.post('/api/retargeting/abandon', (req, res) => {
  const { email, cartItems, page } = req.body;
  setTimeout(() => res.json({ success:true, reminderSchedule:[ { type:'email', delay:'1 hour', status:'scheduled' }, { type:'email', delay:'24 hours', status:'scheduled' }, { type:'sms', delay:'2 hours', status:'scheduled' } ] }), 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const token = (req.headers['authorization']||'').replace('Bearer ','').trim();
  const adminId = ADMIN_SESSIONS.get(token);
  if (!adminId) return res.status(401).json({ error:'Not authenticated' });
  req.admin = [...ADMIN_USERS.values()].find(u => u.id === adminId);
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = ADMIN_USERS.get((email||'').toLowerCase().trim());
  if (!admin || admin.password !== password) return res.status(401).json({ error:'Invalid credentials' });
  const token = crypto.randomBytes(32).toString('hex');
  ADMIN_SESSIONS.set(token, admin.id);
  setTimeout(() => res.json({ token, user:{ id:admin.id, email:admin.email, firstName:admin.firstName, lastName:admin.lastName, role:admin.role } }), 300);
});

app.get('/api/admin/me', adminAuth, (req, res) => {
  const a = req.admin;
  res.json({ id:a.id, email:a.email, firstName:a.firstName, lastName:a.lastName, role:a.role });
});

// Generate mock dashboard data
function generateMockChatbot(dateStr) {
  const topics = ['Booking Help','Baggage Inquiry','Flight Status','Refund Request','Check-in Issue','Seat Selection','Payment Failed','Miles Redemption','Schedule Change','Loyalty Tier'];
  const users = ['Jean U.','Alice M.','Bob N.','Claire I.','David H.','Eve M.','Frank M.','Grace U.','Henry N.','Irene N.','Guest User','Guest User','Anonymous','Guest User','Anonymous'];
  const resolutions = ['Resolved','Resolved','Resolved','Escalated','Resolved','Resolved','Escalated','Resolved','Resolved','Abandoned'];
  const durations = ['1m 23s','3m 45s','2m 10s','8m 32s','0m 58s','4m 15s','12m 05s','2m 30s','1m 47s','5m 20s','3m 12s','6m 44s','0m 35s','9m 18s','1m 55s'];
  const d = dateStr || new Date().toISOString().slice(0,10);
  return Array.from({length:15}, (_,i) => ({
    sessionId: 'CS-' + d.replace(/-/g,'').slice(2) + '-' + String(i+1).padStart(3,'0'),
    user: users[i % users.length],
    topic: topics[i % topics.length],
    messages: Math.floor(Math.random()*12)+2,
    duration: durations[i % durations.length],
    resolution: resolutions[i % resolutions.length],
    satisfaction: resolutions[i%resolutions.length]==='Abandoned' ? 2 : Math.floor(Math.random()*2)+4,
    date: d,
    channel: ['Web Widget','Mobile App','WhatsApp'][i%3]
  }));
}

function generateMockFunnel(dateStr) {
  const base = 12450 + Math.floor(Math.random()*1000);
  return [
    { stage:'Homepage Visit', sessions:base, conversion:100, dropoff:0, avgTime:'0m 00s', trend:3.2 },
    { stage:'Search Initiated', sessions:Math.round(base*0.68), conversion:68, dropoff:32, avgTime:'0m 45s', trend:1.8 },
    { stage:'Results Viewed', sessions:Math.round(base*0.61), conversion:61, dropoff:7, avgTime:'1m 20s', trend:2.1 },
    { stage:'Flight Selected', sessions:Math.round(base*0.34), conversion:34, dropoff:27, avgTime:'2m 35s', trend:-0.5 },
    { stage:'Added to Cart', sessions:Math.round(base*0.28), conversion:28, dropoff:6, avgTime:'3m 10s', trend:0.9 },
    { stage:'Passenger Details', sessions:Math.round(base*0.22), conversion:22, dropoff:6, avgTime:'5m 45s', trend:-1.2 },
    { stage:'Payment Started', sessions:Math.round(base*0.18), conversion:18, dropoff:4, avgTime:'7m 00s', trend:1.5 },
    { stage:'Payment Completed', sessions:Math.round(base*0.14), conversion:14, dropoff:4, avgTime:'8m 30s', trend:2.8 },
    { stage:'Booking Confirmed', sessions:Math.round(base*0.13), conversion:13, dropoff:1, avgTime:'9m 15s', trend:3.1 },
  ];
}

function generateMockOrders(dateStr) {
  const pnrs = ['ABC123','DEF456','GHI789','JKL012','MNO345','PQR678','STU901','VWX234','YZA567','BCD890'];
  const channels = ['Web','Mobile App','Call Center','Travel Agent'];
  const payments = ['Card','Mobile Money','Bank Transfer','Miles','Irembo','Wallet'];
  const routeKeys = Object.keys(ROUTES);
  return pnrs.map((pnr,i) => ({
    pnr, flight:'WB '+(100+i*3).toString().padStart(3,'0'), date:dateStr||'2026-03-13', route:routeKeys[i%routeKeys.length],
    paxCount:Math.floor(Math.random()*4)+1, status:['Confirmed','Ticketed','Cancelled'][i%3], channel:channels[i%channels.length], payment:payments[i%payments.length],
    totalFare:Math.floor(Math.random()*2000000)+200000, createdAt:new Date(Date.now()-i*3600000).toISOString()
  }));
}

app.get('/api/admin/chatbot', adminAuth, (req, res) => {
  const data = generateMockChatbot(req.query.date);
  const resolved = data.filter(c => c.resolution==='Resolved').length;
  const escalated = data.filter(c => c.resolution==='Escalated').length;
  const avgSat = (data.reduce((s,c) => s+c.satisfaction, 0) / data.length).toFixed(1);
  res.json({ conversations:data, summary:{ totalSessions:data.length, resolvedByBot:resolved, escalated, abandoned:data.length-resolved-escalated, avgSatisfaction:avgSat } });
});

app.get('/api/admin/funnel', adminAuth, (req, res) => {
  const data = generateMockFunnel(req.query.date);
  res.json({ stages:data, summary:{ searchToResults:61, resultsToCart:28, cartToPayment:18, paymentToConfirmed:13 } });
});

app.get('/api/admin/orders', adminAuth, (req, res) => {
  const data = generateMockOrders(req.query.date);
  res.json({ orders:data, summary:{ total:data.length, confirmed:data.filter(o=>o.status==='Confirmed').length, cancelled:data.filter(o=>o.status==='Cancelled').length } });
});

app.get('/api/admin/passengers', adminAuth, (req, res) => {
  const names = ['Jean Uwimana','Alice Mukamana','Bob Nshimiyimana','Claire Ingabire','David Habimana','Eve Mukagatare','Frank Mugabo','Grace Uwera','Henry Ndayisaba','Irene Nyirahabimana'];
  const data = names.map((name,i) => ({
    name, pnr:'PNR'+String(i+1).padStart(3,'0'), flight:'WB '+(100+i*2).toString().padStart(3,'0'),
    route:'KGL-'+Object.keys(ROUTES)[i%Object.keys(ROUTES).length].split('-')[1], class:['Economy','Business'][i%2],
    seatAssigned:i<7, checkedIn:i<5, specialMeals:i%3===0, date:req.query.date||'2026-03-13'
  }));
  res.json({ passengers:data, summary:{ total:data.length, checkedIn:5, business:data.filter(p=>p.class==='Business').length } });
});

app.get('/api/admin/ancillaries', adminAuth, (req, res) => {
  const types = ['Extra Baggage','Seat Selection','Lounge Access','Travel Insurance','Meal Upgrade','Car Rental'];
  const data = types.map((t,i) => ({ type:t, quantity:Math.floor(Math.random()*50)+5, revenue:Math.floor(Math.random()*5000000)+100000, flights:Math.floor(Math.random()*15)+3 }));
  res.json({ ancillaries:data, summary:{ totalRevenue:data.reduce((s,a)=>s+a.revenue,0), totalItems:data.reduce((s,a)=>s+a.quantity,0) } });
});

app.get('/api/admin/holds', adminAuth, (req, res) => {
  const data = Array.from({length:15}, (_,i) => ({
    pnr:'HLD'+String(i+1).padStart(3,'0'), route:'KGL-'+Object.keys(ROUTES)[i%Object.keys(ROUTES).length].split('-')[1],
    createdAt:new Date(Date.now()-i*1800000).toISOString(), expiresAt:new Date(Date.now()+(15-i)*900000).toISOString(),
    status:i<5?'expired':i<10?'active':'converted', fare:Math.floor(Math.random()*1500000)+200000
  }));
  res.json({ holds:data, summary:{ total:data.length, active:data.filter(h=>h.status==='active').length, converted:data.filter(h=>h.status==='converted').length, expired:data.filter(h=>h.status==='expired').length } });
});

app.get('/api/admin/channels', adminAuth, (req, res) => {
  const data = [
    { channel:'Website', pnrs:145, revenue:185000000, share:42 },
    { channel:'Mobile App', pnrs:98, revenue:124000000, share:28 },
    { channel:'Travel Agent', pnrs:67, revenue:95000000, share:19 },
    { channel:'Call Center', pnrs:38, revenue:52000000, share:11 },
  ];
  res.json({ channels:data, summary:{ totalPnrs:data.reduce((s,c)=>s+c.pnrs,0), totalRevenue:data.reduce((s,c)=>s+c.revenue,0) } });
});

app.get('/api/admin/offices', adminAuth, (req, res) => {
  const data = [
    { officeId:'KGLWB01', name:'Kigali HQ', pnrs:89, revenue:112000000 },
    { officeId:'NBOWB01', name:'Nairobi', pnrs:67, revenue:85000000 },
    { officeId:'DXBWB01', name:'Dubai', pnrs:54, revenue:78000000 },
    { officeId:'LHRWB01', name:'London', pnrs:42, revenue:65000000 },
    { officeId:'BRUWB01', name:'Brussels', pnrs:31, revenue:48000000 },
  ];
  res.json({ offices:data, summary:{ totalPnrs:data.reduce((s,o)=>s+o.pnrs,0), totalRevenue:data.reduce((s,o)=>s+o.revenue,0) } });
});

app.get('/api/admin/payments', adminAuth, (req, res) => {
  const data = [
    { method:'Credit/Debit Card', pnrs:120, amount:156000000, share:35 },
    { method:'Mobile Money', pnrs:95, amount:89000000, share:27 },
    { method:'Bank Transfer', pnrs:45, amount:67000000, share:13 },
    { method:'DreamMiles', pnrs:38, amount:48000000, share:11 },
    { method:'Irembo', pnrs:25, amount:32000000, share:7 },
    { method:'Wallet', pnrs:15, amount:18000000, share:4 },
    { method:'Cellulant', pnrs:10, amount:12000000, share:3 },
  ];
  res.json({ payments:data, summary:{ totalPnrs:data.reduce((s,p)=>s+p.pnrs,0), totalRevenue:data.reduce((s,p)=>s+p.amount,0) } });
});

// Admin user management
app.get('/api/admin/users', adminAuth, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ error:'Forbidden' });
  const users = [...ADMIN_USERS.values()].map(u => ({ id:u.id, email:u.email, firstName:u.firstName, lastName:u.lastName, role:u.role }));
  res.json({ users });
});

app.post('/api/admin/users', adminAuth, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ error:'Forbidden' });
  const { email, password, firstName, lastName, role } = req.body;
  if (ADMIN_USERS.has(email.toLowerCase())) return res.status(409).json({ error:'User exists' });
  const id = 'ADM'+Date.now().toString(36).toUpperCase();
  const user = { id, email:email.toLowerCase(), password, firstName, lastName, role:role||'viewer' };
  ADMIN_USERS.set(email.toLowerCase(), user);
  res.status(201).json({ id:user.id, email:user.email, firstName:user.firstName, lastName:user.lastName, role:user.role });
});

app.put('/api/admin/users/:id', adminAuth, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ error:'Forbidden' });
  const user = [...ADMIN_USERS.values()].find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error:'User not found' });
  if (req.body.role) user.role = req.body.role;
  if (req.body.firstName) user.firstName = req.body.firstName;
  if (req.body.lastName) user.lastName = req.body.lastName;
  res.json({ id:user.id, email:user.email, firstName:user.firstName, lastName:user.lastName, role:user.role });
});

app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ error:'Forbidden' });
  const user = [...ADMIN_USERS.entries()].find(([k,v]) => v.id === req.params.id);
  if (!user) return res.status(404).json({ error:'User not found' });
  ADMIN_USERS.delete(user[0]);
  res.json({ success:true });
});

// ─────────────────────────────────────────────────────────────────────────────
// CMS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
const CMS_TYPES = ['text','banners','menus','careers','faqs','offices','payment-methods','fare-matrix','t2f'];

app.get('/api/cms/:type', (req, res) => {
  const type = req.params.type;
  if (!CMS_TYPES.includes(type)) return res.status(400).json({ error:'Invalid content type' });
  const store = CMS_DATA[type];
  const items = [...store.values()];
  const search = (req.query.search || '').toLowerCase();
  const filtered = search ? items.filter(i => JSON.stringify(i).toLowerCase().includes(search)) : items;
  res.json({ items:filtered, total:filtered.length });
});

app.get('/api/cms/:type/:id', (req, res) => {
  const store = CMS_DATA[req.params.type];
  if (!store) return res.status(400).json({ error:'Invalid type' });
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error:'Not found' });
  res.json(item);
});

app.post('/api/cms/:type', adminAuth, (req, res) => {
  const type = req.params.type;
  if (!CMS_TYPES.includes(type)) return res.status(400).json({ error:'Invalid type' });
  const id = type.slice(0,3)+'-'+Date.now().toString(36);
  const item = { id, ...req.body, createdAt:new Date().toISOString() };
  CMS_DATA[type].set(id, item);
  res.status(201).json(item);
});

app.put('/api/cms/:type/:id', adminAuth, (req, res) => {
  const store = CMS_DATA[req.params.type];
  if (!store) return res.status(400).json({ error:'Invalid type' });
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error:'Not found' });
  Object.assign(item, req.body, { updatedAt:new Date().toISOString() });
  res.json(item);
});

app.delete('/api/cms/:type/:id', adminAuth, (req, res) => {
  const store = CMS_DATA[req.params.type];
  if (!store) return res.status(400).json({ error:'Invalid type' });
  if (!store.has(req.params.id)) return res.status(404).json({ error:'Not found' });
  store.delete(req.params.id);
  res.json({ success:true });
});

app.post('/api/cms/airports/sync', adminAuth, (req, res) => {
  setTimeout(() => res.json({ success:true, synced:AIRPORTS.length, message:`Synced ${AIRPORTS.length} airports` }), 800);
});

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION CONTENT (simulated AI-generated)
// ─────────────────────────────────────────────────────────────────────────────
const DESTINATION_CONTENT = {
  NBO: {
    city:'Nairobi', country:'Kenya', region:'africa',
    tagline:'Where Safari Meets the City — Africa\'s Beating Heart',
    description:'<p>Nairobi is the only capital city in the world with a national park within its borders. Imagine giraffes silhouetted against skyscrapers — that\'s the magic of this vibrant East African metropolis. From the sprawling savannahs of the Maasai Mara to the bustling streets of the Central Business District, Nairobi is a city of extraordinary contrasts.</p><p>Whether you\'re here for a business conference or beginning an unforgettable safari adventure, Nairobi offers world-class dining, a thriving arts scene, and some of the continent\'s most iconic wildlife experiences — all just a short 1h 45m flight from Kigali.</p>',
    highlights:['Nairobi National Park — wildlife in the city','Maasai Mara safari gateway','David Sheldrick Elephant Orphanage','Vibrant food and nightlife scene','Karen Blixen Museum','Giraffe Centre — feed giraffes up close'],
    bestTimeToVisit:'July to October (Great Migration season) and January to February (dry & warm)',
    weather:{ avg_temp:'22°C', climate:'Subtropical highland' },
    travelTips:['East Africa Tourist Visa covers Kenya, Rwanda & Uganda','Nairobi is 1hr ahead of Kigali (EAT, UTC+3)','Uber and Bolt are widely available','M-Pesa mobile payments accepted everywhere','Light layers — mornings can be cool at 1,661m altitude'],
    attractions:[
      { name:'Maasai Mara National Reserve', desc:'Witness the Great Migration and the Big Five in Africa\'s most famous safari destination.', icon:'🦁' },
      { name:'Nairobi National Park', desc:'See lions, rhinos, and buffalo against the Nairobi skyline — the world\'s only urban safari.', icon:'🏙' },
      { name:'Giraffe Centre', desc:'Hand-feed endangered Rothschild giraffes from an elevated platform.', icon:'🦒' },
      { name:'David Sheldrick Wildlife Trust', desc:'Meet orphaned baby elephants being rehabilitated for release into the wild.', icon:'🐘' },
      { name:'Karen Blixen Museum', desc:'Visit the Danish author\'s historic farmhouse — the setting for "Out of Africa."', icon:'🏛' },
      { name:'Bomas of Kenya', desc:'Experience traditional dances and homesteads from over 40 Kenyan communities.', icon:'💃' }
    ],
    cuisine:['Nyama Choma (grilled meat)','Ugali','Sukuma Wiki','Pilau rice','Samosas','Kenyan chai tea','Mandazi (doughnuts)'],
    currency:'KES (Kenyan Shilling)', language:'Swahili, English', timezone:'EAT (UTC+3)'
  },
  LHR: {
    city:'London', country:'United Kingdom', region:'europe',
    tagline:'A Timeless World Capital — Where History Meets Innovation',
    description:'<p>London needs no introduction, yet it never stops surprising. From the ancient stones of the Tower of London to the futuristic curves of The Shard, this is a city that has reinvented itself for over two millennia. RwandAir\'s direct Dreamliner service puts you in the heart of one of the world\'s greatest cities in under 9 hours.</p><p>Explore world-class museums (most are free!), catch a West End show, wander through royal parks, or discover the incredible diversity of London\'s food scene — from Borough Market to Brick Lane. Whether it\'s business or pleasure, London delivers an experience like no other.</p>',
    highlights:['Direct Boeing 787 Dreamliner service','World-class museums — free entry','West End theatre district','Royal palaces and parks','Global financial hub','Incredible multicultural dining'],
    bestTimeToVisit:'May to September (warm, long daylight hours). December for festive markets.',
    weather:{ avg_temp:'12°C', climate:'Temperate maritime' },
    travelTips:['UK visa may be required — check before travel','The Tube is the fastest way around the city','Contactless payment works on all London transport','Tipping 10-15% is customary in restaurants','Pack layers — London weather changes quickly'],
    attractions:[
      { name:'Tower of London', desc:'900 years of royal history, home to the Crown Jewels and legendary Beefeaters.', icon:'🏰' },
      { name:'British Museum', desc:'Over 8 million works spanning human history — from the Rosetta Stone to the Parthenon sculptures.', icon:'🏛' },
      { name:'Buckingham Palace', desc:'The official residence of the monarchy. Catch the Changing of the Guard ceremony.', icon:'👑' },
      { name:'The Shard', desc:'London\'s tallest building offers panoramic views across 40 miles of cityscape.', icon:'🏙' },
      { name:'West End Theatre', desc:'Catch a world-famous musical or play in London\'s legendary theatre district.', icon:'🎭' },
      { name:'Hyde Park', desc:'350 acres of royal parkland in the heart of the city — perfect for a morning jog or afternoon paddle.', icon:'🌳' }
    ],
    cuisine:['Fish and Chips','Sunday Roast','Afternoon Tea','Pie and Mash','Full English Breakfast','Bangers and Mash','Sticky Toffee Pudding'],
    currency:'GBP (British Pound)', language:'English', timezone:'GMT/BST (UTC+0/+1)'
  },
  DXB: {
    city:'Dubai', country:'UAE', region:'middle-east',
    tagline:'The City of Gold — Where Dreams Touch the Sky',
    description:'<p>Dubai is a testament to what human ambition can achieve. Rising from the desert sands, this glittering metropolis is home to the world\'s tallest building, largest shopping mall, and most luxurious hotels. Yet beyond the superlatives, Dubai offers a fascinating blend of traditional Arabian culture and futuristic innovation.</p><p>Just 5h 30m from Kigali on RwandAir\'s direct service, Dubai is your gateway to desert adventures, world-class shopping, pristine beaches, and a food scene that draws from every corner of the globe. Whether you\'re connecting onward or making Dubai your destination, this city will leave you breathless.</p>',
    highlights:['Direct 5h 30m flight from Kigali','Burj Khalifa — world\'s tallest building','Tax-free shopping paradise','Desert safari adventures','Year-round sunshine','Gateway hub to Asia and beyond'],
    bestTimeToVisit:'November to March (pleasant 20-30°C). Avoid June-August (extreme heat 45°C+).',
    weather:{ avg_temp:'28°C', climate:'Hot desert' },
    travelTips:['Visa on arrival for many nationalities','Dubai Metro is clean and efficient','Friday is the weekend — many businesses closed Friday morning','Dress modestly in public areas and malls','Alcohol only served in licensed venues (hotels, bars)'],
    attractions:[
      { name:'Burj Khalifa', desc:'Soar to the 148th floor observation deck of the world\'s tallest structure at 828 meters.', icon:'🗼' },
      { name:'Dubai Mall', desc:'Over 1,200 shops, an aquarium, ice rink, and indoor waterfall in the world\'s largest shopping destination.', icon:'🛍' },
      { name:'Desert Safari', desc:'Experience dune bashing, camel rides, and a Bedouin-style dinner under the stars.', icon:'🐫' },
      { name:'Palm Jumeirah', desc:'The iconic palm-shaped island with luxury resorts, beaches, and the Atlantis waterpark.', icon:'🌴' },
      { name:'Dubai Creek & Souks', desc:'Explore the historic heart of Dubai — haggle for gold, spices, and textiles in traditional markets.', icon:'⛵' },
      { name:'Museum of the Future', desc:'A stunning architectural marvel showcasing innovations that will shape our world.', icon:'🔮' }
    ],
    cuisine:['Shawarma','Al Machboos (spiced rice)','Luqaimat (sweet dumplings)','Camel milk chocolate','Arabic coffee with dates','Grilled kebabs','Kunafa (cheese pastry)'],
    currency:'AED (UAE Dirham)', language:'Arabic, English widely spoken', timezone:'GST (UTC+4)'
  },
  BRU: {
    city:'Brussels', country:'Belgium', region:'europe',
    tagline:'The Heart of Europe — Art, Chocolate, and Endless Charm',
    description:'<p>Brussels is a city that wears its heart on its sleeve — sometimes literally, in the form of stunning Art Nouveau facades and world-famous comic strip murals adorning its buildings. As the de facto capital of the European Union, Brussels is deeply cosmopolitan, yet retains a warmth and intimacy that larger capitals often lack.</p><p>From the magnificent Grand Place (one of the world\'s most beautiful squares) to the aromatic waffle stands and chocolate boutiques on every corner, Brussels is a sensory feast. RwandAir\'s direct service makes this European gem easily accessible from Kigali.</p>',
    highlights:['Direct flight from Kigali','Grand Place — UNESCO World Heritage','World-famous Belgian chocolate','EU quarter and institutions','Art Nouveau architecture','Gateway to Bruges and Ghent'],
    bestTimeToVisit:'May to September (mild and pleasant). December for Christmas markets.',
    weather:{ avg_temp:'10°C', climate:'Temperate oceanic' },
    travelTips:['Schengen visa required for most non-EU nationals','Brussels has three official languages: French, Dutch, Flemish','Public transport via STIB/MIVB is excellent','Tipping is included in prices — round up if you wish','Belgian beers are strong — check the ABV!'],
    attractions:[
      { name:'Grand Place', desc:'This UNESCO-listed medieval square is surrounded by opulent guildhalls and the stunning Town Hall.', icon:'🏛' },
      { name:'Atomium', desc:'The iconic 102-meter structure built for the 1958 World Expo — Brussels\' answer to the Eiffel Tower.', icon:'⚛' },
      { name:'Manneken Pis', desc:'The cheeky little bronze fountain statue that has been Brussels\' beloved symbol since 1619.', icon:'🗿' },
      { name:'Belgian Comic Strip Centre', desc:'Celebrate Belgium\'s rich comic heritage — home of Tintin, the Smurfs, and Lucky Luke.', icon:'📚' },
      { name:'Royal Palace', desc:'The official palace of the Belgian monarchy, open to visitors during summer months.', icon:'👑' },
      { name:'Chocolate Museums & Workshops', desc:'Learn the art of Belgian chocolate making and sample pralines from master chocolatiers.', icon:'🍫' }
    ],
    cuisine:['Belgian Waffles','Moules-Frites (mussels & fries)','Carbonnade Flamande (beef stew)','Belgian Chocolate Pralines','Speculoos biscuits','Witlof (endive gratin)','Belgian Beer'],
    currency:'EUR (Euro)', language:'French, Dutch, German', timezone:'CET (UTC+1)'
  },
  CDG: {
    city:'Paris', country:'France', region:'europe',
    tagline:'La Ville Lumière — The City That Invented Romance',
    description:'<p>Paris is not just a destination — it\'s a feeling. The soft golden light on Haussmann buildings, the aroma of fresh croissants drifting from corner boulangeries, the Seine glittering beneath ancient bridges. For centuries, Paris has been the world\'s capital of art, fashion, gastronomy, and love.</p><p>Connected via Brussels on RwandAir, Paris offers an inexhaustible treasure of experiences — from the Louvre\'s 35,000 artworks to the bohemian streets of Montmartre, from Michelin-starred temples to hidden bistros serving the perfect coq au vin.</p>',
    highlights:['Connections via Brussels','Eiffel Tower and Champs-Élysées','Louvre — world\'s largest art museum','Unrivaled culinary scene','Fashion capital of the world','Versailles palace day trip'],
    bestTimeToVisit:'April to June and September to November (mild, fewer crowds).',
    weather:{ avg_temp:'12°C', climate:'Temperate oceanic' },
    travelTips:['Schengen visa required','Paris Métro covers the entire city — buy a carnet of 10 tickets','Restaurants add service charge — additional tipping optional','Museums free first Sunday of each month','Learn a few French phrases — locals appreciate the effort'],
    attractions:[
      { name:'Eiffel Tower', desc:'The iron lady of Paris — ascend to the summit for breathtaking views across the City of Light.', icon:'🗼' },
      { name:'Louvre Museum', desc:'Home to the Mona Lisa and 35,000 other masterpieces spanning 9,000 years of art.', icon:'🖼' },
      { name:'Montmartre & Sacré-Cœur', desc:'Climb the hill to the white basilica and wander the artistic neighborhood that inspired Picasso and Van Gogh.', icon:'⛪' },
      { name:'Notre-Dame Cathedral', desc:'The iconic Gothic masterpiece on Île de la Cité, currently being beautifully restored.', icon:'🏛' },
      { name:'Palace of Versailles', desc:'The breathtaking former royal residence with its Hall of Mirrors and magnificent gardens.', icon:'👑' },
      { name:'Seine River Cruise', desc:'Glide past Paris\'s most iconic landmarks illuminated at night — pure magic.', icon:'⛵' }
    ],
    cuisine:['Croissants & Pain au Chocolat','Coq au Vin','Crème Brûlée','Escargots','Duck Confit','Ratatouille','French Onion Soup'],
    currency:'EUR (Euro)', language:'French', timezone:'CET (UTC+1)'
  },
  JNB: {
    city:'Johannesburg', country:'South Africa', region:'africa',
    tagline:'The City of Gold — Africa\'s Economic Powerhouse',
    description:'<p>Johannesburg — "Jozi" to locals — pulses with an energy that is uniquely South African. Born from the gold rush of the 1880s, this sprawling metropolis has transformed into Africa\'s most dynamic economic hub, with a cultural scene that reflects the nation\'s journey from apartheid to the Rainbow Nation.</p><p>Just 3h 20m from Kigali on RwandAir, Johannesburg offers world-class museums, cutting-edge contemporary art, incredible safari lodges within a short drive, and the deeply moving stories of Soweto and the Apartheid Museum.</p>',
    highlights:['Direct 3h 20m flight','Apartheid Museum','Gateway to Kruger National Park','Vibrant Maboneng arts district','Cradle of Humankind UNESCO site','World-class shopping at Sandton City'],
    bestTimeToVisit:'March to May (autumn) and September to November (spring) — pleasant and dry.',
    weather:{ avg_temp:'16°C', climate:'Subtropical highland' },
    travelTips:['South Africa visa-free for many African passport holders','Gautrain connects airport to Sandton in 15 minutes','Always use ride-hailing apps (Uber/Bolt) for transport','The altitude (1,753m) means cool evenings year-round','Soweto tours are a must — book with a local guide'],
    attractions:[
      { name:'Apartheid Museum', desc:'A powerful, moving journey through South Africa\'s history of segregation and liberation.', icon:'🏛' },
      { name:'Soweto Township', desc:'Visit Nelson Mandela\'s former home on Vilakazi Street and feel the spirit of the struggle.', icon:'✊' },
      { name:'Cradle of Humankind', desc:'UNESCO site with fossil evidence of our earliest ancestors dating back 3.5 million years.', icon:'🦴' },
      { name:'Maboneng Precinct', desc:'Johannesburg\'s creative heart — galleries, street food markets, and rooftop bars.', icon:'🎨' },
      { name:'Lion & Safari Park', desc:'Get up close with lions, cheetahs, and wild dogs just 45 minutes from the city.', icon:'🦁' },
      { name:'Constitution Hill', desc:'A former prison now housing South Africa\'s Constitutional Court — a symbol of hope and justice.', icon:'⚖' }
    ],
    cuisine:['Braai (barbecue)','Biltong (dried meat)','Bunny Chow','Bobotie (spiced mince)','Pap and Chakalaka','Malva Pudding','Rooibos tea'],
    currency:'ZAR (South African Rand)', language:'11 official languages; English widely spoken', timezone:'SAST (UTC+2)'
  },
  CPT: {
    city:'Cape Town', country:'South Africa', region:'africa',
    tagline:'Where Mountains Meet the Ocean — The Mother City',
    description:'<p>Cape Town is routinely voted one of the most beautiful cities on Earth, and it\'s easy to see why. Table Mountain rises majestically above a city that cascades down to two oceans, with beaches, vineyards, and dramatic coastal cliffs creating a landscape that seems almost too perfect to be real.</p><p>Connected via Johannesburg on RwandAir, Cape Town rewards every kind of traveler — from adrenaline seekers cage-diving with great white sharks to wine lovers exploring the Cape Winelands, from history buffs on Robben Island to foodies feasting in the acclaimed restaurant scene.</p>',
    highlights:['Via Johannesburg connection','Table Mountain cable car','Cape Winelands tours','Robben Island — Mandela\'s prison','Stunning coastal drives','Penguin colony at Boulders Beach'],
    bestTimeToVisit:'October to March (South African summer). February for whale watching.',
    weather:{ avg_temp:'17°C', climate:'Mediterranean' },
    travelTips:['Hire a car for the best experience — Cape Town is spread out','The Cape of Good Hope is NOT the southernmost point of Africa','Table Mountain cable car closes in strong winds — have a backup plan','Local wines are world-class and very affordable','Load shedding (power cuts) may occur — check the schedule'],
    attractions:[
      { name:'Table Mountain', desc:'Take the rotating cable car to the summit of this iconic flat-topped mountain for 360° views.', icon:'⛰' },
      { name:'Robben Island', desc:'Visit the cell where Nelson Mandela was imprisoned for 18 years — a profound experience.', icon:'🏛' },
      { name:'Cape Winelands', desc:'Explore Stellenbosch and Franschhoek — world-class wines in stunning mountain settings.', icon:'🍷' },
      { name:'Boulders Beach', desc:'Walk among a colony of adorable African penguins on this sheltered beach.', icon:'🐧' },
      { name:'Chapman\'s Peak Drive', desc:'One of the world\'s most spectacular coastal roads — 114 curves hugging the cliffs.', icon:'🛣' },
      { name:'V&A Waterfront', desc:'Cape Town\'s premier dining and shopping destination overlooking the working harbour.', icon:'⚓' }
    ],
    cuisine:['Cape Malay Bobotie','Waterblommetjiebredie (water lily stew)','Fresh West Coast oysters','Biltong','Koeksisters','Snoek braai','Pinotage wine'],
    currency:'ZAR (South African Rand)', language:'Afrikaans, English, Xhosa', timezone:'SAST (UTC+2)'
  },
  ADD: {
    city:'Addis Ababa', country:'Ethiopia', region:'africa',
    tagline:'The Cradle of Humanity — Africa\'s Diplomatic Capital',
    description:'<p>Addis Ababa sits at 2,355 meters above sea level, making it one of the highest capitals in the world. As the headquarters of the African Union, this city is the diplomatic heart of the continent, yet its soul is deeply Ethiopian — ancient, proud, and utterly unique with its own calendar, alphabet, and coffee ceremony traditions.</p><p>A quick 2h 15m flight from Kigali, Addis Ababa invites you to discover a civilization that stretches back millennia, from the fossilized bones of "Lucy" (3.2 million years old) to the rock-hewn churches of Lalibela and the ancient obelisks of Axum.</p>',
    highlights:['Short 2h 15m direct flight','Birthplace of coffee ceremony','African Union headquarters','Lucy skeleton at National Museum','Gateway to Lalibela','Unique calendar and alphabet'],
    bestTimeToVisit:'October to February (dry season, clear skies). Avoid June-August (rainy).',
    weather:{ avg_temp:'16°C', climate:'Subtropical highland' },
    travelTips:['Ethiopian calendar is 7-8 years behind the Gregorian calendar','Visa on arrival for most African nationals','Try to experience a traditional coffee ceremony','Injera (sourdough flatbread) is eaten with everything','Ethiopia runs on its own time — 6 hours offset from Western clock'],
    attractions:[
      { name:'National Museum of Ethiopia', desc:'Home to "Lucy," the 3.2-million-year-old hominid fossil that rewrote human history.', icon:'🦴' },
      { name:'Holy Trinity Cathedral', desc:'Ethiopia\'s most important cathedral — the final resting place of Emperor Haile Selassie.', icon:'⛪' },
      { name:'Merkato', desc:'Africa\'s largest open-air market — a sensory overload of spices, textiles, and crafts.', icon:'🛒' },
      { name:'Entoto Hill', desc:'Panoramic views of Addis from the eucalyptus-covered hilltops above the city.', icon:'⛰' },
      { name:'African Union Headquarters', desc:'The striking modern complex — a gift from China — symbolizing African unity and progress.', icon:'🏛' },
      { name:'Red Terror Martyrs Memorial', desc:'A sobering museum documenting Ethiopia\'s darkest chapter under the Derg regime.', icon:'🕊' }
    ],
    cuisine:['Injera with Wot (stew)','Tibs (sautéed meat)','Kitfo (Ethiopian steak tartare)','Shiro (chickpea stew)','Ethiopian Coffee Ceremony','Tej (honey wine)','Doro Wot (chicken stew)'],
    currency:'ETB (Ethiopian Birr)', language:'Amharic, Oromo, English', timezone:'EAT (UTC+3)'
  },
  LOS: {
    city:'Lagos', country:'Nigeria', region:'africa',
    tagline:'Africa\'s Megacity — Where the Hustle Never Stops',
    description:'<p>Lagos is Africa\'s largest city and its undisputed entertainment capital. With over 20 million people, this coastal megacity throbs with an energy that is unmistakably Nigerian — bold, creative, entrepreneurial, and endlessly surprising. Lagos is where Afrobeats was born, where Nollywood produces more films than Hollywood, and where the tech startup scene is reshaping Africa\'s digital future.</p><p>A 4h 30m direct flight from Kigali puts you in the heart of West Africa\'s economic powerhouse, where gleaming highrise hotels meet legendary beach bars, and where every night is a celebration of life.</p>',
    highlights:['Direct 4h 30m flight','Afrobeats music capital','Lekki & Victoria Island nightlife','Nollywood — world\'s 2nd largest film industry','Booming tech startup scene','Nike Art Gallery'],
    bestTimeToVisit:'November to February (dry harmattan season). Avoid April-July (heavy rains).',
    weather:{ avg_temp:'27°C', climate:'Tropical savanna' },
    travelTips:['Lagos traffic ("Go-Slow") is legendary — factor in extra travel time','Carry cash in small denominations','Lekki and Victoria Island are the main business/leisure areas','Street food is incredible but choose busy vendors','Uber and Bolt are the safest transport options'],
    attractions:[
      { name:'Lekki Conservation Centre', desc:'Walk the longest canopy walkway in Africa through mangrove forests in the middle of Lagos.', icon:'🌿' },
      { name:'Nike Art Gallery', desc:'Four floors of stunning Nigerian art — the largest gallery in West Africa.', icon:'🎨' },
      { name:'Tarkwa Bay Beach', desc:'A sheltered cove accessible by boat — escape the city for sun and surf.', icon:'🏖' },
      { name:'Freedom Park', desc:'A cultural center built on a former colonial prison — live music, art exhibitions, and events.', icon:'🎵' },
      { name:'Lekki Market', desc:'Bargain for African fabrics, crafts, and souvenirs in this vibrant open-air market.', icon:'🛒' },
      { name:'The Shrine', desc:'The legendary music venue founded by Afrobeat pioneer Fela Kuti — still rocking nightly.', icon:'🎶' }
    ],
    cuisine:['Jollof Rice','Suya (spiced grilled meat)','Pepper Soup','Pounded Yam & Egusi','Puff-Puff (fried dough)','Ofada Rice','Chapman cocktail'],
    currency:'NGN (Nigerian Naira)', language:'English, Yoruba, Igbo, Hausa', timezone:'WAT (UTC+1)'
  },
  ACC: {
    city:'Accra', country:'Ghana', region:'africa',
    tagline:'The Gateway to West Africa — Gold Coast Hospitality',
    description:'<p>Accra is a city that wraps you in warmth from the moment you arrive — not just the tropical heat, but the genuine friendliness that Ghanaians are famous for. As the first sub-Saharan African country to gain independence in 1957, Ghana carries its history with pride, and Accra is where you feel that spirit most keenly.</p><p>From the poignant slave castles of the Cape Coast to the colorful fishing boats of Jamestown, from the pulsing nightlife of Osu to the serene Aburi Botanical Gardens, Accra offers a rich, layered experience that stays with you long after you leave.</p>',
    highlights:['Direct 5h 15m flight','Year of Return heritage tourism','Cape Coast Castle day trip','Vibrant Osu nightlife','Makola Market shopping','Aburi Botanical Gardens'],
    bestTimeToVisit:'November to March (dry season). December for the Homowo festival.',
    weather:{ avg_temp:'27°C', climate:'Tropical savanna' },
    travelTips:['Ghana is known as the friendliest country in Africa','Carry cash — card payment is limited outside hotels','Bargaining is expected at markets','Trotros (minibuses) are the cheapest transport','Try waakye (rice and beans) for breakfast — it\'s a local favorite'],
    attractions:[
      { name:'Cape Coast Castle', desc:'A UNESCO World Heritage slave castle — a powerful and emotional journey through history.', icon:'🏰' },
      { name:'Kwame Nkrumah Memorial Park', desc:'Tribute to Ghana\'s founding father and pan-African visionary in a beautiful park setting.', icon:'🗿' },
      { name:'Jamestown Lighthouse', desc:'Climb the colonial-era lighthouse for panoramic views over Accra\'s historic fishing quarter.', icon:'🗼' },
      { name:'Makola Market', desc:'Accra\'s largest market — a maze of colorful stalls selling everything under the sun.', icon:'🛒' },
      { name:'Labadi Beach', desc:'Accra\'s most popular beach — live music, grilled tilapia, and dancing on the sand.', icon:'🏖' },
      { name:'W.E.B. Du Bois Memorial Centre', desc:'The final home of the great African-American scholar who became a Ghanaian citizen.', icon:'📚' }
    ],
    cuisine:['Jollof Rice (Ghanaian-style!)','Waakye','Banku with Tilapia','Kelewele (spiced plantain)','Red Red (bean stew)','Fufu & Light Soup','Fresh coconut water'],
    currency:'GHS (Ghanaian Cedi)', language:'English, Akan, Twi', timezone:'GMT (UTC+0)'
  },
  DAR: {
    city:'Dar es Salaam', country:'Tanzania', region:'africa',
    tagline:'Gateway to Zanzibar — Where the Indian Ocean Whispers',
    description:'<p>Dar es Salaam — "Haven of Peace" in Arabic — is Tanzania\'s largest city and commercial capital, stretching along a stunning Indian Ocean coastline. This bustling port city is the launching pad for two of Africa\'s greatest adventures: the spice islands of Zanzibar and the wildlife-rich Serengeti.</p><p>Just 1h 30m from Kigali, Dar es Salaam offers vibrant markets, delicious coastal cuisine blending African, Arab, and Indian flavors, and some of the friendliest people you\'ll meet anywhere. Use it as your base to explore Tanzania\'s extraordinary natural beauty.</p>',
    highlights:['Short 1h 30m direct flight','Gateway to Zanzibar','Indian Ocean beaches','Vibrant Kariakoo Market','Serengeti & Kilimanjaro access','Rich Swahili culture'],
    bestTimeToVisit:'June to October (dry, cool). January-February also good. Avoid March-May (heavy rain).',
    weather:{ avg_temp:'26°C', climate:'Tropical wet and dry' },
    travelTips:['Zanzibar ferries run multiple times daily','Bargain firmly but fairly at markets','Swahili greetings go a long way — "Habari!" (How are you?)','Dress modestly, especially in predominantly Muslim areas','Dala-dalas (minibuses) are an experience in themselves'],
    attractions:[
      { name:'Zanzibar Island', desc:'Pristine white-sand beaches, Stone Town UNESCO heritage, and world-famous spice tours.', icon:'🏝' },
      { name:'Kariakoo Market', desc:'The largest market in East Africa — experience the true heartbeat of Dar es Salaam.', icon:'🛒' },
      { name:'National Museum', desc:'Trace Tanzania\'s history from the earliest hominids to the Shirazi and colonial periods.', icon:'🏛' },
      { name:'Coco Beach', desc:'Watch the sunset over the Indian Ocean from Dar\'s most beloved oceanfront stretch.', icon:'🌅' },
      { name:'Bagamoyo', desc:'A UNESCO-nominated former slave trade port and German colonial capital — hauntingly beautiful.', icon:'🏚' },
      { name:'Tingatinga Arts Centre', desc:'Watch local artists create vibrant, colorful paintings in this uniquely Tanzanian style.', icon:'🎨' }
    ],
    cuisine:['Zanzibar Pizza (street food crepe)','Pilau rice','Octopus curry','Ugali with dagaa','Chips Mayai (omelette fries)','Mishkaki (grilled skewers)','Spiced Swahili tea'],
    currency:'TZS (Tanzanian Shilling)', language:'Swahili, English', timezone:'EAT (UTC+3)'
  },
  EBB: {
    city:'Entebbe', country:'Uganda', region:'africa',
    tagline:'Pearl of Africa — Where Gorillas Roam and the Nile Begins',
    description:'<p>Uganda earned Winston Churchill\'s famous title "Pearl of Africa" for good reason. Entebbe, your gateway to this extraordinary country, sits on a lush peninsula jutting into Lake Victoria — Africa\'s largest lake. In just 45 minutes from Kigali, you\'ll arrive in a country that offers some of the most unique wildlife experiences on Earth.</p><p>From tracking mountain gorillas in Bwindi Impenetrable Forest to white-water rafting at the source of the Nile in Jinja, Uganda packs more natural wonders per square kilometer than almost anywhere else on the continent.</p>',
    highlights:['Shortest flight — just 45 minutes','Mountain gorilla trekking in Bwindi','Source of the Nile at Jinja','Lake Victoria — Africa\'s largest lake','Murchison Falls','Incredible birdwatching — 1,000+ species'],
    bestTimeToVisit:'June to August and December to February (dry seasons, best for gorilla trekking).',
    weather:{ avg_temp:'22°C', climate:'Tropical' },
    travelTips:['East Africa Tourist Visa covers Uganda, Rwanda & Kenya','Gorilla permits should be booked months in advance','Yellow fever vaccination required','Uganda drives on the left','Boda-bodas (motorcycle taxis) are everywhere — wear a helmet'],
    attractions:[
      { name:'Bwindi Impenetrable Forest', desc:'Track endangered mountain gorillas through dense jungle — a life-changing wildlife encounter.', icon:'🦍' },
      { name:'Source of the Nile, Jinja', desc:'Stand where the world\'s longest river begins its 6,650km journey to the Mediterranean.', icon:'🌊' },
      { name:'Murchison Falls', desc:'Watch the entire Nile force through a 7-meter gap before plunging 43 meters — spectacular.', icon:'💧' },
      { name:'Queen Elizabeth National Park', desc:'Tree-climbing lions, hippos, and the famous Kazinga Channel boat safari.', icon:'🦁' },
      { name:'Uganda Wildlife Education Centre', desc:'Entebbe\'s excellent zoo and rehabilitation center on the shores of Lake Victoria.', icon:'🐒' },
      { name:'Ssese Islands', desc:'Tropical island paradise on Lake Victoria — white sand beaches and palm trees.', icon:'🏝' }
    ],
    cuisine:['Rolex (chapati omelette wrap)','Matoke (steamed plantain)','Luwombo (steamed stew in banana leaves)','Groundnut sauce','Nile perch','Posho','Ugandan Waragi gin'],
    currency:'UGX (Ugandan Shilling)', language:'English, Luganda, Swahili', timezone:'EAT (UTC+3)'
  },
  BJM: {
    city:'Bujumbura', country:'Burundi', region:'africa',
    tagline:'The Hidden Gem on Lake Tanganyika\'s Golden Shore',
    description:'<p>Bujumbura, Burundi\'s largest city and former capital, sits beautifully on the northeastern shore of Lake Tanganyika — the world\'s second-deepest lake and home to over 350 unique fish species. At just 35 minutes from Kigali, this is one of the shortest and most convenient flights in the RwandAir network.</p><p>Still largely undiscovered by international tourism, Bujumbura offers a genuinely authentic African experience. Relax on the surprisingly beautiful lake beaches, explore local markets brimming with handcrafted goods, and enjoy the warm hospitality of the Burundian people.</p>',
    highlights:['Ultra-short 35-minute flight','Lake Tanganyika beaches','Authentic off-the-beaten-path experience','Livingstone-Stanley monument at Mugere','Rusizi National Park','Vibrant local drum culture'],
    bestTimeToVisit:'June to September (dry season, cool evenings). December-January also pleasant.',
    weather:{ avg_temp:'23°C', climate:'Tropical' },
    travelTips:['Visa on arrival for most nationalities','French and Kirundi are the main languages — English is limited','Lake Tanganyika beaches are safe for swimming','Local SIM cards are very affordable','Bujumbura is walkable — or use taxi-motos'],
    attractions:[
      { name:'Lake Tanganyika Beaches', desc:'Swim in the crystal-clear waters of the world\'s second-deepest lake with golden sand shores.', icon:'🏖' },
      { name:'Rusizi National Park', desc:'Spot hippos, crocodiles, and exotic birds where the Rusizi River meets Lake Tanganyika.', icon:'🦛' },
      { name:'Livingstone-Stanley Monument', desc:'Visit the stone marking where explorer Stanley met Dr. Livingstone at Mugere.', icon:'🗿' },
      { name:'Central Market', desc:'Experience the colors and energy of Bujumbura\'s bustling main marketplace.', icon:'🛒' },
      { name:'Saga Beach', desc:'The most popular lakeside beach — perfect for sunset drinks and fresh grilled fish.', icon:'🌅' },
      { name:'Royal Drummers of Burundi', desc:'Witness the UNESCO-listed Karyenda drum performances — a powerful cultural tradition.', icon:'🥁' }
    ],
    cuisine:['Brochettes (grilled meat skewers)','Sambaza (Lake Tanganyika sardines)','Isombe (cassava leaves)','Plantain dishes','Fresh Nile perch','Banana beer','Burundian coffee'],
    currency:'BIF (Burundian Franc)', language:'Kirundi, French', timezone:'CAT (UTC+2)'
  },
  BOM: {
    city:'Mumbai', country:'India', region:'asia',
    tagline:'Maximum City — A Billion Dreams in One Metropolis',
    description:'<p>Mumbai is India at its most intense, most glamorous, and most alive. The financial capital of a 1.4-billion-person nation, Mumbai is where Bollywood dreams are made, where ancient temples stand next to Art Deco masterpieces, and where street food vendors serve some of the most extraordinary flavors on Earth — all for a few rupees.</p><p>Connected via Dubai on RwandAir, Mumbai is your gateway to the incredible diversity of the Indian subcontinent. From the iconic Gateway of India to the cave temples of Elephanta Island, from the chaos of Crawford Market to the serenity of Marine Drive at sunset, Mumbai is unforgettable.</p>',
    highlights:['Via Dubai connection','Bollywood — world\'s largest film industry','Gateway of India landmark','Incredible street food scene','Elephanta Caves UNESCO site','Marine Drive sunset walks'],
    bestTimeToVisit:'November to February (cool and dry). Avoid June-September (monsoon season).',
    weather:{ avg_temp:'27°C', climate:'Tropical wet and dry' },
    travelTips:['Indian e-visa available online for most nationalities','Mumbai local trains are the lifeline — avoid rush hour','Street food is legendary but stick to popular stalls','Auto-rickshaws use meters — insist on it','Dress modestly at religious sites'],
    attractions:[
      { name:'Gateway of India', desc:'The iconic waterfront arch built in 1924 — Mumbai\'s most photographed landmark.', icon:'🏛' },
      { name:'Elephanta Caves', desc:'5th-century rock-cut cave temples on an island in Mumbai Harbour — a UNESCO World Heritage Site.', icon:'🗿' },
      { name:'Marine Drive', desc:'The "Queen\'s Necklace" — a 3km seafront promenade with stunning sunset views over the Arabian Sea.', icon:'🌅' },
      { name:'Chhatrapati Shivaji Terminus', desc:'A UNESCO-listed Victorian Gothic railway station — still Mumbai\'s busiest train hub.', icon:'🚉' },
      { name:'Dharavi', desc:'One of Asia\'s largest informal settlements — visit ethically to understand its incredible entrepreneurial spirit.', icon:'🏘' },
      { name:'Bollywood Studio Tour', desc:'Go behind the scenes of the world\'s most prolific film industry producing 1,500+ films annually.', icon:'🎬' }
    ],
    cuisine:['Vada Pav (Mumbai\'s street burger)','Pav Bhaji','Butter Chicken','Biryani','Pani Puri','Thali (set meal)','Masala Chai'],
    currency:'INR (Indian Rupee)', language:'Hindi, Marathi, English', timezone:'IST (UTC+5:30)'
  },
  LUN: {
    city:'Lusaka', country:'Zambia', region:'africa',
    tagline:'The Real Africa — Victoria Falls and Beyond',
    description:'<p>Lusaka is the laid-back, tree-lined capital of Zambia — a country that offers some of Africa\'s most spectacular and unspoiled wilderness experiences. While the city itself is a pleasant place to spend a day or two, the real draw is what lies beyond: Victoria Falls (the largest curtain of falling water on Earth), South Luangwa National Park (where walking safaris were invented), and the vast wetlands of the Bangweulu Swamps.</p><p>A 3h 45m flight from Kigali, Lusaka is your gateway to an authentic, uncrowded African adventure that few tourists experience.</p>',
    highlights:['Direct 3h 45m flight','Victoria Falls day trip','South Luangwa walking safaris','Lower Zambezi canoeing','Warm Zambian hospitality','Affordable luxury lodges'],
    bestTimeToVisit:'May to October (dry season, best for safari and Victoria Falls at full flow).',
    weather:{ avg_temp:'20°C', climate:'Humid subtropical' },
    travelTips:['Zambia visa available at borders and online','KAZA UniVisa covers both Zambia and Zimbabwe','Malaria prophylaxis recommended for safari areas','Zambian Kwacha notes are polymer (waterproof!)','"Muli shani?" (How are you?) in Nyanja goes a long way'],
    attractions:[
      { name:'Victoria Falls', desc:'Witness "The Smoke That Thunders" — the world\'s largest waterfall, straddling Zambia and Zimbabwe.', icon:'💧' },
      { name:'South Luangwa National Park', desc:'Birthplace of the walking safari — get on foot with expert guides among leopards and hippos.', icon:'🦁' },
      { name:'Lower Zambezi National Park', desc:'Canoe safaris past elephants and hippos in one of Africa\'s most pristine valleys.', icon:'🛶' },
      { name:'Lusaka National Museum', desc:'Explore Zambian history, culture, and contemporary art in the capital\'s main museum.', icon:'🏛' },
      { name:'Lilayi Elephant Nursery', desc:'Visit orphaned baby elephants being raised for release back into the wild.', icon:'🐘' },
      { name:'Sunday Market at Arcades', desc:'Browse local crafts, organic produce, and street food at Lusaka\'s popular weekend market.', icon:'🛒' }
    ],
    cuisine:['Nshima (maize porridge)','Ifisashi (greens in peanut sauce)','Bream fish from Lake Kariba','Chikanda (African polony)','Kapenta (dried sardines)','Chibwantu (fermented drink)','Vitumbuwa (fritters)'],
    currency:'ZMW (Zambian Kwacha)', language:'English, Bemba, Nyanja', timezone:'CAT (UTC+2)'
  },
  HRE: {
    city:'Harare', country:'Zimbabwe', region:'africa',
    tagline:'The Sunshine City — Gateway to Zimbabwe\'s Wonders',
    description:'<p>Harare, the "Sunshine City," lives up to its name with over 300 days of glorious weather per year. Zimbabwe\'s capital is a city of wide jacaranda-lined avenues, thriving arts markets, and a resilient, optimistic spirit that defines the Zimbabwean character.</p><p>Just 3h 30m from Kigali, Harare serves as the gateway to Zimbabwe\'s incredible natural attractions — from the mighty Victoria Falls to the ancient stone ruins of Great Zimbabwe, from the granite balancing rocks of Matopos to the wildlife-rich Hwange National Park.</p>',
    highlights:['Direct 3h 30m flight','Gateway to Victoria Falls','Great Zimbabwe ruins','Stunning Eastern Highlands','Matopos balancing rocks','Thriving arts and crafts scene'],
    bestTimeToVisit:'May to October (dry season). September-October best for wildlife viewing.',
    weather:{ avg_temp:'18°C', climate:'Subtropical highland' },
    travelTips:['KAZA UniVisa covers Zimbabwe and Zambia','US Dollars widely accepted alongside ZiG (new currency)','Harare is very safe by African capital standards','Arts and crafts markets offer incredible value','Book internal flights early for Victoria Falls connections'],
    attractions:[
      { name:'Great Zimbabwe', desc:'The mysterious medieval stone city that gave the nation its name — a UNESCO World Heritage Site.', icon:'🏛' },
      { name:'Matopos National Park', desc:'Ancient granite formations, San rock art, and Cecil Rhodes\' burial site — the "View of the World."', icon:'⛰' },
      { name:'Hwange National Park', desc:'Zimbabwe\'s largest game reserve — home to one of Africa\'s biggest elephant populations.', icon:'🐘' },
      { name:'Mbare Musika Market', desc:'Harare\'s largest and most vibrant market — produce, crafts, and pure Zimbabwean energy.', icon:'🛒' },
      { name:'National Gallery of Zimbabwe', desc:'Outstanding collection of Shona stone sculptures — Zimbabwe\'s most famous art form.', icon:'🎨' },
      { name:'Balancing Rocks', desc:'The iconic granite formations featured on Zimbabwe\'s banknotes — a geological wonder.', icon:'🪨' }
    ],
    cuisine:['Sadza (maize staple)','Nyama (grilled meat)','Matemba (dried minnows)','Muboora (pumpkin leaves)','Dovi (peanut butter stew)','Biltong','Mazoe orange crush'],
    currency:'ZiG / USD accepted', language:'English, Shona, Ndebele', timezone:'CAT (UTC+2)'
  },
  MBA: {
    city:'Mombasa', country:'Kenya', region:'africa',
    tagline:'The Spice Coast — Where Swahili Culture Meets Paradise Beaches',
    description:'<p>Mombasa is Kenya\'s second city and the jewel of the East African coast. For over a thousand years, this island city has been a crossroads of African, Arab, Indian, and Portuguese influences, creating a rich Swahili culture that\'s uniquely its own. The Old Town\'s narrow lanes, carved doors, and coral stone buildings transport you to another era.</p><p>Just 1h 55m from Kigali, Mombasa offers the perfect combination of cultural exploration and beach relaxation. The white-sand beaches stretching north and south of the island are among the finest in Africa, with warm turquoise waters perfect for snorkeling and diving.</p>',
    highlights:['Short 1h 55m direct flight','Diani Beach — Africa\'s best beach','UNESCO Old Town heritage','Fort Jesus — 16th century Portuguese fort','Marine National Park snorkeling','Tsavo safari gateway'],
    bestTimeToVisit:'July to October and January to March (dry, warm, perfect beach weather).',
    weather:{ avg_temp:'27°C', climate:'Tropical monsoon' },
    travelTips:['Mombasa Old Town is best explored on foot','Dress respectfully — Mombasa is predominantly Muslim','Fresh seafood is incredible and very affordable','Tuk-tuks are fun and cheap for getting around','Diani Beach is 30km south — worth a day trip or stay'],
    attractions:[
      { name:'Fort Jesus', desc:'The iconic 16th-century Portuguese fortress overlooking the Old Port — a UNESCO World Heritage Site.', icon:'🏰' },
      { name:'Diani Beach', desc:'Regularly voted Africa\'s leading beach — powder-white sand, palm trees, and crystal waters.', icon:'🏖' },
      { name:'Mombasa Old Town', desc:'Wander through centuries of Swahili history — carved wooden doors, spice markets, and coral mosques.', icon:'🏘' },
      { name:'Haller Park', desc:'A rehabilitated limestone quarry transformed into a nature sanctuary — home to Owen the hippo.', icon:'🌿' },
      { name:'Watamu Marine National Park', desc:'Snorkel or dive among coral gardens, sea turtles, and tropical fish.', icon:'🐢' },
      { name:'Tsavo National Park', desc:'Kenya\'s largest park — famous for its red elephants and the man-eating lions of Tsavo.', icon:'🦁' }
    ],
    cuisine:['Swahili Biryani','Coconut fish curry','Pilau rice','Samosas','Mahamri (coconut doughnuts)','Grilled lobster','Tamarind juice'],
    currency:'KES (Kenyan Shilling)', language:'Swahili, English', timezone:'EAT (UTC+3)'
  },
  MRU: {
    city:'Mauritius', country:'Mauritius', region:'africa',
    tagline:'Paradise Found — Where Every Shade of Blue Exists',
    description:'<p>Mauritius is the dream destination that actually lives up to the postcards. This volcanic island in the Indian Ocean offers a staggering spectrum of blues — from the pale aquamarine of its lagoons to the deep sapphire of the open ocean. But Mauritius is so much more than its legendary beaches; it\'s a cultural melting pot where African, Indian, Chinese, and French influences create something truly unique.</p><p>A 4h 10m flight from Kigali, Mauritius offers luxury resorts, world-class diving, dramatic volcanic landscapes, and a cuisine that draws from every corner of its multicultural heritage. This is the ultimate Indian Ocean escape.</p>',
    highlights:['Direct 4h 10m flight','World-class beach resorts','Seven Coloured Earths of Chamarel','Black River Gorges hiking','Incredible multicultural cuisine','Underwater waterfall illusion'],
    bestTimeToVisit:'May to December (cool, dry). September-November ideal. Avoid January-March (cyclone risk).',
    weather:{ avg_temp:'24°C', climate:'Tropical maritime' },
    travelTips:['No visa required for most nationalities (90 days)','Drive on the left (British influence)','Rupee is the currency but Euros widely accepted at resorts','Rent a car to explore the island — it\'s small and easy','Learn a few Kreol phrases — "Ki manyer?" (How are you?)'],
    attractions:[
      { name:'Chamarel Seven Coloured Earths', desc:'A geological wonder — sand dunes in seven distinct colors that never erode despite rainfall.', icon:'🌈' },
      { name:'Le Morne Brabant', desc:'A UNESCO World Heritage mountain with a powerful history of escaped slaves — stunning hiking.', icon:'⛰' },
      { name:'Black River Gorges National Park', desc:'Hike through endemic forests and spot the rare Mauritius kestrel and pink pigeon.', icon:'🌿' },
      { name:'Île aux Cerfs', desc:'A picture-perfect island with white sand beaches, water sports, and a championship golf course.', icon:'🏝' },
      { name:'Grand Bassin (Ganga Talao)', desc:'A sacred crater lake and Hindu pilgrimage site with towering Shiva and Durga statues.', icon:'🛕' },
      { name:'Port Louis Central Market', desc:'The vibrant capital\'s marketplace — spices, tropical fruits, and local street food delights.', icon:'🛒' }
    ],
    cuisine:['Dholl Puri (lentil flatbread)','Rougaille (tomato-based sauce)','Gateau Piment (chili cakes)','Alouda (sweet milk drink)','Vindaye (mustard seed curry)','Mine Frit (fried noodles)','Rum Arrangé'],
    currency:'MUR (Mauritian Rupee)', language:'English, French, Kreol Morisien', timezone:'MUT (UTC+4)'
  }
};

// GET /api/destinations/:code — simulated AI destination content
app.get('/api/destinations/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const content = DESTINATION_CONTENT[code];
  if (!content) return res.status(404).json({ error: 'Destination not found' });

  const routeKey = 'KGL-' + code;
  const route = ROUTES[routeKey] || null;
  const airport = AIRPORTS.find(a => a.code === code);

  // Simulate AI generation delay
  setTimeout(() => {
    res.json({
      code,
      city: content.city,
      country: content.country,
      region: content.region,
      airport: airport ? airport.name : '',
      tagline: content.tagline,
      description: content.description,
      highlights: content.highlights,
      bestTimeToVisit: content.bestTimeToVisit,
      weather: content.weather,
      travelTips: content.travelTips,
      attractions: content.attractions,
      cuisine: content.cuisine,
      currency: content.currency,
      language: content.language,
      timezone: content.timezone,
      flight: route ? {
        duration: route.duration,
        stops: route.stops,
        stopCity: route.stopCode ? (AIRPORTS.find(a => a.code === route.stopCode) || {}).city || route.stopCode : null,
        aircraft: route.aircraft,
        fromPrice: route.baseEco,
        businessPrice: route.baseBus,
      } : null,
      imageUrl: 'https://www.rwandair.com/dist/phoenix/V1.0/img/' + code + '.jpg',
      generatedAt: new Date().toISOString(),
      aiModel: 'RwandAir Travel AI v2.1',
    });
  }, 200);
});

// GET /api/destinations — list all destinations
app.get('/api/destinations', (req, res) => {
  const list = Object.entries(DESTINATION_CONTENT).map(([code, c]) => {
    const route = ROUTES['KGL-' + code];
    return {
      code, city: c.city, country: c.country, region: c.region,
      tagline: c.tagline,
      imageUrl: 'https://www.rwandair.com/dist/phoenix/V1.0/img/' + code + '.jpg',
      fromPrice: route ? route.baseEco : null,
      duration: route ? route.duration : null,
    };
  });
  res.json({ destinations: list });
});

// SPA fallback — serve index.html for all non-file routes
app.get('*', (req, res) => {
  // Serve admin.html and cms.html specifically
  if (req.path === '/admin.html') return res.sendFile(path.join(__dirname, 'admin.html'));
  if (req.path === '/cms.html') return res.sendFile(path.join(__dirname, 'cms.html'));
  if (!path.extname(req.path))
    return res.sendFile(path.join(__dirname, 'index.html'));
  res.status(404).send('Not found');
});

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

function getNetworkIPs() {
  const nets = os.networkInterfaces();
  return Object.values(nets).flat()
    .filter(n => n.family === 'IPv4' && !n.internal)
    .map(n => n.address);
}

app.listen(PORT, '0.0.0.0', async () => {
  const ips = getNetworkIPs();
  console.log(`\n  ✈  RwandAir Mock API`);
  console.log(`\n  Local:         http://localhost:${PORT}/`);
  if (ips.length) {
    console.log(`  LAN:`);
    ips.forEach(ip => console.log(`                 http://${ip}:${PORT}/`));
  }
  console.log(`\n  Demo login:    demo@rwandair.com  /  demo123`);
  console.log(`  Admin login:   admin@rwandair.com /  admin123`);
  console.log(`\n  Back Office:   /admin.html`);
  console.log(`  CMS:           /cms.html`);
  console.log(`  Audit hub:     /audit.html`);

  // ── Public tunnel (internet access) ──────────────────────────────
  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({ port: PORT, subdomain: 'rwandair-demo' });
    console.log(`\n  🌍 Public URL:  ${tunnel.url}  ← share this link!`);
    tunnel.on('error', () => {});
    tunnel.on('close', () => console.log('\n  Tunnel closed. Restart server to get a new public URL.'));
  } catch (e) {
    // Try without custom subdomain if name taken
    try {
      const localtunnel = require('localtunnel');
      const tunnel = await localtunnel({ port: PORT });
      console.log(`\n  🌍 Public URL:  ${tunnel.url}  ← share this link!`);
      tunnel.on('error', () => {});
    } catch (_) {
      console.log(`\n  ⚠  Public tunnel unavailable. Use LAN URL or run: npx localtunnel --port ${PORT}`);
    }
  }
  console.log('');
});
