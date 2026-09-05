# Claude Handoff — Sept 5, 2026

Paste this whole file to Claude at the start of your next session with it.

---

## Where the project is

CashCompass is a MERN cash-flow forecasting app. Backend is essentially complete: 7 Mongoose models, full CRUD for all resources, JWT auth with a `protect` middleware, and a working projection engine at `server/utils/projection/` exposed under `/api/projection`.

**Phase 1 (backend hardening) is done as of this session.** It's on top of commit `af2716c`. Antwaun applied it as a patch; the changes are summarized below so you don't re-derive or undo them.

Frontend is at: Vite + React 19 scaffold, SCSS design tokens in `client/src/styles/_variables.scss`, `apiRequest` helper in `client/src/api/api.js`, `AuthContext` with `login`/`logout`/`user`/`loading`, and a working `LoginPage`. **`App.jsx` still renders `<LoginPage />` unconditionally — there is no routing yet.** That's your job.

## What changed in Phase 1 (do not undo these)

**New model fields:**
- `User.currentBalance` (Number, default 0) and `User.balanceAsOf` (Date) — a user-attested balance snapshot, not a computed running balance. The server owns `balanceAsOf`; clients never send it.
- `Bill.anchorDate` (Date, optional) — one known due date, needed for weekly/biweekly schedules.
- `Debt.dueDay` (Number 1–31, optional) — which day of the month the payment leaves.
- `IncomeSource.anchorDate` (Date, optional) — this source's own payday, falling back to `user.payCycle.anchorDate`.

**New endpoints, replacing the old `GET /api/users`** (which leaked every user in the database and has been deleted):
- `GET /api/users/me` → the logged-in user's profile.
- `PATCH /api/users/me` → updates `name`, `currentBalance`, `payCycle` only. Deliberately narrow allowlist; email/password changes need their own flows.

`POST /api/users` (signup) now also accepts optional `payCycle` and `currentBalance`. Both signup and login responses now include `currentBalance`, `balanceAsOf`, and `payCycle` alongside the token.

**`startingBalance` is no longer a required query param.** Every `/api/projection` endpoint used to 400 without it. It now defaults to the user's stored `currentBalance`. Pass it explicitly only for "what if I had $X" scenarios.

**Two money bugs fixed in the engine:**
1. Debt payments now stop at payoff and the final payment is sized from the real amortization schedule.
2. Goal contributions are now emitted into the day-by-day cash-flow series, so the surplus figure and the balance line reconcile exactly. (Verified: they agree to the cent on identical fixture data.)

