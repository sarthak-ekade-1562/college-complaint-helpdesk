/* ==========================================================================
   auth.js
   Registration, login, session handling and logout for students & admin.
   ========================================================================== */

/* ---------- Student registration ---------- */
function registerStudent(data) {
  const students = readList(LS_KEYS.STUDENTS);

  const emailExists = students.some(s => s.email.toLowerCase() === data.email.toLowerCase());
  if (emailExists) {
    return { ok: false, message: "An account with this email already exists." };
  }
  const rollExists = students.some(s => s.rollNumber.toLowerCase() === data.rollNumber.toLowerCase());
  if (rollExists) {
    return { ok: false, message: "An account with this roll number already exists." };
  }

  const newStudent = {
    id: "STU-" + Date.now(),
    fullName: data.fullName.trim(),
    rollNumber: data.rollNumber.trim(),
    email: data.email.trim(),
    department: data.department,
    year: data.year,
    password: data.password,
    createdAt: new Date().toISOString()
  };

  students.push(newStudent);
  writeList(LS_KEYS.STUDENTS, students);
  return { ok: true, student: newStudent };
}

/* ---------- Student login ---------- */
function loginStudent(identifier, password) {
  const students = readList(LS_KEYS.STUDENTS);
  const idLower = identifier.trim().toLowerCase();

  const match = students.find(s =>
    (s.email.toLowerCase() === idLower || s.rollNumber.toLowerCase() === idLower) &&
    s.password === password
  );

  if (!match) {
    return { ok: false, message: "Invalid credentials. Please check your email/roll number and password." };
  }

  localStorage.setItem(LS_KEYS.CURRENT_STUDENT, JSON.stringify(match));
  return { ok: true, student: match };
}

function getCurrentStudent() {
  return readObj(LS_KEYS.CURRENT_STUDENT);
}

function requireStudentAuth() {
  const student = getCurrentStudent();
  if (!student) {
    window.location.href = "student-login.html";
    return null;
  }
  return student;
}

/* ---------- Admin login ---------- */
function loginAdmin(username, password) {
  if (username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const session = { username: username.trim(), loginAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.ADMIN_SESSION, JSON.stringify(session));
    return { ok: true };
  }
  return { ok: false, message: "Invalid admin username or password." };
}

function getAdminSession() {
  return readObj(LS_KEYS.ADMIN_SESSION);
}

function requireAdminAuth() {
  const session = getAdminSession();
  if (!session) {
    window.location.href = "admin-login.html";
    return null;
  }
  return session;
}

/* ---------- Logout ---------- */
function logoutStudent() {
  localStorage.removeItem(LS_KEYS.CURRENT_STUDENT);
  window.location.href = "student-login.html";
}

function logoutAdmin() {
  localStorage.removeItem(LS_KEYS.ADMIN_SESSION);
  window.location.href = "admin-login.html";
}

/* ---------- Helpers for initials/avatar ---------- */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
