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
import math
import os
import re
import statistics
import threading
import time
import unicodedata
from bisect import bisect_left
from contextlib import contextmanager
from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

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
# Utility helpers
# ---------------------------------------------------------------------------

FALSEY = {"false", "0", "no", "off"}
TRUTHY = {"true", "1", "yes", "on"}

COLOR_CANONICAL_MAP = {
    "weiss": "white",
    "weiß": "white",
    "weiß metallic": "white",
    "weiss metallic": "white",
    "white": "white",
    "candy white": "white",
    "polar white": "white",
    "pure white": "white",
    "alpinweiss": "white",
    "alpine white": "white",
    "blanc": "white",
    "bianco": "white",
    "schwarz": "black",
    "schwarz metallic": "black",
    "black": "black",
    "deep black": "black",
    "noir": "black",
    "nero": "black",
    "grau": "gray",
    "grau metallic": "gray",
    "graphit": "gray",
    "graphite": "gray",
    "grey": "gray",
    "gris": "gray",
    "anthrazit": "gray",
    "anthracite": "gray",
    "blau": "blue",
    "azul": "blue",
    "bleu": "blue",
    "blu": "blue",
    "rot": "red",
    "rosso": "red",
    "rouge": "red",
    "silber": "silver",
    "silber metallic": "silver",
    "silver": "silver",
    "argent": "silver",
    "grun": "green",
    "grün": "green",
    "verde": "green",
    "vert": "green",
    "braun": "brown",
    "marron": "brown",
    "bruin": "brown",
    "beige": "beige",
    "sand": "beige",
    "creme": "beige",
    "orange": "orange",
    "gelb": "yellow",
    "amarillo": "yellow",
    "giallo": "yellow",
}

FUEL_MAP = {
    "benzin": "petrol",
    "elektro": "electric",
    "diesel": "diesel",
    "elektro/benzin": "hybrid",
    "plugin-hybrid": "plug-in hybrid",
    "hybrid": "hybrid",
    "lpg": "lpg",
    "cng": "cng",
}

TRANSMISSION_MAP = {
    "automatik": "automatic",
    "schaltgetriebe": "manual",
    "manuell": "manual",
    "tiptronic": "automatic",
}

BODY_TYPE_MAP = {
    "suv/geländewagen/pickup": "suv",
    "geländewagen": "suv",
    "suv": "suv",
    "limousine": "sedan",
    "kombi": "wagon",
    "coupe": "coupe",
    "coupé": "coupe",
    "cabrio": "convertible",
    "kabriolett": "convertible",
    "kastenwagen hochdach": "van",
    "kastenwagen": "van",
    "transporter": "van",
    "van": "van",
    "kleinwagen": "hatchback",
    "schräghecklimousine": "hatchback",
}

OPTION_PATTERNS = {
    "adaptive_cruise_control": re.compile(r"\b(acc|adaptive(?:r)? cruise(?: control)?|abstandsregeltempomat|distronic)\b", re.IGNORECASE),
    "camera_360": re.compile(r"\b360\s*(?:grad|camera|kamera|°)\b", re.IGNORECASE),
    "carplay_android_auto": re.compile(r"\b(carplay|android\s*auto|apple\s*carplay)\b", re.IGNORECASE),
    "heated_seats": re.compile(r"\bsitzheizung\b|\bheated seats?\b", re.IGNORECASE),
    "matrix_led": re.compile(r"\bmatrix\s*led\b", re.IGNORECASE),
    "panoramic_roof": re.compile(r"\bpanoram(adach|a dach|ic roof)\b", re.IGNORECASE),
    "dab_plus": re.compile(r"\bdab\+?\b", re.IGNORECASE),
    "park_assist": re.compile(r"\bpark(assist|pilot|hilfe|tronic|distance)\b", re.IGNORECASE),
}

OPTION_LABELS = {
    "adaptive_cruise_control": "Adaptive Cruise / ACC",
    "camera_360": "360° Camera",
    "carplay_android_auto": "CarPlay / Android Auto",
    "heated_seats": "Heated Seats",
    "matrix_led": "Matrix LED",
    "panoramic_roof": "Panoramic Roof",
    "dab_plus": "DAB+ Digital Radio",
    "park_assist": "Parking Assist",
}

HARD_FEATURE_LABELS = {
    "make_model": "Make & Model",
    "body": "Body Type",
    "fuel": "Fuel Type",
    "transmission": "Transmission",
    "exterior_color": "Exterior Color",
    "interior_color": "Interior Color",
}

COLOR_KEYWORD_MAP = {
    "white": [
        "weiss",
        "weiß",
        "white",
        "bianco",
        "blanc",
        "blanco",
        "alpin",
        "arctic",
        "polar",
        "candy",
        "pure white",
        "snow",
    ],
    "black": ["schwarz", "black", "noir", "nero", "obsidian", "midnight", "deep black", "onyx"],
    "gray": ["grau", "grau metallic", "gray", "gris", "anthracite", "graphit", "graphite", "slate"],
    "blue": ["blau", "bleu", "blu", "azul", "blue", "navy", "ocean"],
    "red": ["rot", "rosso", "rouge", "red", "crimson"],
    "silver": ["silber", "silver", "argent", "platinum", "platino"],
    "green": ["grun", "gruen", "grün", "verde", "vert", "green"],
    "brown": ["braun", "marron", "brown", "bruin", "bronze"],
    "beige": ["beige", "sand", "creme", "champagne", "ivory"],
    "orange": ["orange", "sunset"],
    "yellow": ["gelb", "giallo", "amarillo", "yellow"],
}

STOPWORDS = {
    "der",
    "die",
    "das",
    "und",
    "oder",
    "mit",
    "ein",
    "eine",
    "den",
    "von",
    "für",
    "auf",
    "zum",
    "zur",
    "the",
    "and",
    "for",
    "with",
    "einmal",
}

TOKEN_SPLIT = re.compile(r"[^\w]+", re.UNICODE)

CANDIDATE_CACHE: Dict[Tuple[str, str, int], Dict[str, Any]] = {}
CANDIDATE_CACHE_TTL = int(os.getenv("COHORT_CACHE_TTL_SECONDS", "180"))


def parse_bool(raw: Optional[str], default: bool = True) -> bool:
    if raw is None:
        return default
    value = raw.strip().lower()
    if value in TRUTHY:
        return True
    if value in FALSEY:
        return False
    return default


