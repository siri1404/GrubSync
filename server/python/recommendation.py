import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def rank_restaurants(restaurants_data, top_cuisines, top_budget, group_centroid):
    results = []
    top_cuisines_lower = [c.lower() for c in top_cuisines]
    
    for restaurant in restaurants_data:
        # Skip restaurants with missing critical data
        coords = restaurant.get('coordinates', {})
        lat = coords.get('latitude')
        lon = coords.get('longitude')
        
        if not lat or not lon or not restaurant.get('rating'):
            continue
            
        # Calculate distance from group centroid
        distance_km = haversine(lat, lon, group_centroid[0], group_centroid[1])
        
        # Get restaurant categories
        categories = []
        for cat in restaurant.get('categories', []):
            if isinstance(cat, dict) and 'title' in cat:
                categories.append(cat['title'].lower())
            elif isinstance(cat, str):
                categories.append(cat.lower())
        
        # Calculate cuisine match score
        cuisine_match_score = sum(1 for c in categories if c in top_cuisines_lower)
        
        # Skip restaurants that don't match any of the top cuisines
        if cuisine_match_score == 0:
            continue
            
        # Calculate budget match
        price = restaurant.get('price', '$')
        budget_match = 1 if price == top_budget else 0
        
        # Calculate final score
        score = (
            cuisine_match_score * 30 +
            budget_match * 20 +
            restaurant.get('rating', 0) * 10 +
            min(restaurant.get('review_count', 0), 500) / 25 -
            distance_km * 5
        )
        
        # Get address
        location = restaurant.get('location', {})
        address = ', '.join(location.get('display_address', ['No address available']))
        
        results.append({
            'name': restaurant.get('name', 'Unnamed Restaurant'),
            'address': address,
            'rating': restaurant.get('rating', 0),
            'review_count': restaurant.get('review_count', 0),
            'price_val': restaurant.get('price', '$'),
            'distance_km': distance_km,
            'score': score
        })
    
    # Sort by score and return top 10
    return sorted(results, key=lambda x: x['score'], reverse=True)[:10]