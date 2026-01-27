# Pastebin Lite

Simple Pastebin-like application.

## How to run locally

Backend:

cd backend  
npm install  
npm start  

Frontend (in another terminal):

cd frontend  
npm install  
npm run dev  

Open browser at http://localhost:5173

## Persistence

Uses SQLite database stored at backend/pastebin.db.  
Database auto-creates on first run.  
Data persists across requests.

## Design notes

- Express backend implements required API routes.
- SQLite chosen for zero-config persistence.
- TTL and view limits enforced on read.
- Supports deterministic expiry testing using TEST_MODE and x-test-now-ms header.
- Paste content safely escaped in HTML view.
