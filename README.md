# WorkPulse - Enterprise Attendance & Workforce Productivity Platform

WorkPulse is an Employee Attendance, Geofencing, and Workforce Productivity Management platform.
Tech Stack: Node.js, Express, Prisma ORM, SQLite / PostgreSQL, React 18 (Vite), Tailwind CSS, Recharts, jsPDF.

---

## Project Requirements Compliance Matrix

Every required feature is implemented and tested:

| # | Required Feature | Implementation Status | Key Components & Logic |
| :---: | :--- | :---: | :--- |
| 1 | Employee Login & Registration | Implemented | Dual-role RBAC (Employee / HR), bcrypt hashed passwords, JWT authentication, department assignment, and an Admin Security Passcode Gatekeeper (Admin@123). |
| 2 | Attendance Check-In / Check-Out | Implemented | Digital shift timer, instant check-in/out triggers, geolocation capture, and Haversine distance verification against the office geofence. |
| 3 | Working Hours Calculation | Implemented | Automated net working hours: Net Hours = (CheckOut - CheckIn) - Break Durations. Supports Lunch, Coffee, and Meeting pause tracking. |
| 4 | Leave Deduction Calculation | Implemented | Shift duration calculations: >= 8.0h marks 0d deducted, 4.0 - 7.9h marks -0.5d deducted (Half Day), < 4.0h marks -1.0d deducted (Absent). Auto-updates remaining leave balance. |
| 5 | HR Dashboard | Implemented | Real-time workforce metrics, searchable and filterable attendance ledger, Burnout & Integrity scores, immutable audit trail with before and after diffs, and System Settings. |
| 6 | Employee Dashboard | Implemented | Personal shift console, live stopwatch, interactive monthly calendar grid, shift breakdown history, personal integrity ratings, and branded PDF transcript export. |
| 7 | Attendance Status Tracking | Implemented | Real-time status badges (Present, Late after 09:30 AM, Half Day, Absent, On Leave), remote vs office geofence detection, and audit edit tags. |

---

## Key Capabilities & System Features

### Core Features
1. Dynamic Office Location & Geofence GPS Engine:
   - HR Admins can dynamically configure the Office Name, Address, Latitude, Longitude, and Allowed Geofence Radius directly from the Admin Dashboard or via device GPS auto-detection.
   - Live distance is computed using the Haversine formula. Check-ins recorded beyond the configured perimeter are flagged in real-time as Remote / Out of Bounds.

2. Role-Based Access Control & Admin Security Gatekeeper:
   - Dual-role authentication (Employee and HR Admin) with JWT session authorization and bcrypt password hashing.
   - Admin Registration Security Gate: Public registration allows standard Employee accounts. Creating an HR Admin account requires an Organization Admin Security Key (Admin@123), preventing unauthorized administrative privilege escalation.

3. Shift Stopwatch & Break Tracker:
   - Digital shift timer with instant Check-In and Check-Out triggers.
   - Break Tracker supporting Lunch, Coffee, and Meeting intervals with dynamic net-hour deduction upon checkout.

4. Calculations & Leave Deductions:
   - Shift Cutoff: Check-ins after 09:30 AM mark status as Late.
   - Absent Rule: Net Hours < 4.0h marks Absent and deducts 1.0 Day from leave balance.
   - Half Day Rule: 4.0h <= Net Hours < 8.0h marks Half Day and deducts 0.5 Day from leave balance.
   - Present Rule: Net Hours >= 8.0h marks Present (or Late) with 0.0 Days deducted.
   - Database transactions (prisma.$transaction) ensure consistent atomic updates.

5. Attendance Integrity & Burnout Risk Analytics:
   - Integrity Index (0-100%): Real-time punctuality, consistency, and compliance rating (Grade A+ to D).
   - Burnout Alert System: Analyzes multi-week trends. Automatically flags staff exceeding 50 working hours per week for 3 or more consecutive rolling weeks with actionable HR recommendations.

6. Immutable HR Audit Logging:
   - Every administrative override (modifying shift timestamps, changing attendance statuses, or overriding leave balances) writes an append-only record to the audit_logs table with full before and after JSON diff snapshots.

7. Automated Employee Email Notifications:
   - Whenever an administrative change is performed (Attendance Record Edit, Leave Balance Adjustment, or Account Deletion), an automated notification email is generated and dispatched to the employee with modified fields, the admin name, and the reason. Supports live SMTP (Gmail, Outlook, SendGrid) or local development logging.

8. Automated PDF Transcript Generation:
   - Built with jsPDF and jspdf-autotable to export personal attendance statements and master workforce compliance audits.

---

## Default Accounts & Credentials

The system comes pre-configured with the following baseline accounts:

| Full Name | Role | Email / Username | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| Vikram Mehta | HR Admin | admin@innereye.com | Admin@123 | Full HR Console, Geofencing Settings, Audit Trail & Analytics |
| John Doe | Employee | john.doe@innereye.com | Employee@123 | Shift Console, Break Tracker, Personal Attendance Log & PDF Export |
| Alex Rivera | Employee | alex.rivera@innereye.com | Employee@123 | Shift Console, Personal Attendance Log & Burnout Indicators |
| olina | Employee | kunduolina@gmail.com | (User password) | Shift Console, Personal Attendance Log & Summary Export |

