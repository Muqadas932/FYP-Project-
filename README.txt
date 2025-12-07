
Job Portal With AI Recommendation - Backend
==========================================

1. Prerequisites
----------------
- Node.js (v18+ recommended)
- MongoDB running locally (or MongoDB Atlas connection string)

2. Installation
---------------
cd backend
npm install

3. Configuration
----------------
- Copy .env.example to .env

On Windows (PowerShell):
  copy .env.example .env

On Linux / macOS:
  cp .env.example .env

- Edit .env and set:
  MONGODB_URI = your MongoDB connection string
  JWT_SECRET  = any strong secret string

4. Run the server
-----------------
# Development (auto-restart)
cd backend
npm run dev

# Production
npm start

Server will run on http://localhost:5000 by default.

5. API Overview
---------------
- POST /api/auth/register  : Register new user
- POST /api/auth/login     : Login, returns JWT token
- GET  /api/jobs           : List jobs
- POST /api/jobs           : Create job (admin only, Bearer token)
- POST /api/jobs/:id/apply : Apply to a job (jobseeker, Bearer token)
- GET  /api/recommend      : AI recommendations for logged-in user

The recommendation engine is implemented in utils/recommender.js using
a simple content-based similarity (cosine similarity on text features).
