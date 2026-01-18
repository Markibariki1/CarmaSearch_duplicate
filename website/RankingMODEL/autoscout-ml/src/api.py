#!/usr/bin/env python3
"""
CARMA Vehicle API (clean rebuild)
=================================

Expose the minimal set of endpoints required by the frontend:
    • GET /health              – quick connectivity check
    • GET /stats               – basic database stats
    • GET /listings/<id>       – canonical vehicle payload
    • GET /listings/<id>/comparables

The service fetches raw rows from Azure PostgreSQL, normalises price /
mileage / year fields, and ranks comparable listings with a lightweight
similarity + deal score.
"""

from __future__ import annotations

import json
import logging
import os
import threading
import time
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import psycopg2
import psycopg2.pool
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg2.extras import RealDictCursor

# ---------------------------------------------------------------------------
# Environment & logging
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

_connection_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None
_pool_lock = threading.Lock()


def _db_config() -> Dict[str, Any]:
    """Collect required database settings and fail fast if any are missing."""
    required = {
        "host": os.getenv("DATABASE_HOST"),
        "port": os.getenv("DATABASE_PORT", "5432"),
        "user": os.getenv("DATABASE_USER"),
        "password": os.getenv("DATABASE_PASSWORD"),
        "dbname": os.getenv("DATABASE_NAME", "postgres"),
    }
    missing = [key for key, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"Missing database environment variables: {', '.join(missing)}")
    required["port"] = int(required["port"])
    return required


def get_connection_pool() -> psycopg2.pool.ThreadedConnectionPool:
    """Lazy-create a global threaded connection pool."""
    global _connection_pool
    if _connection_pool and not _connection_pool.closed:
        return _connection_pool

    with _pool_lock:
        if _connection_pool and not _connection_pool.closed:
            return _connection_pool

        cfg = _db_config()
        min_conn = int(os.getenv("DB_MIN_CONN", "2"))
        max_conn = int(os.getenv("DB_MAX_CONN", "10"))

        logger.info(
            "Initialising database pool (host=%s, db=%s, min=%s, max=%s)",
            cfg["host"],
            cfg["dbname"],
            min_conn,
            max_conn,
        )

        _connection_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=min_conn,
            maxconn=max_conn,
            connect_timeout=int(os.getenv("DB_CONNECT_TIMEOUT", "10")),
            keepalives=1,
            keepalives_idle=60,
            keepalives_interval=15,
            keepalives_count=5,
            **cfg,
        )
        return _connection_pool


@contextmanager
def get_db_cursor():
    """Yield a cursor with automatic return to the pool."""
    pool = get_connection_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

NUMERIC_PRICE_SQL = "CAST(NULLIF(REGEXP_REPLACE(price, '[^0-9]', '', 'g'), '') AS DOUBLE PRECISION)"
NUMERIC_MILEAGE_SQL = (
    "CAST(NULLIF(REGEXP_REPLACE(COALESCE(CAST(mileage_km AS TEXT), ''), '[^0-9]', '', 'g'), '') AS DOUBLE PRECISION)"
)


