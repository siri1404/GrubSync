import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hasSubmittedPreferences: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique invite code before saving a new group
// groupSchema.pre('save', function(next) {
//   if (this.isNew && !this.inviteCode) {
//     // Generate a random 6-character alphanumeric code
//     this.inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
//   }
//   next();
// });
groupSchema.pre('save', function(next) {
  if (this.isNew && !this.inviteCode) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    console.log("Generated inviteCode:", code);
    this.inviteCode = code;
  } else {
    console.log("Invite code already set or not new.");
  }
  next();
});


const Group = mongoose.model('Group', groupSchema);

export default Group;