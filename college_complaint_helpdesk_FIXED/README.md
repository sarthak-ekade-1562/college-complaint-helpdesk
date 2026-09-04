# College Complaint & Helpdesk Management System

A simple, complete web application that lets **students submit and track complaints**
about college facilities/services, and lets an **admin manage and resolve** them.
Built for a first-year IT student CEP (Community Engagement Project) demonstration.

---

## 1. Project Description

Students often struggle to report issues like a broken projector, poor Wi-Fi, or
an unclean classroom, and have no way to track what happened after they complained.

This project provides a small, self-contained web portal where:
- Students register, log in, submit complaints, and track their status.
- An admin logs in separately, views all complaints, filters/searches them,
  updates their status, and writes a response.

Everything runs **locally on your own laptop** — no internet, cloud database,
or paid service is required.

---

## 2. Features

**Student side**
- Registration & secure login (hashed passwords)
- Dashboard with complaint statistics (Total / Pending / In Progress / Resolved)
- Submit a complaint with title, category, description, location, and an
  optional file attachment (image/PDF)
- "My Complaints" list with status filters
- Complaint details page with a visual status tracker
- Profile page

**Admin side**
- Separate secure admin login
- Dashboard with system-wide statistics and a status chart
- View, search, and filter all complaints (by category / status / keyword)
- Open any complaint, change its status, and write a response
- View all registered students

**Security**
- Passwords are hashed with Werkzeug's `generate_password_hash` (never stored as plain text)
- Session-based login for both students and admins
- Student-only and admin-only pages are protected by login decorators
- Students can only ever see their **own** complaints
- Server-side validation on every form

---

## 3. Technologies Used

| Layer      | Technology                  |
|------------|------------------------------|
| Frontend   | HTML5, CSS3, JavaScript, Bootstrap 5 |
| Backend    | Python 3, Flask              |
| Database   | SQLite (built into Python)   |
| Charts     | Chart.js (loaded from a CDN) |

No React, Node.js, MongoDB, or Firebase is used anywhere.

---

## 4. Requirements

- **Python 3.9 or newer** installed on your Windows PC
  (check with `python --version` in Command Prompt)
- Internet connection **only** the first time you install packages
  (Bootstrap/Chart.js/icons load from a CDN, so an internet connection is
  needed while using the app in a browser — everything else runs locally)

---

## 5. Installation Steps (Windows)

