const Profile = require('../models/Profile');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    
    // Auto-create blank profile if somehow missing
    if (!profile) {
      profile = await Profile.create({
        user: req.user._id,
        personal: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
          location: '',
          linkedin: '',
          github: '',
          portfolio: '',
          photo: ''
        },
        education: [],
        skills: {
          technical: [],
          programmingLanguages: [],
          frameworks: [],
          databases: [],
          tools: []
        },
        experience: [],
        projects: [],
        certifications: [],
        achievements: []
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Merge request body keys into profile
    const fieldsToUpdate = [
      'personal',
      'education',
      'skills',
      'experience',
      'projects',
      'certifications',
      'achievements'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    const updatedProfile = await profile.save();
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
