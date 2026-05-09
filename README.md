# FYP Management System

A full-stack web application for managing Final Year Projects at Universiti Teknologi MARA (UiTM). Replaces fragmented manual processes with a centralized, workflow-based platform.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod
- **Backend**: Node.js, Express, Sequelize, MySQL 8
- **Auth**: JWT, bcryptjs

## Setup

### 1. Database

Create a MySQL database:

```sql
CREATE DATABASE fyp_management;
```

### 2. Environment

Copy `.env.example` to `.env` and update:

- `DB_PASS` - Your MySQL password
- `JWT_SECRET` - A secure random string

### 3. Install & Run

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Sync database
npm run db:sync

# Seed test data
npm run db:seed

# Start dev (server + client)
npm run dev
```

- **Server**: http://localhost:5000
- **Client**: http://localhost:5173

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| coordinator@fyp.com | password123 | Coordinator |
| supervisor1@fyp.com | password123 | Supervisor |
| supervisor2@fyp.com | password123 | Supervisor |
| supervisor3@fyp.com | password123 | Supervisor |
| student@fyp.com | password123 | Student |

## Features

- **Students**: Dashboard, supervisor marketplace, submissions, meeting logbook
- **Supervisors**: Requests, my students, submission review, meeting management, availability toggle
- **Coordinators**: System stats, student/supervisor management, reports export