def parse_int(raw: Optional[str], default: int) -> int:
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def parse_float(raw: Optional[str], default: float) -> float:
    if raw is None:
        return default
    try:
        return float(raw)
    except (TypeError, ValueError):
        return default


def normalize_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = value.strip()
    return text if text else None


def strip_accents(value: str) -> str:
    return "".join(ch for ch in unicodedata.normalize("NFKD", value) if not unicodedata.combining(ch))


def normalize_color(value: Optional[str]) -> Optional[str]:
    text = normalize_text(value)
    if not text:
        return None
    lowered = strip_accents(text).lower()
    lowered = lowered.replace("-", " ")
    lowered = re.sub(r"\s+", " ", lowered).strip()

    if lowered in COLOR_CANONICAL_MAP:
        return COLOR_CANONICAL_MAP[lowered]

    # Try splitting composite values (e.g., "schwarz / weiß")
    for part in re.split(r"[\/,;]| und | with ", lowered):
        part = part.strip()
        if not part:
            continue
        if part in COLOR_CANONICAL_MAP:
            return COLOR_CANONICAL_MAP[part]

    # Keyword-based fallback
    for canonical, keywords in COLOR_KEYWORD_MAP.items():
        for keyword in keywords:
            if keyword in lowered:
                return canonical

    return lowered


def normalize_category(value: Optional[str], mapping: Dict[str, str]) -> Optional[str]:
    text = normalize_text(value)
    if not text:
        return None
    key = strip_accents(text).lower()
    return mapping.get(key, key)


def tokenize_text(value: Optional[str]) -> Set[str]:
    if not value:
        return set()
    lowered = strip_accents(value).lower()
    tokens = set()
    for token in TOKEN_SPLIT.split(lowered):
        if not token or token in STOPWORDS:
            continue
        if len(token) <= 2 and not token.isdigit():
            continue
        tokens.add(token)
    return tokens


def extract_option_features(description: str) -> Set[str]:
    hits: Set[str] = set()
    for key, pattern in OPTION_PATTERNS.items():
        if pattern.search(description):
            hits.add(key)
    return hits


def build_text_profile(description: str) -> Dict[str, Any]:
    text = description or ""
    lowered = strip_accents(text).lower()
    tokens = tokenize_text(text)
    features = extract_option_features(lowered)
    return {
        "tokens": tokens,
        "features": features,
        "text": lowered,
    }


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
    # Azure PostgreSQL requires SSL connections
    required["sslmode"] = "require"
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

    # Convert first registration into vehicle age (months)
    age_months = None
    raw_registration = row.get("first_registration_raw")
    if raw_registration:
        try:
            reg = datetime.fromisoformat(str(raw_registration).replace(" ", "T"))
        except ValueError:
            reg = None
        if reg:
            now = datetime.utcnow()
            if reg > now:
                reg = now
            age_months = (now.year - reg.year) * 12 + (now.month - reg.month)
            if now.day < reg.day:
                age_months = max(0, age_months - 1)

    interior_raw = row.get("interior_color") or row.get("upholstery_color")
    interior_effective = normalize_color(interior_raw)
    colour_effective = normalize_color(row.get("color"))
    fuel = normalize_category(row.get("fuel_type"), FUEL_MAP)
    transmission = normalize_category(row.get("transmission"), TRANSMISSION_MAP)
    body = normalize_category(row.get("body_type"), BODY_TYPE_MAP)
    freshness_days = None
    freshness_source = row.get("updated_at") or row.get("created_at")
    if freshness_source:
        try:
            updated = datetime.fromisoformat(str(freshness_source).replace(" ", "T"))
            freshness_days = max(0.0, (datetime.utcnow() - updated).total_seconds() / 86400)
        except ValueError:
            freshness_days = None

    return {
        "id": row.get("id") or row.get("vehicle_id"),
        "url": row.get("listing_url"),
        "price_eur": float(price) if price is not None else None,
        "price_raw": row.get("price"),
        "mileage_km": float(mileage) if mileage is not None else None,
        "mileage_raw": row.get("mileage_km"),
        "year": year,
        "age_months": age_months,
        "make": row.get("make"),
        "model": row.get("model"),
        "fuel_group": fuel,
        "transmission_group": transmission,
        "body_group": body,
        "color": row.get("color"),
        "color_canonical": colour_effective,
        "interior_color": interior_raw,
        "interior_color_effective": interior_effective,
        "upholstery_color": row.get("upholstery_color"),
        "description": row.get("description") or "",
        "data_source": row.get("data_source"),
        "power_kw": float(row["power_kw"]) if row.get("power_kw") is not None else None,
        "images": parse_images(row.get("images")),
        "first_registration_raw": row.get("first_registration_raw"),
        "created_at": row.get("created_at"),
        "freshness_days": freshness_days,
    }


# ---------------------------------------------------------------------------
# Similarity logic
# ---------------------------------------------------------------------------

SimilarityWeights = Dict[str, float]


