const { loadCourses, saveCourses, getNextId } = require('../utils/fileStore');

const VALID_STATUSES = ['Not Started', 'In Progress', 'Completed'];

// Shared helper: format a Date to "YYYY-MM-DD HH:MM:SS" (matches spec)
function nowString() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ──────────────────────────────────────────────
// GET /api/courses/stats
// ──────────────────────────────────────────────
function getStats(req, res) {
  const courses = loadCourses();
  const stats = {
    total: courses.length,
    not_started: courses.filter(c => c.status === 'Not Started').length,
    in_progress:  courses.filter(c => c.status === 'In Progress').length,
    completed:    courses.filter(c => c.status === 'Completed').length
  };
  res.json(stats);
}

// ──────────────────────────────────────────────
// GET /api/courses/search?q=term
// ──────────────────────────────────────────────
function searchCourses(req, res) {
  const q = (req.query.q || '').trim().toLowerCase();

  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const courses = loadCourses();
  const results = courses.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );

  res.json({ count: results.length, courses: results });
}

// ──────────────────────────────────────────────
// GET /api/courses
// Optional query param: ?status=In%20Progress
// ──────────────────────────────────────────────
function getAllCourses(req, res) {
  let courses = loadCourses();

  if (req.query.status) {
    if (!VALID_STATUSES.includes(req.query.status)) {
      return res.status(400).json({
        error: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }
    courses = courses.filter(c => c.status === req.query.status);
  }

  res.json({ count: courses.length, courses });
}

// ──────────────────────────────────────────────
// GET /api/courses/:id
// ──────────────────────────────────────────────
function getCourseById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number' });
  }

  const courses = loadCourses();
  const course = courses.find(c => c.id === id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json(course);
}

// ──────────────────────────────────────────────
// POST /api/courses
// Body: { name, description, target_date, status? }
// ──────────────────────────────────────────────
function createCourse(req, res) {
  const { name, description, target_date, status = 'Not Started' } = req.body;

  if (!name || !description || !target_date) {
    return res.status(400).json({
      error: 'name, description, and target_date are required'
    });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  const courses = loadCourses();

  const newCourse = {
    id: getNextId(courses),
    name: name.trim(),
    description: description.trim(),
    target_date,
    status,
    created_at: nowString()
  };

  courses.push(newCourse);
  saveCourses(courses);

  res.status(201).json(newCourse);
}

// ──────────────────────────────────────────────
// PUT /api/courses/:id   (full update)
// Body: { name?, description?, target_date?, status? }
// ──────────────────────────────────────────────
function updateCourse(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number' });
  }

  const { name, description, target_date, status } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  const courses = loadCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Merge: only overwrite fields that were actually sent
  courses[index] = {
    ...courses[index],
    name:        name        ?? courses[index].name,
    description: description ?? courses[index].description,
    target_date: target_date ?? courses[index].target_date,
    status:      status      ?? courses[index].status
  };

  saveCourses(courses);
  res.json(courses[index]);
}

// ──────────────────────────────────────────────
// PATCH /api/courses/:id/status
// Body: { status }
// ──────────────────────────────────────────────
function updateStatus(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number' });
  }

  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  const courses = loadCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  courses[index].status = status;

  saveCourses(courses);
  res.json(courses[index]);
}

// ──────────────────────────────────────────────
// DELETE /api/courses/:id
// ──────────────────────────────────────────────
function deleteCourse(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number' });
  }

  const courses = loadCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const [removed] = courses.splice(index, 1);
  saveCourses(courses);

  res.json({ message: 'Course deleted successfully', course: removed });
}

module.exports = {
  getStats,
  searchCourses,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateStatus,
  deleteCourse
};
