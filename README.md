# The Balcony House

**Stay a little longer.**

A working full-stack booking site for a boutique mountain-stay property: React
(Vite + Tailwind) frontend, Spring Boot 3 / Java 21 backend, PostgreSQL,
Redis-backed sessions, and Google OAuth2/OIDC login. This doc gets you from a
fresh clone to a fully running local copy, and points you at what to read next
to actually put it on the internet.

## Quick start (Docker — the fastest path, no Java/Node needed on your machine)

```bash
git clone <this-repo-url>
cd balcony-house
cp .env.example .env
```

Open `.env` and fill in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — see
[Google Cloud setup](#google-cloud-setup-required-for-login) below for exactly
how to get these. Everything else in `.env.example` already has a working
default for local use.

```bash
docker compose up --build
```

First run pulls base images and compiles both apps, so give it a few minutes.
Once it settles:

- **Site**: http://localhost:8081
- **Backend API** (for debugging): http://localhost:8080/api
- **Postgres**: localhost:5432 (`balconyhouse` / `balconyhouse`)
- **Redis**: localhost:6379

Sign in with Google using the same email you put in `ADMIN_EMAILS` in `.env`,
and you'll land with admin access (an "Admin" link appears in the nav) — that
gets you into `/admin` to see bookings, the dashboard, room/gallery/testimonial
management, etc. Any other Google account can browse and book as a guest.

The app starts with realistic demo content already loaded (3 room types,
gallery photos, journal posts, café menu, experiences) — nothing needs to be
entered before you can click around.

To stop everything: `Ctrl+C`, then `docker compose down` (add `-v` if you also
want to wipe the database/uploaded-document volumes and start completely
fresh next time).

## Google Cloud setup (required for login)

Every guest and admin login goes through Google OAuth2 — without this,
nobody can sign in at all, Docker or not.

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   and create (or pick) a project.
2. **OAuth consent screen** (left sidebar) → User type "External" → fill in
   app name + support email → add the `openid`, `email`, `profile` scopes
   (these are the ones `application.yml` already requests).
3. **Credentials** → *Create Credentials* → *OAuth client ID* → Application
   type **Web application**.
4. Under **Authorized redirect URIs**, add the ones you'll actually use. For
   local work you likely want *both* of the first two — they're for two
   different ways of running this app locally, not alternatives:

   | Redirect URI | When it's used |
   |---|---|
   | `http://localhost:8081/login/oauth2/code/google` | **Docker Compose** (the Quick Start above) — Caddy serves everything on 8081 |
   | `http://localhost:8080/login/oauth2/code/google` | **Non-Docker dev mode** (`mvn spring-boot:run` + `npm run dev`, see below) — the Vite proxy forwards straight to the backend on 8080 |
   | `https://<your-ngrok-domain>/login/oauth2/code/google` | Only if testing on a real phone via ngrok — see below |
   | `https://yourdomain.com/login/oauth2/code/google` | Production — see [DEPLOYMENT.md](DEPLOYMENT.md) |

   All of these can live on the same OAuth client — no need for separate
   clients per environment.
5. Copy the **Client ID** and **Client secret** into `.env` as
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
6. To make your own Google account an admin, put that same email in
   `ADMIN_EMAILS` in `.env` (comma-separated if more than one person needs it).

If you ever see Google reject the login with `redirect_uri_mismatch`, it
almost always means the URI above doesn't exactly match what's registered —
check the port and that there's no trailing slash.

## Running locally without Docker (dev mode)

Useful for backend/frontend development with hot reload. Needs a local
Postgres + Redis (or point the `DB_HOST` / `REDIS_HOST` env vars at existing
instances — e.g. the ones Docker Compose already runs, via `docker compose up postgres redis`).

**Backend**:

```bash
cd backend
mvn spring-boot:run
```

Reads the same `.env`-style variables via your shell environment or your IDE's
run configuration (Spring Boot doesn't auto-load `.env` files the way Docker
Compose does — export the variables you need, or use a plugin like
`spring-boot-dotenv` / your IDE's env-file support if you'd rather not export
manually).

**Frontend** (Vite dev server proxies `/api`, `/oauth2`, `/login` to
`localhost:8080` — see `frontend/vite.config.js`):

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173. Remember: this mode's OAuth redirect URI is
`http://localhost:8080/...` (see the table above), not 5173 or 8081.

## What's implemented

The full guest-to-checkout lifecycle works end to end, plus a working admin
back office:

- **Auth**: Google OAuth2/OIDC via Spring Security, server-side only — the
  browser only ever holds an `HttpOnly` session cookie (Redis-backed via
  Spring Session), never a token. CSRF via the standard cookie/header
  double-submit pattern, handled automatically by axios.
- **Guest booking flow**: browse rooms → book a single room or a multi-room
  trip → mandatory online payment at booking time (a pluggable mock gateway
  today — hold, fail-then-retry, auto-release if abandoned — built so a real
  provider like Razorpay is a drop-in swap later) → view/cancel bookings with
  a nights-based prorated refund policy → auto-generated GST invoice.
- **Admin back office** (`/admin`, gated on `ADMIN_EMAILS`): dashboard
  (occupancy/revenue/outstanding balance), booking & trip management,
  check-in/check-out (with guest ID document upload gating check-in),
  availability calendar, room maintenance blocking, housekeeping status,
  guest directory, financial CSV export, an action audit trail, and CRUD for
  testimonials.
- **Content**: gallery, café menu, experiences, and journal (blog) pages are
  all backed by the database and easy to re-seed — see
  `backend/src/main/resources/data.sql`.
- **White-labeling**: hotel name, branding, contact info, GST settings, room
  inventory/pricing, check-in/out times, and policy notes are all plain YAML
  config (`app.hotel` in `backend/src/main/resources/application.yml`) —
  re-skinning this for a different property is meant to start and end there,
  no code changes.
- **Email** (optional, off by default): booking confirmation/cancellation/
  payment-reminder emails via Resend.
- **Docker**: multi-stage Dockerfiles for both apps; `docker-compose.yml` +
  `docker-compose.override.yml` (local) or `docker-compose.prod.yml`
  (production) wire Postgres + Redis + backend + Caddy-served frontend
  together, with Caddy proxying `/api`, `/oauth2`, `/login` to the backend so
  cookies stay same-site (and handling automatic HTTPS in production).

## What's not built yet

See [ROADMAP.md](ROADMAP.md) for the current, prioritized gap list (what's
missing, why it might matter, and what's already in progress) — it's kept
up to date separately from this file since it changes faster.

## External services you'll need

Everything below is optional to skim once, but you need working credentials
from these before the app is fully functional end to end (login won't work at
all without Google; email is silently disabled without Resend).

### Google Cloud (required — see [above](#google-cloud-setup-required-for-login))

### Resend (optional — booking confirmation/cancellation/reminder emails)

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
   Authorized redirect URI on the same Google OAuth client (see the table
   above).
4. Point `.env` at it: `FRONTEND_URL`, `CORS_ORIGINS` = the ngrok URL, plus
   `SITE_ADDRESS=:80` and `FORWARDED_PROTO=https` (ngrok terminates HTTPS at
   its edge, so Caddy needs to be told that explicitly — see the comment
   already in `.env.production.example` for this).

### A domain (needed eventually — production hosting + real Resend delivery)

Not needed for local dev. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Publishing / going live

Once you're happy running it locally, [DEPLOYMENT.md](DEPLOYMENT.md) walks
through putting this on a real domain with HTTPS and auto-deploy on every
push to `main` — a free-tier cloud VM, opening ports, DNS, and the one-time
server setup. After that initial setup, shipping a change is just `git push`.

## Troubleshooting

- **`redirect_uri_mismatch` from Google**: the URI Google is being sent to
  doesn't exactly match one registered on the OAuth client. Check you're
  using the right one for how you're running the app (see the table
  [above](#google-cloud-setup-required-for-login)) — Docker Compose uses
  8081, non-Docker dev mode uses 8080.
- **`docker compose up` fails with a port already in use**: something else on
  your machine is already bound to 8081, 8080, 5432, or 6379. Stop that
  process, or edit the port mappings in `docker-compose.override.yml`.
- **Logged in but no "Admin" link in the nav**: your Google account's email
  isn't in `ADMIN_EMAILS` in `.env`. Add it (comma-separated for more than
  one) and restart the backend (`docker compose up -d backend` after editing
  `.env`, or `docker compose up --build -d backend` if you also changed code).
- **Email-dependent features (reminders, confirmations) not sending**:
  expected if `EMAIL_ENABLED=false` (the default) — this is silent by design,
  not a bug. See [Resend setup](#resend-optional--booking-confirmationcancellationreminder-emails).
- **Changes to `data.sql` or `application.yml` don't seem to take effect**:
  these only apply on backend startup — rerun
  `docker compose up --build -d backend`, or restart `mvn spring-boot:run` in
  dev mode.

## Project layout

```
balcony-house/
  backend/    Spring Boot 3 / Java 21 REST API
  frontend/   React + Vite + Tailwind SPA
  docker-compose.yml               base service definitions
  docker-compose.override.yml      local-only additions (auto-loaded, host port mappings)
  docker-compose.prod.yml          production additions (explicit -f flag, see DEPLOYMENT.md)
  .env.example                     copy to .env for local dev
  .env.production.example          copy to .env on a production server
```

Backend package layout is feature-first — each package mirrors
entity → repository → service → DTO → controller:

```
backend/src/main/java/com/thebalconyhouse/backend/
  auth/          Google OAuth2 login, session, "who am I"
  audit/         Login/logout audit logging
  booking/       Core booking + trip lifecycle, cancellation policy application
  addon/         Cancellation policy calculation, childcare/full-board pricing
  payment/       Pluggable payment gateway (mock today, real provider later)
  document/      Guest ID document upload/storage
  profile/       Guest profile (name/phone) completion
  property/      Room types/inventory, availability
  hotel/         White-label config (name/branding/GST/policies/rooms)
  gallery/ cafe/ experience/ journal/  Public content sections
  testimonial/   Guest reviews (public read, admin CRUD)
  contact/ newsletter/   Contact form + newsletter signup
  notification/  Outbound email (Resend)
  config/        Spring Security, CORS, and other cross-cutting config
  common/        Shared exception handling, etc.
```

Frontend routes live in `frontend/src/App.jsx`; pages in `frontend/src/pages/`
mirror the nav (public pages) plus `Admin*.jsx` (admin back office, gated by
`AdminRoute.jsx`).
