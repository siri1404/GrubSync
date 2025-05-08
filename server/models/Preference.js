import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  cuisineTypes: [{
    type: String
  }],
  dietaryRestrictions: [{
    type: String
  }],
  spiceLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  budget: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  location: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on every save
preferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index to ensure each user can only have one preference per group
preferenceSchema.index({ user: 1, group: 1 }, { unique: true });

const Preference = mongoose.model('Preference', preferenceSchema);

export default Preference;