# CodeShare — Authentication Backend

Secure Node.js + Express + MongoDB authentication system.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET

# 3. Run in development
npm run dev

# 4. Run in production
npm start
```

---

## Project Structure

```
src/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # register / login / getMe logic
├── middleware/
│   ├── auth.js               # JWT protect middleware
│   └── validate.js           # express-validator rules
├── models/
│   └── User.js               # Mongoose schema + bcrypt hooks
├── routes/
│   ├── authRoutes.js         # /api/auth/*
│   └── userRoutes.js         # /api/users/*
├── app.js                    # Express app (no listen)
└── index.js                  # Entry point (DB + server)
```

---

## API Reference

### Health

| Method | Endpoint       | Auth | Description      |
|--------|----------------|------|------------------|
| GET    | /api/health    | —    | Server heartbeat |

---

### Auth

#### POST `/api/auth/register`

**Body**
```json
{
  "name":     "Ayoub",
  "lastname": "Khalil",
  "email":    "ayoub@example.com",
  "password": "Secret123"
}
```

**Success `201`**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id":        "664abc...",
    "name":      "Ayoub",
    "lastname":  "Khalil",
    "email":     "ayoub@example.com",
    "createdAt": "2025-04-01T..."
  }
}
```

**Errors**
| Status | Reason                        |
|--------|-------------------------------|
| 409    | Email already registered      |
| 422    | Validation failed             |
| 500    | Server error                  |

---

#### POST `/api/auth/login`

**Body**
```json
{
  "email":    "ayoub@example.com",
  "password": "Secret123"
}
```

**Success `200`**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { ... }
}
```

**Errors**
| Status | Reason                        |
|--------|-------------------------------|
| 401    | Invalid email or password     |
| 422    | Validation failed             |

---

#### GET `/api/auth/me`  🔒

Returns the currently authenticated user.

**Headers**
```
Authorization: Bearer <jwt>
```

**Success `200`**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### Users

#### GET `/api/users/:id`  🔒

Returns a user's public profile.

**Success `200`**
```json
{
  "success": true,
  "user": {
    "id":        "664abc...",
    "name":      "Sara",
    "lastname":  "L.",
    "email":     "sara@example.com",
    "createdAt": "2025-04-01T..."
  }
}
```

---

## Security Notes

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT signed with `HS256`, expires in 7 days by default
- `password` field has `select: false` — never returned in queries
- Generic error message on login to prevent email enumeration
- Request body limited to **10 kb** to prevent payload attacks
- Duplicate email check before DB write + MongoDB unique index as safety net

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number

---

## Frontend Integration

```js
// Register
const res = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, lastname, email, password }),
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// Authenticated request
const profile = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
```
