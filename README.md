# Asclepia – Clinical & Patient Management Portal

> A secure, high-performance administrative web application for managing doctors and patients with real-time analytics, JWT-based authentication, and MongoDB-powered data intelligence.

---

## 🚀 Elevator Pitch

**Asclepia** is a full-stack administrative portal that empowers healthcare administrators to efficiently manage doctors and patient registries in one centralized, beautiful interface.

Key differentiators:
- **Server-side everything** — search, filter, pagination, and analytics all live in optimized MongoDB aggregation pipelines and compound indexes, not client-side JS
- **Zero-trust security** — all API endpoints are JWT-protected; tokens are validated on every request with per-request middleware
- **Real-time analytics** — dashboard aggregates live data across doctors, patients, conditions, gender demographics, and 7-day trends without any caching layer needed
- **Separation of concerns** — strictly decoupled frontend (Next.js) and backend (Express), communicating only via RESTful API

---

## ⚙️ Setup Guide

### Prerequisites
- Node.js ≥ 18.x
- MongoDB ≥ 6.x (local or Atlas)

### 1. Clone & Install

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Environment Variables

**Backend** — create `Backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/doctor_tracker
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@doctortracker.com
ADMIN_PASSWORD=Admin@123
```

**Frontend** — create `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Seed the Database

```bash
cd Backend
npm run seed
```

This creates:
- 1 Admin account (credentials from `.env`)
- 5 sample doctors across specializations
- 10 sample patients with doctor assignments

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd Backend
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
# → App running on http://localhost:3000
```

### 5. Login

Navigate to `http://localhost:3000` and use:
- **Email:** `admin@doctortracker.com`
- **Password:** `Admin@123`

---

## 🏗️ System Architecture

```
ASCLEPIA/
├── Backend/                    # Standalone Express API Server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── doctorController.js
│   │   │   ├── patientController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT protect
│   │   │   └── errorMiddleware.js  # Global error handler
│   │   ├── models/
│   │   │   ├── Admin.js        # With bcrypt hashing
│   │   │   ├── Doctor.js       # Compound indexed
│   │   │   └── Patient.js      # Compound indexed
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   ├── patientRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── utils/
│   │   │   └── helpers.js      # JWT generator, paginator
│   │   └── server.js           # Express entry point
│   └── seed.js                 # Database seeder
│
├── Frontend/                   # Standalone Next.js App
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout + metadata
│       │   ├── page.tsx        # Redirects to /login
│       │   ├── providers.tsx   # QueryClient + AuthProvider + Toaster
│       │   ├── login/
│       │   │   └── page.tsx    # JWT login screen
│       │   ├── dashboard/
│       │   │   ├── layout.tsx  # Auth guard
│       │   │   └── page.tsx    # Analytics dashboard
│       │   ├── doctors/
│       │   │   ├── layout.tsx  # Auth guard
│       │   │   └── page.tsx    # Doctor CRUD + patient view
│       │   └── patients/
│       │       ├── layout.tsx  # Auth guard
│       │       └── page.tsx    # Patient CRUD + filtering
│       ├── components/
│       │   └── layout/
│       │       ├── Sidebar.tsx
│       │       └── Topbar.tsx
│       ├── hooks/
│       │   └── useAuth.tsx     # Auth context + localStorage
│       ├── lib/
│       │   ├── api.ts          # Typed API service layer
│       │   ├── apiClient.ts    # Axios instance + interceptors
│       │   └── utils.ts        # Helpers, color maps
│       └── types/
│           └── index.ts        # All TypeScript types
│
└── Utilities/
    └── Logo.svg                # Asclepia brand logo
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Admin login → JWT token |
| GET | `/api/auth/me` | Current admin profile |
| GET | `/api/doctors` | List doctors (search, filter, paginate) |
| POST | `/api/doctors` | Create doctor |
| PUT | `/api/doctors/:id` | Update doctor |
| DELETE | `/api/doctors/:id` | Delete doctor |
| GET | `/api/doctors/:id/patients` | Doctor's patient list |
| POST | `/api/doctors/:id/patients/:pid` | Assign patient to doctor |
| DELETE | `/api/doctors/:id/patients/:pid` | Remove patient from doctor |
| GET | `/api/patients` | List patients (search, filter, paginate) |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |
| GET | `/api/analytics/dashboard` | Full dashboard aggregation |
| GET | `/api/analytics/monthly` | Monthly breakdown by year |

---

## 🧠 Technical Decisions

### 1. MongoDB Compound Indexing
All frequently queried fields have compound indexes defined at the Mongoose schema level:

```js
// Doctor model
DoctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text' });
DoctorSchema.index({ name: 1, createdAt: -1 });
DoctorSchema.index({ specialization: 1 });