def normalise_price(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    if not digits:
        return None
    return float(digits)


def normalise_mileage(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    if not digits:
        return None
    return float(digits)


def extract_year(raw: Any) -> Optional[int]:
    if raw is None:
        return None
    text = str(raw)
    for token in text.replace("/", "-").split("-"):
        if token.isdigit() and len(token) == 4:
            return int(token)
    return None


def safe_lower(text: Optional[str]) -> Optional[str]:
    return text.lower().strip() if isinstance(text, str) else None


def parse_images(raw: Any) -> List[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(item) for item in raw if item]
    if isinstance(raw, str):
        try:
            decoded = json.loads(raw)
            if isinstance(decoded, list):
                return [str(item) for item in decoded if item]
        except json.JSONDecodeError:
            return []
    return []


def format_vehicle_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    price = normalise_price(row.get("price_num"))
    if price is None:
        price = normalise_price(row.get("price"))

    mileage = normalise_mileage(row.get("mileage_num"))
    if mileage is None:
        mileage = normalise_mileage(row.get("mileage_km"))

    year = extract_year(row.get("first_registration_raw"))

    return {
        "id": row.get("id") or row.get("vehicle_id"),
        "url": row.get("listing_url"),
        "price_eur": float(price) if price is not None else None,
        "price_raw": row.get("price"),
        "mileage_km": float(mileage) if mileage is not None else None,
        "mileage_raw": row.get("mileage_km"),
        "year": year,
        "make": row.get("make"),
        "model": row.get("model"),
        "fuel_group": row.get("fuel_type"),
        "transmission_group": row.get("transmission"),
        "body_group": row.get("body_type"),
        "color": row.get("color"),
        "interior_color": row.get("interior_color"),
        "upholstery_color": row.get("upholstery_color"),
        "description": row.get("description") or "",
        "data_source": row.get("data_source"),
        "power_kw": float(row["power_kw"]) if row.get("power_kw") is not None else None,
        "images": parse_images(row.get("images")),
        "first_registration_raw": row.get("first_registration_raw"),
        "created_at": row.get("created_at"),
    }


# ---------------------------------------------------------------------------
# Similarity logic
# ---------------------------------------------------------------------------

SimilarityWeights = Dict[str, float]


class SimilarityEngine:
    """Very small heuristic similarity scorer for vehicle listings."""

    def __init__(self, weights: Optional[SimilarityWeights] = None) -> None:
        self.weights = weights or {
            "color": 0.15,
            "interior_color": 0.05,
            "age": 0.20,
            "mileage": 0.20,
            "power": 0.10,
            "price": 0.30,
        }

    @staticmethod
    def _match_score(a: Optional[str], b: Optional[str]) -> float:
        if not a or not b:
            return 0.5
        return 1.0 if safe_lower(a) == safe_lower(b) else 0.0

    @staticmethod
    def _similarity_ratio(a: Optional[float], b: Optional[float], tolerance: float) -> float:
        if a is None or b is None or a <= 0 or b <= 0:
            return 0.5
        diff = abs(a - b)
        return max(0.0, 1.0 - (diff / (a * tolerance)))

    @staticmethod
    def _price_deal(target_price: Optional[float], candidate_price: Optional[float]) -> float:
        if target_price is None or candidate_price is None or target_price <= 0:
            return 0.5
        delta_pct = (target_price - candidate_price) / target_price
        # Clamp to [-0.4, 0.4] (~ +/-40%) before mapping to 0..1
        delta_pct = max(-0.4, min(0.4, delta_pct))
        return 0.5 + (delta_pct / 0.8)

    def score(self, target: Dict[str, Any], candidate: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        components = {
            "color": self._match_score(target.get("color"), candidate.get("color")),
            "interior_color": self._match_score(target.get("interior_color"), candidate.get("interior_color")),
            "age": self._similarity_ratio(
                float(target["year"]) if target.get("year") else None,
                float(candidate["year"]) if candidate.get("year") else None,
                tolerance=0.10,  # 10% variance across 10 years
            ),
            "mileage": self._similarity_ratio(target.get("mileage_km"), candidate.get("mileage_km"), tolerance=1.0),
            "power": self._similarity_ratio(target.get("power_kw"), candidate.get("power_kw"), tolerance=0.25),
            "price": self._price_deal(target.get("price_eur"), candidate.get("price_eur")),
        }

        final_score = 0.0
        for key, weight in self.weights.items():
            final_score += weight * components.get(key, 0.5)

        return final_score, components


similarity_engine = SimilarityEngine()


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

SELECT_BASE_FIELDS = f"""
    vehicle_id,
    listing_url,
    price,
    mileage_km,
    first_registration_raw,
    make,
    model,
    fuel_type,
    transmission,
    body_type,
    description,
    data_source,
    power_kw,
    images,
    color,
    interior_color,
    upholstery_color,
    created_at,
    {NUMERIC_PRICE_SQL} AS price_num,
    {NUMERIC_MILEAGE_SQL} AS mileage_num
"""


def fetch_vehicle(vehicle_id: str) -> Optional[Dict[str, Any]]:
    """Return a single vehicle row, or None if not found."""
    with get_db_cursor() as cursor:
        cursor.execute(
            f"""
            SELECT {SELECT_BASE_FIELDS}
            FROM vehicle_marketplace.vehicle_data
            WHERE vehicle_id = %s
              AND is_vehicle_available = true
            LIMIT 1
            """,
            (vehicle_id,),
        )
        row = cursor.fetchone()
    return row


def build_attempts(target_row: Dict[str, Any]) -> List[Dict[str, bool]]:
    """Define progressive query relaxations."""
    has_color = bool(target_row.get("color"))
    has_body = bool(target_row.get("body_type"))
    has_transmission = bool(target_row.get("transmission"))
    has_fuel = bool(target_row.get("fuel_type"))

    attempts = [
        {"name": "strict", "color": has_color, "body": has_body, "transmission": has_transmission, "fuel": has_fuel},
        {"name": "relaxed_color", "color": False, "body": has_body, "transmission": has_transmission, "fuel": has_fuel},
        {"name": "relaxed_color_body", "color": False, "body": False, "transmission": has_transmission, "fuel": has_fuel},
        {"name": "relaxed_drivetrain", "color": False, "body": False, "transmission": False, "fuel": has_fuel},
        {"name": "make_model_only", "color": False, "body": False, "transmission": False, "fuel": False},
    ]
    # Deduplicate attempts in case some attributes are already missing
    seen = set()
    result = []
    for attempt in attempts:
        signature = tuple(sorted(attempt.items()))
        if signature not in seen:
            seen.add(signature)
            result.append(attempt)
    return result


def find_candidate_rows(target_row: Dict[str, Any], target_year: Optional[int]) -> List[Dict[str, Any]]:
    """Fetch candidate rows using progressive relaxation."""
    attempts = build_attempts(target_row)
    price_range = None
    mileage_max = None

    target_price = normalise_price(target_row.get("price_num") or target_row.get("price"))
    if target_price and target_price > 0:
        price_range = (target_price * 0.6, target_price * 1.4)

    target_mileage = normalise_mileage(target_row.get("mileage_num") or target_row.get("mileage_km"))
    if target_mileage and target_mileage > 0:
        mileage_max = target_mileage * 2.0

    for attempt in attempts:
        base_conditions = [
            "is_vehicle_available = true",
            "vehicle_id != %s",
            "make = %s",
            "model = %s",
        ]
        params: List[Any] = [
            target_row["vehicle_id"],
            target_row["make"],
            target_row["model"],
        ]

        if attempt["fuel"] and target_row.get("fuel_type"):
            base_conditions.append("fuel_type = %s")
            params.append(target_row["fuel_type"])

        if attempt["transmission"] and target_row.get("transmission"):
            base_conditions.append("transmission = %s")
            params.append(target_row["transmission"])

        if attempt["body"] and target_row.get("body_type"):
            base_conditions.append("body_type = %s")
            params.append(target_row["body_type"])

        if attempt["color"] and target_row.get("color"):
            base_conditions.append("color = %s")
            params.append(target_row["color"])

        if target_year:
            base_conditions.append(
                "CAST(SUBSTRING(CAST(first_registration_raw AS TEXT), 1, 4) AS INTEGER) BETWEEN %s AND %s"
            )
            params.extend([target_year - 2, target_year + 2])

        where_clause = " AND ".join(base_conditions)
        logger.info(
            "Attempt %s – where(%s params) price_range=%s mileage_max=%s",
            attempt["name"],
            len(base_conditions),
            price_range,
            mileage_max,
        )

        with get_db_cursor() as cursor:
            query_start = time.time()
            cursor.execute(
                f"""
                SELECT {SELECT_BASE_FIELDS}
                FROM vehicle_marketplace.vehicle_data
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (*params, int(os.getenv("CANDIDATE_LIMIT", "400"))),
            )
            rows = cursor.fetchall()
            logger.info(
                "Attempt %s – fetched %s rows in %.3fs",
                attempt["name"],
                len(rows),
                time.time() - query_start,
            )

        if not rows:
            continue

        filtered = []
        dropped = 0
        for row in rows:
            row_price = normalise_price(row.get("price_num") or row.get("price"))
            row_mileage = normalise_mileage(row.get("mileage_num") or row.get("mileage_km"))

            if price_range and (row_price is None or not price_range[0] <= row_price <= price_range[1]):
                dropped += 1
                continue
            if mileage_max and row_mileage and row_mileage > mileage_max:
                dropped += 1
                continue

            filtered.append(row)

        logger.info(
            "Attempt %s – keeping %s rows (dropped %s on range checks)",
            attempt["name"],
            len(filtered),
            dropped,
        )

        if filtered:
            return filtered

    return []


def score_candidates(target_payload: Dict[str, Any], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Compute similarity + deal scores and return sorted payloads."""
    scored: List[Tuple[float, Dict[str, Any], Dict[str, float]]] = []
    for row in candidates:
        payload = format_vehicle_payload(
            {**row, "vehicle_id": row.get("id") or row.get("vehicle_id")}
        )
        score, components = similarity_engine.score(target_payload, payload)
        payload["score"] = score
        payload["final_score"] = score

        target_price = target_payload.get("price_eur")
        candidate_price = payload.get("price_eur")
        savings = 0.0
        if target_price and candidate_price:
            savings = float(target_price - candidate_price)

        payload.update(
            {
                "price_hat": float(candidate_price * 1.05) if candidate_price else None,
                "deal_score": components["price"],
                "savings": savings,
                "savings_percent": (savings / target_price * 100) if target_price and target_price > 0 else None,
                "ranking_details": {
                    "similarity_components": components,
                    "weights": similarity_engine.weights,
                },
            }
        )
        scored.append((score, payload, components))

    scored.sort(key=lambda entry: entry[0], reverse=True)
    return [payload for score, payload, _ in scored]


# ---------------------------------------------------------------------------
# Flask endpoints
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health() -> Tuple[Any, int]:
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS vehicle_count FROM vehicle_marketplace.vehicle_data WHERE is_vehicle_available = true"
            )
            result = cursor.fetchone()
        return (
            jsonify(
                {
                    "status": "healthy",
                    "database_connected": True,
                    "vehicle_count": result["vehicle_count"] if result else 0,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )
    except Exception as exc:
        logger.exception("Health check failed: %s", exc)
        return (
            jsonify({"status": "unhealthy", "database_connected": False, "error": str(exc)}),
            503,
        )


@app.route("/stats", methods=["GET"])
def stats() -> Tuple[Any, int]:
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE is_vehicle_available) AS total_vehicles,
                    COUNT(DISTINCT make) AS unique_makes,
                    COUNT(DISTINCT data_source) AS data_sources
                FROM vehicle_marketplace.vehicle_data
                """
            )
            row = cursor.fetchone()
        return (
            jsonify(
                {
                    "total_vehicles": row["total_vehicles"],
                    "unique_makes": row["unique_makes"],
                    "data_sources": row["data_sources"],
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )
    except Exception as exc:
        logger.exception("Stats endpoint failed: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/listings/<vehicle_id>", methods=["GET"])
def get_vehicle_endpoint(vehicle_id: str) -> Tuple[Any, int]:
    row = fetch_vehicle(vehicle_id)
    if not row:
        return jsonify({"error": f"Vehicle {vehicle_id} not found"}), 404
    payload = format_vehicle_payload({**row, "vehicle_id": vehicle_id})
    return jsonify(payload), 200


@app.route("/listings/<vehicle_id>/comparables", methods=["GET"])
def comparables_endpoint(vehicle_id: str) -> Tuple[Any, int]:
    top_param = request.args.get("top", default="10")
    try:
        top = max(1, min(int(top_param), 50))
    except ValueError:
        return jsonify({"error": "Invalid 'top' parameter"}), 400

    target_row = fetch_vehicle(vehicle_id)
    if not target_row:
        return jsonify({"error": f"Vehicle {vehicle_id} not found"}), 404

    target_payload = format_vehicle_payload({**target_row, "vehicle_id": vehicle_id})
    target_year = target_payload.get("year")

    candidates_raw = find_candidate_rows(target_row, target_year)
    if not candidates_raw:
        return jsonify({"error": "No comparable vehicles found"}), 404

    scored = score_candidates(target_payload, candidates_raw)
    response = {
        "vehicle": target_payload,
        "comparables": scored[:top],
        "metadata": {
            "requested_top": top,
            "returned": len(scored[:top]),
            "total_candidates": len(scored),
        },
    }
    return jsonify(response), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    logger.info("Starting CARMA API on port %s", port)
    app.run(host="0.0.0.0", port=port, debug=False)
