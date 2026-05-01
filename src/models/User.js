const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'First name is required'],
      trim:     true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    lastname: {
      type:     String,
      required: [true, 'Last name is required'],
      trim:     true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // never returned in queries by default
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ── Hash password before saving ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was actually modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ── Instance method: compare plain-text password against hash ───────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: safe public representation (no password) ───────────────
userSchema.methods.toPublicJSON = function () {
  return {
    id:        this._id,
    name:      this.name,
    lastname:  this.lastname,
    email:     this.email,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
