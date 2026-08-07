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
  wiring Postgres + Redis + backend + Caddy-served frontend together, with
  Caddy proxying `/api`, `/oauth2`, `/login` to the backend so cookies stay
  same-site (and handling automatic HTTPS in production).

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

## External services you'll need

Everything below is optional to skim once, but you need working credentials
from these before `docker compose up` gives you a fully working app (login
won't work at all without Google; email is silently disabled without Resend).

### Google Cloud (required — login)

Every guest and admin login goes through Google OAuth2. Without this, nobody
can sign in at all.

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   and create (or pick) a project.
2. **OAuth consent screen** (left sidebar) → User type "External" → fill in
   app name + support email → add the `openid`, `email`, `profile` scopes
   (these are the ones `application.yml` already requests).
3. **Credentials** → *Create Credentials* → *OAuth client ID* → Application
   type **Web application**.
4. Under **Authorized redirect URIs**, add one per environment you'll run:
   - Local Docker: `http://localhost:8081/login/oauth2/code/google`
   - Any ngrok tunnel: `https://<your-ngrok-domain>/login/oauth2/code/google`
   - Production: `https://yourdomain.com/login/oauth2/code/google`
   (You can add all three to the same client — no need for separate clients per environment.)
5. Copy the **Client ID** and **Client secret** it gives you into `.env`:
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
6. To make your own Google account an admin in the app, add that same email
   to `ADMIN_EMAILS` in `.env` (comma-separated for more than one).

### Resend (optional — booking confirmation/cancellation emails)

Only needed if you want `EMAIL_ENABLED=true`. Leave it `false` and the app
runs fine without it — bookings/cancellations just won't email anyone.

1. Sign up free at [resend.com](https://resend.com) (no card required).
2. Dashboard → **API Keys** → *Create API Key* → copy it into `.env` as
   `RESEND_API_KEY`, and set `EMAIL_ENABLED=true`.
3. That alone only lets you send test emails to the address you signed up
   with — not to real guests. To fix that:
   Dashboard → **Domains** → *Add Domain* → enter a domain you own → add the
   SPF/DKIM records it shows you at wherever that domain's DNS is managed →
   wait for it to show "Verified" (usually minutes).
4. Once verified, change `EMAIL_FROM_ADDRESS` in `.env` to an address on that
   domain, e.g. `bookings@yourdomain.com`.

### ngrok (optional — testing on your own phone before you have a real domain)

Handy for trying the app on an actual mobile device while it's still running
on your laptop.

1. Sign up free at [ngrok.com](https://ngrok.com) and install the CLI (or
   grab a free static domain from their dashboard so the URL doesn't change
   every restart).
2. Run `ngrok http 8081` (8081 = the Caddy/frontend port) — it prints a
   public `https://*.ngrok-free.dev` URL forwarding to your machine.
3. Add `https://<that-domain>/login/oauth2/code/google` as another
   Authorized redirect URI on the same Google OAuth client (step 4 above).
4. Point `.env` at it: `FRONTEND_URL`, `CORS_ORIGINS` = the ngrok URL, plus
   `SITE_ADDRESS=:80` and `FORWARDED_PROTO=https` (ngrok terminates HTTPS at
   its edge, so Caddy needs to be told that explicitly — see the comment
   already in `.env` for this).

### A domain (needed eventually — production hosting + real Resend delivery)

Not needed for local dev. You'll want one (~$10–15/year from any registrar —
Namecheap, Cloudflare Registrar, GoDaddy, etc.) for two things once you're
ready to go live: Caddy uses it to get itself a free HTTPS certificate
automatically (`SITE_ADDRESS` in `.env.production.example`), and Resend uses
it to let you send to real guests (see above).

## Running locally with Docker

```bash
cp .env.example .env
# fill in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (see "External services" above)

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
