// ============================================================
// College Complaint & Helpdesk — client-side behaviour
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // ---- Sidebar toggle (mobile) ----
  const toggleBtn = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        sidebar.classList.remove("open");
      }
    });
  }

  // ---- Auto-dismiss flash messages after a few seconds ----
  document.querySelectorAll(".flash-wrap .alert").forEach(function (alert) {
    setTimeout(function () {
      if (window.bootstrap && bootstrap.Alert) {
        const instance = bootstrap.Alert.getOrCreateInstance(alert);
        instance.close();
      }
    }, 5000);
  });

  // ---- Admin dashboard: status doughnut chart ----
  const canvas = document.getElementById("statusChart");
  if (canvas && window.Chart) {
    const data = canvas.dataset;
    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Pending", "In Progress", "Resolved", "Rejected"],
        datasets: [
          {
            data: [
              Number(data.pending),
              Number(data.progress),
              Number(data.resolved),
              Number(data.rejected),
            ],
            backgroundColor: ["#f59e0b", "#3b82f6", "#16a34a", "#dc2626"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } },
        },
        cutout: "65%",
      },
    });
  }
});
