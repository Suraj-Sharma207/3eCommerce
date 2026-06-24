# eCommerce Full Stack Application

A production-ready full-stack eCommerce application demonstrating clean architecture, security, and scalability.

## Tech Stack
* **Frontend**: React, Vite, React Router DOM, Axios, Tailwind CSS, Zustand
* **Backend**: Node.js, Express.js
* **Database**: PostgreSQL (Neon DB)
* **ORM**: Prisma ORM
* **Authentication**: JWT, bcrypt
* **Validation**: Zod

## Monorepo Structure
The project uses npm workspaces to manage both frontend and backend dependencies from the root directory.

* `frontend/`: React application
* `backend/`: Node.js Express application
* `docs/`: Additional documentation (API docs)

## Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Environment Setup
1. Copy `.env.example` to `.env` in the `backend` directory and fill in your Neon Database URL and JWT secrets.
2. Copy `.env.example` to `.env` in the `frontend` directory.

### Database Setup
1. Push the Prisma schema to the database:
```bash
npm run db:push --workspace=backend
```
2. Generate the Prisma Client:
```bash
npm run db:generate --workspace=backend
```
3. Seed the database with initial data:
```bash
npm run db:seed --workspace=backend
```

### Running the Application
Start both frontend and backend development servers concurrently:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Features implemented in foundation:
* Clean architecture (Controller -> Service -> Repository)
* Monorepo setup with npm workspaces
* Secure authentication flow (JWT + Bcrypt)
* AES-256-GCM encryption utility for sensitive data
* Global Error handling & Zod request validation
* Tailwind custom professional theme
* React Router setup with protected route placeholders
* Zustand global state management with persistence
* Axios API client with interceptors