class SimilarityEngine:
    """Hybrid similarity engine combining categorical, numeric, and textual cues."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        config = config or {}

        match_weights = config.get(
            "match_weights",
            {"categorical": 0.45, "numeric": 0.25, "text": 0.30},
        )
        match_total = sum(match_weights.values())
        if match_total <= 0:
            match_weights = {"categorical": 0.45, "numeric": 0.25, "text": 0.30}
            match_total = sum(match_weights.values())
        self.match_weights = {k: v / match_total for k, v in match_weights.items()}

        categorical_weights = config.get(
            "categorical_weights",
            {
                "make_model": 0.25,
                "body": 0.20,
                "fuel": 0.20,
                "transmission": 0.20,
                "exterior_color": 0.10,
                "interior_color": 0.05,
            },
        )
        cat_total = sum(categorical_weights.values())
        if cat_total <= 0:
            categorical_weights = {
                "make_model": 0.25,
                "body": 0.20,
                "fuel": 0.20,
                "transmission": 0.20,
                "exterior_color": 0.10,
                "interior_color": 0.05,
            }
            cat_total = sum(categorical_weights.values())
        self.categorical_weights = {k: v / cat_total for k, v in categorical_weights.items()}

        numeric_weights = config.get(
            "numeric_weights",
            {"age": 0.40, "mileage": 0.40, "power": 0.20},
        )
        num_total = sum(numeric_weights.values())
        if num_total <= 0:
            numeric_weights = {"age": 0.40, "mileage": 0.40, "power": 0.20}
            num_total = sum(numeric_weights.values())
        self.numeric_weights = {k: v / num_total for k, v in numeric_weights.items()}

        text_weights = config.get(
            "text_weights",
            {"feature_overlap": 0.60, "token_overlap": 0.40},
        )
        text_total = sum(text_weights.values())
        if text_total <= 0:
            text_weights = {"feature_overlap": 0.60, "token_overlap": 0.40}
            text_total = sum(text_weights.values())
        self.text_weights = {k: v / text_total for k, v in text_weights.items()}

        # Retain backwards compatible attribute for debugging/response payloads
        self.weights = {
            "categorical": self.match_weights["categorical"],
            "numeric": self.match_weights["numeric"],
            "text": self.match_weights["text"],
        }

    @staticmethod
    def _norm_value(value: Optional[str]) -> Optional[str]:
        text = normalize_text(value)
        return strip_accents(text).lower() if text else None

    @staticmethod
    def _bounded_similarity(diff: float, window: float) -> float:
        if window <= 0:
            return 0.5
        return max(0.0, min(1.0, 1.0 - (diff / window)))

    def _categorical_similarity(
        self,
        target: Dict[str, Any],
        candidate: Dict[str, Any],
        locks: Optional[Dict[str, bool]] = None,
    ) -> Tuple[float, Dict[str, Any]]:
        """Categorical similarity for hard-locked fields.
        
        Since we filter by make, model, body, fuel, transmission, and color in SQL,
        these should all match (score = 1.0). This function provides transparency
        and handles edge cases where normalization might differ slightly.
        """
        locks = locks or {}

        target_body = target.get("body_group") or normalize_category(target.get("body_type"), BODY_TYPE_MAP)
        candidate_body = candidate.get("body_group") or normalize_category(candidate.get("body_type"), BODY_TYPE_MAP)
        target_fuel = target.get("fuel_group") or normalize_category(target.get("fuel_type"), FUEL_MAP)
        candidate_fuel = candidate.get("fuel_group") or normalize_category(candidate.get("fuel_type"), FUEL_MAP)
        target_trans = target.get("transmission_group") or normalize_category(target.get("transmission"), TRANSMISSION_MAP)
        candidate_trans = candidate.get("transmission_group") or normalize_category(candidate.get("transmission"), TRANSMISSION_MAP)
        target_color = target.get("color_canonical") or normalize_color(target.get("color"))
        candidate_color = candidate.get("color_canonical") or normalize_color(candidate.get("color"))

        def cat_score(a: Optional[str], b: Optional[str]) -> float:
            if a is None or b is None:
                return 0.5
            return 1.0 if strip_accents(a).lower() == strip_accents(b).lower() else 0.0

        components: Dict[str, Any] = {}
        weighted_score = 0.0
        weight_total = 0.0

        # Make & Model (required match - already filtered, so should be 1.0)
        make_model_weight = 0.25  # 25% weight
        target_make = self._norm_value(target.get("make"))
        target_model = self._norm_value(target.get("model"))
        candidate_make = self._norm_value(candidate.get("make"))
        candidate_model = self._norm_value(candidate.get("model"))
        if None in (target_make, target_model, candidate_make, candidate_model):
            mm_score = 0.5
        else:
            mm_score = 1.0 if (target_make == candidate_make and target_model == candidate_model) else 0.0
        components["make_model"] = {
            "score": mm_score,
            "weight": make_model_weight,
            "locked": True,
            "target": f"{target.get('make', '')} {target.get('model', '')}".strip(),
            "candidate": f"{candidate.get('make', '')} {candidate.get('model', '')}".strip(),
        }
        weighted_score += make_model_weight * mm_score
        weight_total += make_model_weight

        # Body Type (20% weight)
        body_weight = 0.20
        body_score = cat_score(target_body, candidate_body)
        components["body"] = {
            "score": body_score,
            "weight": body_weight,
            "locked": True,
            "target": target_body,
            "candidate": candidate_body,
        }
        weighted_score += body_weight * body_score
        weight_total += body_weight

        # Fuel Type (20% weight)
        fuel_weight = 0.20
        fuel_score = cat_score(target_fuel, candidate_fuel)
        components["fuel"] = {
            "score": fuel_score,
            "weight": fuel_weight,
            "locked": True,
            "target": target_fuel,
            "candidate": candidate_fuel,
        }
        weighted_score += fuel_weight * fuel_score
        weight_total += fuel_weight

        # Transmission (15% weight)
        transmission_weight = 0.15
        transmission_score = cat_score(target_trans, candidate_trans)
        components["transmission"] = {
            "score": transmission_score,
            "weight": transmission_weight,
            "locked": True,
            "target": target_trans,
            "candidate": candidate_trans,
        }
        weighted_score += transmission_weight * transmission_score
        weight_total += transmission_weight

        # Exterior Color (20% weight)
        color_weight = 0.20
        color_score = cat_score(target_color, candidate_color)
        components["exterior_color"] = {
            "score": color_score,
            "weight": color_weight,
            "locked": True,
            "target": target_color,
            "candidate": candidate_color,
        }
        weighted_score += color_weight * color_score
        weight_total += color_weight

        similarity = weighted_score / weight_total if weight_total > 0 else 0.5
        return similarity, {
            "score": similarity,
            "components": components,
            "weight_total": weight_total,
        }

    def _numeric_similarity(
        self,
        target: Dict[str, Any],
        candidate: Dict[str, Any],
        tolerances: Optional[Dict[str, float]] = None,
    ) -> Tuple[float, Dict[str, Any]]:
        tolerances = tolerances or {}
        year_tolerance = max(tolerances.get("year_tolerance_years", 2), 0.1) * 12.0
        mileage_ratio = max(tolerances.get("mileage_tolerance_ratio", 1.0), 0.01)
        mileage_min_window = max(tolerances.get("mileage_min_window", 5000.0), 0.0)
        power_ratio = max(tolerances.get("power_tolerance_ratio", 0.15), 0.01)
        power_min_window = max(tolerances.get("power_min_window", 15.0), 0.0)

        components: Dict[str, Any] = {}
        weighted_score = 0.0
        weight_total = 0.0

        target_age = target.get("age_months")
        candidate_age = candidate.get("age_months")
        age_delta = None
        if target_age is not None and candidate_age is not None:
            age_delta = float(candidate_age) - float(target_age)
            age_diff = abs(age_delta)
            age_window = max(year_tolerance, 1.0)
            age_score = self._bounded_similarity(age_diff, age_window)
        else:
            age_diff = None
            age_window = year_tolerance
            age_score = 0.5
        components["age"] = {
            "score": age_score,
            "diff": age_diff,
            "signed_diff": age_delta,
            "window": age_window,
            "target": target_age,
            "candidate": candidate_age,
        }
        weighted_score += self.numeric_weights["age"] * age_score
        weight_total += self.numeric_weights["age"]

        target_mileage = target.get("mileage_km")
        candidate_mileage = candidate.get("mileage_km")
        mileage_delta = None
        if target_mileage is not None and candidate_mileage is not None:
            tolerance_window = max(abs(float(target_mileage)) * mileage_ratio, mileage_min_window)
            mileage_delta = float(candidate_mileage) - float(target_mileage)
            mileage_diff = abs(mileage_delta)
            mileage_score = self._bounded_similarity(mileage_diff, tolerance_window if tolerance_window > 0 else mileage_min_window or 1.0)
        else:
            tolerance_window = mileage_min_window
            mileage_diff = None
            mileage_score = 0.5
        components["mileage"] = {
            "score": mileage_score,
            "diff": mileage_diff,
            "signed_diff": mileage_delta,
            "window": tolerance_window,
            "target": target_mileage,
            "candidate": candidate_mileage,
        }
        weighted_score += self.numeric_weights["mileage"] * mileage_score
        weight_total += self.numeric_weights["mileage"]

        target_power = target.get("power_kw")
        candidate_power = candidate.get("power_kw")
        power_delta = None
        if target_power is not None and candidate_power is not None:
            window = max(abs(float(target_power)) * power_ratio, power_min_window)
            power_delta = float(candidate_power) - float(target_power)
            power_diff = abs(power_delta)
            power_score = self._bounded_similarity(power_diff, window if window > 0 else power_min_window or 1.0)
            percent_diff = (power_delta / max(float(target_power), 1.0)) * 100.0
        else:
            window = power_min_window
            power_diff = None
            percent_diff = None
            power_score = 0.5
        components["power"] = {
            "score": power_score,
            "diff": power_diff,
            "signed_diff": power_delta,
            "window": window,
            "percent_diff": percent_diff,
            "target": target_power,
            "candidate": candidate_power,
        }
        weighted_score += self.numeric_weights["power"] * power_score
        weight_total += self.numeric_weights["power"]

        similarity = weighted_score / weight_total if weight_total > 0 else 0.5
        return similarity, {
            "score": similarity,
            "components": components,
        }

    def _textual_similarity(
        self,
        target_profile: Dict[str, Any],
        candidate_profile: Dict[str, Any],
    ) -> Tuple[float, Dict[str, Any]]:
        target_tokens: Set[str] = target_profile.get("tokens", set())
        candidate_tokens: Set[str] = candidate_profile.get("tokens", set())
        token_union = target_tokens | candidate_tokens
        token_intersection = target_tokens & candidate_tokens
        if token_union:
            token_overlap = len(token_intersection) / len(token_union)
        else:
            token_overlap = 0.5

        target_features: Set[str] = target_profile.get("features", set())
        candidate_features: Set[str] = candidate_profile.get("features", set())
        feature_union = target_features | candidate_features
        feature_intersection = target_features & candidate_features
        if feature_union:
            feature_overlap = len(feature_intersection) / len(feature_union)
        else:
            feature_overlap = 0.5

        text_score = (
            self.text_weights["feature_overlap"] * feature_overlap
            + self.text_weights["token_overlap"] * token_overlap
        )

        feature_labels = [OPTION_LABELS.get(item, item) for item in sorted(feature_intersection)]
        text_details = {
            "score": text_score,
            "components": {
                "feature_overlap": feature_overlap,
                "token_overlap": token_overlap,
                "feature_hits": feature_labels,
                "shared_tokens": sorted(token_intersection)[:10],
            },
        }
        return text_score, text_details

    def score(
        self,
        target: Dict[str, Any],
        candidate: Dict[str, Any],
        tolerances: Optional[Dict[str, float]] = None,
        locks: Optional[Dict[str, bool]] = None,
        target_profile: Optional[Dict[str, Any]] = None,
        candidate_profile: Optional[Dict[str, Any]] = None,
    ) -> Tuple[float, Dict[str, Any]]:
        """Simplified scoring: categorical (make/model/body), numeric, and text similarity."""
        target_profile = target_profile or build_text_profile(target.get("description") or "")
        candidate_profile = candidate_profile or build_text_profile(candidate.get("description") or "")

        categorical_score, categorical_details = self._categorical_similarity(target, candidate, locks=locks)
        numeric_score, numeric_details = self._numeric_similarity(target, candidate, tolerances=tolerances)
        text_score, text_details = self._textual_similarity(target_profile, candidate_profile)

        # Simple weighted combination - no complex penalties
        total = (
            self.match_weights["categorical"] * categorical_score
            + self.match_weights["numeric"] * numeric_score
            + self.match_weights["text"] * text_score
        )
        
        final_score = max(0.0, min(1.0, total))

        return final_score, {
            "match_score": final_score,
            "categorical": categorical_details,
            "numeric": numeric_details,
            "textual": text_details,
            "weights": {
                "categorical": self.match_weights["categorical"],
                "numeric": self.match_weights["numeric"],
                "text": self.match_weights["text"],
            },
            "penalties": {},
        }


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


def fetch_candidate_rows(
    target_row: Dict[str, Any],
    candidate_limit: int,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Fetch base candidate rows constrained by make/model in as few queries as possible."""
    target_make = normalize_text(target_row.get("make"))
    target_model = normalize_text(target_row.get("model"))
    if not target_make or not target_model:
        raise ValueError("Target vehicle missing make/model")

    key = (
        strip_accents(target_make).lower(),
        strip_accents(target_model).lower(),
        candidate_limit,
    )
    logs: Dict[str, Any] = {"primary": None, "fallback": None, "cache": None}

    now = time.time()
    cache_entry = CANDIDATE_CACHE.get(key)
    if cache_entry and now - cache_entry["ts"] < CANDIDATE_CACHE_TTL:
        logs["cache"] = {
            "hit": True,
            "age_s": round(now - cache_entry["ts"], 3),
            "row_count": len(cache_entry["rows"]),
        }
        return [deepcopy(row) for row in cache_entry["rows"]], logs
    logs["cache"] = {"hit": False}

    def run_query(condition: str, params: Tuple[Any, ...], tag: str) -> List[Dict[str, Any]]:
        with get_db_cursor() as cursor:
            start = time.time()
            cursor.execute(
                f"""
                SELECT {SELECT_BASE_FIELDS}
                FROM vehicle_marketplace.vehicle_data
                WHERE {condition}
                ORDER BY created_at DESC
                LIMIT %s
                """,
                params + (candidate_limit,),
            )
            rows = cursor.fetchall()
            logs[tag] = {"row_count": len(rows), "duration_s": round(time.time() - start, 3)}
            return rows

    primary_condition = (
        "is_vehicle_available = true AND vehicle_id != %s AND make = %s AND model = %s"
    )
    primary_params = (
        target_row["vehicle_id"],
        target_row["make"],
        target_row["model"],
    )
    rows = run_query(primary_condition, primary_params, "primary")

    if not rows:
        fallback_condition = (
            "is_vehicle_available = true AND vehicle_id != %s "
            "AND LOWER(TRIM(make)) = %s AND LOWER(TRIM(model)) = %s"
        )
        fallback_params = (
            target_row["vehicle_id"],
            target_make.lower(),
            target_model.lower(),
        )
        rows = run_query(fallback_condition, fallback_params, "fallback")

    CANDIDATE_CACHE[key] = {
        "ts": now,
        "rows": [dict(row) for row in rows],
    }
    return [deepcopy(row) for row in rows], logs


