# FYP Management System — Full Build Prompt for Cursor

## OVERVIEW

Build a full-stack web application called the **Final Year Project (FYP) Management System** for Universiti Teknologi MARA (UiTM). This system replaces fragmented manual FYP processes (spreadsheets, emails, WhatsApp, physical forms) with a centralized, workflow-based digital platform.

The system has **three user roles**: Student, Supervisor, and Coordinator. Each role has its own dashboard and feature set. All workflows are enforced — users cannot skip steps.

---

## TECH STACK

### Frontend

- **React.js v18+** with **Vite**
- **React Router v6** for routing
- **TanStack Query (React Query v5)** for server state management
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** with **Zod** for form validation
- **Lucide React** for icons

### Backend

- **Node.js** with **Express.js**
- **Sequelize ORM** with **MySQL 8.0**
- **JWT** (jsonwebtoken) for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **PDFKit** or **pdf-lib** for PDF generation
- **CORS**, **helmet**, **express-rate-limit** for security
- **dotenv** for environment variables

### Database

- **MySQL 8.0**

### Other

- File storage: local `/uploads` directory (structured by type)
- Environment: development on localhost

---

## PROJECT STRUCTURE

```
fyp-management-system/
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/             # Shared UI components
│   │   │   ├── student/
│   │   │   ├── supervisor/
│   │   │   └── coordinator/
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── supervisor/
│   │   │   └── coordinator/
│   │   ├── services/               # Axios API service files
│   │   ├── store/                  # Auth context / state
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                         # Express backend
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   ├── rbac.js                 # Role-based access control
│   │   └── upload.js               # Multer config
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── pdfService.js
│   ├── uploads/                    # File storage
│   └── server.js
│
├── .env
└── README.md
```

---

## DATABASE SCHEMA

Create the following MySQL tables using Sequelize models with associations:

### 1. `users`

```
id (PK, auto-increment)
name (VARCHAR 255, NOT NULL)
email (VARCHAR 255, UNIQUE, NOT NULL)
password (VARCHAR 255, NOT NULL)  -- bcrypt hashed
role (ENUM: 'student', 'supervisor', 'coordinator')
is_active (BOOLEAN, default true)
created_at, updated_at
```

### 2. `student_profiles`

```
id (PK)
user_id (FK → users.id, UNIQUE)
student_id (VARCHAR 20, UNIQUE)
programme (VARCHAR 100)
group_name (VARCHAR 10)           -- e.g. "CS5A"
current_supervisor_id (FK → users.id, NULLABLE)
fyp_title (VARCHAR 500, NULLABLE)
fyp_status (ENUM: 'no_supervisor', 'pending_approval', 'active', 'submitted', 'completed')
created_at, updated_at
```

### 3. `supervisor_profiles`

```
id (PK)
user_id (FK → users.id, UNIQUE)
staff_id (VARCHAR 20, UNIQUE)
expertise (TEXT)                  -- comma-separated or JSON array
max_students (INT, default 5)
current_student_count (INT, default 0)
is_accepting (BOOLEAN, default true)
created_at, updated_at
```

### 4. `supervision_requests`

```
id (PK)
student_id (FK → users.id)
supervisor_id (FK → users.id)
title_proposed (VARCHAR 500)
message (TEXT)
status (ENUM: 'pending', 'accepted', 'rejected')
rejected_reason (TEXT, NULLABLE)
created_at, updated_at
```

### 5. `submissions`

```
id (PK)
student_id (FK → users.id)
supervisor_id (FK → users.id)
title (VARCHAR 255)
submission_type (ENUM: 'proposal', 'progress_report', 'draft', 'final')
description (TEXT, NULLABLE)
external_link (VARCHAR 500, NULLABLE)
status (ENUM: 'pending', 'reviewed', 'approved', 'revision_required')
supervisor_feedback (TEXT, NULLABLE)
submitted_at (DATETIME)
reviewed_at (DATETIME, NULLABLE)
created_at, updated_at
```

### 6. `submission_attachments`

```
id (PK)
submission_id (FK → submissions.id)
file_name (VARCHAR 255)
file_path (VARCHAR 500)
file_type (VARCHAR 255)
file_size (INT)
uploaded_at (DATETIME)
```

### 7. `meeting_logs`

```
id (PK)
student_id (FK → users.id)
supervisor_id (FK → users.id)
meeting_date (DATE)
meeting_time (TIME)
location (VARCHAR 255)
agenda (TEXT)
student_notes (TEXT, NULLABLE)
supervisor_notes (TEXT, NULLABLE)
outcome (TEXT, NULLABLE)
status (ENUM: 'scheduled', 'completed', 'cancelled')
created_by (FK → users.id)
created_at, updated_at
```

