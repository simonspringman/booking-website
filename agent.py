"""
RwandAir Flight Booking Agent — Google ADK
==========================================
Conversational AI agent that helps users search and book RwandAir flights.
Uses mock flight data from data/flights.json and stores bookings in data/bookings.json.

Architecture:
- Tools: search_available_flights, get_airport_info, create_flight_booking, get_booking_details
- LLM: Gemini via Google ADK
- Session: InMemorySessionService (per-tab session using sessionId from browser)
"""

import json
import uuid
import random
import os
from datetime import datetime, timedelta
from pathlib import Path

from google.adk.agents import Agent

# ── Model config (override via GEMINI_MODEL env var) ──────────────────────────
# Free-tier quota comparison (requests/minute):
#   gemini-2.0-flash-lite  → 30 RPM  ← recommended for free tier
#   gemini-2.0-flash       → 15 RPM
#   gemini-1.5-flash-8b    → 15 RPM
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
FLIGHTS_FILE = BASE_DIR / "data" / "flights.json"
BOOKINGS_FILE = BASE_DIR / "data" / "bookings.json"

# ── Load flight data once at startup ──────────────────────────────────────────
with open(FLIGHTS_FILE, "r") as f:
    FLIGHT_DB = json.load(f)

AIRPORTS = FLIGHT_DB["airports"]
CITY_TO_CODE = FLIGHT_DB["city_to_code"]
ROUTES = FLIGHT_DB["routes"]


# ── Helper utilities ───────────────────────────────────────────────────────────

def _resolve_code(name: str) -> str | None:
    """Resolve city name or IATA code to IATA code."""
    name = name.strip().upper()
    if name in AIRPORTS:
        return name
    lower = name.lower()
    return CITY_TO_CODE.get(lower)


