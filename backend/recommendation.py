import os
import time
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from geopy.distance import geodesic
from collections import Counter

app = Flask(__name__)
CORS(app)

YELP_API_KEY = os.getenv("YELP_API_KEY")
SEARCH_URL = "https://api.yelp.com/v3/businesses/search"
HEADERS = {"Authorization": f"Bearer {YELP_API_KEY}"}

@app.route("/api/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    group = data.get("group", [])
    top_k = data.get("top_k", 5)

    if not group:
        return jsonify({"error": "Missing group preferences"}), 400

    # Aggregate coordinates and preferences
    user_coords = [tuple(m["coordinates"]) for m in group if "coordinates" in m]
    if not user_coords:
        return jsonify({"error": "Missing coordinates for all group members"}), 400

    avg_lat = sum(lat for lat, _ in user_coords) / len(user_coords)
    avg_lon = sum(lon for _, lon in user_coords) / len(user_coords)

    # Count cuisine preferences
    cuisine_counter = Counter()
    for member in group:
        for cuisine in member.get("cuisine_choices", []):
            cuisine_counter[cuisine.lower().replace(" ", "_")] += 1

    # Aggregate dietary restrictions
    dietary_restrictions = list(set(
        d.lower().replace(" ", "_") for m in group for d in m.get("dietary_restrictions", [])
    ))

    # Determine minimum budget preference
    min_budget = min(len(m.get("budget", "$$")) for m in group)

    # Parse time for 'open_at' parameter
    time_str = group[0].get("time", "19:00")
    hh, mm = map(int, time_str.split(":"))
    now = time.localtime()
    open_at = int(time.mktime((now.tm_year, now.tm_mon, now.tm_mday, hh, mm, 0,
                               now.tm_wday, now.tm_yday, now.tm_isdst)))

    # Prepare Yelp API parameters
    params = {
        "latitude": avg_lat,
        "longitude": avg_lon,
        "categories": ",".join(cuisine_counter.keys()),
        "open_at": open_at,
        "sort_by": "best_match",
        "limit": 30
    }

    response = requests.get(SEARCH_URL, headers=HEADERS, params=params)
    if response.status_code != 200:
        return jsonify({"error": "Yelp API call failed", "details": response.json()}), response.status_code

    candidates = response.json().get("businesses", [])

    # Filter by proximity (within 2 miles of all users)
    nearby = []
    for biz in candidates:
        if "coordinates" not in biz or not biz["coordinates"]:
            continue
        biz_coords = (biz["coordinates"]["latitude"], biz["coordinates"]["longitude"])
        if all(geodesic(biz_coords, u).miles <= 2 for u in user_coords):
            nearby.append(biz)

    # Scoring function with weighted cuisine preferences
    scored = []
    for biz in nearby:
        categories = {c["alias"] for c in biz.get("categories", [])}
        price = biz.get("price", "")
        rating = float(biz.get("rating", 0))

        # Calculate cuisine score based on preference weights
        cuisine_score = sum(cuisine_counter.get(cat, 0) for cat in categories)

        # Calculate dietary score
        dietary_score = sum(1 for d in dietary_restrictions if d in categories)

        # Calculate budget score
        budget_score = 2 if len(price) == min_budget else (1 if abs(len(price) - min_budget) == 1 else 0)

        # Total score
        total_score = cuisine_score * 3 + dietary_score * 2 + budget_score + rating

        scored.append((total_score, biz))

    # Sort and select top results
    scored.sort(reverse=True, key=lambda x: x[0])
    top_results = [biz for _, biz in scored[:top_k]]

    # Fallback: If no suitable matches, suggest top-rated nearby restaurants
    if not top_results:
        fallback_params = {
            "latitude": avg_lat,
            "longitude": avg_lon,
            "sort_by": "rating",
            "limit": top_k
        }
        fallback_response = requests.get(SEARCH_URL, headers=HEADERS, params=fallback_params)
        if fallback_response.status_code == 200:
            top_results = fallback_response.json().get("businesses", [])

    return jsonify(top_results)

if __name__ == "__main__":
    app.run(port=5000, debug=True)

