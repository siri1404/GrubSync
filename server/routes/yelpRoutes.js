import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/authMiddleware.js';
import Preference from '../models/Preference.js';
import Group from '../models/Group.js';
import { getAllYelpCategories } from '../utils/cuisineMapping.js';
import { Client } from '@googlemaps/google-maps-services-js';

const router = express.Router();
const googleMapsClient = new Client({});

// Price mapping for Yelp API
const priceMapping = {
  '$': '1',
  '$$': '1,2',
  '$$$': '1,2,3',
  '$$$$': '1,2,3,4'
};

// Distance scoring configuration
const DISTANCE_WEIGHTS = {
  VERY_CLOSE: 60,  // 0-2 miles
  CLOSE: 45,       // 2-5 miles
  MEDIUM: 25,      // 5-8 miles
  FAR: 10,         // 8-12 miles
  VERY_FAR: -10    // 12+ miles
};

async function getCoordinates(address) {
  try {
    const response = await googleMapsClient.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    
    throw new Error('No results found for address');
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function calculateCentroid(coordinates) {
  if (!coordinates.length) return null;
  
  const validCoords = coordinates.filter(coord => coord && typeof coord.lat === 'number' && typeof coord.lng === 'number');
  
  if (!validCoords.length) return null;
  
  const sumLat = validCoords.reduce((sum, coord) => sum + coord.lat, 0);
  const sumLng = validCoords.reduce((sum, coord) => sum + coord.lng, 0);
  
  return {
    lat: sumLat / validCoords.length,
    lng: sumLng / validCoords.length
  };
}

function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2) return Infinity;
  
  const toRad = value => (value * Math.PI) / 180;
  const R = 3958.8; // Earth's radius in miles
  
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function getMostCommonCuisines(preferences) {
  const cuisineCounts = {};
  const totalUsers = preferences.length;
  
  preferences.forEach(pref => {
    pref.cuisineTypes.forEach(cuisine => {
      cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
    });
  });
  
  return Object.entries(cuisineCounts)
    .map(([cuisine, count]) => ({
      cuisine,
      weight: count / totalUsers,
      count
    }))
    .sort((a, b) => b.weight - a.weight);
}

function getCommonDietaryRestrictions(preferences) {
  const allRestrictions = new Set();
  preferences.forEach(pref => {
    pref.dietaryRestrictions.forEach(restriction => {
      allRestrictions.add(restriction.toLowerCase());
    });
  });
  return Array.from(allRestrictions);
}

function getAverageSpiceLevel(preferences) {
  const sum = preferences.reduce((acc, pref) => acc + pref.spiceLevel, 0);
  return Math.round(sum / preferences.length);
}

function getCommonBudget(preferences) {
  const budgetCounts = { '$': 0, '$$': 0, '$$$': 0, '$$$$': 0 };
  const totalUsers = preferences.length;
  
  preferences.forEach(pref => {
    budgetCounts[pref.budget]++;
  });
  
  return Object.entries(budgetCounts)
    .map(([budget, count]) => ({
      budget,
      weight: count / totalUsers,
      count
    }))
    .sort((a, b) => b.weight - a.weight)[0];
}

function getDistanceScore(distance) {
  if (distance <= 2) return DISTANCE_WEIGHTS.VERY_CLOSE;
  if (distance <= 5) return DISTANCE_WEIGHTS.CLOSE;
  if (distance <= 8) return DISTANCE_WEIGHTS.MEDIUM;
  if (distance <= 12) return DISTANCE_WEIGHTS.FAR;
  return DISTANCE_WEIGHTS.VERY_FAR;
}

function calculateMatchScore(restaurant, cuisinePrefs, dietaryRestrictions, budget, distance) {
  let score = 0;
  const maxScore = 100;
  
  // Distance is now the primary factor
  score += getDistanceScore(distance);
  
  const restaurantCategories = restaurant.categories.map(c => ({
    alias: c.alias.toLowerCase(),
    title: c.title.toLowerCase()
  }));
  
  // Cuisine matching
  let cuisineScore = 0;
  cuisinePrefs.forEach(({ cuisine, weight }) => {
    if (restaurantCategories.some(cat => 
      cat.alias.includes(cuisine.toLowerCase()) || 
      cat.title.includes(cuisine.toLowerCase())
    )) {
      cuisineScore += 25 * weight;
    }
  });
  score += Math.min(cuisineScore, 25);
  
  // Rating score
  const ratingScore = (restaurant.rating / 5) * 10;
  score += ratingScore;
  
  // Review count score
  const reviewScore = Math.min((restaurant.review_count / 200) * 5, 5);
  score += reviewScore;
  
  // Budget matching
  if (restaurant.price === budget.budget) {
    score += 8;
  } else if (
    (restaurant.price === '$' && budget.budget === '$$') ||
    (restaurant.price === '$$' && (budget.budget === '$' || budget.budget === '$$$'))
  ) {
    score += 4;
  }
  
  return Math.min(Math.round(score), maxScore);
}

async function searchRestaurantsInZone(zone, params, apiKey) {
  const maxRetries = 3;
  const baseDelay = 1000;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const zoneParams = {
        ...params,
        latitude: zone.lat,
        longitude: zone.lng,
        location: undefined
      };
      
      if (!zoneParams.radius || zoneParams.radius > 8000) {
        zoneParams.radius = 8000;
      }
      
      const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip'
        },
        params: zoneParams,
        timeout: 10000
      });
      
      return response.data.businesses || [];
    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (!isRateLimit || isLastAttempt) {
        console.error(`Zone search error (${zone.lat},${zone.lng}):`, error.message);
        return [];
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return [];
}

