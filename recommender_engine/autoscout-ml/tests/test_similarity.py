import math

from src.api import (
    build_attempts,
    SimilarityEngine,
    build_text_profile,
    normalize_color,
)


def create_payload(
    *,
    make: str = "Audi",
    model: str = "A4",
    body: str = "sedan",
    fuel: str = "petrol",
    transmission: str = "automatic",
    exterior: str = "black",
    interior: str = "black",
    age_months: int = 24,
    mileage_km: int = 20000,
    power_kw: int = 140,
    description: str = "",
) -> dict:
    return {
        "make": make,
        "model": model,
        "body_group": body,
        "fuel_group": fuel,
        "transmission_group": transmission,
        "color_canonical": exterior,
        "interior_color_effective": interior,
        "age_months": age_months,
        "mileage_km": mileage_km,
        "power_kw": power_kw,
        "description": description,
    }


def test_normalize_color_handles_umlauts():
    assert normalize_color("Weiß Metallic") == "white"
    assert normalize_color("Schwarz") == "black"
    assert normalize_color("Candy White Perleffekt") == "white"
    assert normalize_color("Deep Black Perleffekt") == "black"
    assert normalize_color("Schwarz / Weiß") == "black"

# New test additions later

def test_text_profile_extracts_known_features():
    profile = build_text_profile("ACC und Panoramadach sowie Matrix LED")
    assert "adaptive_cruise_control" in profile["features"]
    assert "panoramic_roof" in profile["features"]
    assert profile["tokens"]  # tokens should not be empty


def test_similarity_engine_penalises_categoric_mismatch():
    engine = SimilarityEngine()
    locks = {
        "exterior_color": True,
        "interior_color": True,
        "body_type": True,
        "fuel_type": True,
        "transmission": True,
    }

    target = create_payload(exterior="white", description="ACC Panoramadach Matrix LED")
    candidate_match = create_payload(exterior="white", description="ACC Panoramadach Matrix LED")
    candidate_mismatch = create_payload(exterior="black", description="ACC Panoramadach Matrix LED")

    target_profile = build_text_profile(target["description"])
    match_profile = build_text_profile(candidate_match["description"])
    mismatch_profile = build_text_profile(candidate_mismatch["description"])

    match_score, details_match = engine.score(
        target,
        candidate_match,
        locks=locks,
        target_profile=target_profile,
        candidate_profile=match_profile,
    )
    mismatch_score, details_mismatch = engine.score(
        target,
        candidate_mismatch,
        locks=locks,
        target_profile=target_profile,
        candidate_profile=mismatch_profile,
    )

    assert math.isclose(details_match["categorical"]["components"]["exterior_color"]["score"], 1.0)
    assert details_mismatch["categorical"]["components"]["exterior_color"]["score"] == 0.0
    assert match_score > mismatch_score
    assert mismatch_score < 0.4


def test_similarity_engine_respects_unlocked_colour():
    engine = SimilarityEngine()
    locks = {
        "exterior_color": False,
        "interior_color": True,
        "body_type": True,
        "fuel_type": True,
        "transmission": True,
    }

    target = create_payload(description="ACC Panoramadach Matrix LED")
    candidate = create_payload(exterior="white", description="ACC Panoramadach Matrix LED")

    target_profile = build_text_profile(target["description"])
    candidate_profile = build_text_profile(candidate["description"])

    score, details = engine.score(
        target,
        candidate,
        locks=locks,
        target_profile=target_profile,
        candidate_profile=candidate_profile,
    )

    exterior_component = details["categorical"]["components"]["exterior_color"]
    assert exterior_component["weight"] == 0.0
    assert score > 0.5  # colour mismatch should not dominate when unlocked


def test_build_attempts_does_not_relax_colour_when_locked():
    target_row = {
        "color": "Weiß",
        "interior_color": "Schwarz",
        "body_type": "Limousine",
        "transmission": "Automatik",
        "fuel_type": "Benzin",
    }
    locks = {
        "exterior_color": True,
        "interior_color": True,
        "body_type": True,
        "transmission": True,
        "fuel_type": True,
    }
    attempts = build_attempts(target_row, locks)
    attempt_names = [attempt["name"] for attempt in attempts]
    assert attempt_names == ["strict"]


def test_build_attempts_relaxes_when_color_unlocked():
    target_row = {
        "color": "Weiß",
        "interior_color": "Schwarz",
        "body_type": "Limousine",
        "transmission": "Automatik",
        "fuel_type": "Benzin",
    }
    locks = {
        "exterior_color": False,
        "interior_color": True,
        "body_type": True,
        "transmission": True,
        "fuel_type": True,
    }
    attempts = build_attempts(target_row, locks)
    assert attempts[0]["name"] == "strict"
    assert attempts[0]["color"] is False
