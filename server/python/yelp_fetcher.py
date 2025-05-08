import os
import requests
import time
import json

def fetch_yelp_data_for_cuisine(cuisine, max_results=50):
    """Mock function for testing without real API calls"""
    # In a real implementation, this would make actual API calls to Yelp
    # For testing, we'll return sample data
    sample_data = []
    
    for i in range(1, max_results + 1):
        sample_data.append({
            "id": f"{cuisine.lower()}_restaurant_{i}",
            "name": f"{cuisine} Restaurant {i}",
            "coordinates": {
                "latitude": 40.7128 + (i * 0.001),
                "longitude": -74.0060 - (i * 0.001)
            },
            "categories": [
                {"title": cuisine}
            ],
            "rating": min(5, 3.5 + (i % 3) * 0.5),
            "review_count": 50 + (i * 10),
            "price": "$" * (1 + (i % 4)),
            "location": {
                "display_address": [f"{i} {cuisine} St", "New York, NY 10001"]
            }
        })
    
    return sample_data

def fetch_yelp_data_for_group_cuisines(cuisine_list):
    """Fetch restaurant data for all cuisines in the list"""
    all_data = []
    seen_ids = set()
    
    for cuisine in cuisine_list:
        cuisine_data = fetch_yelp_data_for_cuisine(cuisine)
        for restaurant in cuisine_data:
            if restaurant["id"] not in seen_ids:
                seen_ids.add(restaurant["id"])
                all_data.append(restaurant)
    
    return all_data