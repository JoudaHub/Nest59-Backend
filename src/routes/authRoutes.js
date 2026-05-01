const express = require('express');
const router  = express.Router();

const { register, login, getMe }         = require('../controllers/authController');
const { validate, registerRules, loginRules } = require('../middleware/validate');
const { protect }                         = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/auth/login
router.post('/login', loginRules, validate, login);

// GET  /api/auth/me  — requires valid JWT
router.get('/me', protect, getMe);

module.exports = router;
