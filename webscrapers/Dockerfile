FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    AUTOSCOUT_THREAD_COUNT=10 \
    MOBILE_THREAD_COUNT=5 \
    SCRAPER_CMD=autoscout24_recent

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app

# Allow overriding the scraper command at runtime via SCRAPER_CMD
CMD ["sh", "-c", "python main.py ${SCRAPER_CMD}"]
