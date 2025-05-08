#!/usr/bin/env python3
import sys
import json
from group_profile import get_group_profile
from recommendation import rank_restaurants
from yelp_fetcher import fetch_yelp_data_for_group_cuisines

def main():
    # Get input data from arguments
    if len(sys.argv) > 1:
        group_input = json.loads(sys.argv[1])
    else:
        # Sample data for testing
        group_input = [
            {"name": "Alice", "cuisines": ["Italian", "Japanese"], "budget": "$$", "location": [40.74, -73.99]},
            {"name": "Bob", "cuisines": ["Italian", "Mexican"], "budget": "$$", "location": [40.75, -73.993]},
            {"name": "Charlie", "cuisines": ["Italian", "Indian"], "budget": "$$$", "location": [40.742, -73.989]}
        ]

    # Step 1: Group profile
    top_cuisines, top_budget, GROUP_CENTROID = get_group_profile(group_input)
    
    # Step 2: Yelp data
    restaurant_data = fetch_yelp_data_for_group_cuisines(top_cuisines)
    
    # Step 3: Recommendation
    results = rank_restaurants(restaurant_data, top_cuisines, top_budget, GROUP_CENTROID)
    
    # Step 4: Output as JSON
    output = {
        "recommendations": results,
        "stats": {
            "top_cuisines": top_cuisines,
            "top_budget": top_budget,
            "centroid": GROUP_CENTROID
        }
    }
    
    print(json.dumps(output))

if __name__ == "__main__":
    main()