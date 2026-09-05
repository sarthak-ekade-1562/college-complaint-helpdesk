# CampusVoice — Student Complaint Management System

A **frontend-only** Student Complaint Management System built as a CEP (Certified Engineering Project) for FY B.Tech Information Technology. It runs entirely in the browser using **HTML5, CSS3, and Vanilla JavaScript**, with `localStorage` used to simulate a database for demonstration purposes. No backend, server, or database is required — it works directly on **GitHub Pages**.

---

## 1. Problem Statement

Colleges receive a wide range of day-to-day complaints from students — Wi-Fi outages, broken furniture, cleanliness issues, electrical faults, and more — that are often reported informally (verbally, on paper, or over chat) and easily lost or forgotten. There is no structured way for students to track the status of an issue they've raised, and administrators have no centralized view to prioritize, respond to, and resolve these complaints efficiently.

## 2. Project Objective

To design and build a web-based Student Complaint Management System that:
- Allows students to register, log in, submit complaints, and track their status in real time.
- Allows administrators to view, search, filter, update, and respond to all submitted complaints.
- Demonstrates a complete, realistic complaint lifecycle (Pending → In Progress → Resolved / Rejected) without requiring any server-side infrastructure.

## 3. Features

**Student Portal**
- Registration with roll number, department, year, and email
- Login using email or roll number
- Dashboard with live complaint statistics
- Submit complaints with category, location, priority, and description
- View all personal complaints with status badges
- Detailed complaint view with a visual status timeline and admin responses
- Logout with session clearing

**Admin Portal**
- Secure demo login
- Dashboard with total/pending/in-progress/resolved/rejected counts and student count
- View, search, and filter all complaints (by status, category, priority, or keyword)
- Update complaint status and add a written response from a single modal
- Changes reflect immediately on the student's tracking page
- View all registered students with their complaint counts

**General**
- Fully responsive design (desktop, laptop, tablet, mobile) with a collapsible sidebar
- Toast notifications and inline form validation
- Clean, modern, dashboard-style UI — not a bare-bones assignment layout
- Every button is functional; there are no placeholder/dead links

## 4. Technologies Used

| Layer      | Technology                          |
|------------|--------------------------------------|
| Structure  | HTML5                                |
| Styling    | CSS3 (custom, no framework)          |
| Behavior   | Vanilla JavaScript (ES6)             |
| Data store | Browser `localStorage`               |
| Icons      | Font Awesome (via CDN)               |
| Fonts      | Google Fonts — Poppins & Inter (via CDN) |
| Hosting    | GitHub Pages (static hosting)        |

No Python, PHP, Node.js, React, MongoDB, or Firebase is used anywhere in this project.

## 5. Project Structure

```
student-complaint-management/
│
├── index.html                 Landing page
├── student-login.html         Student login
├── register.html              Student registration
├── student-dashboard.html     Student dashboard
├── submit-complaint.html      Complaint submission form
├── my-complaints.html         Student's complaint list
├── complaint-details.html     Full complaint view + status timeline
├── admin-login.html           Admin login
├── admin-dashboard.html       Admin dashboard
├── admin-complaints.html      Admin complaint management (search/filter/update)
├── admin-students.html        Registered students list
│
├── css/
│   └── style.css              All styling for every page
│
├── js/
│   ├── common.js              Shared helpers: storage, toasts, seed data, nav
│   ├── auth.js                Registration, login, session, logout
│   ├── student.js             Complaint submission & student-side rendering
│   └── admin.js                Stats, filtering, and admin-side rendering
│
├── assets/
│   └── images/                 (reserved for any future image assets)
│
└── README.md
```

## 6. How the System Works

All data is stored as JSON inside the browser's `localStorage` under these keys:

| Key                 | Purpose                                   |
|----------------------|--------------------------------------------|
| `students`           | All registered student accounts            |
| `complaints`         | All submitted complaints                    |
| `currentStudent`     | The currently logged-in student's session   |
| `adminSession`       | The current admin session                   |
| `complaintCounter`   | Running counter used to generate complaint IDs |

