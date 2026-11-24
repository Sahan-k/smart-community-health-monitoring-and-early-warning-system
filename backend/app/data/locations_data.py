"""
Official Local Government Directory (LGD) and Indian Postal PIN Code Data.
Hierarchical structure: State (all India) → District → Taluk → Village → Pincode.
"""
import json
import os
import urllib.request
import urllib.parse
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

# Load LGD data from JSON file
DATA_FILE = Path(__file__).resolve().parent / "lgd_india_data.json"

if DATA_FILE.exists():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        LGD_DATA: Dict[str, Any] = json.load(f)
else:
    LGD_DATA: Dict[str, Any] = {}

# Backward compatibility map
LOCATION_DATA = {
    state: {
        dist: {
            "taluks": sorted(list(dist_info.get("taluks", {}).keys())),
            "lat": dist_info.get("lat", 12.9716),
            "lng": dist_info.get("lng", 77.5946)
        }
        for dist, dist_info in state_dict.items()
    }
    for state, state_dict in LGD_DATA.items()
}


def _find_ci(d: dict, query: str) -> Optional[str]:
    """Find key in dictionary matching query case-insensitively with whitespace trimmed."""
    if not query or not d:
        return None
    q_clean = query.strip().lower()
    for k in d.keys():
        if k.strip().lower() == q_clean:
            return k
    return None


def get_states() -> List[str]:
    """Return all available Indian States and Union Territories sorted alphabetically."""
    return sorted([k for k in LGD_DATA.keys() if k.strip()])


def get_districts(state: str) -> List[str]:
    """Return list of districts for a given state sorted alphabetically."""
    real_state = _find_ci(LGD_DATA, state) or state
    state_data = LGD_DATA.get(real_state, {})
    return sorted([k for k in state_data.keys() if k.strip()])


def get_taluks(state: str, district: str) -> List[str]:
    """Return list of taluks / sub-districts for a given state and district sorted alphabetically."""
    real_state = _find_ci(LGD_DATA, state) or state
    state_data = LGD_DATA.get(real_state, {})
    
    real_dist = _find_ci(state_data, district) or district
    district_data = state_data.get(real_dist, {})
    taluks_dict = district_data.get("taluks", {})
    return sorted([k for k in taluks_dict.keys() if k.strip()])


def get_villages(state: str, district: str, taluk: str) -> List[str]:
    """Return list of villages / localities for a given taluk sorted alphabetically."""
    real_state = _find_ci(LGD_DATA, state) or state
    state_data = LGD_DATA.get(real_state, {})
    
    real_dist = _find_ci(state_data, district) or district
    district_data = state_data.get(real_dist, {})
    taluks_dict = district_data.get("taluks", {})
    
    real_taluk = _find_ci(taluks_dict, taluk) or taluk
    village_dict = taluks_dict.get(real_taluk, {})
    return sorted([k for k in village_dict.keys() if k.strip()])


def get_pincodes(state: str, district: str, taluk: str, village: str) -> List[str]:
    """
    Return list of PIN codes for the selected village.
    Uses official LGD dataset mapping, with optional live India Post API enhancement.
    If multiple PIN codes exist, all are returned as sorted options.
    """
    real_state = _find_ci(LGD_DATA, state) or state
    state_data = LGD_DATA.get(real_state, {})
    
    real_dist = _find_ci(state_data, district) or district
    district_data = state_data.get(real_dist, {})
    taluks_dict = district_data.get("taluks", {})
    
    real_taluk = _find_ci(taluks_dict, taluk) or taluk
    village_dict = taluks_dict.get(real_taluk, {})
    
    real_village = _find_ci(village_dict, village) or village
    
    # 1. Local LGD dataset lookup
    local_pins = village_dict.get(real_village, [])
    if isinstance(local_pins, str):
        local_pins = [local_pins]
    elif isinstance(local_pins, list):
        local_pins = [str(p) for p in local_pins]
    else:
        local_pins = []

    # 2. Try online Indian Post Office API only as fallback if local mapping is missing
    api_pins = []
    if not local_pins and real_village:
        try:
            clean_name = real_village.split("(")[0].strip()
            encoded_name = urllib.parse.quote(clean_name)
            api_url = f"https://api.postalpincode.in/postoffice/{encoded_name}"
            req = urllib.request.Request(api_url, headers={"User-Agent": "HealthGuardAI-Location/1.0"})
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                data = json.loads(resp.read().decode())
                if data and isinstance(data, list) and data[0].get("Status") == "Success":
                    for po in data[0].get("PostOffice", []):
                        pincode = po.get("Pincode")
                        po_state = (po.get("State") or "").lower()
                        po_dist = (po.get("District") or "").lower()
                        # If matches state or district, prioritize
                        if state.lower() in po_state or district.lower() in po_dist:
                            if pincode and str(pincode).strip() not in api_pins:
                                api_pins.append(str(pincode).strip())
        except Exception:
            # Gracefully ignore if offline or sandbox restricted
            pass

    # Combine local pins and API pins, ensuring uniqueness
    all_pins = list(set([str(p).strip() for p in (local_pins + api_pins) if str(p).strip()]))
    
    # 3. Fallback: If no direct pins found for this village, check if any village in the taluk has pins
    if not all_pins:
        for v, pins in village_dict.items():
            if pins:
                if isinstance(pins, list):
                    all_pins.extend([str(x).strip() for x in pins])
                else:
                    all_pins.append(str(pins).strip())
                break
    
    # 4. Fallback: District-level fallback from other taluks
    if not all_pins:
        for t, v_dict in taluks_dict.items():
            for v, pins in v_dict.items():
                if pins:
                    if isinstance(pins, list):
                        all_pins.extend([str(x).strip() for x in pins])
                    else:
                        all_pins.append(str(pins).strip())
                    break
            if all_pins:
                break

    # Sort alphabetically/numerically
    return sorted(list(set(all_pins)))