### 8. `official_documents`

```
id (PK)
student_id (FK → users.id)
supervisor_id (FK → users.id, NULLABLE)
document_type (ENUM: 'mutual_acceptance', 'progress_report_form', 'evaluation_form')
file_path (VARCHAR 500)
generated_at (DATETIME)
created_at, updated_at
```

### 9. `notifications`

```
id (PK)
user_id (FK → users.id)
title (VARCHAR 255)
message (TEXT)
type (ENUM: 'info', 'success', 'warning', 'error')
is_read (BOOLEAN, default false)
related_id (INT, NULLABLE)        -- ID of related record
related_type (VARCHAR 50, NULLABLE) -- e.g. 'submission', 'meeting'
created_at
```

---

## AUTHENTICATION & AUTHORIZATION

- JWT-based auth with access tokens (expiry: 7 days)
- Token stored in `localStorage`
- All routes protected — unauthenticated users redirected to `/login`
- Role-based access control (RBAC):
  - `/student/*` — only role: student
  - `/supervisor/*` — only role: supervisor
  - `/coordinator/*` — only role: coordinator
- Middleware: `verifyToken`, `requireRole(['student'])`, etc.
- On login, return `{ token, user: { id, name, email, role } }`
- Seed the database with test accounts:
  - `student@fyp.com` / `password123` (role: student)
  - `supervisor@fyp.com` / `password123` (role: supervisor)
  - `coordinator@fyp.com` / `password123` (role: coordinator)

---

## FEATURE SPECIFICATIONS

---

### AUTH PAGES

#### `/login`

- Email + password form
- On success: store JWT, redirect based on role
- Show error for invalid credentials
- Clean, centered card layout with UiTM branding (use maroon `#8B0000` as primary color)

#### `/register` (optional, or admin-seeded only)

- Fields: name, email, password, role, student number / staff ID
- Validate email uniqueness

---

### STUDENT FEATURES (`/student/*`)

#### Dashboard (`/student/dashboard`)

- Welcome message with student name
- Status card showing current FYP status (color-coded)
- Quick stats: pending submissions, upcoming meetings, unread notifications
- Recent activity feed
- Quick action buttons: Submit Progress, Book Meeting, View Supervisor

#### Supervisor Marketplace (`/student/supervisors`)

- Grid/list of all supervisors who are accepting students
- Each card shows: name, expertise tags, current load bar (e.g. 3/5 students), availability badge
- Search by name or expertise
- Filter by: available only, expertise area
- Click card → view supervisor profile
- "Request Supervision" button — opens modal with:
  - Proposed FYP title (text input)
  - Message to supervisor (textarea)
  - Submit button (disabled if student already has pending request or active supervisor)
- Show student's own pending/rejected requests

#### My Supervisor (`/student/supervisor`)

- Shows accepted supervisor's details
- Only accessible after supervision is accepted
- Redirect to marketplace if no supervisor

#### Submissions (`/student/submissions`)

- List of all past submissions with status badges
- "New Submission" button → form with:
  - Title (text input)
  - Submission type (dropdown: proposal, progress report, draft, final)
  - Description (textarea, optional)
  - File upload (multiple files, max 10MB each, accept: pdf, docx, pptx, zip)
  - External link (optional URL input)
  - Submit button
- Click submission → detail view with supervisor feedback if reviewed
- Cannot submit if no active supervisor

#### Meeting Logbook (`/student/meetings`)

- Calendar view + list view toggle
- "Book Meeting" button → form with:
  - Date picker
  - Time picker
  - Location (text input with suggestions: "Online - Google Meet", "Faculty Room", etc.)
  - Agenda (textarea)
- List of all meetings: scheduled, completed, cancelled
- Click meeting → detail view, add student notes after completion

---

### SUPERVISOR FEATURES (`/supervisor/*`)

#### Dashboard (`/supervisor/dashboard`)

- Welcome message
- Stats: total students supervised, pending requests, pending reviews, upcoming meetings
- Quick action cards
- Recent submission activity

#### Supervision Requests (`/supervisor/requests`)

- Table of all incoming supervision requests
- Each row: student name, proposed title, date, status badge, action buttons
- "Accept" → updates request status, creates supervisor-student link, increments student count, generates Mutual Acceptance PDF, sends notification
- "Reject" → modal to enter rejection reason, sends notification to student
- Quota guard: if `current_student_count >= max_students`, disable Accept button with tooltip "Quota full"

#### My Students (`/supervisor/students`)

- Grid of currently supervised students
- Each card: student name, programme, FYP title, status badge, progress indicator
- Click → student detail view with full submission history and meeting logs