def _day_of_week(date_str: str) -> str:
    """Return day name (e.g., 'Monday') for a YYYY-MM-DD string."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return d.strftime("%A")
    except ValueError:
        return ""


def _seats_remaining(flight_number: str, date_str: str, cabin: str, total: int) -> int:
    """Generate a deterministic-ish seat count using flight+date as seed."""
    seed = hash(f"{flight_number}{date_str}{cabin}") % 10000
    rng = random.Random(seed)
    # 10–90% of seats available
    return rng.randint(max(1, total // 10), total)


def _load_bookings() -> list:
    try:
        with open(BOOKINGS_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_bookings(bookings: list) -> None:
    with open(BOOKINGS_FILE, "w") as f:
        json.dump(bookings, f, indent=2)


# ── Tool: get_airport_info ────────────────────────────────────────────────────

def get_airport_info(city_or_code: str) -> dict:
    """
    Look up an airport by city name or IATA code.

    Args:
        city_or_code: City name (e.g., 'London', 'Kigali') or IATA code (e.g., 'LHR', 'KGL')

    Returns:
        dict with airport details or error message
    """
    code = _resolve_code(city_or_code)
    if not code:
        # Try partial match
        lower = city_or_code.lower()
        for key, val in CITY_TO_CODE.items():
            if lower in key or key in lower:
                code = val
                break

    if code and code in AIRPORTS:
        airport = AIRPORTS[code]
        return {
            "status": "success",
            "iata_code": code,
            "city": airport["city"],
            "airport_name": airport["name"],
            "country": airport["country"]
        }

    # List available airports as hint
    available = [f"{info['city']} ({code})" for code, info in AIRPORTS.items()]
    return {
        "status": "not_found",
        "message": f"Airport not found for '{city_or_code}'.",
        "available_destinations": available
    }


# ── Tool: search_available_flights ────────────────────────────────────────────

def search_available_flights(origin: str, destination: str, travel_date: str) -> dict:
    """
    Search for available RwandAir flights between two cities/airports on a given date.

    Args:
        origin: Origin city name or IATA code (e.g., 'Kigali' or 'KGL')
        destination: Destination city name or IATA code (e.g., 'London' or 'LHR')
        travel_date: Date in YYYY-MM-DD format (e.g., '2025-04-15')

    Returns:
        dict with list of available flights including prices and seat availability
    """
    origin_code = _resolve_code(origin)
    dest_code = _resolve_code(destination)

    if not origin_code:
        return {"status": "error", "message": f"Could not find airport for origin '{origin}'. Please use a city name like 'Kigali' or IATA code like 'KGL'."}
    if not dest_code:
        return {"status": "error", "message": f"Could not find airport for destination '{destination}'. Please use a city name like 'London' or IATA code like 'LHR'."}

    # Validate date
    try:
        travel_dt = datetime.strptime(travel_date, "%Y-%m-%d")
        if travel_dt.date() < datetime.now().date():
            return {"status": "error", "message": "Travel date cannot be in the past. Please choose a future date."}
    except ValueError:
        return {"status": "error", "message": f"Invalid date format '{travel_date}'. Please use YYYY-MM-DD (e.g., 2025-04-15)."}

    day_name = _day_of_week(travel_date)
    route_id = f"{origin_code}-{dest_code}"

    # Find matching route
    route = next((r for r in ROUTES if r["route_id"] == route_id), None)

    if not route:
        # List available routes from origin
        available_from_origin = [
            r["route_id"] for r in ROUTES if r["route_id"].startswith(origin_code + "-")
        ]
        if available_from_origin:
            dest_cities = [AIRPORTS.get(r.split("-")[1], {}).get("city", r.split("-")[1]) for r in available_from_origin]
            return {
                "status": "no_route",
                "message": f"RwandAir does not currently fly from {AIRPORTS.get(origin_code, {}).get('city', origin_code)} to {AIRPORTS.get(dest_code, {}).get('city', dest_code)}.",
                "available_from_origin": dest_cities
            }
        return {
            "status": "no_route",
            "message": f"No routes found from {origin_code}."
        }

    # Filter flights operating on this day
    available_flights = []
    for flight in route["flights"]:
        if day_name in flight["days_of_week"]:
            seats = {}
            for cabin in ["economy_lite", "economy_classic", "business"]:
                total = flight["total_seats"][cabin]
                remaining = _seats_remaining(flight["flight_number"], travel_date, cabin, total)
                seats[cabin] = remaining

            available_flights.append({
                "flight_number": flight["flight_number"],
                "origin": origin_code,
                "destination": dest_code,
                "origin_city": AIRPORTS[origin_code]["city"],
                "destination_city": AIRPORTS[dest_code]["city"],
                "travel_date": travel_date,
                "departure_time": flight["departure_time"],
                "arrival_time": flight["arrival_time"],
                "duration": flight["duration"],
                "aircraft": flight["aircraft"],
                "prices_usd": flight["prices"],
                "seats_available": seats
            })

    if not available_flights:
        # Find which days the route operates
        all_days = set()
        for flight in route["flights"]:
            all_days.update(flight["days_of_week"])
        return {
            "status": "no_flights_on_date",
            "message": f"No flights from {AIRPORTS[origin_code]['city']} to {AIRPORTS[dest_code]['city']} on {day_name} ({travel_date}).",
            "route_operates_on": sorted(list(all_days), key=lambda d: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].index(d))
        }

    return {
        "status": "success",
        "origin": origin_code,
        "origin_city": AIRPORTS[origin_code]["city"],
        "destination": dest_code,
        "destination_city": AIRPORTS[dest_code]["city"],
        "travel_date": travel_date,
        "day_of_week": day_name,
        "flights_found": len(available_flights),
        "flights": available_flights
    }


# ── Tool: create_flight_booking ───────────────────────────────────────────────

def create_flight_booking(
    flight_number: str,
    travel_date: str,
    passenger_first_name: str,
    passenger_last_name: str,
    passport_number: str,
    email: str,
    phone: str,
    seat_class: str,
    payment_method: str
) -> dict:
    """
    Create a confirmed flight booking and store it.

    Args:
        flight_number: Flight number (e.g., 'WB 400')
        travel_date: Date in YYYY-MM-DD format
        passenger_first_name: Passenger's first name
        passenger_last_name: Passenger's last name (surname)
        passport_number: Passport or national ID number
        email: Contact email address
        phone: Contact phone number (include country code)
        seat_class: One of 'economy_lite', 'economy_classic', or 'business'
        payment_method: Payment method used (e.g., 'MTN Mobile Money', 'Visa Card', 'DPO', 'Bank of Kigali')

    Returns:
        dict with booking confirmation details
    """
    # Validate seat class
    valid_classes = {"economy_lite": "Economy Lite", "economy_classic": "Economy Classic", "business": "Business Class"}
    seat_class_lower = seat_class.lower().replace(" ", "_").replace("-", "_")

    # Handle common variations
    if "business" in seat_class_lower:
        seat_class_lower = "business"
    elif "lite" in seat_class_lower:
        seat_class_lower = "economy_lite"
    elif "classic" in seat_class_lower or "economy" in seat_class_lower:
        seat_class_lower = "economy_classic"

    if seat_class_lower not in valid_classes:
        return {"status": "error", "message": f"Invalid seat class '{seat_class}'. Choose from: Economy Lite, Economy Classic, or Business Class."}

    # Find the flight in our data
    found_flight = None
    found_route = None
    for route in ROUTES:
        for flight in route["flights"]:
            if flight["flight_number"].upper() == flight_number.upper():
                found_flight = flight
                found_route = route
                break
        if found_flight:
            break

    if not found_flight:
        return {"status": "error", "message": f"Flight '{flight_number}' not found. Please check the flight number."}

    # Calculate price
    base_price = found_flight["prices"][seat_class_lower]
    taxes = round(base_price * 0.15, 2)
    total = round(base_price + taxes, 2)

    # Generate booking reference
    dest_code = found_route["destination"]
    ref_num = random.randint(10000, 99999)
    booking_ref = f"WB-{travel_date[:4]}-{dest_code}-{ref_num}"

    # Assign seat
    seat_letters = {"economy_lite": ["D", "E", "F"], "economy_classic": ["A", "B", "C", "D", "E", "F"], "business": ["A", "C"]}
    row = random.randint(1, 30) if seat_class_lower != "business" else random.randint(1, 8)
    seat = f"{row}{random.choice(seat_letters[seat_class_lower])}"

    origin_code = found_route["origin"]
    dest_code = found_route["destination"]

    booking = {
        "booking_reference": booking_ref,
        "status": "CONFIRMED",
        "created_at": datetime.now().isoformat(),
        "flight": {
            "flight_number": found_flight["flight_number"],
            "origin": origin_code,
            "origin_city": AIRPORTS[origin_code]["city"],
            "destination": dest_code,
            "destination_city": AIRPORTS[dest_code]["city"],
            "travel_date": travel_date,
            "departure_time": found_flight["departure_time"],
            "arrival_time": found_flight["arrival_time"],
            "duration": found_flight["duration"],
            "aircraft": found_flight["aircraft"]
        },
        "passenger": {
            "first_name": passenger_first_name.strip().title(),
            "last_name": passenger_last_name.strip().title(),
            "full_name": f"{passenger_first_name.strip().title()} {passenger_last_name.strip().title()}",
            "passport_number": passport_number.strip().upper(),
            "email": email.strip().lower(),
            "phone": phone.strip()
        },
        "booking_details": {
            "seat_class": seat_class_lower,
            "seat_class_display": valid_classes[seat_class_lower],
            "assigned_seat": seat,
            "meal": "Standard Meal",
            "baggage_allowance": "1 x 23 kg" if seat_class_lower != "business" else "2 x 32 kg"
        },
        "payment": {
            "method": payment_method,
            "base_fare_usd": base_price,
            "taxes_usd": taxes,
            "total_usd": total,
            "currency": "USD"
        },
        "miles_earned": int(base_price * 4)
    }

    # Persist booking
    bookings = _load_bookings()
    bookings.append(booking)
    _save_bookings(bookings)

    return {
        "status": "success",
        "booking": booking
    }


# ── Tool: get_booking_details ─────────────────────────────────────────────────

def get_booking_details(booking_reference: str) -> dict:
    """
    Retrieve details of an existing booking by booking reference.

    Args:
        booking_reference: Booking reference number (e.g., 'WB-2025-NBO-78421')

    Returns:
        dict with full booking details or error
    """
    bookings = _load_bookings()
    ref = booking_reference.strip().upper()
    for booking in bookings:
        if booking["booking_reference"].upper() == ref:
            return {"status": "success", "booking": booking}

    return {
        "status": "not_found",
        "message": f"No booking found with reference '{booking_reference}'. Please check the reference and try again."
    }


# ── Agent Definition ──────────────────────────────────────────────────────────

AGENT_INSTRUCTION = """
You are the RwandAir AI booking assistant. You help users search for available flights and
complete flight bookings entirely through this chat interface.

