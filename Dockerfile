FROM python:3.12-slim

WORKDIR /app

COPY index.html .
COPY css/ css/
COPY js/ js/

EXPOSE 8080

CMD ["python", "-m", "http.server", "8080"]
