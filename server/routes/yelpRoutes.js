// routes/yelpRoutes.js
import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/authMiddleware.js';
import Preference from '../models/Preference.js';
import Group from '../models/Group.js';

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

// 1) Most common cuisines
function getMostCommonCuisines(preferences) {
  const counts = {};
  preferences.forEach(p => {
    p.cuisineTypes.forEach(c => {
      counts[c] = (counts[c] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([c]) => c);
}

// 2) All dietary restrictions
function getCommonDietaryRestrictions(preferences) {
  const set = new Set();
  preferences.forEach(p => {
    p.dietaryRestrictions.forEach(d => set.add(d));
  });
  return [...set];
}



// 3) Average spice level
function getAverageSpiceLevel(preferences) {
  const sum = preferences.reduce((acc, p) => acc + p.spiceLevel, 0);
  return Math.round(sum / preferences.length);
}

// 4) Most common budget
function getCommonBudget(preferences) {
  const counts = { '$':0, '$$':0, '$$$':0, '$$$$':0 };
  preferences.forEach(p => { counts[p.budget]++; });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)[0][0];
}

// 5) Build Yelp price param
function buildPriceParam(budget) {
  switch (budget) {
    case '$':   return '1';
    case '$$':  return '1,2';
    case '$$$': return '2,3';
    case '$$$$':return '3,4';
    default:    return '1,2,3,4';
  }
}

// 6) Compute match score
function calculateMatchScore(restaurant, cuisines, dietaryRestrictions, budget) {
  let score = 0;
  const aliases = restaurant.categories.map(c => c.alias.toLowerCase());

  // cuisine matches
  cuisines.forEach(c => {
    if (aliases.includes(c.toLowerCase())) score += 3;
  });

  // budget
  if (restaurant.price === budget)          score += 2;
  else if ((restaurant.price === '$'   && budget === '$$') ||
           (restaurant.price === '$$'  && (budget === '$' || budget === '$$$')) ||
           (restaurant.price === '$$$' && (budget === '$$' || budget === '$$$$')) ||
           (restaurant.price === '$$$$'&& budget === '$$$')) {
    score += 1;
  }

  // rating
  score += Math.min(restaurant.rating || 0, 5);

  return Math.min(Math.round((score / 10) * 100), 100);
}

// ─── Route: POST /api/yelp/recommend/:groupId ─────────────────────────────────
router.post('/recommend/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // membership check
    if (!group.members.some(m => m.user.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not in this group.' });
    }

    // collect prefs
    const prefs = await Preference.find({ group: groupId });
    if (!prefs.length) {
      return res.status(400).json({ message: 'No preferences submitted yet.' });
    }

    // aggregate
    const cuisines            = getMostCommonCuisines(prefs);
    const dietaryRestrictions = getCommonDietaryRestrictions(prefs);
    const spiceLevel          = getAverageSpiceLevel(prefs);
    const budget              = getCommonBudget(prefs);

    // user location
    const userPref = await Preference.findOne({
      user: req.user._id,
      group: groupId
    });
    if (!userPref) {
      return res.status(400).json({ message: 'Submit your own preferences first.' });
    }
    const location = userPref.location;

    // Yelp fetch
    const priceParam  = buildPriceParam(budget);
    const categoryParam = cuisines.map(c => c.toLowerCase()).join(',');
    const resp = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
      params: {
        term:     'restaurants',
        location,
        categories: categoryParam,
        price:    priceParam,
        limit:    20,
        sort_by:  'rating',
        open_now: true
      }
    });
    let businesses = resp.data.businesses;

    // strict filter (cuisine + all dietary)
    let filtered = businesses.filter(biz => {
      const aliases = biz.categories.map(c => c.alias.toLowerCase());
      const hasCuisine = cuisines.some(c => aliases.includes(c.toLowerCase()));
      const okDiet     = dietaryRestrictions.every(d => aliases.includes(d.toLowerCase()));
      return hasCuisine && okDiet;
    });

    // fallback to cuisine-only
    if (!filtered.length) {
      filtered = businesses.filter(biz => {
        const aliases = biz.categories.map(c => c.alias.toLowerCase());
        return cuisines.some(c => aliases.includes(c.toLowerCase()));
      });
    }

    // map + score + sort + top 5
    const recommendations = filtered
      .map(biz => ({
        id:         biz.id,
        name:       biz.name,
        imageUrl:   biz.image_url,
        url:        biz.url,
        rating:     biz.rating,
        reviewCount:biz.review_count,
        price:      biz.price,
        address:    biz.location.display_address.join(', '),
        categories: biz.categories.map(c => c.title),
        phone:      biz.display_phone,
        distance:   Math.round(biz.distance / 1609.34 * 10) / 10,
        matchScore: calculateMatchScore(
          biz, cuisines, dietaryRestrictions, budget
        )
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return res.json({
      message:         'Recommendations generated successfully',
      preferences:     { cuisines, dietaryRestrictions, spiceLevel, budget, location },
      recommendations
    });

  } catch (err) {
    console.error('Yelp API error:', err.response?.data || err.message);
    return res.status(500).json({
      message: 'Error generating recommendations',
      error:   err.message
    });
  }
});

export default router;


// import express from 'express';
// import axios from 'axios';
// import { authenticate } from '../middleware/authMiddleware.js';
// import Preference from '../models/Preference.js';
// import Group from '../models/Group.js';

// const router = express.Router();

// // ─── Helpers ────────────────────────────────────────────────────────────────

// function getMostCommonCuisines(prefs) {
//   const counts = {};
//   prefs.forEach(p => (p.cuisineTypes || []).forEach(c => {
//     counts[c] = (counts[c] || 0) + 1;
//   }));
//   return Object.entries(counts)
//     .sort(([,a],[,b]) => b - a)
//     .slice(0,3)
//     .map(([c]) => c);
// }

// function getCommonDietaryRestrictions(prefs) {
//   const set = new Set();
//   prefs.forEach(p => (p.dietaryRestrictions || []).forEach(d => set.add(d)));
//   return [...set];
// }

// function getAverageSpiceLevel(prefs) {
//   const sum = prefs.reduce((acc,p) => acc + (p.spiceLevel || 0), 0);
//   return Math.round(sum / prefs.length);
// }

// function getCommonBudget(prefs) {
//   const counts = {'$':0,'$$':0,'$$$':0,'$$$$':0};
//   prefs.forEach(p => { if (counts[p.budget] != null) counts[p.budget]++; });
//   return Object.entries(counts).sort(([,a],[,b]) => b - a)[0][0];
// }

// function buildPriceParam(budget) {
//   switch(budget){
//     case '$':   return '1';
//     case '$$':  return '1,2';
//     case '$$$': return '2,3';
//     case '$$$$':return '3,4';
//     default:    return '1,2,3,4';
//   }
// }

// function haversine(lat1, lon1, lat2, lon2) {
//   const R = 6371, toRad = d => d * Math.PI/180;
//   const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
//   const a = Math.sin(dLat/2)**2 +
//             Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
// }

// function calculateMatchScore(r, topCuisines, topBudget, centroid) {
//   if (!r.coordinates) return null;
//   const { latitude: lat, longitude: lon } = r.coordinates;
//   const distance_km = haversine(lat, lon, centroid[0], centroid[1]);

//   const aliases = (r.categories || []).map(c => c.alias.toLowerCase());
//   const cuisineMatch = topCuisines
//     .map(c => c.toLowerCase())
//     .reduce((sum,c) => sum + (aliases.includes(c) ? 1 : 0), 0);
//   if (!cuisineMatch) return null;

//   const budgetMatch = r.price === topBudget ? 1 : 0;
//   const rating = r.rating || 0;
//   const reviewsScore = Math.min(r.review_count || 0, 500) / 25;

//   const score = cuisineMatch*30 + budgetMatch*20 + rating*10 + reviewsScore - distance_km*5;

//   return {
//     id: r.id,
//     name: r.name,
//     address: (r.location?.display_address||[]).join(', '),
//     rating,
//     review_count: r.review_count||0,
//     price_val: r.price||'$',
//     distance_km: +distance_km.toFixed(2),
//     score: +score.toFixed(1)
//   };
// }

// // ─── Route: POST /api/yelp/recommend/:groupId ─────────────────────────────────
// router.post('/recommend/:groupId', authenticate, async (req, res) => {
//   try {
//     const { groupId } = req.params;
//     const group = await Group.findById(groupId);
//     if (!group) return res.status(404).json({ message: 'Group not found.' });
//     if (!group.members.some(m => m.user.toString() === req.user._id.toString())) {
//       return res.status(403).json({ message: 'Not in group.' });
//     }

//     const prefs = await Preference.find({ group: groupId });
//     if (!prefs.length) {
//       return res.status(400).json({ message: 'No preferences submitted.' });
//     }

//     const cuisines            = getMostCommonCuisines(prefs);
//     const dietaryRestrictions = getCommonDietaryRestrictions(prefs);
//     const spiceLevel          = getAverageSpiceLevel(prefs);
//     const budget              = getCommonBudget(prefs);

//     // Compute centroid from numeric coords
//     const lats = prefs.map(p => p.locationCoords[0]);
//     const lons = prefs.map(p => p.locationCoords[1]);
//     const centroid = [
//       lats.reduce((a,b) => a + b, 0) / lats.length,
//       lons.reduce((a,b) => a + b, 0) / lons.length
//     ];

//     // Yelp search around centroid
//     const priceParam    = buildPriceParam(budget);
//     const categoryParam = cuisines.map(c => c.toLowerCase()).join(',');
//     const resp = await axios.get('https://api.yelp.com/v3/businesses/search', {
//       headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
//       params: {
//         term:       'restaurants',
//         latitude:   centroid[0],
//         longitude:  centroid[1],
//         categories: categoryParam,
//         price:      priceParam,
//         limit:      20,
//         sort_by:    'rating',
//         open_now:   true
//       }
//     });

//     const businesses = resp.data.businesses || [];

//     // Strict filter (cuisine + dietary)
//     let filtered = businesses.filter(biz => {
//       const aliases = biz.categories.map(c => c.alias.toLowerCase());
//       const hasCuisine = cuisines.some(c => aliases.includes(c.toLowerCase()));
//       const okDiet     = dietaryRestrictions.every(d => aliases.includes(d.toLowerCase()));
//       return hasCuisine && okDiet;
//     });

//     // Fallback to cuisine-only
//     if (!filtered.length) {
//       filtered = businesses.filter(biz => {
//         const aliases = biz.categories.map(c => c.alias.toLowerCase());
//         return cuisines.some(c => aliases.includes(c.toLowerCase()));
//       });
//     }

//     const recommendations = filtered
//       .map(r => calculateMatchScore(r, cuisines, budget, centroid))
//       .filter(x => x)
//       .sort((a,b) => b.score - a.score)
//       .slice(0,5);

//     return res.json({
//       message: 'Recommendations generated successfully',
//       preferences: { cuisines, dietaryRestrictions, spiceLevel, budget, centroid },
//       recommendations
//     });
//   } catch (err) {
//     console.error('Yelp API error:', err.response?.data || err.message);
//     return res.status(500).json({ message: 'Error', error: err.message });
//   }
// });

// export default router;


