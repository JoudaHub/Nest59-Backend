const User = require('../models/User')

// GET /api/users/:id — public profile
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
    res.json({ success: true, user: user.toPublicJSON() })
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' })
    }
    console.error('[getUser]', err)
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getUser }
