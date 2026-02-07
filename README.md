# Lost & Found Web Application

This repository contains the initial scaffold for a full-stack Lost & Found web application. The project is split into backend and frontend directories so each side can evolve independently.

## Folder Structure

- `backend/` - Node.js + Express API server
  - `server.js` - backend entry point (runs on port 5000)
  - `app.js` - Express app setup and routes
  - `routes/`, `controllers/`, `models/`, `middleware/`, `config/` - backend module directories
- `frontend/` - frontend scaffold

## Run the Backend

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Verify health endpoint:
   ```bash
   curl http://localhost:5000/health
   ```