## YOUR CAPABILITIES
1. Search available flights between any two cities/airports RwandAir serves
2. Help users select a flight and fare class
3. Collect passenger details and create confirmed bookings
4. Retrieve existing booking details

## BOOKING WORKFLOW
Follow this exact sequence when a user wants to book a flight:

**STEP 1 — Gather route info**
- Ask for origin city (default is Kigali if not specified)
- Ask for destination city
- Ask for travel date (format: YYYY-MM-DD, help user if they give natural language dates)
- Then call search_available_flights()

**STEP 2 — Present flights**
After calling search_available_flights(), format the results EXACTLY like this:

[FLIGHTS_JSON]
<paste the entire flights array from the tool result as valid JSON>
[/FLIGHTS_JSON]

Then add a brief summary: "I found X flights. Which flight would you like? Please reply with the flight number (e.g., WB 400)."

**STEP 3 — Confirm selection and class**
Once user selects a flight number, ask which fare class they prefer:
- Economy Lite ($X) — hand baggage only, non-refundable
- Economy Classic ($X) — 23kg checked bag, changeable with fee
- Business Class ($X) — 2x32kg bags, full flexibility, premium dining

**STEP 4 — Collect passenger details (one at a time)**
Ask for these details one by one, waiting for each answer:
1. First name
2. Last name
3. Passport number
4. Email address
5. Phone number (with country code)

