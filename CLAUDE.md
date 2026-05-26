# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (run both)
npm install
cd client && npm install && cd ..

# Development (runs server + client concurrently)
npm run dev

# Server only (nodemon, port 5001)
npm run server

# Client only (Vite, port 5173)
npm run client

# Database
npm run db:sync     # Sync Sequelize models to MySQL
npm run db:seed     # Seed test data

# Production build
npm run build
```

No test suite is configured. No linter is configured.

## Environment Setup

Copy `.env.example` to `.env`. Required values to change:
- `DB_PASS` — MySQL password
- `JWT_SECRET` — random secret string

Database: `CREATE DATABASE fyp_management;` (MySQL 8)

Server runs on **port 5001** (not 5000 as README states). Client proxies `/api` and `/uploads` to `http://localhost:5001`.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| coordinator@fyp.com | password123 | Coordinator |
| supervisor1@fyp.com | password123 | Supervisor |
| student@fyp.com | password123 | Student |

## Architecture

Full-stack FYP management system for UiTM with three roles: **student**, **supervisor**, **coordinator**.

### Backend (`server/`)

Express + Sequelize (MySQL). All models are defined in `server/models/index.js` which also defines every association — this is the single source of truth for the data model. Never write raw SQL with user input; use Sequelize associations (`hasMany`, `belongsTo`), never raw JOINs.

**Request lifecycle:** `server.js` mounts 24 route groups at `/api/{resource}` → route files apply `authenticate` (JWT check) and role middleware (`studentOnly`, `supervisorOnly`, `coordinatorOnly` from `server/middleware/rbac.js`) → controllers handle business logic.

**Standard API response shape:**
```js
{ success: true, data: {...}, message: "..." }   // success
{ success: false, error: "..." }                  // failure
```

Controllers always use `async/await` in `try/catch`. Never return password fields. Use correct HTTP status codes (200, 201, 400, 401, 403, 404, 500).

**File uploads:** Multer middleware in `server/middleware/upload.js` (max 5 files, 10MB each). Uploads served statically from `/uploads`. Always validate file type and size.

**Auth:** Every route except `/api/auth/*` must use the `authenticate` middleware.

### Frontend (`client/src/`)

React 18 + Vite. Global providers in `main.jsx`: `QueryClientProvider` → `BrowserRouter` → `AuthProvider` → `Toaster`.

**Auth flow:** `AuthContext` (`store/AuthContext.jsx`) validates JWT from localStorage against `/api/auth/me` on mount. API calls auto-attach `Authorization: Bearer` via Axios interceptor (`services/api.js`). On 401, token is cleared and user is redirected to `/login`.

**Routing (`App.jsx`):** Three protected route trees — `/student/*`, `/supervisor/*`, `/coordinator/*` — each wrapped in a `ProtectedRoute` that enforces role. Unauthenticated users go to `/login`; wrong-role users are redirected to their own dashboard.

**Layout:** `MainLayout` provides the shared sidebar/header shell. Each role has its own layout (`StudentLayout`, `SupervisorLayout`, `CoordinatorLayout`) that declares its own nav items and wraps nested routes.

**Data fetching:** Use TanStack Query (`useQuery`, `useMutation`) for all server state. Never use `useEffect` to fetch data.

**Forms:** Use React Hook Form + Zod for all forms.

**UI:** Tailwind CSS, Lucide React icons. UiTM brand color: `#8B0000` (maroon).

## Key Conventions

- Comment complex business logic; omit obvious comments
- Ask before making architectural decisions not covered in `instruction.md`
- The full system specification lives in `instruction.md` — read it before starting a significant feature
