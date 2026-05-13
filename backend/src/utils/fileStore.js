const fs = require('fs');
const path = require('path');

// Path to our JSON "database" file
const DATA_FILE = path.join(__dirname, '../data/courses.json');

// Load all courses from the JSON file.
// Returns an empty array if the file is missing or empty.
function loadCourses() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  return raw ? JSON.parse(raw) : [];
}

// Write the full courses array back to the JSON file.
// null, 2 keeps the file human-readable (pretty-printed).
function saveCourses(courses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2), 'utf-8');
}

// Generate the next numeric ID (max existing id + 1, or 1 if empty).
function getNextId(courses) {
  if (courses.length === 0) return 1;
  return Math.max(...courses.map(c => c.id)) + 1;
}

module.exports = { loadCourses, saveCourses, getNextId };
