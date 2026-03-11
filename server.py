"""
RwandAir Booking API Server
============================
Flask server that exposes the Google ADK agent as a REST API.

Endpoints:
  POST /api/chat         — Send a message, receive agent response
  GET  /api/bookings     — List all bookings
  GET  /api/bookings/<ref> — Get a specific booking
  GET  /health           — Health check

Run:
  python server.py
  (or: flask --app server run --port 5000)

Requires: GOOGLE_API_KEY in .env file
"""

import asyncio
import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

load_dotenv()

BASE_DIR = Path(__file__).parent

# ── Validate environment ───────────────────────────────────────────────────────
if not os.getenv("GOOGLE_API_KEY"):
    raise EnvironmentError(
        "GOOGLE_API_KEY is not set. Create a .env file with:\n"
        "  GOOGLE_API_KEY=your_key_here\n"
        "Get your key at https://aistudio.google.com/"
    )

# ── Import ADK components ──────────────────────────────────────────────────────
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

# Import our agent
from agent import root_agent, BOOKINGS_FILE

# ── ADK Session Setup ──────────────────────────────────────────────────────────
APP_NAME = "rwandair_booking"
session_service = InMemorySessionService()
runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=session_service
)

# ── Flask App ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ── Async helpers ──────────────────────────────────────────────────────────────

async def _ensure_session(session_id: str) -> None:
    """Create session if it doesn't exist."""
    session = await session_service.get_session(
        app_name=APP_NAME, user_id="user", session_id=session_id
    )
    if session is None:
        await session_service.create_session(
            app_name=APP_NAME, user_id="user", session_id=session_id
        )


def _parse_quota_error(exc: Exception) -> dict | None:
    """
    If exc is a 429 quota error, return structured info.
    Returns None if not a quota error.
    """
    msg = str(exc)
    if "429" not in msg and "RESOURCE_EXHAUSTED" not in msg:
        return None

    # Extract retry delay (e.g. "retryDelay: '14s'" or "retry in 21s")
    import re
    retry_seconds = 60  # conservative default
    m = re.search(r"retry[^0-9]*(\d+)[\.\d]*s", msg, re.IGNORECASE)
    if m:
        retry_seconds = int(m.group(1))

    # Distinguish per-minute limit (retryDelay given, short) vs daily exhaustion (limit: 0)
    is_daily_exhausted = "GenerateRequestsPerDayPerProjectPerModel" in msg and "limit: 0" in msg

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")
    if is_daily_exhausted:
        return {
            "error_type": "quota_daily",
            "retry_seconds": None,
            "user_message": (
                f"⚠️ The free-tier daily quota for **{model}** is fully exhausted.\n\n"
                "Quotas reset at midnight Pacific Time. You can:\n"
                "• Wait until tomorrow (quota resets automatically)\n"
                "• Enable billing on your Google AI project for higher limits\n"
                "• Use a different API key with remaining quota"
            )
        }
    return {
        "error_type": "quota_rate_limit",
        "retry_seconds": retry_seconds,
        "user_message": (
            f"⏳ Rate limit hit — the API asked us to wait **{retry_seconds} seconds**. "
            "Please try again in a moment."
        )
    }