def get_location_coords(state: str, district: str) -> Tuple[Optional[float], Optional[float]]:
    """Return lat/lng for a given district."""
    real_state = _find_ci(LGD_DATA, state) or state
    state_data = LGD_DATA.get(real_state, {})
    
    real_dist = _find_ci(state_data, district) or district
    district_data = state_data.get(real_dist, {})
    return district_data.get("lat", 12.9716), district_data.get("lng", 77.5946)


def reverse_geocode_coords(lat: float, lon: float) -> Dict[str, Any]:
    """
    Reverse geocode coordinates using OpenStreetMap Nominatim with LGD fallback.
    Extracts State, District, Taluk, Village and Pincode.
    """
    detected = {
        "latitude": lat,
        "longitude": lon,
        "state": "",
        "district": "",
        "taluk": "",
        "village": "",
        "pincode": "",
        "display_name": "",
        "source": "osm_nominatim"
    }

    # 1. Try OpenStreetMap Nominatim reverse geocoding
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "HealthGuardAI/1.0 (smart-community-health-monitoring)"}
        )
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode())
            addr = data.get("address", {})
            detected["display_name"] = data.get("display_name", "")

            raw_state = addr.get("state", "")
            raw_district = (
                addr.get("state_district") or
                addr.get("district") or
                addr.get("city_district") or
                addr.get("county") or ""
            ).replace(" District", "").strip()

            raw_taluk = (
                addr.get("subdistrict") or
                addr.get("tehsil") or
                addr.get("county") or
                addr.get("subdivision") or ""
            ).replace(" Taluk", "").replace(" Tehsil", "").strip()

            raw_village = (
                addr.get("village") or
                addr.get("hamlet") or
                addr.get("suburb") or
                addr.get("neighbourhood") or
                addr.get("town") or
                addr.get("residential") or
                addr.get("city") or ""
            ).strip()

            raw_pincode = (addr.get("postcode") or "").strip()

            detected["state"] = raw_state
            detected["district"] = raw_district
            detected["taluk"] = raw_taluk
            detected["village"] = raw_village
            detected["pincode"] = raw_pincode
    except Exception:
        detected["source"] = "lgd_proximity_fallback"

    # 2. Reconcile / Fallback with official LGD dataset
    matched_state = None
    if detected["state"]:
        matched_state = _find_ci(LGD_DATA, detected["state"])

    # If no state matched or in fallback mode, find closest district from LGD coordinates
    if not matched_state:
        best_sq = float("inf")
        best_state = "Karnataka"
        best_dist = "Bengaluru Urban"
        for s_name, s_dists in LGD_DATA.items():
            for d_name, d_info in s_dists.items():
                d_lat = d_info.get("lat")
                d_lng = d_info.get("lng")
                if d_lat is not None and d_lng is not None:
                    sq = (lat - d_lat)**2 + (lon - d_lng)**2
                    if sq < best_sq:
                        best_sq = sq
                        best_state = s_name
                        best_dist = d_name
        matched_state = best_state
        if not detected["district"]:
            detected["district"] = best_dist

    detected["state"] = matched_state or "Karnataka"
    state_dists = LGD_DATA.get(detected["state"], {})

    # Reconcile District
    matched_dist = None
    if detected["district"]:
        for d in state_dists.keys():
            if d.lower() == detected["district"].lower() or d.lower() in detected["district"].lower() or detected["district"].lower() in d.lower():
                matched_dist = d
                break
    if not matched_dist and state_dists:
        matched_dist = list(state_dists.keys())[0]
    detected["district"] = matched_dist or detected["district"]

    # Reconcile Taluk
    dist_info = state_dists.get(detected["district"], {})
    taluks_dict = dist_info.get("taluks", {})
    matched_taluk = None
    if detected["taluk"]:
        for t in taluks_dict.keys():
            if t.lower() == detected["taluk"].lower() or t.lower() in detected["taluk"].lower() or detected["taluk"].lower() in t.lower():
                matched_taluk = t
                break
    if not matched_taluk and taluks_dict:
        matched_taluk = list(taluks_dict.keys())[0]
    detected["taluk"] = matched_taluk or detected["taluk"]

    # Reconcile Village
    village_dict = taluks_dict.get(detected["taluk"], {})
    matched_village = None
    if detected["village"]:
        for v in village_dict.keys():
            if v.lower() == detected["village"].lower() or v.lower() in detected["village"].lower() or detected["village"].lower() in v.lower():
                matched_village = v
                break
    if not matched_village and village_dict:
        matched_village = list(village_dict.keys())[0]
    detected["village"] = matched_village or detected["village"]

    # Reconcile Pincode
    if not detected["pincode"]:
        pins = get_pincodes(detected["state"], detected["district"], detected["taluk"], detected["village"])
        if pins:
            detected["pincode"] = pins[0]

    if not detected["display_name"]:
        parts = [p for p in [detected["village"], detected["taluk"], detected["district"], detected["state"]] if p]
        detected["display_name"] = ", ".join(parts)
        if detected["pincode"]:
            detected["display_name"] += f" - {detected['pincode']}"

    return detected