**STEP 5 — Payment**
After collecting all passenger details, show a summary of what you have collected and say:
"Great! Now let's complete your payment. Please select your preferred payment method:"
Then output EXACTLY this marker on its own line:
[SHOW_PAYMENT]

**STEP 6 — Confirm booking**
When the user selects a payment method (they will say something like "I want to pay with Card / Mobile Money" or "Pay with Bank of Kigali"), you MUST immediately call create_flight_booking() using ALL the passenger details and flight details you collected in previous steps. Do NOT ask again for information already provided.
After the tool returns successfully, output EXACTLY:

[BOOKING_JSON]
<paste the entire booking object from the tool result as valid JSON — the value of the "booking" key>
[/BOOKING_JSON]

Then congratulate the user and tell them to save their booking reference.

## RETRIEVING EXISTING BOOKINGS
When a user asks to check, view or retrieve an existing booking (e.g., "Check my booking WB-2026-LHR-47471"):
1. Call get_booking_details() with the reference they provide
2. If found, output EXACTLY:

[BOOKING_JSON]
<paste the entire booking object from the tool result as valid JSON — the value of the "booking" key>
[/BOOKING_JSON]

Then say: "Here are your booking details above. Is there anything else I can help you with?"
3. If not found, tell the user the reference was not found and ask them to double-check it.

## IMPORTANT RULES
- Be friendly, concise, and professional — you represent RwandAir
- Always use tools to search flights and create bookings — never invent flight data
- When presenting prices, always say they are in USD
- If a route is not available, suggest alternatives politely
- For dates, accept natural language (e.g., "next Monday", "March 15") and convert to YYYY-MM-DD
- Today's date reference: use the current date context
- Do NOT skip steps in the booking workflow
- Ask one question at a time when collecting passenger details
- NEVER ask for information already provided in the conversation — remember all details across the conversation
- If user asks about baggage, check-in, travel documents — answer from your knowledge of RwandAir policies
- Baggage: Lite=7kg hand only, Classic=7kg+23kg, Business=7kg+2x32kg
- Check-in opens 24h before, closes 3h before departure
- Online check-in available at rwandair.com

## TONE
Warm, helpful, efficient. Use phrases like "Great choice!", "Let me check that for you...",
"You're all set!" Keep responses concise — avoid long paragraphs.
"""

root_agent = Agent(
    name="rwandair_booking_agent",
    model=GEMINI_MODEL,
    description="RwandAir conversational flight booking assistant with real flight data access.",
    instruction=AGENT_INSTRUCTION,
    tools=[get_airport_info, search_available_flights, create_flight_booking, get_booking_details],
)
