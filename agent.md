# AGENTS.md — Tutoring Center Management System (TSC)

## 1. Project Overview & Purpose
The **Tutoring Center Management System (TSC)** is a web-based platform designed to manage university tutoring activities, verify tutoring sessions, calculate official tutoring hours, and maintain centralized records.

### 1.1 Problem Statement
Manual recording of tutoring sessions and hours often leads to inaccurate or fraudulent tutoring-hour records, along with challenges in monitoring tutor performance.

### 1.2 Proposed Solution
The system records and verifies tutoring sessions using attendance tracking, session timestamps, and verification mechanisms (such as QR codes and location verification for physical sessions). Only verified and completed sessions are used to automatically calculate tutoring hours and generate performance metrics.

---

## 2. Core Business Rules (STRICT / NON-NEGOTIABLE)

1. **Automated Hour Calculation Only**:
   - Official tutoring hours **shall ONLY** be calculated from verified and completed tutoring sessions.
   - **Tutors shall NOT be able to manually add, override, or modify official tutoring hours.**
2. **Immutability of Completed Sessions**:
   - Once a session is finalized/completed, its records (start time, end time, duration, verified attendees) **must not be editable** by tutors.
3. **Duplicate Attendance Prevention**:
   - Duplicate attendance entries for the same student in the same session must be strictly prevented at the database and API levels.
4. **Mandatory Audit Logging**:
   - Critical events (session creation, start/end timestamps, attendance marking, administrative interventions, flagging) must be captured in audit logs.

---

## 3. Technology Stack & Backend Architecture

- **Runtime & Language**: Node.js (ES Modules: `"type": "module"`)
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt password hashing
- **Architecture Pattern**: Layered REST API (Routes -> Middlewares -> Controllers -> Services -> Models -> Utils)

### Project Directory Structure
```
TSC_BACKEND/
├── controllers/          # Request handlers & HTTP responses
│   ├── authController.js
│   ├── feedbackController.js
│   ├── sessionController.js
│   └── userController.js
├── middlewares/          # JWT auth, role validation, error handlers
│   ├── adminMiddleware.js
│   └── authMiddleware.js
├── models/               # Mongoose schemas & data models
│   ├── Admin.js
│   ├── feedback.js
│   ├── Session.js
│   └── User.js
├── routes/               # API endpoint routing
│   ├── authRoutes.js
│   ├── feedbackRoute.js
│   └── userRoute.js
├── services/             # Business logic & verification algorithms
│   ├── authService.js
│   └── feedbackService.js
├── utils/                # Helper utilities (token generation, hashing, math)
│   ├── generateToken.js
│   ├── hashPassword.js
│   └── rating.js
├── .env                  # Environment variables (DB URI, JWT secret, Port)
├── index.js              # Application entry point & DB connection
└── package.json          # Dependencies & scripts
```

---

## 4. User Roles & Permissions (RBAC)

### 4.1 Student
- Register and log in.
- View and search available tutoring sessions (physical and online).
- Join sessions.
- Mark and verify attendance (e.g., via QR code or location check).
- View personal attended sessions and accumulated tutoring hours.
- Submit session feedback and ratings for tutors.

### 4.2 Tutor
- Register and log in.
- Create and manage tutoring sessions (schedule, topic, mode: physical/online).
- Start and end tutoring sessions (capturing accurate server timestamps).
- Monitor student attendance in real-time.
- View verified tutoring hours (read-only, calculated automatically).
- View personal performance statistics and feedback.

### 4.3 Administrator
- Dedicated administrator authentication and dashboard.
- Manage students and tutors (activate, deactivate, inspect accounts).
- Monitor all tutoring sessions and attendance records.
- Review and resolve suspicious or flagged sessions.
- Access system-wide reports and analytics.
- Manage tutor performance metrics and "Tutor of the Month" selection.

---

## 5. Functional Requirements (FR) Specification

| ID | Feature | Specification |
| :--- | :--- | :--- |
| **FR1** | **Authentication & Authorization** | Secure registration, login, logout, password reset, and role-based access control (Student, Tutor, Admin) using JWT. |
| **FR2** | **Session Management** | Tutors can schedule, start, monitor, and end sessions. Sessions support both physical and online modes. |
| **FR3** | **Attendance Tracking** | Students join sessions and have attendance securely recorded. Prevents duplicate check-ins. |
| **FR4** | **Session Verification** | Verification using server timestamps, QR codes, and location verification for physical sessions. |
| **FR5** | **Tutoring Hour Calculation** | System automatically computes official tutoring hours based solely on verified, completed sessions. Manual entry is prohibited. |
| **FR6** | **Performance Tracking** | Computes tutor performance metrics: verified hours, sessions conducted, unique students assisted, and feedback ratings. |
| **FR7** | **Tutor of the Month** | Generates monthly tutor rankings and statistics based on predefined objective criteria. |
| **FR8** | **Administration** | Admin capabilities to manage users, sessions, attendance, flagged/suspicious activities, and system settings. |
| **FR9** | **Reporting & Analytics** | Detailed reporting on tutoring hours, attendance rates, session distributions, and student/tutor participation. |
| **FR10** | **Audit Logging** | Immutable logs for session creation, start/end actions, attendance verification, and administrative actions. |

---

## 6. Non-Functional & Security Requirements

- **Security**:
  - Passwords hashed with salted bcrypt prior to persistence.
  - JWT used for stateless authentication with role-based authorization guards on protected routes.
  - Principle of least privilege for resource access.
- **Data Integrity & Reliability**:
  - Session records become read-only once marked as completed.
  - Unique compound constraints and atomic operations to eliminate duplicate attendance.
- **Performance & Scalability**:
  - Efficient MongoDB indexing on frequent query fields (`tutorId`, `sessionId`, `studentId`, `status`, `createdAt`).
  - Aggregation pipelines optimized for analytics and report generation.
- **Usability**:
  - Standardized JSON REST API responses with clear status codes and meaningful error messages.

---

## 7. Guidelines for AI Agents Working on this Codebase

1. **Preserve Business Invariants**: Under no circumstances should an endpoint or service allow tutors or students to manually inject or alter official hours.
2. **Verification Integrity**: When implementing or altering session completion logic, always ensure timestamp verification and attendance checks are strictly enforced.
3. **Modular ES Modules**: Maintain the project's ES Module structure (`import`/`export`), separating concerns across routes, controllers, services, models, and middlewares.
4. **Error Handling**: Use consistent HTTP response formats (`{ success: boolean, message: string, data?: any }`) with appropriate HTTP status codes (400, 401, 403, 404, 500).
5. **Security Checks**: Ensure all sensitive routes are wrapped with `authMiddleware` and appropriate role checks (`adminMiddleware`, tutor ownership checks).
