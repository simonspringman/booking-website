FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY agent.py .
COPY server.py .
COPY index.html .
COPY css/ css/
COPY js/ js/
COPY data/ data/

# Ensure bookings file exists and is writable
RUN mkdir -p data && \
    [ -f data/bookings.json ] || echo "[]" > data/bookings.json

EXPOSE 8080

# Run Flask — serves both API and static frontend
CMD ["python", "server.py"]
