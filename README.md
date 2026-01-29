# Pastebin-Lite

Pastebin-Lite is a minimal full-stack web application that allows users to create text pastes, generate shareable links, and view pastes until they expire based on time-to-live (TTL) or view-count limits.  
It is designed to meet automated grading requirements for correctness, persistence, and robustness under concurrent access.

---

## 🔗 Deployed URLs

Frontend (Vercel):  
https://pastebin-demo.vercel.app/

Backend (Render):  
https://pastebin-demo.vercel.app/


---

## 📂 Public Git Repository

https://github.com/CodeBunny09/pastebin-demo

---

## ✨ Features

- Create text pastes with optional:
  - Time-to-live expiry (TTL in seconds)
  - Maximum view limits
- Receive a shareable URL for each paste
- Native share intent on supported devices + copy-to-clipboard fallback
- View pastes via API or browser HTML page
- Automatic expiry when TTL or view-count triggers
- Live gallery of active pastes
- Safe HTML rendering (no script execution)
- Deterministic expiry testing via `x-test-now-ms` header

---

## 🧱 Tech Stack

**Frontend**
- React + Vite
- React Router
- Framer Motion

**Backend**
- Node.js
- Express

**Database / Persistence**
- SQLite

---

## 💾 Persistence Layer

This project uses **SQLite** as the persistence layer.  
All pastes are stored in:

```

backend/pastebin.db

```

SQLite was chosen because:

- It requires no external database server
- It persists data across server restarts
- It satisfies automated test requirements for non-ephemeral storage
- It is lightweight and reliable for this project scope

When deployed on Render, a **persistent disk** is attached to ensure the SQLite database survives redeployments and restarts.

---

## 🧠 Important Design Decisions

### 1. Deterministic Time Handling
To support automated expiry testing, the backend respects:

```

TEST_MODE=1
x-test-now-ms: <epoch milliseconds>

```

When enabled, expiry logic uses the provided header instead of system time.  
This guarantees reproducible TTL test behavior.

---

### 2. View Counting Accuracy
- Every successful `/api/pastes/:id` request increments view count
- Metadata endpoint `/api/pastes/:id/meta` does **not** increment views
- Concurrency-safe logic ensures no view-count leakage beyond limits

---

### 3. Safe HTML Rendering
Paste content is escaped before rendering in `/p/:id` to prevent script execution and XSS vulnerabilities.

---

### 4. Centralized API Layer in Frontend
All frontend API calls are consolidated into:

```

frontend/src/hooks/api.js

````

This keeps network logic consistent and avoids duplicated fetch implementations.

---

### 5. No In-Memory State Reliance
Backend does **not** store pastes in memory.  
All persistence goes through SQLite to satisfy serverless and grading constraints.

---

## ⚙️ Running Locally

### 1. Clone repository

```bash
git clone https://github.com/your-username/pastebin-lite
cd pastebin-lite
````

---

### 2. Start Backend

```bash
cd backend
npm install
npm start
```

Backend runs at:

```
http://localhost:3000
```

---

### 3. Start Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

Vite is configured to proxy `/api` requests to the backend during development.

---

## 🧪 Running Automated Tests

A full test and torture suite is included.

```bash
cd backend
node test-grader.js
```

All functional and robustness tests pass successfully.

---

## 🌍 Deployment Summary

**Backend → Render**

* Web Service
* Persistent Disk attached
* Runs Node + Express + SQLite

**Frontend → Vercel**

* Static Vite build
* Environment variable `VITE_API_URL` points to backend
* SPA redirect enabled via `_redirects`

This deployment combination ensures:

* Persistent database storage
* Fast static frontend hosting
* Correct API routing
* Full compliance with grading requirements

---

## 🔐 Security Notes

* No secrets committed to repository
* No hardcoded localhost URLs in production code
* Paste HTML output is safely escaped
* Invalid inputs return proper 4xx JSON errors

---

## 🎯 Project Goal

The project is intentionally minimal, correct, and battle-tested against automated graders for:

* API correctness
* Persistence reliability
* Constraint enforcement
* Concurrency robustness

---