def find_candidate_rows(
    target_row: Dict[str, Any],
    target_year: Optional[int],
    options: Dict[str, Any],
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Fetch candidate rows using SQL-based filtering with hard locks and soft locks.
    
    Hard Locks (Exact Match Required):
    - Make, Model, Body Type, Fuel Type, Transmission, Exterior Color
    
    Soft Locks (Range-Based, Can Be Relaxed):
    - Year: ±2 years (can relax to ±3, ±4)
    - Mileage: ±50% (can relax to ±75%, ±100%)
    - Price: 60-140% (can relax to 50-150%, 40-160%)
    - Power: ±15% (can relax to ±20%, ±25%)
    
    Progressive Relaxation: If < 10 results, progressively relax soft locks.
    """
    candidate_limit = options.get("candidate_limit", int(os.getenv("CANDIDATE_LIMIT", "400")))
    min_results = options.get("min_results", 10)
    
    # Extract and normalize target attributes
    target_make = normalize_text(target_row.get("make"))
    target_model = normalize_text(target_row.get("model"))
    
    # For SQL queries, use raw database values (not normalized)
    # Normalized values are only used for Python-side comparison/scoring
    target_body_raw = target_row.get("body_type")
    target_fuel_raw = target_row.get("fuel_type")
    target_transmission_raw = target_row.get("transmission")
    
    # Normalized versions for Python-side filtering/scoring
    target_body = normalize_category(target_body_raw, BODY_TYPE_MAP)
    target_fuel = normalize_category(target_fuel_raw, FUEL_MAP)
    target_transmission = normalize_category(target_transmission_raw, TRANSMISSION_MAP)
    target_color = normalize_color(target_row.get("color"))
    
    # Extract numeric values for soft locks
    target_price = normalise_price(target_row.get("price_num") or target_row.get("price"))
    target_mileage = normalise_mileage(target_row.get("mileage_num") or target_row.get("mileage_km"))
    target_power = normalise_mileage(target_row.get("power_kw"))  # Reusing function, works for power too
    
    if not target_make or not target_model:
        return [], {"error": "Target vehicle missing make or model", "attempts": []}
    
    # Progressive relaxation attempts
    relaxation_attempts = [
        {
            "name": "strict",
            "year_tolerance": 2,
            "mileage_ratio": 0.5,
            "price_min": 0.6,
            "price_max": 1.4,
            "power_ratio": 0.15,
        },
        {
            "name": "relaxed_year",
            "year_tolerance": 3,
            "mileage_ratio": 0.5,
            "price_min": 0.6,
            "price_max": 1.4,
            "power_ratio": 0.15,
        },
        {
            "name": "relaxed_mileage",
            "year_tolerance": 3,
            "mileage_ratio": 0.75,
            "price_min": 0.6,
            "price_max": 1.4,
            "power_ratio": 0.15,
        },
        {
            "name": "relaxed_price",
            "year_tolerance": 3,
            "mileage_ratio": 0.75,
            "price_min": 0.5,
            "price_max": 1.5,
            "power_ratio": 0.15,
        },
        {
            "name": "relaxed_power",
            "year_tolerance": 3,
            "mileage_ratio": 0.75,
            "price_min": 0.5,
            "price_max": 1.5,
            "power_ratio": 0.25,
        },
    ]
    
    attempt_logs: List[Dict[str, Any]] = []
    best_result: Optional[Tuple[List[Dict[str, Any]], str]] = None
    
    for attempt in relaxation_attempts:
        # Build SQL WHERE conditions
        conditions = ["is_vehicle_available = true", "vehicle_id != %s"]
        params: List[Any] = [target_row.get("vehicle_id")]
        
        # Hard locks (always applied)
        conditions.append("make = %s")
        params.append(target_make)
        conditions.append("model = %s")
        params.append(target_model)
        
        if target_body_raw:
            conditions.append("LOWER(TRIM(body_type)) = %s")
            params.append(strip_accents(target_body_raw).lower())
        
        if target_fuel_raw:
            conditions.append("LOWER(TRIM(fuel_type)) = %s")
            params.append(strip_accents(target_fuel_raw).lower())
        
        if target_transmission_raw:
            conditions.append("LOWER(TRIM(transmission)) = %s")
            params.append(strip_accents(target_transmission_raw).lower())
        
        if target_color:
            # Normalize color for comparison - we need to match normalized colors
            # Since we can't easily do normalization in SQL, we'll filter in Python
            # But we can still add a basic color check in SQL
            conditions.append("color IS NOT NULL AND color != ''")
        
        # Soft locks (with ranges)
        # Note: Year filtering will be done in Python after query for reliability
        # since first_registration_raw format varies. We'll filter in the loop below.
        
        if target_mileage and target_mileage > 0:
            mileage_low = target_mileage * (1 - attempt["mileage_ratio"])
            mileage_high = target_mileage * (1 + attempt["mileage_ratio"])
            conditions.append(
                f"{NUMERIC_MILEAGE_SQL} BETWEEN %s AND %s"
            )
            params.extend([mileage_low, mileage_high])
        
        if target_price and target_price > 0:
            price_low = target_price * attempt["price_min"]
            price_high = target_price * attempt["price_max"]
            conditions.append(
                f"{NUMERIC_PRICE_SQL} BETWEEN %s AND %s"
            )
            params.extend([price_low, price_high])
        
        if target_power and target_power > 0:
            power_low = target_power * (1 - attempt["power_ratio"])
            power_high = target_power * (1 + attempt["power_ratio"])
            # Cast power_kw to numeric for comparison (handles TEXT columns)
            conditions.append("power_kw IS NOT NULL AND CAST(power_kw AS DOUBLE PRECISION) BETWEEN %s AND %s")
            params.extend([power_low, power_high])
        
        # Execute query
        where_clause = " AND ".join(conditions)
        with get_db_cursor() as cursor:
            start_time = time.time()
            cursor.execute(
                f"""
                SELECT {SELECT_BASE_FIELDS}
                FROM vehicle_marketplace.vehicle_data
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT %s
                """,
                tuple(params) + (candidate_limit,),
            )
            rows = cursor.fetchall()
            query_time = time.time() - start_time
        
        # Filter by color and year in Python (since normalization/extraction is complex)
        filtered_rows: List[Dict[str, Any]] = []
        for row in rows:
            row_dict = dict(row)
            
            # Apply color filter (hard lock)
            if target_color:
                candidate_color = normalize_color(row_dict.get("color"))
                if candidate_color != target_color:
                    continue
            
            # Apply year filter (soft lock)
            if target_year:
                candidate_year = extract_year(row_dict.get("first_registration_raw"))
                if candidate_year is None or abs(candidate_year - target_year) > attempt["year_tolerance"]:
                    continue
            
            # Add match strategy for tracking
            row_dict["_match_strategy"] = attempt["name"]
            filtered_rows.append(row_dict)
        
        attempt_logs.append({
            "name": attempt["name"],
            "row_count": len(filtered_rows),
            "query_time_s": round(query_time, 3),
            "filters_applied": {
                "hard_locks": {
                    "make": bool(target_make),
                    "model": bool(target_model),
                    "body_type": bool(target_body),
                    "fuel_type": bool(target_fuel),
                    "transmission": bool(target_transmission),
                    "exterior_color": bool(target_color),
                },
                "soft_locks": {
                    "year": f"±{attempt['year_tolerance']}" if target_year else None,
                    "mileage": f"±{int(attempt['mileage_ratio'] * 100)}%" if target_mileage else None,
                    "price": f"{int(attempt['price_min'] * 100)}-{int(attempt['price_max'] * 100)}%" if target_price else None,
                    "power": f"±{int(attempt['power_ratio'] * 100)}%" if target_power else None,
                },
            },
        })
        
        # Track best result
        if best_result is None or len(filtered_rows) > len(best_result[0]):
            best_result = (filtered_rows, attempt["name"])
        
        # If we have enough results, return them immediately
        if len(filtered_rows) >= min_results:
            return filtered_rows, {
                "selected_attempt": attempt["name"],
                "attempts": attempt_logs,
            }
    
    # Return best result even if below min_results
    if best_result and len(best_result[0]) > 0:
        return best_result[0], {
            "selected_attempt": best_result[1],
            "attempts": attempt_logs,
            "warning": f"Only found {len(best_result[0])} results (minimum: {min_results})",
        }
    
    return [], {
        "selected_attempt": None,
        "attempts": attempt_logs,
        "error": "No candidates found matching filters",
    }


def compute_deal_score(
    price: Optional[float],
    percentile: Optional[float],
    median_price: Optional[float],
    target_price: Optional[float],
    target_mileage: Optional[float],
    candidate_mileage: Optional[float],
) -> Tuple[float, Dict[str, Any]]:
    if price is None:
        return 0.5, {
            "price_percentile": percentile,
            "mileage_ratio": None,
            "median_price": median_price,
            "discount_pct": None,
            "components": {
                "comparable": 0.5,
                "hedonic": 0.5,
            },
        }

    # Comparable-based component using percentile and cohort median
    if percentile is None:
        comps_score = 0.5
    else:
        comps_score = max(0.0, min(1.0, 1.0 - percentile))

    comps_discount = None
    if median_price and median_price > 0:
        comps_discount = (median_price - price) / median_price
        comps_score = 1.0 / (1.0 + math.exp(-6 * comps_discount))

    mileage_ratio = None
    if target_mileage and candidate_mileage:
        target_mileage = float(target_mileage)
        candidate_mileage = float(candidate_mileage)
        mileage_ratio = (candidate_mileage - target_mileage) / max(target_mileage, 1.0)
        # Penalise higher mileage; reward lower mileage softly
        if mileage_ratio > 0:
            comps_score -= min(mileage_ratio / 1.5, 1.0) * 0.25
        else:
            comps_score += min(abs(mileage_ratio) / 1.5, 1.0) * 0.15

    # Hedonic component approximated using target price
    if target_price and target_price > 0:
        hedonic_raw = (target_price - price) / target_price
        hedonic_score = 1.0 / (1.0 + math.exp(-6 * hedonic_raw))
    else:
        hedonic_score = comps_score

    deal = max(0.0, min(1.0, 0.5 * comps_score + 0.5 * hedonic_score))
    return deal, {
        "price_percentile": percentile,
        "median_price": median_price,
        "mileage_ratio": mileage_ratio,
        "discount_pct": (comps_discount * 100.0) if comps_discount is not None else None,
        "components": {
            "comparable": comps_score,
            "hedonic": hedonic_score,
        },
    }


def build_explanation(
    target_payload: Dict[str, Any],
    candidate_payload: Dict[str, Any],
    similarity_details: Dict[str, Any],
    deal_details: Dict[str, Any],
    locks: Dict[str, bool],
    cohort_size: int,
    savings: float,
) -> Dict[str, Any]:
    """Simplified explanation builder - only shows make, model, body type matches."""
    categorical_components = similarity_details.get("categorical", {}).get("components", {})
    numeric_components = similarity_details.get("numeric", {}).get("components", {})
    text_components = similarity_details.get("textual", {}).get("components", {})

    # Only show make/model and body type matches
    hard_matches: Dict[str, Any] = {}
    for key in ["make_model", "body"]:
        component = categorical_components.get(key)
        if not component:
            continue
        
        score = component.get("score")
        if score is None:
            status = "unknown"
        elif score >= 0.99:
            status = "match"
        elif score <= 0.01:
            status = "mismatch"
        else:
            status = "partial"

        label = "Make & Model" if key == "make_model" else "Body Type"
        hard_matches[label] = {
            "status": status,
            "target": component.get("target"),
            "candidate": component.get("candidate"),
            "score": score,
        }

    def rounded(value: Optional[float], digits: int = 2) -> Optional[float]:
        if value is None:
            return None
        try:
            return round(float(value), digits)
        except (TypeError, ValueError):
            return None

    proximities = {
        "age_months_delta": rounded(numeric_components.get("age", {}).get("signed_diff")),
        "mileage_delta": rounded(numeric_components.get("mileage", {}).get("signed_diff")),
        "power_delta_pct": rounded(numeric_components.get("power", {}).get("percent_diff")),
    }

    text_hits = list(text_components.get("feature_hits", []))[:5]
    shared_tokens = list(text_components.get("shared_tokens", []))[:5]

    deal_view = {
        "discount_pct": rounded(deal_details.get("discount_pct")),
        "price_percentile": deal_details.get("price_percentile"),
        "median_price": deal_details.get("median_price"),
        "comparable_count": deal_details.get("comparable_count") or cohort_size,
        "savings_eur": rounded(savings, 0),
        "components": deal_details.get("components"),
    }

    freshness_days = candidate_payload.get("freshness_days")

    return {
        "hard_matches": hard_matches,
        "text_hits": text_hits,
        "shared_tokens": shared_tokens,
        "proximities": proximities,
        "deal_view": deal_view,
        "freshness_days": rounded(freshness_days, 1) if freshness_days is not None else None,
        "target_price_eur": target_payload.get("price_eur"),
        "candidate_price_eur": candidate_payload.get("price_eur"),
    }


def score_candidates(
    target_payload: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    tolerances: Dict[str, float],
    locks: Optional[Dict[str, bool]] = None,
) -> List[Dict[str, Any]]:
    """Compute similarity + deal scores and return sorted payloads."""
    locks = locks or {}
    payloads: List[Dict[str, Any]] = []
    for row in candidates:
        payload = format_vehicle_payload(
            {**row, "vehicle_id": row.get("id") or row.get("vehicle_id")}
        )
        payload["_match_strategy"] = row.get("_match_strategy")
        payload["_text_profile"] = build_text_profile(payload.get("description") or "")
        payloads.append(payload)

    price_values = sorted(
        p["price_eur"] for p in payloads if p.get("price_eur") is not None
    )
    median_price = statistics.median(price_values) if price_values else None

    def price_percentile(value: Optional[float]) -> Optional[float]:
        if value is None or not price_values:
            return None
        if len(price_values) == 1:
            return 0.0
        pos = bisect_left(price_values, value)
        percentile = pos / (len(price_values) - 1)
        return max(0.0, min(1.0, percentile))

    scored_payloads: List[Dict[str, Any]] = []
    target_price = target_payload.get("price_eur")
    target_mileage = target_payload.get("mileage_km")
    target_profile = build_text_profile(target_payload.get("description") or "")
    cohort_size = len(payloads)

    for payload in payloads:
        profile = payload.pop("_text_profile", build_text_profile(payload.get("description") or ""))
        
        # Simplified scoring - no complex penalty logic
        similarity_score, similarity_details = similarity_engine.score(
            target_payload,
            payload,
            tolerances=tolerances,
            locks=locks,
            target_profile=target_profile,
            candidate_profile=profile,
        )
        percentile = price_percentile(payload.get("price_eur"))
        deal_score, deal_details = compute_deal_score(
            payload.get("price_eur"),
            percentile,
            median_price,
            target_price,
            target_mileage,
            payload.get("mileage_km"),
        )
        deal_details["comparable_count"] = len(price_values)

        candidate_price = payload.get("price_eur")
        savings = 0.0
        if target_price and candidate_price:
            savings = float(target_price - candidate_price)

        freshness_days = payload.get("freshness_days")
        freshness_score = None
        if freshness_days is not None:
            freshness_score = math.exp(-float(freshness_days) / 30.0)
        trust_fields = [
            payload.get("price_eur"),
            payload.get("mileage_km"),
            payload.get("power_kw"),
            payload.get("description"),
            payload.get("images"),
        ]
        non_null = sum(1 for item in trust_fields if item)
        trust_score = non_null / len(trust_fields) if trust_fields else 0.5

        alpha = tolerances.get("rank_alpha", 0.55)
        beta = tolerances.get("rank_beta", 0.30)
        freshness_weight = tolerances.get("rank_freshness", 0.10)
        trust_weight = tolerances.get("rank_trust", 0.05)

        # Simple weighted combination
        final_score = (
            alpha * similarity_score
            + beta * deal_score
            + freshness_weight * (freshness_score if freshness_score is not None else 0.0)
            + trust_weight * trust_score
        )
        
        final_score = max(0.0, min(1.0, final_score))
        payload.update(
            {
                "similarity_score": similarity_score,
                "deal_score": deal_score,
                "final_score": final_score,
                "score": final_score,
                "price_hat": float(candidate_price * 1.03) if candidate_price else None,
                "savings": savings,
                "savings_percent": (savings / target_price * 100) if target_price and target_price > 0 else None,
                "freshness_score": freshness_score,
                "trust_score": trust_score,
                "ranking_details": {
                    "match_score": similarity_score,
                    "similarity_components": {
                        "categorical": similarity_details["categorical"]["score"],
                        "numeric": similarity_details["numeric"]["score"],
                        "text": similarity_details["textual"]["score"],
                    },
                    "categorical_components": similarity_details["categorical"]["components"],
                    "numeric_components": similarity_details["numeric"]["components"],
                    "text_components": similarity_details["textual"]["components"],
                    "weights": {
                        "match": similarity_details["weights"],
                        "ranking": {
                            "match": alpha,
                            "deal": beta,
                            "freshness": freshness_weight,
                            "trust": trust_weight,
                        },
                    },
                    "deal": deal_details,
                },
            }
        )
        payload.pop("_match_strategy", None)
        payload["explanation"] = build_explanation(
            target_payload=target_payload,
            candidate_payload=payload,
            similarity_details=similarity_details,
            deal_details=deal_details,
            locks=locks,
            cohort_size=cohort_size,
            savings=savings,
        )
        scored_payloads.append(payload)

    scored_payloads.sort(key=lambda item: item.get("final_score", 0.0), reverse=True)
    
    # Filter out results below minimum quality threshold
    # Only return results with similarity score >= 0.30 (30%) to avoid terrible matches
    min_similarity_threshold = 0.30
    filtered_payloads = [
        p for p in scored_payloads 
        if p.get("similarity_score", 0.0) >= min_similarity_threshold
    ]
    
    # If we filtered out too many, return at least the top results even if below threshold
    # (but log a warning)
    if len(filtered_payloads) < len(scored_payloads) * 0.5 and len(scored_payloads) > 0:
        # Keep top 50% even if below threshold, but prioritize those above threshold
        above_threshold = [p for p in scored_payloads if p.get("similarity_score", 0.0) >= min_similarity_threshold]
        below_threshold = [p for p in scored_payloads if p.get("similarity_score", 0.0) < min_similarity_threshold]
        # Return all above threshold + top 50% of below threshold
        keep_below = below_threshold[:max(1, len(below_threshold) // 2)]
        filtered_payloads = above_threshold + keep_below
    
    return filtered_payloads


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


@app.route("/top-vehicles", methods=["GET"])
def top_vehicles() -> Tuple[Any, int]:
    """Get top 10 most listed vehicles with sample URLs"""
    try:
        limit = request.args.get("limit", default="10", type=int)
        limit = max(1, min(limit, 50))  # Clamp between 1 and 50
        
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    make::TEXT,
                    model::TEXT,
                    COUNT(*)::INTEGER as count,
                    MIN(listing_url)::TEXT as sample_url
                FROM vehicle_marketplace.vehicle_data
                WHERE make IS NOT NULL 
                  AND model IS NOT NULL
                  AND listing_url IS NOT NULL
                  AND is_vehicle_available = true
                GROUP BY make, model
                ORDER BY COUNT(*) DESC
                LIMIT %s
                """,
                (limit,)
            )
            results = cursor.fetchall()
        
        vehicles = []
        for i, row in enumerate(results):
            try:
                # Ensure all values are properly typed
                count_val = row.get("count")
                if count_val is not None:
                    count_val = int(count_val)
                else:
                    count_val = 0
                
                vehicles.append({
                    "rank": i + 1,
                    "make": str(row.get("make", "")) if row.get("make") is not None else "",
                    "model": str(row.get("model", "")) if row.get("model") is not None else "",
                    "count": count_val,
                    "sample_url": str(row.get("sample_url", "")) if row.get("sample_url") is not None else ""
                })
            except Exception as e:
                logger.warning(f"Skipping row due to error: {e}, row: {row}")
                continue
        
        return jsonify({
            "vehicles": vehicles,
            "total_returned": len(vehicles)
        }), 200
    except Exception as exc:
        logger.exception("Top vehicles endpoint failed: %s", exc)
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
    request_started = time.time()
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

    # Simplified: no lock settings needed, just basic tolerances
    year_tolerance_years = max(0, parse_int(request.args.get("year_variance"), 2))
    mileage_ratio = parse_float(request.args.get("mileage_variance_multiplier"), 2.0)
    mileage_min_window = parse_float(request.args.get("mileage_min_window"), 5000.0)
    power_variance_ratio = parse_float(request.args.get("power_variance_pct"), 0.15)
    power_min_window = parse_float(request.args.get("power_min_window"), 15.0)
    candidate_limit = max(50, parse_int(request.args.get("max_candidates"), int(os.getenv("CANDIDATE_LIMIT", "400"))))

    balance_param = request.args.get("balance")
    balance = parse_float(balance_param, 0.0)
    balance = max(-1.0, min(1.0, balance))
    alpha_base = 0.55
    beta_base = 0.30
    alpha_raw = max(0.15, alpha_base + balance * 0.2)
    beta_raw = max(0.15, beta_base - balance * 0.2)
    total_raw = alpha_raw + beta_raw
    desired_total = 0.85
    if total_raw <= 0:
        alpha_raw, beta_raw = alpha_base, beta_base
        total_raw = alpha_raw + beta_raw
    scale = desired_total / total_raw
    alpha_weight = max(0.1, min(0.85, alpha_raw * scale))
    beta_weight = max(0.1, min(0.85, beta_raw * scale))
    freshness_weight = 0.10
    trust_weight = 0.05

    candidate_options = {
        "candidate_limit": candidate_limit,
        "min_results": max(top, 5),  # Want at least as many as requested, or 5 minimum
    }

    candidates_raw, candidate_debug = find_candidate_rows(target_row, target_year, candidate_options)
    if not candidates_raw:
        return jsonify({
            "error": "No comparable vehicles found",
            "debug": candidate_debug,
        }), 404

    tolerance_config = {
        "year_tolerance_years": year_tolerance_years,
        "mileage_tolerance_ratio": mileage_ratio,
        "mileage_min_window": mileage_min_window,
        "power_tolerance_ratio": power_variance_ratio,
        "power_min_window": power_min_window,
        "rank_alpha": alpha_weight,
        "rank_beta": beta_weight,
        "rank_freshness": freshness_weight,
        "rank_trust": trust_weight,
    }

    # No locks needed - filtering is done in SQL
    scored = score_candidates(target_payload, candidates_raw, tolerance_config, locks={})

    cohort_prices = [item["price_eur"] for item in scored if item.get("price_eur") is not None]
    cohort_median_price = statistics.median(cohort_prices) if cohort_prices else None
    elapsed = time.time() - request_started
    
    # Extract filter strategy info from debug
    selected_attempt = candidate_debug.get("selected_attempt", "unknown")
    attempts = candidate_debug.get("attempts", [])
    filter_info = {}
    if attempts:
        selected_attempt_info = next((a for a in attempts if a["name"] == selected_attempt), None)
        if selected_attempt_info:
            filter_info = selected_attempt_info.get("filters_applied", {})
    
    response = {
        "vehicle": target_payload,
        "comparables": scored[:top],
        "metadata": {
            "requested_top": top,
            "returned": len(scored[:top]),
            "total_candidates": len(scored),
            "raw_candidates": len(candidates_raw),
            "filter_strategy": selected_attempt,
            "filters_applied": filter_info,
            "relaxation_attempts": len(attempts),
            "processing_time_s": round(elapsed, 3),
            "weights": {
                "match": alpha_weight,
                "deal": beta_weight,
                "freshness": freshness_weight,
                "trust": trust_weight,
            },
            "cohort_median_price": cohort_median_price,
            "warning": candidate_debug.get("warning"),
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