function generateSearchZones(centroid, radius, count) {
  const zones = [{ ...centroid }];
  const angleStep = (2 * Math.PI) / count;
  const distanceRings = [radius/4, radius/2, radius*0.75];
  
  distanceRings.forEach(offsetDistance => {
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const latOffset = offsetDistance * Math.cos(angle) / 69;
      const lngOffset = offsetDistance * Math.sin(angle) / (69 * Math.cos(centroid.lat * Math.PI / 180));
      
      zones.push({
        lat: centroid.lat + latOffset,
        lng: centroid.lng + lngOffset
      });
    }
  });
  
  return zones;
}

router.post('/recommend/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId).exec();
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (!group.members.some(member => member.user.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const preferences = await Preference.find({ group: groupId }).exec();
    if (preferences.length === 0) {
      return res.status(400).json({ message: 'No preferences found for this group.' });
    }

    const userPreference = await Preference.findOne({ 
      user: req.user._id, 
      group: groupId 
    }).exec();

    if (!userPreference) {
      return res.status(400).json({ message: 'Please submit your preferences first.' });
    }

    const coordinatesPromises = preferences.map(pref => getCoordinates(pref.location));
    const userCoordinates = await Promise.all(coordinatesPromises);
    const validCoordinates = userCoordinates.filter(coord => coord !== null);
    
    if (validCoordinates.length === 0) {
      return res.status(400).json({ message: 'No valid locations found. Please check address formats.' });
    }
    
    const centroid = calculateCentroid(validCoordinates);
    if (!centroid) {
      return res.status(400).json({ message: 'Could not determine a central location for the group.' });
    }
    
    const cuisinePrefs = getMostCommonCuisines(preferences);
    const dietaryRestrictions = getCommonDietaryRestrictions(preferences);
    const averageSpiceLevel = getAverageSpiceLevel(preferences);
    const budgetPref = getCommonBudget(preferences);
    
    const cuisines = cuisinePrefs.map(c => c.cuisine);
    const yelpCategories = getAllYelpCategories(cuisines);
    
    const searchZones = generateSearchZones(centroid, 8, 4);
    
    const searchParams = {
      term: `${cuisines[0]} restaurant`,
      categories: cuisines[0].toLowerCase() === 'indian' ? 'indian' : yelpCategories.join(','),
      price: priceMapping[budgetPref.budget],
      radius: 8000,
      limit: 20,
      sort_by: 'distance',
      open_now: true
    };

    const allRestaurants = [];
    const seenBusinessIds = new Set();
    
    for (const zone of searchZones) {
      const results = await searchRestaurantsInZone(zone, searchParams, process.env.YELP_API_KEY);
      
      results.forEach(business => {
        if (!seenBusinessIds.has(business.id)) {
          seenBusinessIds.add(business.id);
          allRestaurants.push(business);
        }
      });
      
      if (allRestaurants.length >= 20) break;
    }
    
    if (allRestaurants.length < 5) {
      const broadSearchParams = {
        term: `${cuisines[0]} restaurant`,
        radius: 16000,
        limit: 50,
        sort_by: 'distance',
        open_now: true
      };
      
      for (const zone of searchZones.slice(0, 2)) {
        const results = await searchRestaurantsInZone(zone, broadSearchParams, process.env.YELP_API_KEY);
        
        results.forEach(business => {
          if (!seenBusinessIds.has(business.id)) {
            seenBusinessIds.add(business.id);
            allRestaurants.push(business);
          }
        });
        
        if (allRestaurants.length >= 10) break;
      }
    }
    
    let processedRestaurants = allRestaurants
      .map(restaurant => {
        const distance = restaurant.distance / 1609.34;
        return {
          id: restaurant.id,
          name: restaurant.name,
          imageUrl: restaurant.image_url,
          url: restaurant.url,
          rating: restaurant.rating,
          reviewCount: restaurant.review_count,
          price: restaurant.price || '$$',
          address: restaurant.location.display_address.join(', '),
          categories: restaurant.categories.map(c => c.title),
          phone: restaurant.display_phone,
          coordinates: restaurant.coordinates,
          distance: Math.round(distance * 10) / 10,
          matchScore: calculateMatchScore(
            restaurant,
            cuisinePrefs,
            dietaryRestrictions,
            budgetPref,
            distance
          )
        };
      })
      .sort((a, b) => {
        if (Math.abs(a.distance - b.distance) < 2) {
          return b.matchScore - a.matchScore;
        }
        return a.distance - b.distance;
      })
      .slice(0, 10);

    if (processedRestaurants.length === 0) {
      return res.status(404).json({
        message: 'No nearby restaurants found matching your criteria.',
        preferences: {
          cuisines,
          dietaryRestrictions,
          spiceLevel: averageSpiceLevel,
          budget: budgetPref.budget,
          centroidLocation: `${centroid.lat},${centroid.lng}`
        }
      });
    }

    res.json({
      message: 'Recommendations generated successfully',
      recommendations: processedRestaurants,
      preferences: {
        cuisines,
        dietaryRestrictions,
        spiceLevel: averageSpiceLevel,
        budget: budgetPref.budget,
        centroidLocation: `${centroid.lat},${centroid.lng}`
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error generating recommendations', 
      error: error.message 
    });
  }
});

export default router;
