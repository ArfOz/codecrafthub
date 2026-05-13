# CodeCraftHub API

A personal learning goal tracker REST API built with Node.js and Express.
Course data is stored in a plain JSON file — no database setup required.

---

## Features

- Add, view, update, and delete learning courses
- Filter courses by status (`Not Started`, `In Progress`, `Completed`)
- Search courses by name or description
- View a statistics summary (total / per-status counts)
- Auto-generates `courses.json` on first run — nothing to configure
- CORS enabled so any frontend (e.g. a Bolt app) can connect directly

---

## Project Structure

```
backend/
├── app.js              ← single-file Express app (start here)
├── package.json
├── courses.json        ← created automatically on first run
└── src/                ← modular version (split into routes/controllers)
    ├── controllers/
    │   └── courseController.js
    ├── routes/
    │   └── courses.js
    ├── utils/
    │   └── fileStore.js
    └── data/
        └── courses.json
```

> **Beginner tip:** `app.js` is the self-contained all-in-one version.
> The `src/` folder is a refactored version split into separate files
> for when the project grows larger.

---

## Installation

**Prerequisites:** Node.js 16 or higher — download from [nodejs.org](https://nodejs.org)

```bash
# 1. Clone or download the project
cd backend

# 2. Install dependencies
npm install
```

That's it. No database, no environment variables needed.

---

## Running the Application

```bash
# Production mode
npm start

# Development mode (auto-restarts when you save a file)
npm run dev
```

The server starts on **http://localhost:5000**

You should see:

```
  CodeCraftHub API is running!
  Local:   http://localhost:5000
  Health:  http://localhost:5000/
  Courses: http://localhost:5000/api/courses
```

Open http://localhost:5000 in your browser to see the list of all available endpoints.

---

## API Endpoints

### Base URL
```
http://localhost:5000
```

### Course Object Shape
```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started",
  "created_at": "2025-11-04T10:30:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | number | Auto-generated, starts at 1 |
| `name` | string | Required |
| `description` | string | Required |
| `target_date` | string | Required — format `YYYY-MM-DD` |
| `status` | string | Required — `Not Started` / `In Progress` / `Completed` |
| `created_at` | string | Auto-generated ISO timestamp |

---

### POST `/api/courses` — Add a course

**Request body:**
```json
{
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started"
}
```

> `status` defaults to `"Not Started"` if omitted.

**Success — 201 Created:**
```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started",
  "created_at": "2025-11-04T10:30:00.000Z"
}
```

**curl example:**
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Python Basics","description":"Learn Python fundamentals","target_date":"2025-12-31"}'
```

---

### GET `/api/courses` — Get all courses

Returns every course. Optionally filter by status.

```
GET /api/courses
GET /api/courses?status=In Progress
GET /api/courses?status=Completed
```

**Success — 200 OK:**
```json
{
  "count": 2,
  "courses": [ { ... }, { ... } ]
}
```

**curl example:**
```bash
curl http://localhost:5000/api/courses
curl "http://localhost:5000/api/courses?status=In%20Progress"
```

---

### GET `/api/courses/stats` — Get statistics

Returns a count of courses grouped by status.

**Success — 200 OK:**
```json
{
  "total": 5,
  "not_started": 2,
  "in_progress": 2,
  "completed": 1
}
```

**curl example:**
```bash
curl http://localhost:5000/api/courses/stats
```

---

### GET `/api/courses/search?q=term` — Search courses

Searches `name` and `description` fields (case-insensitive).

```
GET /api/courses/search?q=python
```

**Success — 200 OK:**
```json
{
  "count": 1,
  "courses": [ { ... } ]
}
```

**curl example:**
```bash
curl "http://localhost:5000/api/courses/search?q=python"
```

---

### GET `/api/courses/:id` — Get one course

```
GET /api/courses/1
```

**Success — 200 OK:** returns the course object.

**Not found — 404:**
```json
{ "error": "Course with id 99 not found" }
```

**curl example:**
```bash
curl http://localhost:5000/api/courses/1
```

---

### PUT `/api/courses/:id` — Update a course

Send only the fields you want to change. Omitted fields keep their current value.

**Request body (all fields optional):**
```json
{
  "status": "In Progress",
  "target_date": "2026-03-01"
}
```

**Success — 200 OK:** returns the updated course object.

**curl example:**
```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'
```

---

### DELETE `/api/courses/:id` — Delete a course

```
DELETE /api/courses/1
```

**Success — 200 OK:**
```json
{
  "message": "Course deleted successfully",
  "course": { ... }
}
```

**curl example:**
```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

---

## Error Responses

All errors follow the same shape:

```json
{ "error": "Human-readable description of the problem" }
```

| HTTP Status | Meaning |
|---|---|
| `400 Bad Request` | Missing required fields, invalid status, or bad date format |
| `404 Not Found` | No course exists with the given id |
| `500 Internal Server Error` | Unexpected file read/write failure |

---

## Troubleshooting

**`Cannot find module 'express'`**
```bash
# You haven't installed dependencies yet
npm install
```

---

**`EADDRINUSE: address already in use :::5000`**

Port 5000 is occupied by another process.

```bash
# Windows — find and kill the process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change the port in app.js
const PORT = 5001;   # pick any free port
```

---

**`courses.json` contains corrupted data**

Delete the file. It will be recreated empty on the next request.

```bash
del courses.json        # Windows
rm  courses.json        # Mac / Linux
```

---

**Frontend gets a CORS error**

CORS is enabled for all origins by default (`cors()` middleware in `app.js`).
If you still see a CORS error, make sure you're calling `http://localhost:5000`
and not `https://` (the local server doesn't use SSL).

---

**Changes to `app.js` don't take effect**

If you started with `npm start` (plain node), you need to restart the server manually.
Use `npm run dev` instead — nodemon watches for file changes and restarts automatically.
