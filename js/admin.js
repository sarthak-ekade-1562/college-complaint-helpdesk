/* ==========================================================================
   admin.js
   Admin dashboard statistics, complaint search/filter/update, and the
   registered-students view.
   ========================================================================== */

/* ---------- Stats ---------- */
function getAdminStats() {
  const complaints = readList(LS_KEYS.COMPLAINTS);
  const students = readList(LS_KEYS.STUDENTS);
  return {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Pending").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    rejected: complaints.filter(c => c.status === "Rejected").length,
    totalStudents: students.length
  };
}

function getAllComplaints() {
  return readList(LS_KEYS.COMPLAINTS).sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
}

/* ---------- Update status / response ---------- */
function updateComplaintStatus(complaintId, newStatus) {
  const complaints = readList(LS_KEYS.COMPLAINTS);
  const idx = complaints.findIndex(c => c.complaintId === complaintId);
  if (idx === -1) return { ok: false, message: "Complaint not found." };

  complaints[idx].status = newStatus;
  complaints[idx].updatedDate = new Date().toISOString();
  writeList(LS_KEYS.COMPLAINTS, complaints);
  return { ok: true, complaint: complaints[idx] };
}

function updateAdminResponse(complaintId, responseText) {
  const complaints = readList(LS_KEYS.COMPLAINTS);
  const idx = complaints.findIndex(c => c.complaintId === complaintId);
  if (idx === -1) return { ok: false, message: "Complaint not found." };

  complaints[idx].adminResponse = responseText.trim();
  complaints[idx].updatedDate = new Date().toISOString();
  writeList(LS_KEYS.COMPLAINTS, complaints);
  return { ok: true, complaint: complaints[idx] };
}

/* ---------- Filtering / search ---------- */
function filterComplaints(complaints, { search, status, category, priority }) {
  return complaints.filter(c => {
    if (status && status !== "all" && c.status !== status) return false;
    if (category && category !== "all" && c.category !== category) return false;
    if (priority && priority !== "all" && c.priority !== priority) return false;
    if (search) {
      const term = search.toLowerCase();
      const haystack = `${c.complaintId} ${c.title} ${c.studentName} ${c.rollNumber} ${c.category}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/* ---------- Rendering: admin dashboard recent table ---------- */
function renderAdminRecentTable(containerEl, complaints, limit) {
  const list = complaints.slice(0, limit || 6);
  if (list.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <h3>No complaints submitted yet</h3>
      </div>`;
    return;
  }
  const rows = list.map(c => `
    <tr>
      <td>${escapeHtml(c.complaintId)}</td>
      <td>${escapeHtml(c.studentName)}<br><span style="color:var(--text-faint);font-size:.78rem;">${escapeHtml(c.rollNumber)}</span></td>
      <td>${escapeHtml(c.title)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td><span class="badge ${priorityBadgeClass(c.priority)}">${escapeHtml(c.priority)}</span></td>
      <td><span class="badge ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
      <td><a class="btn btn-ghost btn-sm" href="admin-complaints.html?id=${encodeURIComponent(c.complaintId)}"><i class="fa-solid fa-arrow-right"></i></a></td>
    </tr>
  `).join("");
  containerEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Student</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Rendering: admin complaints management table ---------- */
function renderAdminComplaintsTable(containerEl, complaints) {
  if (complaints.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>No complaints match your filters</h3>
        <p>Try adjusting the search term or filters above.</p>
      </div>`;
    return;
  }

  const rows = complaints.map(c => `
    <tr>
      <td>${escapeHtml(c.complaintId)}</td>
      <td>${escapeHtml(c.studentName)}<br><span style="color:var(--text-faint);font-size:.78rem;">${escapeHtml(c.rollNumber)}</span></td>
      <td>${escapeHtml(c.title)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td><span class="badge ${priorityBadgeClass(c.priority)}">${escapeHtml(c.priority)}</span></td>
      <td>${formatDate(c.createdDate)}</td>
      <td><span class="badge ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openComplaintModal('${c.complaintId}')">
          <i class="fa-solid fa-pen"></i> Manage
        </button>
      </td>
    </tr>
  `).join("");

  containerEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Student</th><th>Title</th><th>Category</th><th>Priority</th><th>Date</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Rendering: students table ---------- */
function renderStudentsTable(containerEl, students) {
  if (students.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-user-graduate"></i>
        <h3>No students registered yet</h3>
      </div>`;
    return;
  }

  const complaints = readList(LS_KEYS.COMPLAINTS);

  const rows = students.map(s => {
    const count = complaints.filter(c => c.studentId === s.id).length;
    return `
    <tr>
      <td>${escapeHtml(s.fullName)}</td>
      <td>${escapeHtml(s.rollNumber)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.department)}</td>
      <td>${escapeHtml(s.year)}</td>
      <td>${count}</td>
    </tr>`;
  }).join("");

  containerEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Full Name</th><th>Roll Number</th><th>Email</th><th>Department</th><th>Year</th><th>Complaints</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
