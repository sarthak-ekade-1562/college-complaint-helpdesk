"""
College Complaint & Helpdesk Management System
Flask + SQLite web application.

Run with: python app.py
"""

import os
import sqlite3
import uuid
from datetime import datetime
from functools import wraps

from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, g
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask import send_from_directory, abort

# ---------------------------------------------------------------------------
# CONFIGURATION  (all app-wide settings live here, in one place)
# ---------------------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = "change-this-secret-key-before-real-deployment"
    DATABASE = os.path.join(BASE_DIR, "database.db")
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB max upload

    # Default admin account created automatically on first run.
    # CHANGE THIS PASSWORD before using the project for anything real.
    DEFAULT_ADMIN_USERNAME = "admin"
    DEFAULT_ADMIN_PASSWORD = "admin123"


app = Flask(__name__)
app.config.from_object(Config)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

COMPLAINT_CATEGORIES = [
    "IT / Wi-Fi", "Classroom", "Infrastructure", "Cleanliness",
    "Electricity", "Library", "Laboratory", "Transport",
    "Canteen", "Other",
]
COMPLAINT_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"]


# ---------------------------------------------------------------------------
# DATABASE HELPERS
# ---------------------------------------------------------------------------
def get_db():
    """Open a new database connection if one doesn't already exist for
    this request, and store it on Flask's application context (g)."""
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables (if they don't exist yet) and seed the default
    admin account. Safe to call every time the app starts."""
    db = sqlite3.connect(app.config["DATABASE"])
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")

    db.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT NOT NULL,
            year TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT UNIQUE NOT NULL,
            student_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            attachment TEXT,
            status TEXT NOT NULL DEFAULT 'Pending',
            admin_response TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    """)

    # Seed default admin only if the admins table is empty.
    existing = db.execute("SELECT COUNT(*) AS c FROM admins").fetchone()
    if existing["c"] == 0:
        db.execute(
            "INSERT INTO admins (username, password) VALUES (?, ?)",
            (
                app.config["DEFAULT_ADMIN_USERNAME"],
                generate_password_hash(app.config["DEFAULT_ADMIN_PASSWORD"]),
            ),
        )

    db.commit()
    db.close()


# Initialize the database as soon as the module is loaded, so the tables
# and default admin exist no matter how the app is started — `python app.py`,
# `flask run`, a WSGI server, or an automated test client.
init_db()


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------
def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]
    )


def generate_complaint_id():
    """Human-friendly unique complaint ID, e.g. CMP-3F9A2B."""
    return "CMP-" + uuid.uuid4().hex[:6].upper()


def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def student_login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("student_id"):
            flash("Please login as a student to continue.", "warning")
            return redirect(url_for("student_login"))
        return view(*args, **kwargs)
    return wrapped


def admin_login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("admin_id"):
            flash("Please login as admin to continue.", "warning")
            return redirect(url_for("admin_login"))
        return view(*args, **kwargs)
    return wrapped


def get_status_counts(db, student_id=None):
    """Return a dict of status -> count. If student_id is given, counts
    are scoped to that student only (used for the student dashboard)."""
    counts = {status: 0 for status in COMPLAINT_STATUSES}
    if student_id is None:
        rows = db.execute(
            "SELECT status, COUNT(*) AS c FROM complaints GROUP BY status"
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT status, COUNT(*) AS c FROM complaints WHERE student_id = ? "
            "GROUP BY status",
            (student_id,),
        ).fetchall()
    for row in rows:
        counts[row["status"]] = row["c"]
    counts["total"] = sum(counts[s] for s in COMPLAINT_STATUSES)
    return counts


# ---------------------------------------------------------------------------
# PUBLIC ROUTES
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    """Serve complaint attachments, but only to the admin or the student
    who owns the complaint the file belongs to."""
    if not (session.get("admin_id") or session.get("student_id")):
        abort(403)

    db = get_db()
    complaint = db.execute(
        "SELECT student_id FROM complaints WHERE attachment = ?", (filename,)
    ).fetchone()

    if not complaint:
        abort(404)

    if session.get("student_id") and complaint["student_id"] != session["student_id"]:
        abort(403)

    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ---------------------------------------------------------------------------