#### Submission Review (`/supervisor/submissions`)

- List of all student submissions needing review (status: pending)
- Filter by: student, submission type, date
- Click submission → review workspace:
  - View submitted files (PDF viewer for PDFs, download for others)
  - External link display
  - Feedback textarea
  - Status dropdown: approved / revision_required
  - Submit Review button
  - Mark as reviewed updates submission status and notifies student

#### Meeting Management (`/supervisor/meetings`)

- View all meetings with all supervised students
- Can add supervisor notes to completed meetings
- Can cancel scheduled meetings (with reason)

#### Availability Toggle (`/supervisor/settings`)

- Toggle "Accepting Students" on/off
- Update max student quota
- Update expertise tags

---

### COORDINATOR FEATURES (`/coordinator/*`)

#### Dashboard (`/coordinator/dashboard`)

- System-wide statistics:
  - Total students, supervisors, active supervision pairs
  - Submission counts by type and status
  - Students without supervisors count (alert if high)
- Bar chart: submissions per week (last 8 weeks) — use Recharts
- Pie chart: FYP status distribution
- Table: students without supervisors (with direct action to contact)

#### Student Management (`/coordinator/students`)

- Full table of all students with columns:
  - Name, Student No., Programme, Group, Supervisor, FYP Status
- Search and filter by: group, programme, status, supervisor
- Click row → student profile modal with full details
- Export to CSV button

#### Supervisor Management (`/coordinator/supervisors`)

- Table of all supervisors with: name, expertise, current load, max quota, availability
- Click → supervisor profile
- Edit quota button (coordinator can override max_students)

#### Reports (`/coordinator/reports`)

- Generate and download official forms as PDF:
  - Cohort progress summary report
  - Students without supervisors list
  - Submission status report
- Date range filter

---

## API ROUTES

### Auth

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
```

### Users

```
GET    /api/users/profile
PUT    /api/users/profile
```

### Supervisors

```
GET    /api/supervisors                    -- list all (for marketplace)
GET    /api/supervisors/:id               -- single supervisor profile
PUT    /api/supervisors/availability      -- toggle accepting
PUT    /api/supervisors/quota             -- update max students
```

### Supervision Requests

```
POST   /api/requests                      -- student creates request
GET    /api/requests/incoming             -- supervisor sees incoming
GET    /api/requests/my                   -- student sees own requests
PUT    /api/requests/:id/accept           -- supervisor accepts
PUT    /api/requests/:id/reject           -- supervisor rejects
```

### Submissions

```
POST   /api/submissions                   -- student creates
GET    /api/submissions/my                -- student's own
GET    /api/submissions/pending           -- supervisor's pending reviews
GET    /api/submissions/:id
PUT    /api/submissions/:id/review        -- supervisor reviews
```

### Meetings

```
POST   /api/meetings                      -- create meeting
GET    /api/meetings/my                   -- all meetings for logged-in user
GET    /api/meetings/:id
PUT    /api/meetings/:id                  -- update notes / status
DELETE /api/meetings/:id                  -- cancel
```

### Notifications

```
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

### Documents

```
POST   /api/documents/generate/:type     -- generate PDF
GET    /api/documents/my
GET    /api/documents/:id/download
```

### Coordinator

```
GET    /api/coordinator/stats
GET    /api/coordinator/students
GET    /api/coordinator/supervisors
PUT    /api/coordinator/supervisors/:id/quota
GET    /api/coordinator/reports/:type
```

---

## UI/UX REQUIREMENTS

### Color Scheme

- Primary: `#8B0000` (UiTM Maroon)
- Primary Light: `#B22222`
- Secondary: `#1E3A5F` (Dark Blue)
- Accent: `#F59E0B` (Amber)
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Background: `#F8FAFC`
- Card: `#FFFFFF`

### Layout

- Persistent sidebar navigation (collapsible on mobile)
- Top navbar with: page title, notification bell with badge, user avatar dropdown (profile, logout)
- Breadcrumb navigation on all inner pages
- Responsive design (mobile-first)

### Components to Build

- `<StatusBadge status="pending|active|completed|..." />`
- `<QuotaBar current={3} max={5} />`
- `<FileUploader onUpload={fn} accept=".pdf,.docx" multiple />`
- `<NotificationDropdown />`
- `<ConfirmModal title message onConfirm onCancel />`
- `<EmptyState icon message actionLabel onAction />`
- `<DataTable columns data searchable filterable />`
- `<StatsCard icon label value trend />`

### Forms

- All forms use React Hook Form + Zod validation
- Show inline validation errors
- Disable submit button while loading
- Show success/error toast on completion (use a simple custom toast or react-hot-toast)