1. **Install Python** (if you don't already have it):
   - Download from [python.org/downloads](https://www.python.org/downloads/).
   - During setup, **check the box "Add Python to PATH"** before clicking Install.
   - Confirm it worked by opening Command Prompt and typing `python --version`.

2. **Extract the ZIP file** anywhere on your computer, e.g. `Desktop\college_complaint_helpdesk`.

3. **Open Command Prompt in the project folder:**
   - Open the extracted folder in File Explorer.
   - Click the address bar, type `cmd`, and press Enter.

4. **Create a virtual environment:**
   ```
   python -m venv venv
   ```

5. **Activate the virtual environment:**
   ```
   venv\Scripts\activate
   ```
   You should now see `(venv)` at the start of the command line.

6. **Install the required packages:**
   ```
   pip install -r requirements.txt
   ```

---

## 6. How to Run the Project

1. **Run the app** (same Command Prompt window, with `venv` still activated):
   ```
   python app.py
   ```
2. You should see output similar to:
   ```
   * Running on http://127.0.0.1:5000
   ```
3. **Open the URL in your browser:**
   ```
   http://127.0.0.1:5000
   ```
4. The database file (`database.db`) and all tables — plus the default admin
   account — are created **automatically** the moment the app starts, no
   matter how you launch it. You don't need to set anything up manually.
5. To stop the server, go back to Command Prompt and press `CTRL + C`.

**Quick reference — all commands in order:**
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Then open `http://127.0.0.1:5000`.

---

## 7. Default Admin Login

A default admin account is created automatically the first time the app runs:

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

> ⚠️ This is a demo credential meant for the CEP demonstration only.
> If you ever deploy this project beyond a local demo, change
> `DEFAULT_ADMIN_PASSWORD` and `SECRET_KEY` in the `Config` class at the
> top of `app.py`, delete `database.db`, and restart the app.

---

## 8. Database Information

The project uses **SQLite**, a lightweight file-based database — no separate
database server needs to be installed or started. All data lives in a single
file, `database.db`, created automatically in the project folder.

**Tables:**

- **students** — id, name, roll_number, email, department, year, password (hashed), created_at
- **admins** — id, username, password (hashed)
- **complaints** — id, complaint_id, student_id (linked to students), title, category,
  description, location, attachment, status, admin_response, created_at, updated_at

Each complaint is linked to the student who submitted it through `student_id`,
so the app can show a student only their own complaints.

If you want to reset all data, simply close the app and delete `database.db`,
then run `python app.py` again — a fresh database (with the default admin) will
be created.

---

## 9. Project Folder Structure

```
college_complaint_helpdesk/
│
├── app.py                     # Main Flask application (routes + logic)
├── requirements.txt           # Python packages needed
├── README.md                  # This file
├── database.db                # Created automatically on first run
│
├── templates/                 # HTML pages (Jinja2 templates)
│   ├── base.html               # Shared layout (sidebar / navbar / flash messages)
│   ├── _flash.html             # Reusable flash-message partial
│   ├── index.html              # Landing page
│   ├── register.html           # Student registration
│   ├── student_login.html
│   ├── admin_login.html
│   ├── student_dashboard.html
│   ├── submit_complaint.html
│   ├── my_complaints.html
│   ├── complaint_details.html  # Used by both student & admin views
│   ├── profile.html
│   ├── admin_dashboard.html
│   ├── manage_complaints.html
│   └── students.html
│
├── static/
│   ├── css/style.css           # All styling
│   └── js/script.js            # Sidebar toggle + dashboard chart
│
└── uploads/                    # Complaint attachments are stored here
```

---

## 10. How the System Works (Explanation for your Demo)

1. **`app.py`** is the heart of the project. It creates a Flask app, defines
   all the URL "routes" (e.g. `/student/dashboard`, `/admin/complaints`), and
   contains the logic for each page.
2. **`init_db()`** runs once when the app starts. It creates the three tables
   (`students`, `admins`, `complaints`) if they don't already exist, and
   inserts the default admin account.
3. When a student **registers**, their password is hashed (scrambled one-way)
   before being saved — the original password is never stored anywhere.
4. When a student **logs in**, Flask checks the hash and, if correct, stores
   `student_id` in the **session** (a secure cookie) so the server remembers
   they're logged in on every later page.
5. **Decorators** (`@student_login_required`, `@admin_login_required`) sit on
   top of routes to block access if the right session key isn't present —
   this is what stops a logged-out user from viewing dashboards directly.
6. When a complaint is **submitted**, a unique ID like `CMP-3F9A2B` is
   generated, the row is inserted into the `complaints` table with the
   student's `id` as a foreign key, and status defaults to `"Pending"`.
7. Every complaint list query for a student includes `WHERE student_id = ?`
   — this is what guarantees a student can only ever see their own complaints.
8. The **admin** dashboard runs simple `COUNT(*) ... GROUP BY status` SQL
   queries to build the statistics cards and the Chart.js doughnut chart.
9. When the admin updates a complaint's status or writes a response, it's a
   plain SQL `UPDATE` on that complaint's row.
10. **Jinja2 templates** (the `.html` files in `templates/`) all extend a
    shared `base.html`, which is what gives every page the same sidebar,
    navbar, and consistent look without repeating code.

---

## 11. Common Errors and Solutions

| Problem | Solution |
|---|---|
| `'python' is not recognized as an internal or external command` | Python isn't installed or not added to PATH. Reinstall Python from python.org and check "Add Python to PATH" during setup. |
| `ModuleNotFoundError: No module named 'flask'` | You forgot to run `pip install -r requirements.txt`, or you're not inside the activated virtual environment. |
| `Address already in use` / port 5000 busy | Another program (or a previous instance of this app) is using port 5000. Close it, or run `python app.py` after changing `app.run(debug=True, port=5001)` in `app.py`. |
| Page looks unstyled / no icons | You need an internet connection, since Bootstrap/Chart.js/Font Awesome are loaded from a CDN. |
| Changes to code aren't showing up | Make sure the server is running with `debug=True` (it is, by default) and refresh your browser; if needed, stop the server (`CTRL+C`) and run `python app.py` again. |
| "This site can't be reached" in browser | Make sure the Command Prompt still shows the server running, and that you typed `http://127.0.0.1:5000` exactly. |
| Forgot the admin password | Stop the app, delete `database.db`, and restart — a fresh default admin (`admin` / `admin123`) will be created. **Note: this also deletes all student and complaint data.** |

---

## 12. Future Improvements

- Email notifications when a complaint's status changes
- Admin ability to reset a student's password
- Complaint priority levels (Low / Medium / High / Urgent)
- Export complaint reports to Excel/PDF
- Multiple admin roles (department-wise admins)
- REST API for a future mobile app
- Pagination for large complaint/student lists

---

## Quick Start (TL;DR)

```
pip install -r requirements.txt
python app.py
```
Then open `http://127.0.0.1:5000` in your browser.
Admin login: **admin / admin123**
