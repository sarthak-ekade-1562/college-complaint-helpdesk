/* ==========================================================================
   common.js
   Shared LocalStorage helpers, seed data, UI utilities (toast, modal, nav)
   used across every page of the Student Complaint Management System.
   ========================================================================== */

/* ---------- LocalStorage keys ---------- */
const LS_KEYS = {
  STUDENTS: "students",
  COMPLAINTS: "complaints",
  CURRENT_STUDENT: "currentStudent",
  ADMIN_SESSION: "adminSession",
  COUNTER: "complaintCounter"
};

const CATEGORIES = [
  "IT / Wi-Fi",
  "Classroom",
  "Infrastructure",
  "Cleanliness",
  "Electricity",
  "Library",
  "Laboratory",
  "Transport",
  "Canteen",
  "Other"
];

const STATUS_FLOW = ["Pending", "In Progress", "Resolved"];
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

/* ---------- Generic storage helpers ---------- */
function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read " + key, e);
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function readObj(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/* ---------- Seed demo data on first load ---------- */
function ensureSeedData() {
  if (localStorage.getItem(LS_KEYS.STUDENTS) === null) {
    const demoStudents = [
      {
        id: "STU-1001",
        fullName: "Aarav Sharma",
        rollNumber: "IT2301",
        email: "aarav.sharma@college.edu",
        department: "Information Technology",
        year: "FY",
        password: "demo1234",
        createdAt: new Date().toISOString()
      }
    ];
    writeList(LS_KEYS.STUDENTS, demoStudents);
  }

  if (localStorage.getItem(LS_KEYS.COMPLAINTS) === null) {
    const now = Date.now();
    const demoComplaints = [
      {
        complaintId: "CMP-2026-0001",
        studentId: "STU-1001",
        studentName: "Aarav Sharma",
        rollNumber: "IT2301",
        title: "Wi-Fi not working in Room 204",
        category: "IT / Wi-Fi",
        description: "The Wi-Fi router on the second floor near Room 204 has been down for three days, making it difficult to access online lab material during practicals.",
        location: "Second Floor, Room 204",
        priority: "High",
        status: "In Progress",
        adminResponse: "Our network team has identified a faulty access point and a replacement has been ordered. Expected fix within 2 working days.",
        createdDate: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedDate: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString()
      },
      {
        complaintId: "CMP-2026-0002",
        studentId: "STU-1001",
        studentName: "Aarav Sharma",
        rollNumber: "IT2301",
        title: "Broken chair in classroom",
        category: "Classroom",
        description: "One of the chairs in the last row of the FY-IT classroom has a broken leg and is unsafe to sit on.",
        location: "FY-IT Classroom, Ground Floor",
        priority: "Medium",
        status: "Resolved",
        adminResponse: "The chair has been replaced by the maintenance team. Thank you for reporting this.",
        createdDate: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updatedDate: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString()
      },
      {
        complaintId: "CMP-2026-0003",
        studentId: "STU-1001",
        studentName: "Aarav Sharma",
        rollNumber: "IT2301",
        title: "Water leakage near library entrance",
        category: "Infrastructure",
        description: "There is continuous water leakage from the ceiling near the library entrance, creating a slippery floor.",
        location: "Library Entrance",
        priority: "High",
        status: "Pending",
        adminResponse: "",
        createdDate: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
        updatedDate: new Date(now - 1000 * 60 * 60 * 5).toISOString()
      }
    ];
    writeList(LS_KEYS.COMPLAINTS, demoComplaints);
  }

  if (localStorage.getItem(LS_KEYS.COUNTER) === null) {
    localStorage.setItem(LS_KEYS.COUNTER, "3");
  }
}

/* ---------- Complaint ID generation ---------- */
function generateComplaintId() {
  const year = new Date().getFullYear();
  let counter = parseInt(localStorage.getItem(LS_KEYS.COUNTER) || "0", 10);
  counter += 1;
  localStorage.setItem(LS_KEYS.COUNTER, String(counter));
  const padded = String(counter).padStart(4, "0");
  return `CMP-${year}-${padded}`;
}

/* ---------- Formatting helpers ---------- */
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusBadgeClass(status) {
  switch (status) {
    case "Pending": return "badge-pending";
    case "In Progress": return "badge-progress";
    case "Resolved": return "badge-resolved";
    case "Rejected": return "badge-rejected";
    default: return "badge-pending";
  }
}

function priorityBadgeClass(priority) {
  switch (priority) {
    case "Low": return "badge-priority-low";
    case "Medium": return "badge-priority-medium";
    case "High": return "badge-priority-high";
    default: return "badge-priority-low";
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- Toast notifications ---------- */
function ensureToastStack() {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type) {
  type = type || "info";
  const stack = ensureToastStack();
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    toast.style.transition = "opacity .2s ease, transform .2s ease";
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

/* ---------- Inline alert helper (used in forms) ---------- */
function showAlert(elId, message, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.className = "alert show alert-" + (type || "error");
}

function hideAlert(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = "alert";
  el.textContent = "";
}

/* ---------- Sidebar / mobile nav ---------- */
function initSidebarToggle() {
  const hamburger = document.querySelector(".hamburger");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  if (!hamburger || !sidebar) return;

  function closeSidebar() {
    sidebar.classList.remove("show");
    if (overlay) overlay.classList.remove("show");
  }
  function openSidebar() {
    sidebar.classList.add("show");
    if (overlay) overlay.classList.add("show");
  }

  hamburger.addEventListener("click", () => {
    if (sidebar.classList.contains("show")) closeSidebar();
    else openSidebar();
  });
  if (overlay) overlay.addEventListener("click", closeSidebar);
}

/* ---------- Modal helpers ---------- */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("show");
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("show");
}

/* ---------- Active nav link highlighting ---------- */
function highlightActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar-nav a[data-page]").forEach(a => {
    if (a.getAttribute("data-page") === path) a.classList.add("active");
    else a.classList.remove("active");
  });
}

/* ---------- Init on every page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  ensureSeedData();
  initSidebarToggle();
  highlightActiveNav();
});
