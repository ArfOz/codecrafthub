// ============================================================
//  CodeCraftHub API  –  app.js
//  A beginner-friendly Express REST API that stores data in
//  a local JSON file (no database required).
// ============================================================

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

// ── App setup ────────────────────────────────────────────────
const app  = express();
const PORT = 5000;

// middleware: allow any frontend (e.g. Bolt) to call this API
app.use(cors());
// middleware: automatically parse incoming JSON request bodies
app.use(express.json());

// ── File storage path ────────────────────────────────────────
// __dirname is the folder where this file lives
const DATA_FILE = path.join(__dirname, 'courses.json');

// ── Valid status values ───────────────────────────────────────
const VALID_STATUSES = ['Not Started', 'In Progress', 'Completed'];


// ============================================================
//  HELPER FUNCTIONS
//  These 3 functions handle all file I/O so the rest of
//  the code stays clean and readable.
// ============================================================

/**
 * loadCourses()
 * Reads courses.json from disk and returns the array.
 * Creates the file automatically if it doesn't exist yet.
 */
function loadCourses() {
  // If the file doesn't exist, create it with an empty array
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    return [];
  }

  // Read the file and parse its JSON content
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  return raw ? JSON.parse(raw) : [];
}

/**
 * saveCourses(courses)
 * Writes the courses array back to courses.json.
 * null, 2  →  pretty-prints the file so you can read it easily.
 */
function saveCourses(courses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2), 'utf-8');
}

/**
 * getNextId(courses)
 * Generates the next numeric ID.
 * Looks at the highest existing ID and adds 1.
 * Returns 1 when the list is empty.
 */
function getNextId(courses) {
  if (courses.length === 0) return 1;
  return Math.max(...courses.map(c => c.id)) + 1;
}


// ============================================================
//  ROUTES
// ============================================================

// ── POST /api/courses ─────────────────────────────────────────
// Add a brand-new course to the list.
//
// Required body: { name, description, target_date, status }
// Returns:       201 Created  +  the new course object
// ─────────────────────────────────────────────────────────────
app.post('/api/courses', (req, res) => {
  try {
    // Destructure the fields we need from the request body
    const { name, description, target_date, status = 'Not Started' } = req.body;

    // ----- Validation -----
    if (!name || !description || !target_date) {
      return res.status(400).json({
        error: 'name, description, and target_date are all required'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Validate target_date format  YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(target_date)) {
      return res.status(400).json({
        error: 'target_date must be in YYYY-MM-DD format (e.g. 2025-12-31)'
      });
    }

    // ----- Build the new course object -----
    const courses = loadCourses();

    const newCourse = {
      id:          getNextId(courses),        // auto-incremented integer
      name:        name.trim(),
      description: description.trim(),
      target_date,
      status,
      created_at:  new Date().toISOString()   // e.g. "2025-11-04T10:30:00.000Z"
    };

    // Add to the array and save to disk
    courses.push(newCourse);
    saveCourses(courses);

    // Respond with 201 Created and the new course
    res.status(201).json(newCourse);

  } catch (err) {
    res.status(500).json({ error: 'Server error while creating course', details: err.message });
  }
});


// ── GET /api/courses ──────────────────────────────────────────
// Retrieve ALL courses.
// Optional query filter:  ?status=In%20Progress
//
// Returns: 200 OK  +  { count, courses }
// ─────────────────────────────────────────────────────────────
app.get('/api/courses', (req, res) => {
  try {
    let courses = loadCourses();

    // If the caller passed ?status=..., filter the list
    if (req.query.status) {
      if (!VALID_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          error: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      courses = courses.filter(c => c.status === req.query.status);
    }

    res.json({ count: courses.length, courses });

  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching courses', details: err.message });
  }
});


// ── GET /api/courses/stats ────────────────────────────────────
// Returns a count breakdown by status.
// IMPORTANT: this route must be declared BEFORE  /:id
//            otherwise Express would treat "stats" as an id.
//
// Returns: 200 OK  +  { total, not_started, in_progress, completed }
// ─────────────────────────────────────────────────────────────
app.get('/api/courses/stats', (req, res) => {
  try {
    const courses = loadCourses();

    res.json({
      total:       courses.length,
      not_started: courses.filter(c => c.status === 'Not Started').length,
      in_progress: courses.filter(c => c.status === 'In Progress').length,
      completed:   courses.filter(c => c.status === 'Completed').length
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching stats', details: err.message });
  }
});


// ── GET /api/courses/search ───────────────────────────────────
// Search courses by name or description.
// Usage:  GET /api/courses/search?q=python
//
// Returns: 200 OK  +  { count, courses }
// ─────────────────────────────────────────────────────────────
app.get('/api/courses/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();

    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required, e.g. ?q=python' });
    }

    const courses = loadCourses();
    const results = courses.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );

    res.json({ count: results.length, courses: results });

  } catch (err) {
    res.status(500).json({ error: 'Server error while searching courses', details: err.message });
  }
});


// ── GET /api/courses/:id ──────────────────────────────────────
// Get one specific course by its numeric ID.
//
// Returns: 200 OK  +  course object
//          404 Not Found  if the id doesn't exist
// ─────────────────────────────────────────────────────────────
app.get('/api/courses/:id', (req, res) => {
  try {
    // Convert the URL string parameter to an integer
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID must be a number' });
    }

    const courses = loadCourses();
    const course  = courses.find(c => c.id === id);

    if (!course) {
      return res.status(404).json({ error: `Course with id ${id} not found` });
    }

    res.json(course);

  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching course', details: err.message });
  }
});