async def _run_agent(session_id: str, user_message: str) -> str:
    """Send a message to the agent and return the final text response.
    Retries once automatically on short per-minute rate limits (≤ 60 s).
    """
    await _ensure_session(session_id)
    content = Content(role="user", parts=[Part(text=user_message)])

    for attempt in range(2):  # 1 automatic retry for rate limits
        try:
            final_text = ""
            async for event in runner.run_async(
                user_id="user",
                session_id=session_id,
                new_message=content
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_text = event.content.parts[0].text or ""
            return final_text

        except Exception as exc:
            quota_info = _parse_quota_error(exc)
            if quota_info and quota_info["error_type"] == "quota_rate_limit" and attempt == 0:
                wait = min(quota_info["retry_seconds"], 60)
                await asyncio.sleep(wait)
                continue  # retry once
            raise  # re-raise for daily exhaustion or second failure

    return ""


def run_async_safe(coro):
    """Run an async coroutine from a sync Flask context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# ── Response parsing ───────────────────────────────────────────────────────────

def _parse_agent_response(raw_text: str) -> dict:
    """
    Extract structured data blocks from agent response text.
    Returns a dict with parsed components for the frontend.
    """
    result = {
        "text": raw_text,
        "flights": None,
        "booking": None,
        "show_payment": False,
        "clean_text": raw_text
    }

    # Extract [FLIGHTS_JSON]...[/FLIGHTS_JSON]
    flights_start = raw_text.find("[FLIGHTS_JSON]")
    flights_end = raw_text.find("[/FLIGHTS_JSON]")
    if flights_start != -1 and flights_end != -1:
        json_str = raw_text[flights_start + 14: flights_end].strip()
        try:
            result["flights"] = json.loads(json_str)
        except json.JSONDecodeError:
            pass
        # Remove the block from clean text
        result["clean_text"] = (
            raw_text[:flights_start].strip() + "\n" +
            raw_text[flights_end + 15:].strip()
        ).strip()

    # Extract [BOOKING_JSON]...[/BOOKING_JSON]
    booking_start = result["clean_text"].find("[BOOKING_JSON]")
    booking_end = result["clean_text"].find("[/BOOKING_JSON]")
    if booking_start != -1 and booking_end != -1:
        json_str = result["clean_text"][booking_start + 14: booking_end].strip()
        try:
            parsed = json.loads(json_str)
            # The tool returns {"status": "success", "booking": {...}}
            result["booking"] = parsed.get("booking", parsed)
        except json.JSONDecodeError:
            pass
        result["clean_text"] = (
            result["clean_text"][:booking_start].strip() + "\n" +
            result["clean_text"][booking_end + 15:].strip()
        ).strip()

    # Detect [SHOW_PAYMENT]
    if "[SHOW_PAYMENT]" in result["clean_text"]:
        result["show_payment"] = True
        result["clean_text"] = result["clean_text"].replace("[SHOW_PAYMENT]", "").strip()

    return result


# ── API Routes ─────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def serve_index():
    """Serve the frontend SPA."""
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>", methods=["GET"])
def serve_static(filename):
    """Serve static assets (css, js, images)."""
    return send_from_directory(BASE_DIR, filename)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "agent": "rwandair_booking_agent"})


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Process a chat message through the ADK agent.

    Request body:
        { "message": "I want to fly from Kigali to London", "session_id": "uuid-..." }

    Response:
        {
          "session_id": "uuid-...",
          "clean_text": "Here are the available flights...",
          "flights": [...] | null,
          "booking": {...} | null,
          "show_payment": false
        }
    """
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()
    session_id = (data.get("session_id") or str(uuid.uuid4())).strip()

    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        raw_response = run_async_safe(_run_agent(session_id, user_message))
        parsed = _parse_agent_response(raw_response)
        parsed["session_id"] = session_id
        return jsonify(parsed)
    except Exception as e:
        quota_info = _parse_quota_error(e)
        if quota_info:
            return jsonify({
                "error_type": quota_info["error_type"],
                "retry_seconds": quota_info.get("retry_seconds"),
                "session_id": session_id,
                "clean_text": quota_info["user_message"],
                "flights": None,
                "booking": None,
                "show_payment": False
            }), 429
        return jsonify({
            "error_type": "server_error",
            "session_id": session_id,
            "clean_text": "I'm sorry, I encountered a technical issue. Please try again.",
            "flights": None,
            "booking": None,
            "show_payment": False
        }), 500


@app.route("/api/bookings", methods=["GET"])
def list_bookings():
    """List all bookings (for admin/debugging)."""
    try:
        with open(BOOKINGS_FILE, "r") as f:
            bookings = json.load(f)
        return jsonify({"bookings": bookings, "total": len(bookings)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/bookings/<string:ref>", methods=["GET"])
def get_booking(ref):
    """Retrieve a specific booking by reference."""
    try:
        with open(BOOKINGS_FILE, "r") as f:
            bookings = json.load(f)
        booking = next((b for b in bookings if b["booking_reference"].upper() == ref.upper()), None)
        if booking:
            return jsonify({"booking": booking})
        return jsonify({"error": f"Booking '{ref}' not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"\n🛫  RwandAir Booking Agent API")
    print(f"    Running on http://localhost:{port}")
    print(f"    Chat endpoint: POST http://localhost:{port}/api/chat")
    print(f"    Health check:  GET  http://localhost:{port}/health\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
