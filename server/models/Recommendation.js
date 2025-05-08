import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: String,
  address: String,
  rating: Number,
  review_count: Number,
  price_val: String,
  distance_km: Number,
  score: Number
});

const recommendationSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    unique: true
  },
  recommendations: [restaurantSchema],
  stats: {
    top_cuisines: [String],
    top_budget: String,
    centroid: [Number]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;