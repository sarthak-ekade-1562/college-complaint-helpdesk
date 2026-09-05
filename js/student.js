/* ==========================================================================
   student.js
   Complaint submission, retrieval, dashboard stats and rendering helpers
   for the student-facing pages.
   ========================================================================== */

/* ---------- Submit a new complaint ---------- */
function submitComplaint(student, data) {
  const complaints = readList(LS_KEYS.COMPLAINTS);
  const nowIso = new Date().toISOString();

  const complaint = {
    complaintId: generateComplaintId(),
    studentId: student.id,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    title: data.title.trim(),
    category: data.category,
    description: data.description.trim(),
    location: data.location.trim(),
    priority: data.priority,
    status: "Pending",
    adminResponse: "",
    createdDate: nowIso,
    updatedDate: nowIso
  };

  complaints.unshift(complaint);
  writeList(LS_KEYS.COMPLAINTS, complaints);
  return complaint;
}

/* ---------- Retrieval ---------- */
function getStudentComplaints(studentId) {
  const complaints = readList(LS_KEYS.COMPLAINTS);
  return complaints
    .filter(c => c.studentId === studentId)
    .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
}

function getComplaintById(complaintId) {
  const complaints = readList(LS_KEYS.COMPLAINTS);
  return complaints.find(c => c.complaintId === complaintId) || null;
}

function getStudentStats(studentId) {
  const list = getStudentComplaints(studentId);
  return {
    total: list.length,
    pending: list.filter(c => c.status === "Pending").length,
    inProgress: list.filter(c => c.status === "In Progress").length,
    resolved: list.filter(c => c.status === "Resolved").length,
    rejected: list.filter(c => c.status === "Rejected").length
  };
}

/* ---------- Rendering: dashboard recent complaints ---------- */
function renderRecentComplaintsTable(containerEl, complaints, limit) {
  const list = complaints.slice(0, limit || 5);
  if (list.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <h3>No complaints yet</h3>
        <p>Submit your first complaint to see it listed here.</p>
      </div>`;
    return;
  }

  const rows = list.map(c => `
    <tr>
      <td><a href="complaint-details.html?id=${encodeURIComponent(c.complaintId)}">${escapeHtml(c.complaintId)}</a></td>
      <td>${escapeHtml(c.title)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td>${formatDate(c.createdDate)}</td>
      <td><span class="badge ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
    </tr>
  `).join("");

  containerEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Title</th><th>Category</th><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---------- Rendering: my-complaints list with cards ---------- */
function renderMyComplaintsList(containerEl, complaints) {
  if (complaints.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <h3>You haven't submitted any complaints</h3>
        <p>Use "Submit Complaint" from the sidebar to raise a new issue.</p>
      </div>`;
    return;
  }

  containerEl.innerHTML = complaints.map(c => `
    <div class="complaint-card">
      <div class="top-row">
        <span class="cmp-id">${escapeHtml(c.complaintId)}</span>
        <span class="badge ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
      </div>
      <h3>${escapeHtml(c.title)}</h3>
      <div class="meta">
        <span><i class="fa-solid fa-tag"></i> ${escapeHtml(c.category)}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.location)}</span>
        <span><i class="fa-regular fa-calendar"></i> ${formatDate(c.createdDate)}</span>
        <span class="badge ${priorityBadgeClass(c.priority)}">${escapeHtml(c.priority)} priority</span>
      </div>
      <div class="actions">
        <a class="btn btn-outline btn-sm" href="complaint-details.html?id=${encodeURIComponent(c.complaintId)}">
          <i class="fa-solid fa-eye"></i> View Details
        </a>
      </div>
    </div>
  `).join("");
}

/* ---------- Rendering: complaint status timeline ---------- */
function renderStatusTimeline(containerEl, complaint) {
  if (complaint.status === "Rejected") {
    containerEl.innerHTML = `
      <li class="done"><div class="st-title">Submitted</div><div class="st-sub">${formatDateTime(complaint.createdDate)}</div></li>
      <li class="rejected"><div class="st-title">Rejected</div><div class="st-sub">${formatDateTime(complaint.updatedDate)}</div></li>
    `;
    return;
  }

  const currentIndex = STATUS_FLOW.indexOf(complaint.status);
  containerEl.innerHTML = STATUS_FLOW.map((step, i) => {
    let cls = "";
    let sub = "Awaiting";
    if (i < currentIndex) { cls = "done"; sub = "Completed"; }
    else if (i === currentIndex) { cls = "current"; sub = "Current stage · " + formatDateTime(complaint.updatedDate); }
    return `<li class="${cls}"><div class="st-title">${step}</div><div class="st-sub">${sub}</div></li>`;
  }).join("");
}
