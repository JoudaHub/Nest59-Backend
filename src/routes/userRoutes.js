const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/:id — view any user's public profile
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