// ── PUT /api/courses/:id ──────────────────────────────────────
// Update an existing course.
// Only fields included in the body will be changed
// (unincluded fields keep their current value).
//
// Returns: 200 OK  +  updated course object
//          404 Not Found  if the id doesn't exist
// ─────────────────────────────────────────────────────────────
app.put('/api/courses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID must be a number' });
    }

    const { name, description, target_date, status } = req.body;

    // Validate status only when it's being updated
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Validate target_date format when provided
    if (target_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(target_date)) {
        return res.status(400).json({
          error: 'target_date must be in YYYY-MM-DD format (e.g. 2025-12-31)'
        });
      }
    }

    const courses = loadCourses();
    const index   = courses.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: `Course with id ${id} not found` });
    }

    // ?? (nullish coalescing) keeps the old value when the new one is undefined/null
    courses[index] = {
      ...courses[index],                         // keep id, created_at
      name:        name        ?? courses[index].name,
      description: description ?? courses[index].description,
      target_date: target_date ?? courses[index].target_date,
      status:      status      ?? courses[index].status
    };

    saveCourses(courses);
    res.json(courses[index]);

  } catch (err) {
    res.status(500).json({ error: 'Server error while updating course', details: err.message });
  }
});


// ── DELETE /api/courses/:id ───────────────────────────────────
// Permanently remove a course from the list.
//
// Returns: 200 OK  +  { message, course }   (the deleted course)
//          404 Not Found  if the id doesn't exist
// ─────────────────────────────────────────────────────────────
app.delete('/api/courses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID must be a number' });
    }

    const courses = loadCourses();
    const index   = courses.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: `Course with id ${id} not found` });
    }

    // splice removes 1 element at `index` and returns it in an array
    const [deleted] = courses.splice(index, 1);
    saveCourses(courses);

    res.json({ message: 'Course deleted successfully', course: deleted });

  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting course', details: err.message });
  }
});


// ── Health check ──────────────────────────────────────────────
// Quick test that the server is alive.
app.get('/', (req, res) => {
  res.json({
    message: 'CodeCraftHub API is running!',
    version: '1.0.0',
    endpoints: {
      'GET    /api/courses':            'List all courses (optional ?status= filter)',
      'GET    /api/courses/stats':      'Count courses by status',
      'GET    /api/courses/search?q=':  'Search by name or description',
      'GET    /api/courses/:id':        'Get one course',
      'POST   /api/courses':            'Create a course',
      'PUT    /api/courses/:id':        'Update a course',
      'DELETE /api/courses/:id':        'Delete a course'
    }
  });
});


// ── 404 catch-all ─────────────────────────────────────────────
// If no route matched, return a helpful error instead of a blank response
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});


// ============================================================
//  START THE SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('  CodeCraftHub API is running!');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Health:  http://localhost:${PORT}/`);
  console.log(`  Courses: http://localhost:${PORT}/api/courses`);
  console.log('');
});