---

## BUSINESS LOGIC & WORKFLOW RULES

Enforce these rules strictly in the backend:

1. **One active supervisor per student** — A student cannot send a new supervision request if they already have an accepted supervisor or a pending request.

2. **Supervisor quota enforcement** — If `current_student_count >= max_students`, the system must prevent accepting new requests (return 400 error).

3. **Submission gate** — Students can only submit if they have an active supervisor (status: 'active').

4. **Meeting gate** — Students can only book meetings if they have an active supervisor.

5. **Coordinator override** — Coordinator can update supervisor quota even if at capacity (no gate for coordinator).

6. **Auto-notification** — Send a notification record whenever:
   - Supervision request is sent (to supervisor)
   - Request is accepted or rejected (to student)
   - Submission is reviewed (to student)
   - Meeting is booked (to both parties)
   - Meeting is cancelled (to both parties)

7. **Document generation on acceptance** — When a supervision request is accepted, automatically generate a Mutual Acceptance PDF with both parties' names and the proposed FYP title and store it in `official_documents`.

---

## PDF GENERATION

Use **PDFKit** to generate official documents. Create a `pdfService.js` with:

```javascript
generateMutualAcceptance({ student, supervisor, title, date });
// Returns a PDF with UiTM header, student/supervisor details, FYP title, date, signature lines

generateProgressReport({ student, supervisor, submissions, meetings });
// Returns a summary PDF of all submissions and meetings
```

Store generated PDFs in `server/uploads/documents/` and save the path in `official_documents` table.

---

## SECURITY REQUIREMENTS

- All routes (except `/api/auth/login` and `/api/auth/register`) require valid JWT
- Role checks on every protected route via `requireRole` middleware
- File uploads: validate file type (whitelist), limit size to 10MB, use UUID for stored filenames
- Use Sequelize parameterized queries (never raw SQL with user input)
- Rate limiting: 100 requests per 15 minutes per IP on auth routes
- CORS: allow only `http://localhost:5173` in development
- Passwords: bcrypt with salt rounds = 10
- Never return password field in any API response

---

## SEED DATA

Create a seed file `server/seeders/seed.js` that populates:

**Users (10 total):**

- 1 coordinator
- 3 supervisors (with different expertise, quota levels)
- 6 students (in different FYP stages: no supervisor, pending, active, completed)

**Supervisor Profiles:**

- Supervisor 1: expertise "Artificial Intelligence, Machine Learning", max 5, has 2 students
- Supervisor 2: expertise "Web Development, Cloud Computing", max 4, has 4 students (near quota)
- Supervisor 3: expertise "Cybersecurity, Network Systems", max 5, has 0 students

**Sample Data:**

- 2 pending supervision requests
- 4 submissions across different students (mix of statuses)
- 6 meeting logs (mix of scheduled/completed)
- 5 notifications

---

## ENVIRONMENT VARIABLES (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fyp_management
DB_USER=root
DB_PASS=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Client URL
CLIENT_URL=http://localhost:5173
```

---

## STARTUP SCRIPTS

In `package.json` (root or server):

```json
"scripts": {
  "dev": "nodemon server.js",
  "db:sync": "node config/syncDb.js",
  "db:seed": "node seeders/seed.js"
}
```

In `client/package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build"
}
```

---

## IMPLEMENTATION ORDER (Build in this sequence)

1. Database setup + Sequelize models + associations
2. Express server scaffold + middleware setup
3. Auth routes + JWT middleware
4. User/profile routes
5. Supervisor marketplace routes
6. Supervision request routes + quota enforcement
7. Submission routes + file upload
8. Meeting routes
9. Notification system
10. Document generation (PDF)
11. Coordinator stats + reports
12. React app scaffold + routing + auth context
13. Login page
14. Student dashboard + marketplace UI
15. Student submissions UI
16. Student meeting logbook UI
17. Supervisor dashboard + requests UI
18. Supervisor submission review UI
19. Coordinator dashboard with charts
20. Coordinator management tables
21. Notification dropdown
22. Polish: loading states, empty states, error handling, responsive

---

## NOTES FOR CURSOR

- Use async/await throughout (no callbacks or raw promises)
- Every controller function must be wrapped in try/catch with proper error responses
- Standard API response format:
  ```json
  { "success": true, "data": {...}, "message": "..." }
  { "success": false, "error": "...", "message": "..." }
  ```
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500)
- Comment complex business logic
- Use Sequelize associations (`hasMany`, `belongsTo`, `hasOne`) — do not do manual JOIN queries
- For file serving, add a static route: `app.use('/uploads', express.static('uploads'))`
- Protect the uploads directory so only authenticated users can access files through API routes
