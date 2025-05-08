import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/authMiddleware.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Preference from '../models/Preference.js';
import crypto from 'crypto'; // Add this at the top of the file if not already present

const router = express.Router();

// Get all groups for current user
router.get('/my', authenticate, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id
    }).select('name inviteCode createdAt');

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new group
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    // const newGroup = new Group({
    //   name,
    //   creator: req.user._id,
    //   members: [{ user: req.user._id, hasSubmittedPreferences: false }]
    // });

    

const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

const newGroup = new Group({
  name,
  creator: req.user._id,
  inviteCode,  // 👈 add this manually
  members: [{ user: req.user._id, hasSubmittedPreferences: false }]
});

await newGroup.save();


    await newGroup.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { groups: newGroup._id } }
    );

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: newGroup._id,
        name: newGroup.name,
        inviteCode: newGroup.inviteCode
      }
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a group with invite code
router.post('/join', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required.' });
    }

    // Find group by invite code
    const group = await Group.findOne({ inviteCode });
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found. Invalid invite code.' });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    // Add user to group members
    await Group.findByIdAndUpdate(
      group._id,
      { $push: { members: { user: req.user._id, hasSubmittedPreferences: false } } }
    );

    // Add group to user's groups
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { groups: group._id } }
    );

    res.json({
      message: 'Successfully joined group',
      group: {
        id: group._id,
        name: group.name,
        inviteCode: group.inviteCode
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get group details by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID.' });
    }

    const group = await Group.findById(id)
      .populate('members.user', 'name email');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get group details by invite code
router.get('/code/:inviteCode', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    
    const group = await Group.findOne({ inviteCode })
      .populate('members.user', 'name email');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save user preferences for a group
router.post('/:groupId/preferences', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { 
      cuisineTypes, 
      dietaryRestrictions, 
      spiceLevel, 
      budget, 
      location,
      dateTime
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID.' });
    }

    // Validate required fields
    if (!location || !dateTime) {
      return res.status(400).json({ 
        message: 'Location and dateTime are required fields.' 
      });
    }

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    // Create or update preferences
    const existingPreference = await Preference.findOne({
      user: req.user._id,
      group: groupId
    });

    if (existingPreference) {
      // Update existing preference
      existingPreference.cuisineTypes = cuisineTypes || [];
      existingPreference.dietaryRestrictions = dietaryRestrictions || [];
      existingPreference.spiceLevel = spiceLevel || 3;
      existingPreference.budget = budget || '$$';
      existingPreference.location = location;
      existingPreference.dateTime = new Date(dateTime);
      
      await existingPreference.save();

      // Update group member status if not already set
      await Group.updateOne(
        { 
          _id: groupId, 
          'members.user': req.user._id,
          'members.hasSubmittedPreferences': false
        },
        { $set: { 'members.$.hasSubmittedPreferences': true } }
      );

      res.json({ 
        message: 'Preferences updated successfully',
        preference: existingPreference
      });
    } else {
      // Create new preference
      const newPreference = new Preference({
        user: req.user._id,
        group: groupId,
        cuisineTypes: cuisineTypes || [],
        dietaryRestrictions: dietaryRestrictions || [],
        spiceLevel: spiceLevel || 3,
        budget: budget || '$$',
        location,
        dateTime: new Date(dateTime)
      });

      await newPreference.save();

      // Update group member status
      await Group.updateOne(
        { _id: groupId, 'members.user': req.user._id },
        { $set: { 'members.$.hasSubmittedPreferences': true } }
      );

      res.status(201).json({ 
        message: 'Preferences saved successfully',
        preference: newPreference
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get preferences for current user in a group
router.get('/:groupId/preferences', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID.' });
    }

    const preference = await Preference.findOne({
      user: req.user._id,
      group: groupId
    });

    if (!preference) {
      return res.status(404).json({ message: 'Preferences not found for this group.' });
    }

    res.json({ preference });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all members of a group with their preference status
router.get('/:groupId/members', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID.' });
    }

    const group = await Group.findById(groupId)
      .populate('members.user', 'name email');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const members = group.members.map(member => ({
      id: member.user._id,
      name: member.user.name,
      email: member.user.email,
      hasSubmittedPreferences: member.hasSubmittedPreferences
    }));

    res.json({ members });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;