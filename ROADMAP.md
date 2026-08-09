# The Balcony House — Feature Roadmap

Gap analysis as of 2026-08-08, prioritized 2026-08-08. First pass of priorities is in; the
six rows marked **Now — building** below are in active development.

## What's already solid

The full stay lifecycle works end to end: browse → book (single room or multi-room trip) →
admin assigns a room number → guest ID document uploaded → check-in (blocked until room +
ID are set) → payment recorded (partial payments and refunds both supported) → check-out
(blocked until fully paid) → GST invoice generated automatically → confirmation/cancellation/
check-in/checkout emails sent. Plus: availability calendar, room maintenance blocking,
guest directory, an admin dashboard (occupancy/revenue/outstanding balance), and a
white-labelable config system (name/branding/GST/room inventory all editable without code
changes).

## Money

| Feature | What's missing today | Why it might matter | Priority |
|---|---|---|---|
| Online payment collection | **Framework ready.** Every booking now goes through a real hold → pay → retry-if-failed flow, backed by a mock gateway that behaves like a real one (fails once, succeeds on retry, releases the room automatically if nobody ever pays). Swapping in a real provider (Razorpay) is meant to be one new file + a config change — what's still missing is the provider itself, its account/KYC setup, its payment widget on the checkout page, and its webhook. | Framework de-risked ahead of time; the remaining work is mostly account setup + one integration, not architecture. | Recommended right before launch |
| Cancellation policy | Cancelling just cancels — no automatic "free up to 48h before, 50% penalty after" logic. Any penalty is manual. | Matters once cancellations become frequent enough that manual judgment calls get inconsistent. | **Now — building** |
| Financial export / reports | Nothing beyond "revenue this month" on the dashboard. No CSV export of bookings/payments for a date range. | Needed once you're handing numbers to a CA for GST filing or ITR. | **Now — building** |

## Running the front desk

| Feature | What's missing today | Why it might matter | Priority |
|---|---|---|---|
| Staff roles | Single `ROLE_ADMIN` — anyone in the admin email list sees everything: full financials, ability to cancel anything, guest ID documents. No "front desk only" tier. | Matters once someone besides you is logging in day to day. | |
| Action audit trail | Login/logout is logged, but nothing records *who* cancelled a booking, recorded a payment, or changed a room — just that it happened. | Matters with multiple staff, for accountability and catching mistakes. | **Now — building** |
| Housekeeping workflow | Room maintenance blocking exists (out of service for repairs), but nothing tracks the routine "checked out → needs cleaning → ready" cycle between guests. | Useful once turnover volume makes "which rooms are actually ready right now" hard to just remember. | **Now — building** |

## Guest-facing

| Feature | What's missing today | Why it might matter | Priority |
|---|---|---|---|
| Reviews / testimonials | No guest review or testimonial feature anywhere on the site. | Social proof for new visitors deciding whether to book. | **Now — building** |
| WhatsApp / SMS notifications | Only email (via Resend), and email still needs a verified domain to reach real guests, not just your own inbox. | WhatsApp is likely more reliable for Indian guests and doesn't need a domain to get working. | |
| Per-room photo gallery | `Property` (each room category) has a single hero image. The site-wide Gallery page exists but isn't tied to specific rooms. | Guests often want to see more than one angle of the actual room before booking. | **Now — building** |

## Safety net

| Item | What's missing today | Why it might matter | Priority |
|---|---|---|---|
| Database backups | No documented/automated backup of the Postgres volume that holds every booking, payment, and guest record. | If that volume is ever lost, everything goes with it. Worth doing regardless of what else gets built. | |

---

*Six rows marked "Now — building": cancellation policy, financial export, audit trail,
housekeeping workflow, testimonials, per-room photo gallery — all since completed. Online
payment collection now has its framework built (hold/retry/cleanup, mock gateway) with only
the real provider integration left, recommended right before launch. Staff roles and
WhatsApp/SMS weren't picked this round — bring them back whenever they become relevant.*
