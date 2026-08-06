# The Balcony House — Full-Stack Skeleton

**Stay a little longer.**

A minimal-but-working skeleton for a boutique mountain-stay brand site:
React (Vite + Tailwind) frontend, Spring Boot 3 / Java 21 backend, PostgreSQL,
Redis-backed server-side sessions, and Google OAuth2/OIDC login — with tokens
kept entirely on the server.

## What's implemented

- **Auth architecture exactly as specified**: Spring Security handles the full
  Google OAuth2/OIDC flow. Access/refresh tokens never leave the backend. The
  browser only ever holds a `HttpOnly`, `Secure`-in-prod, `SameSite=Lax`
  session cookie (`BALCONYSESSION`). CSRF is protected via the standard
  cookie/header double-submit pattern (`XSRF-TOKEN` cookie ↔ `X-XSRF-TOKEN`
  header), which axios handles automatically.
- **Spring Session**, wired to Redis, so sessions can scale horizontally.
  Inactivity timeout, session-fixation protection, and clean logout
  (cookie deletion + session invalidation) are all configured.
- **Authorization**: public GET endpoints for Home/Gallery/Experiences/
  Café/About/Journal content; `/api/bookings/**` requires an authenticated
  session.
- **Audit logging** of login success/failure/logout, persisted to Postgres.
- **REST modules**: properties (rooms), gallery, experiences, café, journal,
  contact enquiries, newsletter subscriptions, bookings — each with
  entity → repository → DTO → controller, global exception handling, and
  bean validation.
- **React frontend**: React Router pages for every nav section, an
  `AuthContext` that only ever asks the backend "who am I" (`GET
  /api/auth/me`) rather than touching tokens, a `ProtectedRoute` for
  booking-only pages, an error boundary, loading states, and a Tailwind
  theme using the specified warm-white / stone / olive / charcoal / wood
  palette with serif headings + sans body.
- **Docker**: multi-stage Dockerfiles for both apps, `docker-compose.yml`
  wiring Postgres + Redis + backend + nginx-served frontend together, with
  the frontend nginx proxying `/api`, `/oauth2`, `/login` to the backend so
  cookies stay same-site.

## What's intentionally left as a next step

This is a skeleton, not the finished brand experience:

- **Imagery**: pages reference `/images/...` paths that don't exist yet —
  drop real photography into `frontend/public/images/...` (see paths used
  in `Home.jsx`, `data.sql`, etc.) or swap for a CDN.
- **Admin module**: role-based authorization is wired into `SecurityConfig`
  (`/api/admin/**` → authenticated) but there's no admin UI or `ADMIN` role
  assignment flow yet.
- **Guest Stories / testimonials section** on the homepage.
- **Payment/availability logic** for bookings — `BookingController` currently
  just records a request; there's no calendar/availability check or payment
  integration.
- Polished scroll animations / micro-interactions described in the brief.

## Running locally with Docker

```bash
cp .env.example .env
# then fill in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env
# (Google Cloud Console → Credentials → OAuth Client ID → Web application
#  → Authorized redirect URI: http://localhost:8080/login/oauth2/code/google)

docker compose up --build
```

- Frontend: http://localhost:8081
- Backend API: http://localhost:8080/api
- Postgres: localhost:5432 (balconyhouse/balconyhouse)
- Redis: localhost:6379

## Running locally without Docker (dev mode)

**Backend** (needs local Postgres + Redis, or point `DB_HOST`/`REDIS_HOST`
env vars at your own instances):

```bash
cd backend
mvn spring-boot:run
```

**Frontend** (Vite dev server proxies `/api`, `/oauth2`, `/login` to
`localhost:8080` — see `vite.config.js`):

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173.

## Project layout

```
balcony-house/
  backend/    Spring Boot 3 / Java 21 REST API
  frontend/   React + Vite + Tailwind SPA
  docker-compose.yml
  .env.example
```

Backend package layout is feature-first (`property/`, `gallery/`,
`experience/`, `cafe/`, `journal/`, `contact/`, `newsletter/`, `booking/`,
`auth/`, `audit/`, `config/`, `common/`) — each mirrors
entity → repository → (service) → DTO → controller, ready to extend as
"Future-ready modules" grow.