// Patient model
PatientSchema.index({ name: 'text', diagnosis: 'text' });
PatientSchema.index({ condition: 1, createdAt: -1 });
PatientSchema.index({ assignedDoctor: 1, createdAt: -1 });
```

This means text search, date-wise filtering, and condition/doctor filtering all hit indexes, not full collection scans.

### 2. MongoDB Aggregation Pipelines
The analytics dashboard uses a single parallel `Promise.all()` with 9 aggregation queries, including:
- `$group` for condition/gender breakdown
- `$lookup` for doctor-patient joins
- `$dateToString` for 7-day trend graphs
- `$match` with date ranges for monthly stats

### 3. TanStack React Query for Data Caching
Instead of `useEffect` + `useState` for API calls, all data fetching uses React Query:
- **30-second stale time** prevents redundant re-fetches
- `queryClient.invalidateQueries()` on mutations ensures UI stays consistent
- `isPending` states drive loading indicators without re-render pollution

### 4. JWT Authentication Strategy
- Token stored in `localStorage` (appropriate for admin-only apps)
- Axios request interceptor attaches `Bearer` token to every request automatically
- Axios response interceptor clears token and redirects on 401
- Backend middleware validates token on every protected route

### 5. Next.js as Pure Client
Since the backend is a fully independent Express server, Next.js is used purely as a React client:
- All data-fetching pages use `"use client"` directive
- No server-side data fetching (no `getServerSideProps`)
- Auth guards are handled client-side via the `useAuth` hook in layout components

### 6. Error Handling
- **Backend:** Centralized `errorMiddleware.js` catches Mongoose validation errors, duplicate key errors (11000), CastErrors, and JWT errors with consistent `{ success, message }` response shape
- **Frontend:** `getErrorMessage()` utility extracts Axios error messages; `react-hot-toast` displays them as styled toasts

---

## 📸 Visual Evidence

### Dashboard Analytics
The dashboard features:
- **Stat cards** for total doctors, patients, critical cases, and stable cases
- **7-day line chart** tracking patient & doctor registrations
- **Gender pie chart** with donut ring visualization
- **Horizontal bar chart** for patient condition breakdown
- **Vertical bar chart** for top doctors by patient count
- **Recent activity feeds** for latest doctors and patients

### Doctors Management
- Searchable, filterable, date-range-sortable table
- Add/Edit modal with full validation
- "View Patients" modal showing all assigned patients
- Graceful delete with patient unassignment

### Patients Registry
- Multi-filter support: condition, gender, date range, text search
- Color-coded condition badges (Critical = red, Stable = blue, etc.)
- Doctor assignment dropdown in the Add/Edit form
- Paginated results with page controls

### Design System
- **Dark mode** base (`#080c10` background, `#e6edf3` text)
- **Brand color:** Teal/Cyan (`#00b4d8`) from Asclepia logo
- **Typography:** Inter font with tight letter-spacing for headings
- **Glassmorphism cards** with subtle borders and backdrop blur
- **Micro-animations:** fadeInUp on page load, hover transforms on stat cards
- **Skeleton loaders** while data fetches

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 15 (App Router) |
| UI Library | React 19 + Custom CSS Design System |
| Styling | Tailwind CSS + Vanilla CSS (CSS Variables) |
| Data Fetching | TanStack React Query v5 |
| Charts | Recharts |
| HTTP Client | Axios |
| Backend Framework | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Security | Helmet + CORS |
| Icons | Lucide React |
