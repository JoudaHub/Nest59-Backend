const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: sign JWT ────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Helper: send token response ─────────────────────────────────────────────
const sendTokenResponse = (res, statusCode, user) => {
  const token = signToken(user._id);

  return res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, lastname, email, password } = req.body;

    // Check for duplicate email before hitting the DB unique index
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user — password hashed automatically via pre-save hook
    const user = await User.create({ name, lastname, email, password });

    sendTokenResponse(res, 201, user);
  } catch (err) {
    // MongoDB duplicate key fallback (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    console.error('[register]', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (field has select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    // Use a generic message to prevent email enumeration attacks
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(res, 200, user);
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toPublicJSON(),
  });
};

module.exports = { register, login, getMe };
