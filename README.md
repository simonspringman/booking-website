# RwandAir Booking Website

A prototype airline booking website for RwandAir with an AI-powered chat assistant that lets users search and book flights entirely through conversation.

## What it does

- **Flight search** — ask the chatbot "I want to fly from Kigali to London" and it searches real mock flight data
- **Full booking flow in chat** — select a flight, enter passenger details, choose a payment method, and receive a booking confirmation — all inside the chat widget
- **Standard booking pages** — search, results, passenger form, seat map, payment, and confirmation pages
- **Manage Booking / Check-in / Flight Status** pages

---

## Architecture

```
┌─────────────────────────────────┐
│  Browser (index.html)           │
│  css/styles.css · js/app.js     │
│  Chat widget ──► /api/chat      │
└────────────┬────────────────────┘
             │ HTTP (same origin)
┌────────────▼────────────────────┐
│  Flask server  (server.py)      │
│  · Serves static frontend       │
│  · POST /api/chat               │
│  · GET  /api/bookings           │
│  · GET  /health                 │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Google ADK Agent  (agent.py)   │
│  Model: Gemini 1.5 Flash        │
│  Tools:                         │
│  · search_available_flights     │
│  · get_airport_info             │
│  · create_flight_booking        │
│  · get_booking_details          │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  Mock data  (data/)             │
│  · flights.json  — 12 routes    │
│  · bookings.json — stored here  │
└─────────────────────────────────┘
```

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.10 or newer |
| pip | any recent version |
| Docker + Docker Compose | optional (for containerised run) |
| Google AI API key | required for the Gemini LLM |

Get a free Google AI API key at **https://aistudio.google.com/**

---

## Option 1 — Run with Docker (recommended)

This is the easiest way. One command builds and starts everything.

**Step 1 — Create your `.env` file**

```bash
cp .env.example .env
```

Open `.env` and fill in your key:

```env
GOOGLE_API_KEY=your_google_ai_api_key_here
```

**Step 2 — Build and start**

```bash
docker compose up --build
```

**Step 3 — Open the app**

```
http://localhost:8080
```

To stop:

```bash
docker compose down
```

> Bookings are saved to `data/bookings.json` on your machine (volume mount), so they persist across restarts.

---

## Option 2 — Run locally with Python

**Step 1 — Create a virtual environment**

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**Step 2 — Install dependencies**

```bash
pip install -r requirements.txt
```

**Step 3 — Create your `.env` file**

```bash
cp .env.example .env
```

Open `.env` and add your key:

```env
GOOGLE_API_KEY=your_google_ai_api_key_here
```

**Step 4 — Start the server**

```bash
python server.py
```

You should see:

```
🛫  RwandAir Booking Agent API
    Running on http://localhost:8080
    Chat endpoint: POST http://localhost:8080/api/chat
    Health check:  GET  http://localhost:8080/health
```

**Step 5 — Open the app**

```
http://localhost:8080
```

---

## Project structure

```
booking-website/
├── index.html              # Frontend SPA (all pages)
├── css/
│   └── styles.css          # All styling
├── js/
│   └── app.js              # Navigation, booking flow, chat logic
├── agent.py                # Google ADK agent + flight tools
├── server.py               # Flask API server
├── data/
│   ├── flights.json        # Mock flight schedule (12 routes, 20+ flights)
│   └── bookings.json       # Confirmed bookings (written at runtime)
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Container orchestration
└── CLAUDE.md               # Architecture & change history
```

---

## Using the chat assistant

Open the chat bubble (bottom-right corner) and try:

| What to say | What happens |
|-------------|-------------|
| `I want to fly from Kigali to London` | Agent asks for date, then searches flights |
| `What flights are available to Nairobi?` | Agent asks for date and shows results |
| `Book flight WB 400` | Agent starts collecting passenger details |
| `What is the baggage allowance?` | Agent answers from RwandAir policy |
| `Check my booking WB-2025-NBO-78421` | Agent retrieves booking details |

The full booking flow inside chat:

```
You: I want to fly from Kigali to Dubai
Agent: What date would you like to travel?
You: April 20 2025
Agent: [shows flight cards] → click "Select WB 200"
Agent: Which fare class? (Lite $310 / Classic $420 / Business $1200)
You: Economy Classic
Agent: What is your first name?
You: John
Agent: Last name?
...  (passport, email, phone)
Agent: [shows payment buttons] → click "Pay with MTN Mobile Money"
Agent: [shows booking confirmation card with reference number]
```

---

## Available flight routes

| Route | Frequency |
|-------|-----------|
| Kigali (KGL) ↔ Nairobi (NBO) | Daily (4 flights/day) |
| Kigali (KGL) ↔ London (LHR) | 4× weekly |
| Kigali (KGL) ↔ Dubai (DXB) | Daily |
| Kigali (KGL) ↔ Lagos (LOS) | 4× weekly |
| Kigali (KGL) ↔ Johannesburg (JNB) | 5× weekly |
| Kigali (KGL) ↔ Entebbe (EBB) | Daily |
| Kigali (KGL) ↔ Bujumbura (BJM) | Daily |
| Kigali (KGL) ↔ Brussels (BRU) | 3× weekly |
| Kigali (KGL) ↔ Dar es Salaam (DAR) | Daily |

---

## Payment methods supported

- **Card / Mobile Money** — Visa, Mastercard, PayPal, MTN MoMo, Airtel
- **DPO** — Direct Pay Online
- **Bank of Kigali** — Visa

> Payment is mocked in this prototype — no real charges are made.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Serves the frontend |
| `GET` | `/health` | Health check |
| `POST` | `/api/chat` | Send a message to the AI agent |
| `GET` | `/api/bookings` | List all bookings |
| `GET` | `/api/bookings/<ref>` | Get a booking by reference |

**Chat request format:**
```json
POST /api/chat
{
  "message": "I want to fly from Kigali to London",
  "session_id": "optional-uuid-for-conversation-continuity"
}
```

---

## Troubleshooting

**`GOOGLE_API_KEY is not set` error**
Make sure you have a `.env` file with a valid key. Do not commit this file.

**Chat says "unable to connect to the booking service"**
The Flask server is not running. Start it with `python server.py` or `docker compose up`.

**`ModuleNotFoundError: No module named 'google.adk'`**
Run `pip install -r requirements.txt` inside your virtual environment.

**`ModuleNotFoundError: No module named 'google.adk.types'`**
`Content` and `Part` live in `google.genai.types`, not `google.adk.types`. This is already fixed in `server.py` — rebuild the container: `docker compose up --build`.

**Port 8080 already in use**
Change the port in `.env`: `PORT=9090` and update `docker-compose.yml` ports to `"9090:9090"`.