**Dependencies added to `client/package.json`:** `sass` (was missing entirely — a fresh clone couldn't build) and `react-router-dom@^7.18.3`. Run `npm install` in `client/`.

---

## Your job this session

Build the app shell and the auth-adjacent screens. **Frontend only — do not modify anything under `server/`.** Perplexity is writing the Vitest suite for the backend math in parallel, and edits to `server/` will collide.

### 1. Routing and the shell

Install is already declared; just `npm install` in `client/`.

- Wrap the app in `BrowserRouter` (in `main.jsx`, outside `AuthProvider` is fine).
- Build `client/src/components/ProtectedRoute.jsx`: reads `useAuth()`, renders `<Outlet />` when `user` is set, `<Navigate to="/login" replace />` when not. **Must handle `loading`** — `AuthContext` starts with `loading: true` while it reads `localStorage`, so returning early without checking it will bounce a logged-in user to the login screen on every refresh. Render nothing (or a spinner) while `loading`.
- Build `client/src/components/AppShell.jsx`: persistent nav + `<Outlet />` for page content. Nav items: Dashboard, Bills, Debts, Goals, Income, Settings. Include the user's name and a logout button.
- Routes: `/login`, `/signup` public; `/`, `/bills`, `/debts`, `/goals`, `/income`, `/settings` behind `ProtectedRoute` inside `AppShell`.
- `LoginPage` should `navigate('/')` after a successful `login()` — right now it succeeds and nothing visibly happens.

### 2. `AuthContext` additions

Add a `signup(name, email, password, extras)` function mirroring `login` — it POSTs to `/users`, stores token + user in `localStorage`, sets state. The backend response shape is identical to login's.

Also add a `refreshUser()` that GETs `/users/me` and updates both state and `localStorage`. The settings screen and the balance prompt both need it.

### 3. `SignupPage`

Mirror `LoginPage`'s structure and SCSS conventions (BEM, `login__*` → `signup__*`). Fields: name, email, password. Same error/submitting handling.

### 4. Onboarding: balance + pay cycle

After signup, route to `/onboarding` and collect:
- **Current balance** — "How much is in your checking account right now?" Sends `{ currentBalance }` to `PATCH /users/me`.
- **Pay cycle** — frequency (`weekly` | `biweekly` | `semimonthly` | `monthly`) and `anchorDate` ("when's your next payday?"). Sends `{ payCycle: { frequency, anchorDate } }`.

Both are optional-but-strongly-encouraged. Without them the projection still works but returns `warnings` explaining it's approximate.

### 5. `SettingsPage`

A minimal screen to edit name, balance, and pay cycle via `PATCH /users/me`. This is also the "refresh your balance" surface the staleness warning points at.

### What NOT to build yet

**Do not build the Dashboard, Bills, Debts, Goals, or Income screens.** Route them to a placeholder component. The projection response shape is being frozen in Phase 3 and those screens should be built against the frozen contract, not guessed at. A placeholder that says "Coming next" is the right answer for now.

---

## API reference you'll need

Base URL is `http://localhost:5000/api`. `apiRequest` already attaches `Authorization: Bearer <token>` from `localStorage`.

### Auth

```
POST   /users          { name, email, password, payCycle?, currentBalance? }
                       → 201 { _id, name, email, currentBalance, balanceAsOf, payCycle, token }
POST   /users/login    { email, password }
                       → 200 { _id, name, email, currentBalance, balanceAsOf, payCycle, token }
GET    /users/me       → 200 { _id, name, email, currentBalance, balanceAsOf, payCycle, createdAt, updatedAt }
PATCH  /users/me       { name?, currentBalance?, payCycle? }
                       → 200 { _id, name, email, currentBalance, balanceAsOf, payCycle }
```

`payCycle` is `{ frequency: 'weekly'|'biweekly'|'semimonthly'|'monthly', anchorDate: ISO date string }`.

### Resources (all require auth, all scoped to the caller)

```
GET|POST           /bills             /debts   /goals   /income   /variable-expenses   /logged-entries
PUT|DELETE         /bills/:id         (same for each)
```

Field shapes:
- **Bill** — `{ name, amount, dueDay?, frequency: 'weekly'|'biweekly'|'monthly'|'yearly', anchorDate?, category? }`
- **Debt** — `{ name, balance, interestRate?, minimumPayment, extraPayment?, dueDay? }`
- **Goal** — `{ name, targetAmount, currentAmount?, targetDate?, type: 'savings'|'purchase' }`
- **IncomeSource** — `{ name, type: 'regular'|'irregular', amount?, frequency?, anchorDate?, estimatedMonthlyAmount? }`
- **VariableExpense** — `{ name, estimatedMonthlyAmount }`
- **LoggedEntry** — `{ variableExpense: <id>, amount, date?, note? }`

### Projection (all query params optional)

```
GET /api/projection?windowDays=90&windowStart=&startingBalance=&payCycleAnchorDate=
```

Returns `{ cashFlow, debts, goals, surplus }`, where `cashFlow` is:

```js
{
  windowStart: ISODate,
  windowDays: 90,
  startingBalance: 1240,
  balanceAsOf: ISODate | null,
  series: [ { date, balance, events: [ { date, amount, type, refId, label, isFinalPayment? } ] } ],
  shortfalls: [ { date, amount } ],   // amount is negative; start of each dip only
  warnings: [ "..." ]                  // human-readable, safe to show the user
}
```

`event.type` is `'bill' | 'debt' | 'income' | 'goal'`. `amount` is positive for income, negative for everything else. `isFinalPayment: true` marks a debt's payoff month — worth celebrating in the UI.

**Note:** treat this projection shape as provisional. It is being formally frozen in Phase 3 and may gain fields. Build the balance-and-pay-cycle screens against `/users/me` (stable) and leave the projection-consuming screens as placeholders.

---

## Working agreement

- **Frontend only.** Everything under `server/` belongs to Perplexity this session.
- **Match existing conventions:** BEM class names, one `.scss` file per page next to the `.jsx`, SCSS variables from `_variables.scss` (never raw hex values), functional components with hooks.
- **Every data-driven screen needs loading, error, and empty states.** Skipping these is the most common reason an app feels broken.
- If something in this brief looks wrong or contradicts the code, say so instead of working around it silently.