# STUDENT AUTH
# ---------------------------------------------------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        roll_number = request.form.get("roll_number", "").strip()
        email = request.form.get("email", "").strip().lower()
        department = request.form.get("department", "").strip()
        year = request.form.get("year", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        errors = []
        if not name or len(name) < 2:
            errors.append("Please enter a valid full name.")
        if not roll_number:
            errors.append("Roll number is required.")
        if not email or "@" not in email:
            errors.append("Please enter a valid email address.")
        if not department:
            errors.append("Please select a department.")
        if not year:
            errors.append("Please select a year.")
        if not password or len(password) < 6:
            errors.append("Password must be at least 6 characters long.")
        if password != confirm_password:
            errors.append("Passwords do not match.")

        db = get_db()
        if not errors:
            existing = db.execute(
                "SELECT id FROM students WHERE email = ? OR roll_number = ?",
                (email, roll_number),
            ).fetchone()
            if existing:
                errors.append("A student with this email or roll number already exists.")

        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template("register.html", form=request.form)

        db.execute(
            """INSERT INTO students
               (name, roll_number, email, department, year, password, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (name, roll_number, email, department, year,
             generate_password_hash(password), now_str()),
        )
        db.commit()
        flash("Registration successful! Please login to continue.", "success")
        return redirect(url_for("student_login"))

    return render_template("register.html", form={})


@app.route("/student/login", methods=["GET", "POST"])
def student_login():
    if request.method == "POST":
        identifier = request.form.get("identifier", "").strip().lower()
        password = request.form.get("password", "")

        db = get_db()
        student = db.execute(
            "SELECT * FROM students WHERE email = ? OR roll_number = ?",
            (identifier, request.form.get("identifier", "").strip()),
        ).fetchone()

        if student and check_password_hash(student["password"], password):
            session.clear()
            session["student_id"] = student["id"]
            session["student_name"] = student["name"]
            flash(f"Welcome back, {student['name']}!", "success")
            return redirect(url_for("student_dashboard"))

        flash("Invalid email/roll number or password.", "danger")

    return render_template("student_login.html")


@app.route("/student/logout")
def student_logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("index"))


# ---------------------------------------------------------------------------
# STUDENT DASHBOARD & FEATURES
# ---------------------------------------------------------------------------
@app.route("/student/dashboard")
@student_login_required
def student_dashboard():
    db = get_db()
    counts = get_status_counts(db, student_id=session["student_id"])
    recent = db.execute(
        "SELECT * FROM complaints WHERE student_id = ? "
        "ORDER BY created_at DESC LIMIT 5",
        (session["student_id"],),
    ).fetchall()
    return render_template("student_dashboard.html", counts=counts, recent=recent)


@app.route("/student/complaint/new", methods=["GET", "POST"])
@student_login_required
def submit_complaint():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        category = request.form.get("category", "").strip()
        description = request.form.get("description", "").strip()
        location = request.form.get("location", "").strip()

        errors = []
        if not title or len(title) < 3:
            errors.append("Please enter a valid complaint title.")
        if category not in COMPLAINT_CATEGORIES:
            errors.append("Please select a valid category.")
        if not description or len(description) < 10:
            errors.append("Description should be at least 10 characters.")
        if not location:
            errors.append("Please enter a location.")

        attachment_filename = None
        file = request.files.get("attachment")
        if file and file.filename:
            if not allowed_file(file.filename):
                errors.append("Attachment must be an image or PDF file.")
            else:
                safe_name = secure_filename(file.filename)
                attachment_filename = f"{uuid.uuid4().hex}_{safe_name}"
                file.save(os.path.join(app.config["UPLOAD_FOLDER"], attachment_filename))

        if errors:
            for e in errors:
                flash(e, "danger")
            return render_template(
                "submit_complaint.html",
                categories=COMPLAINT_CATEGORIES,
                form=request.form,
            )

        db = get_db()
        complaint_id = generate_complaint_id()
        timestamp = now_str()
        db.execute(
            """INSERT INTO complaints
               (complaint_id, student_id, title, category, description,
                location, attachment, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)""",
            (complaint_id, session["student_id"], title, category,
             description, location, attachment_filename, timestamp, timestamp),
        )
        db.commit()
        flash(f"Complaint submitted successfully! Your Complaint ID is {complaint_id}.",
              "success")
        return redirect(url_for("my_complaints"))

    return render_template(
        "submit_complaint.html", categories=COMPLAINT_CATEGORIES, form={}
    )


@app.route("/student/complaints")
@student_login_required
def my_complaints():
    db = get_db()
    status_filter = request.args.get("status", "")
    query = "SELECT * FROM complaints WHERE student_id = ?"
    params = [session["student_id"]]
    if status_filter in COMPLAINT_STATUSES:
        query += " AND status = ?"
        params.append(status_filter)
    query += " ORDER BY created_at DESC"
    complaints = db.execute(query, params).fetchall()
    return render_template(
        "my_complaints.html", complaints=complaints,
        statuses=COMPLAINT_STATUSES, current_status=status_filter,
    )


@app.route("/student/complaint/<complaint_id>")
@student_login_required
def complaint_details(complaint_id):
    db = get_db()
    complaint = db.execute(
        "SELECT * FROM complaints WHERE complaint_id = ? AND student_id = ?",
        (complaint_id, session["student_id"]),
    ).fetchone()
    if not complaint:
        flash("Complaint not found.", "danger")
        return redirect(url_for("my_complaints"))
    return render_template("complaint_details.html", complaint=complaint, is_admin=False)


@app.route("/student/profile")
@student_login_required
def profile():
    db = get_db()
    student = db.execute(
        "SELECT * FROM students WHERE id = ?", (session["student_id"],)
    ).fetchone()
    counts = get_status_counts(db, student_id=session["student_id"])
    return render_template("profile.html", student=student, counts=counts)


# ---------------------------------------------------------------------------
# ADMIN AUTH
# ---------------------------------------------------------------------------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        db = get_db()
        admin = db.execute(
            "SELECT * FROM admins WHERE username = ?", (username,)
        ).fetchone()

        if admin and check_password_hash(admin["password"], password):
            session.clear()
            session["admin_id"] = admin["id"]
            session["admin_username"] = admin["username"]
            flash("Welcome to the Admin Panel.", "success")
            return redirect(url_for("admin_dashboard"))

        flash("Invalid admin username or password.", "danger")

    return render_template("admin_login.html")


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    flash("Admin logged out.", "info")
    return redirect(url_for("index"))


# ---------------------------------------------------------------------------
# ADMIN DASHBOARD & FEATURES
# ---------------------------------------------------------------------------
@app.route("/admin/dashboard")
@admin_login_required
def admin_dashboard():
    db = get_db()
    counts = get_status_counts(db)
    total_students = db.execute("SELECT COUNT(*) AS c FROM students").fetchone()["c"]
    recent = db.execute(
        """SELECT complaints.*, students.name AS student_name
           FROM complaints JOIN students ON complaints.student_id = students.id
           ORDER BY complaints.created_at DESC LIMIT 5"""
    ).fetchall()
    return render_template(
        "admin_dashboard.html", counts=counts,
        total_students=total_students, recent=recent,
    )


@app.route("/admin/complaints")
@admin_login_required
def manage_complaints():
    db = get_db()
    search = request.args.get("search", "").strip()
    category_filter = request.args.get("category", "")
    status_filter = request.args.get("status", "")

    query = """SELECT complaints.*, students.name AS student_name,
                      students.roll_number AS roll_number
               FROM complaints JOIN students ON complaints.student_id = students.id
               WHERE 1 = 1"""
    params = []

    if search:
        query += """ AND (complaints.title LIKE ? OR complaints.complaint_id LIKE ?
                     OR students.name LIKE ? OR students.roll_number LIKE ?)"""
        like = f"%{search}%"
        params += [like, like, like, like]

    if category_filter in COMPLAINT_CATEGORIES:
        query += " AND complaints.category = ?"
        params.append(category_filter)

    if status_filter in COMPLAINT_STATUSES:
        query += " AND complaints.status = ?"
        params.append(status_filter)

    query += " ORDER BY complaints.created_at DESC"
    complaints = db.execute(query, params).fetchall()

    return render_template(
        "manage_complaints.html",
        complaints=complaints,
        categories=COMPLAINT_CATEGORIES,
        statuses=COMPLAINT_STATUSES,
        search=search,
        current_category=category_filter,
        current_status=status_filter,
    )


@app.route("/admin/complaint/<complaint_id>", methods=["GET", "POST"])
@admin_login_required
def admin_complaint_details(complaint_id):
    db = get_db()
    complaint = db.execute(
        """SELECT complaints.*, students.name AS student_name,
                  students.roll_number AS roll_number, students.email AS student_email,
                  students.department AS student_department
           FROM complaints JOIN students ON complaints.student_id = students.id
           WHERE complaints.complaint_id = ?""",
        (complaint_id,),
    ).fetchone()

    if not complaint:
        flash("Complaint not found.", "danger")
        return redirect(url_for("manage_complaints"))

    if request.method == "POST":
        new_status = request.form.get("status", "")
        admin_response = request.form.get("admin_response", "").strip()

        if new_status not in COMPLAINT_STATUSES:
            flash("Invalid status selected.", "danger")
        else:
            db.execute(
                """UPDATE complaints
                   SET status = ?, admin_response = ?, updated_at = ?
                   WHERE complaint_id = ?""",
                (new_status, admin_response, now_str(), complaint_id),
            )
            db.commit()
            flash("Complaint updated successfully.", "success")
            return redirect(url_for("admin_complaint_details", complaint_id=complaint_id))

    return render_template("complaint_details.html", complaint=complaint, is_admin=True,
                            statuses=COMPLAINT_STATUSES)


@app.route("/admin/students")
@admin_login_required
def students():
    db = get_db()
    all_students = db.execute(
        "SELECT * FROM students ORDER BY created_at DESC"
    ).fetchall()
    return render_template("students.html", students=all_students)


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------
# (Database is already initialized above, at module load time.)
if __name__ == "__main__":
    app.run(debug=True)
