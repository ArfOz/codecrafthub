const express = require('express');
const router = express.Router();
const {
  getStats,
  searchCourses,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateStatus,
  deleteCourse
} = require('../controllers/courseController');

// ── Bonus endpoints MUST come before /:id so Express doesn't treat
//    "stats" or "search" as a dynamic :id parameter ──────────────
router.get('/stats',         getStats);
router.get('/search',        searchCourses);

// List all / create new
router.get('/',              getAllCourses);
router.post('/',             createCourse);

// Single course operations
router.get('/:id',           getCourseById);
router.put('/:id',           updateCourse);
router.delete('/:id',        deleteCourse);

// Status-only shortcut (useful for a Kanban-style UI)
router.patch('/:id/status',  updateStatus);

module.exports = router;
