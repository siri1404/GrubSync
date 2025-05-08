// controllers/preferenceController.js
import axios from 'axios';
import Preference from './Preference.js';

// POST /api/groups/:groupId/preferences
export async function createPreference(req, res) {
  try {
    const {
      cuisineTypes = [],
      dietaryRestrictions = [],
      spiceLevel,
      budget,
      locationString    // human‑readable address
    } = req.body;

    // 1) Geocode address → { lat, lng }
    const geoRes = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: locationString,
          key:     process.env.GOOGLE_MAPS_API_KEY
        }
      }
    );
    if (!geoRes.data.results.length) {
      return res.status(400).json({ message: 'Invalid address.' });
    }
    const { lat, lng } = geoRes.data.results[0].geometry.location;

    // 2) Upsert preference (unique per user+group)
    const pref = await Preference.findOneAndUpdate(
      { user: req.user._id, group: req.params.groupId },
      {
        cuisineTypes,
        dietaryRestrictions,
        spiceLevel,
        budget,
        locationString,
        locationCoords: [lat, lng],
        dateTime:       new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json(pref);
  } catch (err) {
    console.error('Error creating preference:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