Key JavaScript helper functions:

- `registerStudent()` — validates and stores a new student account
- `loginStudent()` — verifies email/roll number + password against stored students
- `loginAdmin()` — verifies against the hard-coded demo admin credentials
- `logout()` (`logoutStudent()` / `logoutAdmin()`) — clears the relevant session key
- `submitComplaint()` — creates a complaint record with a generated ID and `Pending` status
- `getStudentComplaints()` — returns all complaints belonging to a student
- `updateComplaintStatus()` — updates a complaint's status (admin side)
- `updateAdminResponse()` — attaches/updates an admin's written response
- `generateComplaintId()` — produces IDs in the format `CMP-YYYY-NNNN`

Because both the student and admin pages read from the same `complaints` key in `localStorage`, any status or response update made by the admin is immediately visible the next time the student opens their complaint list or detail page (same browser/device, since `localStorage` is per-browser).

The project seeds one demo student and three demo complaints on first load so the interface is populated immediately — feel free to clear your browser's site data to reset it to an empty state.

## 7. How to Run Locally

No installation or build step is required.

1. Download or clone this repository.
2. Open the `student-complaint-management` folder.
3. Double-click `index.html` (or right-click → Open with your browser).

That's it — the entire application runs client-side.

## 8. How to Upload to GitHub

1. Create a new repository on GitHub (e.g. `student-complaint-management`).
2. On your computer, inside the `student-complaint-management` folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Student Complaint Management System"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY-NAME.git
   git push -u origin main
   ```
3. Refresh your GitHub repository page to confirm all files were uploaded.

## 9. How to Enable GitHub Pages

1. Go to your repository on GitHub.
2. Click **Settings** → **Pages** (in the left sidebar under "Code and automation").
3. Under **Build and deployment → Source**, select **Deploy from a branch**.
4. Choose the **`main`** branch and the **`/ (root)`** folder, then click **Save**.
5. Wait a minute for GitHub to build the site, then visit:
   ```
   https://USERNAME.github.io/REPOSITORY-NAME/
   ```
6. The landing page (`index.html`) will load automatically at that URL.

All internal links in this project use **relative paths** (e.g. `css/style.css`, `student-login.html`), so the site works correctly both locally and under a GitHub Pages subpath.

## 10. Demo Credentials

**Admin**
- Username: `admin`
- Password: `admin123`

**Demo Student** (seeded automatically)
- Roll Number: `IT2301`
- Password: `demo1234`

You can also register a brand-new student account from the **Register** page at any time.

## 11. Important Limitation — LocalStorage & Security

This project is a **frontend-only academic prototype**. It is designed to demonstrate the workflow, UI, and logic of a complaint management system for a CEP submission — **not** to be deployed as a real, production system. Specifically:

- All data (accounts, passwords, complaints) is stored in **plain text inside the browser's `localStorage`**, which is visible to anyone with access to the browser's developer tools.
- Data is **local to a single browser on a single device** — it does not sync across devices or browsers, and clearing browser data will erase all stored accounts and complaints.
- There is **no real authentication, encryption, or server-side validation** of any kind.
- The demo admin credentials are hard-coded in `js/auth.js` and are **not suitable for a production system**.

**A production version should use a secure backend with a real database (e.g. PostgreSQL/MySQL/MongoDB), server-side authentication (e.g. hashed passwords, sessions or JWTs), and HTTPS-secured API endpoints**, rather than client-side `localStorage`.

## 12. Future Improvements

- Replace `localStorage` with a real backend (e.g. Node.js/Express + a database, or a serverless platform) for persistent, multi-device data.
- Add password hashing and proper session/token-based authentication.
- Add email or push notifications when a complaint's status changes.
- Add file/photo attachments to complaints (e.g. a photo of the damaged item).
- Add role-based access for multiple admin accounts/departments.
- Add analytics/charts (e.g. complaints by category over time) on the admin dashboard.
- Add pagination for large complaint/student lists.

---

*Built as a CEP project for FY B.Tech Information Technology using HTML5, CSS3, and Vanilla JavaScript only.*