Note on New Registrations:
- Users can create new Employee accounts via the Sign Up tab on the login page.
- To create an HR Admin account, enter the organization security passcode: Admin@123 (configurable via ADMIN_REGISTRATION_KEY).

---

## Setup & Running Locally

### Prerequisites
- Node.js (v18.x, v20.x, or v22.x)
- npm (v9.x or v10.x)

---

### Quick Start (From Root)

1. Clone the repository:
```bash
git clone https://github.com/OlinaKundu/WorkPulse.git
cd WorkPulse
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Initialize database and seed demo data:
```bash
npm run db:init
```

4. Start backend and frontend (separate terminals):
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run start:backend

# Terminal 2: Frontend App (http://localhost:3000)
npm run dev:frontend
```

---

### Configuring Company Gmail for Live Email Notifications

WorkPulse allows HR Administrators to configure company email delivery directly from the Admin Portal:

1. Directly via the Admin Portal:
   - Log into the HR Admin account (admin@innereye.com / Admin@123).
   - Click the System Settings tab in the top navigation bar.
   - In the Company Email & SMTP card, enter your company Gmail address (e.g. hr@company.com).
   - Enter your 16-character Google App Password.
   - Click Send Test Email to verify connection, then click Save Email Setup.
   - All subsequent employee notifications will be sent live from your Gmail address.

2. How to Generate a Google App Password:
   - Go to your Google Account -> Security -> ensure 2-Step Verification is turned ON.
   - Visit https://myaccount.google.com/apppasswords
   - Enter App Name: WorkPulse
   - Google will display a 16-character code (e.g. abcd efgh ijkl mnop).
   - Paste this code into the Google App Password field in the Admin Portal.

---

### Database Inspection (Prisma Studio)
To view and edit database tables, users, attendance logs, and audit records visually in your browser:
```bash
cd backend
npm run studio
```

---

## REST API Endpoint Reference

### Authentication & Profiles
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| POST | /api/auth/register | Public (Passcode for HR) | Register a new user account with role validation |
| POST | /api/auth/login | Public | Authenticate user and issue JWT access token |
| GET | /api/auth/departments | Public | List available company departments for registration |
| GET | /api/auth/me | Authenticated | Retrieve current user profile and leave balance |

### Employee Shift & Attendance
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| POST | /api/attendance/check-in | Employee | Log daily check-in with GPS Haversine verification |
| POST | /api/attendance/check-out | Employee | Finalize shift, calculate net hours, deduct leave |
| GET | /api/attendance/today | Employee | Get today active shift and break status |
| GET | /api/attendance/my-history | Employee | Get user monthly attendance history |
| POST | /api/breaks/start | Employee | Start a shift break (Lunch, Coffee, Meeting) |
| POST | /api/breaks/end | Employee | End active shift break |

### HR Administration & System Settings
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| GET | /api/admin/stats | HR Admin | Get real-time workforce KPIs (Present, Late, Absent, Remote) |
| GET | /api/admin/workforce-attendance | HR Admin | Filterable workforce attendance ledger |
| GET | /api/admin/settings/office | HR Admin | Get active office address & geofence parameters |
| PUT | /api/admin/settings/office | HR Admin | Update office address, latitude, longitude, radius |
| PUT | /api/admin/attendance/:id | HR Admin | Override attendance status/hours with audit log |
| PUT | /api/admin/user/:id/leave-balance | HR Admin | Override employee leave balance with audit log |
| DELETE | /api/admin/users/:userId | HR Admin | Permanently delete employee account & records |
| GET | /api/audit/logs | HR Admin | Retrieve append-only immutable audit trail |
| GET | /api/analytics/workforce | HR Admin | Get Burnout and Attendance Integrity analytics |

---

## Business Rules & Calculation Formulas

1. Shift Punctuality: Standard workday starts at 09:30 AM. Check-ins after 09:30 AM mark status as Late.
2. Break Deductions: Net Working Hours = (CheckOut - CheckIn) - Sum of Break Durations.
3. Leave Deduction Matrix:
   - Net Hours < 4.0h marks Absent (-1.0d from leave balance).
   - 4.0h <= Net Hours < 8.0h marks Half Day (-0.5d from leave balance).
   - Net Hours >= 8.0h marks Present (0.0d deduction).
4. Geofencing (Haversine Formula):
   - Check-ins recorded farther than the configured office radius (default 200m) are marked as Remote Check-in.

---

## Security & Architecture Highlights
- Password Security: Salted cryptographic hashes using bcryptjs.
- JWT Authorization: Signed tokens validated on every private API route.
- Transactional Consistency: Type-safe database queries and atomic consistency via Prisma ORM.
- Admin Gatekeeper: Prevents unauthorized public escalation to the HR role.
- Immutable Audit Trail: Append-only ledger documenting administrative overrides with before and after state snapshots.

---

