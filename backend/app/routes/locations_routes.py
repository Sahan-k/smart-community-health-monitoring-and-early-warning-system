"""
API routes for hierarchical location data (State → District → Taluk)
and environmental data (auto-fetched, read-only for users).
"""
import random
from typing import List, Optional
from fastapi import APIRouter, Query

from backend.app.data.locations_data import (
    get_states, get_districts, get_taluks, get_villages, get_pincodes, get_location_coords, reverse_geocode_coords
)
from backend.app.models.schemas import EnvironmentalData

router = APIRouter(prefix="/api/locations", tags=["Location & Environmental Data"])


@router.get("/states", response_model=List[str])
def list_states():
    """Return all available states."""
    return get_states()


@router.get("/districts", response_model=List[str])
def list_districts(state: str = Query(..., description="State name")):
    """Return districts for a given state."""
    return get_districts(state)


@router.get("/taluks", response_model=List[str])
def list_taluks(
    state: str = Query(..., description="State name"),
    district: str = Query(..., description="District name")
):
    """Return taluks for a given state and district."""
    return get_taluks(state, district)


@router.get("/villages", response_model=List[str])
def list_villages(
    state: str = Query(..., description="State name"),
    district: str = Query(..., description="District name"),
    taluk: str = Query(..., description="Taluk name")
):
    """Return villages / localities for a given state, district, and taluk sorted alphabetically."""
    return get_villages(state, district, taluk)


@router.get("/pincodes", response_model=List[str])
def list_pincodes(
    state: str = Query(..., description="State name"),
    district: str = Query(..., description="District name"),
    taluk: str = Query(..., description="Taluk name"),
    village: str = Query(..., description="Village name")
):
    """Return PIN codes for a given village. If multiple PIN codes exist, returns all of them sorted."""
    return get_pincodes(state, district, taluk, village)


@router.get("/pincode", response_model=List[str])
def list_pincode_alias(
    state: str = Query(..., description="State name"),
    district: str = Query(..., description="District name"),
    taluk: str = Query(..., description="Taluk name"),
    village: str = Query(..., description="Village name")
):
    """Alias for /pincodes."""
    return get_pincodes(state, district, taluk, village)


@router.get("/coords")
def get_coords(
    state: str = Query(...),
    district: str = Query(...)
):
    """Return approximate latitude/longitude for a district."""
    lat, lng = get_location_coords(state, district)
    return {"latitude": lat or 12.9716, "longitude": lng or 77.5946}


@router.get("/reverse-geocode")
def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Reverse geocode coordinates using OpenStreetMap Nominatim with LGD fallback.
    Returns State, District, Taluk, Village, Pincode and full display name.
    """
    return reverse_geocode_coords(lat, lon)


@router.get("/environmental", response_model=EnvironmentalData)
def get_environmental_data(
    state: Optional[str] = "Karnataka",
    district: Optional[str] = None,
    taluk: Optional[str] = None
):
    """
    Get environmental data for a location.
    
    Data sources:
    - Temperature & Rainfall: Simulated from regional climate baselines.
      In production, this would integrate with IMD (India Meteorological Department)
      or OpenWeatherMap API.
    - Water pH & Turbidity: Demo baseline values.
      In production, this would connect to IoT water quality sensors
      or public water quality datasets.
    
    These values are NOT user-editable. They represent system-provided data.
    """
    # Regional climate baseline for Karnataka (varies by district altitude/region)
    # In production: replace with actual weather API calls (IMD/OpenWeatherMap)
    base_temp = 28.0
    base_rainfall = 45.0
    base_humidity = 68.0
    
    # Slight regional variation based on district (coastal vs inland vs northern)
    if district:
        d_lower = district.lower()
        if "mangal" in d_lower or "udupi" in d_lower or "uttara" in d_lower:
            # Coastal - higher rainfall, moderate temp
            base_temp = 27.5
            base_rainfall = 120.0
            base_humidity = 82.0
        elif "kodagu" in d_lower or "chikkamagal" in d_lower or "hassan" in d_lower:
            # Western Ghats - cooler, high rainfall
            base_temp = 24.0
            base_rainfall = 150.0
            base_humidity = 78.0
        elif "kalaburagi" in d_lower or "raichur" in d_lower or "bidar" in d_lower or "yadgir" in d_lower:
            # Northern dry zone - hotter, low rainfall
            base_temp = 33.0
            base_rainfall = 20.0
            base_humidity = 55.0
        elif "bengaluru" in d_lower:
            # Bengaluru - moderate
            base_temp = 26.5
            base_rainfall = 55.0
            base_humidity = 65.0
        elif "mysuru" in d_lower or "mandya" in d_lower or "chamaraj" in d_lower:
            # Southern plateau - moderate
            base_temp = 27.0
            base_rainfall = 50.0
            base_humidity = 62.0
    
    # Add small deterministic variation (not random, based on inputs for consistency)
    seed_val = hash(f"{state}_{district}_{taluk}") % 100
    temp_variation = (seed_val % 5) * 0.3
    rain_variation = (seed_val % 10) * 2.0
    
    return EnvironmentalData(
        avg_temp_c=round(base_temp + temp_variation, 1),
        rainfall_mm=round(base_rainfall + rain_variation, 1),
        humidity_percent=round(base_humidity + (seed_val % 8), 1),
        water_ph=round(7.0 + (seed_val % 15) * 0.05, 2),
        turbidity_ntu=round(1.5 + (seed_val % 20) * 0.15, 2),
        temp_source="Regional climate baseline (Demo — production: IMD/Weather API)",
        rainfall_source="Regional climate baseline (Demo — production: IMD/Weather API)",
        water_ph_source="Baseline estimate (Demo — production: IoT water quality sensor)",
        turbidity_source="Baseline estimate (Demo — production: IoT water quality sensor)"
    )
