# CashCompass — Code Audit & Next Milestone

**Date:** September 5, 2026
**Repo reviewed:** `AntwaunW/cashcompass` @ `af2716c` ("got a running, authenticating front and backend")
**Purpose:** Establish what actually exists in the code, what's blocking the dashboard, and the exact order of work going forward. This doc is also the shared brief for working with Claude.

---

## 1. The headline

**Your overview doc is out of date in one important way: the projection engine already exists.**

It's ~660 lines across six files in `server/utils/projection/`, plus a controller and six live REST endpoints under `/api/projection`. It computes day-by-day cash flow, shortfall detection, debt amortization, goal pacing, and investable surplus. It's well-structured — pure math separated from database access, dates normalized to UTC, floats rounded to cents.

So the "next big milestone" is not building the engine. It's **making the engine's output trustworthy and reachable from the UI.** Right now it is neither, for four specific reasons listed in section 3.

---

## 2. Current state, file by file

### Backend — substantially complete

| Area | Status |
| --- | --- |
| 7 Mongoose models | Done. `user` ownership field on all six child models. |
| CRUD for all 6 resources | Done, consistent pattern: owner comes from `req.user._id`, never the request body. |
| Auth | Done. bcrypt hashing, JWT (30-day expiry), `protect` middleware attaches `req.user`. |
| Ownership scoping | Done and correct — every lookup is `findOne({ _id, user: req.user._id })`, and "not yours" returns the same 404 as "doesn't exist" so the API can't be used to probe other users' IDs. Genuinely good instinct. |
| Error middleware | Done (`notFound` + `errorHandler`, registered last). |
| CORS | Done, locked to one configurable origin. |
| Projection engine | Done, with caveats (section 3). |
| Tests | **None.** Zero test files, no test runner installed. |

### Frontend — barely started

| Area | Status |
| --- | --- |
| Vite + React 19 scaffold | Done. |
| Design tokens (`_variables.scss`) | Done. Dark emerald/champagne-gold palette, Fraunces + Inter, radius scale. |
| `apiRequest` helper | Done. Reads token from `localStorage`, attaches `Authorization: Bearer`, throws on non-2xx. |
| `AuthContext` | Done — `user`, `loading`, `login`, `logout`, rehydrates from `localStorage` on mount. |
| `LoginPage` | Done and working against the live API. |
| Routing | **Not installed.** `react-router-dom` is absent from `package.json`. `App.jsx` renders `<LoginPage />` unconditionally — logging in successfully does nothing visible. |
| Signup page | **Missing.** The backend endpoint exists; there's no UI to reach it. |
| Every other screen | Not started. |

**This is exactly where you and Claude stopped:** login works end-to-end, and the very next line of work is routing + a shell to navigate into.

---

## 3. The four blockers (read this section twice)

These are the reasons you cannot build the dashboard today, even though the engine is written.

### Blocker 1 — Nothing stores the user's current balance

`GET /api/projection/cashflow` requires `?startingBalance=` and returns **400** without it. But no model has a balance field. The engine's own comment says this was deliberate:

> "nothing in the data model stores a running balance, and it shouldn't, since there's no bank feed to keep it honest"

That reasoning is sound for a *derived* balance, but the consequence is that the dashboard has no number to start from. **A cash-flow forecast is mathematically impossible without a starting balance.** Every projection endpoint is currently unreachable from a real UI.

**Recommended fix:** add to `User`:

```js
currentBalance: { type: Number, default: 0 },
balanceAsOf:    { type: Date },
```

Treat it as a **user-attested snapshot**, not a computed truth: the user types "I have $1,240 right now," you stamp the date, and the forecast starts there. When `balanceAsOf` is more than ~7 days old, the dashboard nudges: "Still around $1,240?" This preserves the privacy-first, manual-entry philosophy while unblocking everything.

### Blocker 2 — Recurring events have no anchor dates, so they land on wrong days

The engine needs to know *which day* a recurring thing happens. The models don't record it, so the engine improvises:

| Thing | What the engine assumes | Why that's wrong |
| --- | --- | --- |
| Weekly/biweekly bill | Recurs from `bill.createdAt` | A biweekly bill you entered on a Tuesday is forecast every other Tuesday, regardless of reality |
| Debt payment | Lands on the **1st of every month** | Almost no debt is due on the 1st. Shortfall dates will be wrong |
| Every regular income source | Anchored to the *user's* `payCycle.anchorDate` | Your day job and your side hustle get the same payday |
| Irregular income | One lump sum on the **1st** | Overstates early-month balance, understates late-month risk |

Meanwhile `payCycle.anchorDate` is never collected at signup — `registerUser` only accepts `name`, `email`, `password`. So *every* user today falls into the fallback path (`user.createdAt`) and every projection carries a warning string.

**Recommended fix:** add `anchorDate` to `Bill` and `IncomeSource`, add `dueDay` to `Debt`, and collect `payCycle` during onboarding.

### Blocker 3 — Two engine bugs that produce wrong money

**3a. Debt payments never stop.** `debtToDiscreteEvents` emits a payment every month across the whole window, with no awareness of payoff. A card that `projectDebtPayoff` says is clear in 6 months still drains cash in month 40. **Your two features contradict each other:** the debt page says "paid off in June," the forecast keeps charging you through next year.

**3b. Goal contributions are missing from the cash-flow series.** `buildSurplusProjection` subtracts required goal contributions. `buildCashFlowProjection` does not add them as events. So the daily balance line is optimistic relative to the surplus number, and the two figures disagree on the same screen. For a product whose entire promise is "you can trust this forecast," two numbers that don't reconcile is the worst possible bug.

### Blocker 4 — Logged spending doesn't affect anything

`LoggedEntry` (actual spending) has a model, CRUD, and routes — and is **never read by the projection engine.** The forecast uses only `VariableExpense.estimatedMonthlyAmount`. A user can diligently log groceries for two months and the forecast won't budge.

This is *fine for now* — it's the seam where the AI layer plugs in later ("your groceries estimate says $400, your last 8 weeks say $520 — update it?"). Worth being deliberate that it's deferred, not forgotten. Also note the double-counting trap: once logged entries feed the forecast, past days must use **actuals** and future days must use **estimates**, never both.

---

## 4. Smaller issues worth a cleanup pass

1. **`sass` is not in `client/package.json`.** You import `.scss` files, so a fresh `git clone && npm install` produces a build that fails. It works on your machine because it's installed there but never saved to the manifest. Run `npm install -D sass` and commit.
2. **`GET /api/users` returns every user in the database** to any logged-in caller. It's labeled a dev helper, but it's a real data leak. Replace with `GET /api/users/me`, which you need anyway for the balance + pay-cycle settings screen.
3. **No `.env.example`.** Nobody (including future you on a new machine) can tell which variables are required: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`.
4. **`client/src/index.css` is dead** — `main.jsx` imports `global.scss` instead.
5. **`semimonthly` is approximated as "anchor day + 15."** Reasonable, but a real 1st-and-15th schedule drifts. Fine to ship; note it.
6. **No rate limiting on login** — brute-force protection before launch, not now.
7. **JWT lives in `localStorage`** — the standard tradeoff, vulnerable to XSS. Acceptable for v1; know that you chose it.
8. **`extraPayment` is stored per-debt but there's no payoff strategy** (snowball vs. avalanche). Worth deciding before the debt screen ships.

---

## 5. Recommended next move

**Do not start building screens yet. Spend one focused session freezing the engine-to-UI contract, then build screens on top of something stable.**

Why: the dashboard is your hardest screen and it consumes the projection response. If you build it against today's response — which requires a `startingBalance` you can't supply, and returns numbers that don't reconcile — you will build it twice and debug it in the hardest possible place (a React component with a chart in it).

### Phase 1 — Unblock the engine (backend only, no UI)

1. `User.currentBalance` + `User.balanceAsOf`; accept `payCycle` at signup.
2. `GET /api/users/me` and `PATCH /api/users/me` (replaces the leaky `GET /api/users`).
3. `Bill.anchorDate`, `IncomeSource.anchorDate`, `Debt.dueDay` — wire each into `engine.js`.
4. Fix bug 3a: stop debt payments at payoff (run `projectDebtPayoff` first, use its schedule length to cap the events).
5. Fix bug 3b: emit goal contributions as events in the cash-flow series so it reconciles with surplus.
6. Default `startingBalance` from `user.currentBalance` so the query param becomes optional.

### Phase 2 — Lock it down with tests

Install Vitest. The math modules are pure functions with no database — this is the single highest-leverage testing you will ever do on this project, and it's cheap.

Cases that must pass:
- Bill due on the 31st in February
- Biweekly paycheck across a month boundary
- A shortfall week correctly detected and dated
- A debt whose minimum doesn't cover interest (already handled — prove it stays handled)
- Irregular income with `estimatedMonthlyAmount` only
- **Surplus and cash-flow series agree** on the same fixture data

### Phase 3 — Freeze the API contract, then build UI

Write down the exact JSON shape of `GET /api/projection` in this repo. That document becomes the thing Claude builds components against — and the thing that stops the frontend and backend from drifting.

Then: `react-router-dom`, an `AppShell` with nav, a `<ProtectedRoute>` guard, a `SignupPage`, an onboarding flow that collects balance + pay cycle, and finally the dashboard.

**Estimated: Phase 1 + 2 is one solid session. It converts a 90%-built engine into a trustworthy one.**

---

## 6. How to run Perplexity and Claude together

The failure mode with two AI assistants is both editing the same file from different assumptions. Avoid it with a split by *type of work*, not by feature.

| | **Perplexity (me)** | **Claude (in your editor)** |
| --- | --- | --- |
| Best at | Deciding, specifying, auditing, verifying | Typing code into a live repo with full file context |
| Give it | "Should balance be stored or derived?" · "Audit this for bugs" · "Write the test suite" · "Spec the projection response" · "Review this diff" | "Build the BillsPage from this spec" · "Add routing" · "Refactor these five components" · "Style this to the tokens" |
| Output | Specs, decisions, test files, audits, this document | Committed working code |

**Three rules that make it work:**

1. **Specs live in the repo, not in chat.** Anything I decide gets written to `docs/` and committed. Claude reads the file instead of you re-explaining. Chat history is not shared between us; the repo is.
2. **Commit before switching assistants.** A clean `git status` at every handoff means either of us can see exactly what changed and neither of us clobbers uncommitted work.
3. **One assistant per layer per session.** I take backend/math/tests; Claude takes components/styling. When we must overlap, whoever starts a file finishes it.

**Concretely, for the next session:** I write the Phase 1 changes and the Phase 2 test suite (backend, math, tests — my lane). You hand Claude the frozen contract from Phase 3 and it builds the screens (components, SCSS — its lane). Neither of us touches the other's files.

---

## 7. Key terms glossary

Terms that will come up constantly. Organized by where you'll hit them.

### Database layer (Mongoose / MongoDB)

- **Document** — one record. One bill, one user. In MongoDB it's stored as JSON-like data.
- **Collection** — a group of documents of the same kind. Your `bills` collection holds every bill document.
- **Schema** — the blueprint: which fields exist, their types, what's required. Your `billSchema` is a schema.
- **Model** — the schema turned into a usable object with methods (`.find()`, `.create()`). `mongoose.model('Bill', billSchema)` makes the `Bill` model.
- **ODM** — Object-Document Mapper. Mongoose is an ODM: it maps JavaScript objects to MongoDB documents. (The SQL equivalent is an **ORM**.)
- **Validator** — a schema rule enforced on save, like `min: 0` or `enum: [...]`. This is why your code uses `.save()` instead of `findOneAndUpdate` — `.save()` re-runs validators.
- **`ObjectId`** — MongoDB's unique ID type. Your `user: { type: ObjectId, ref: 'User' }` field is a **reference** — a pointer to a document in another collection. This is how you model relationships.
- **`.lean()`** — "give me plain JavaScript objects, not full Mongoose documents." Faster, but the result has no `.save()`. Your engine uses it correctly since it never writes back.
- **Index** — a lookup shortcut that makes queries fast. `unique: true` on email creates one. You'll want indexes on the `user` field of every model as data grows.
- **Migration** — a change to already-stored data's shape. When you add `currentBalance`, existing users won't have it — that's a migration concern (Mongoose `default` handles most of it).

### API layer (Express)

- **Route** — a URL + HTTP method pair. `POST /api/bills`.
- **Endpoint** — the specific address a request goes to. Used almost interchangeably with "route."
- **Controller** — the function that handles a route's actual work. Keeps logic out of the routing file.
- **Middleware** — a function that runs *between* the request arriving and the controller responding. It either passes control on (`next()`) or short-circuits with a response. Your `protect` is middleware.
- **The middleware chain / order matters** — Express runs middleware top to bottom. This is why `notFound` and `errorHandler` must be registered *last* in `index.js`.
- **`req` / `res` / `next`** — request, response, and "hand off to the next middleware."
- **REST** — the convention of mapping HTTP verbs to actions on resources. GET reads, POST creates, PUT/PATCH updates, DELETE removes.
- **CRUD** — Create, Read, Update, Delete. The four basic operations. You've built CRUD six times.
- **Status codes** — 200 OK · 201 Created · 400 Bad Request (client sent bad data) · 401 Unauthorized (not logged in) · 403 Forbidden (logged in, not allowed) · 404 Not Found · 500 Server Error (you broke).
- **PUT vs PATCH** — PUT replaces the whole resource; PATCH updates only the fields sent. Your controllers behave like PATCH but are routed as PUT. Common, harmless, worth knowing.
- **Payload / body** — the JSON data sent with a request.
- **Query parameter** — data in the URL after `?`, like `?startingBalance=1200`. Used for options and filters, not for creating things.
- **Route parameter** — a variable slot in the path, like `/:id`, read as `req.params.id`.
- **API contract** — the agreed-on shape of requests and responses. Freezing this is Phase 3.

### Auth & security

- **Hashing vs. encryption** — encryption is reversible with a key; **hashing is one-way**. Passwords must be hashed, never encrypted, so even you can't read them.
- **Salt** — random data mixed into a password before hashing, so two users with the same password get different hashes. `bcrypt.genSalt(10)` — the 10 is the **cost factor**, how slow the hash is on purpose.
- **JWT (JSON Web Token)** — a signed string proving who you are. Signed, **not encrypted** — anyone can read its contents, but nobody can forge one without your `JWT_SECRET`. Never put anything secret inside a JWT.
- **Bearer token** — the convention of sending a token as `Authorization: Bearer <token>`.
- **Stateless auth** — the server stores no session; the token itself carries the proof. Downside: you can't easily revoke a token before it expires.
- **Protected route** — **two different meanings, both in your app.** Backend: a route requiring a valid JWT (`protect` middleware). Frontend: a page that redirects to login if there's no user (`<ProtectedRoute>` — you haven't built this yet). Same name, different layers.
- **CORS** — Cross-Origin Resource Sharing. Browsers block requests from one origin (`localhost:5173`) to another (`localhost:5000`) unless the server opts in. That's what `app.use(cors(...))` does.
- **Origin** — protocol + host + port together. `http://localhost:5173`. Change any one and it's a different origin.
- **Environment variable** — config kept outside the code, in `.env`. Secrets belong here, and `.env` belongs in `.gitignore` — which you did correctly.
- **XSS** — cross-site scripting: injected JavaScript running in your page. The reason `localStorage` tokens carry risk.

### Frontend (React)

- **Component** — a reusable piece of UI, written as a function returning JSX. `LoginPage` is one.
- **JSX** — HTML-like syntax inside JavaScript. Compiled to real function calls by Vite.
- **Props** — data passed *into* a component from its parent. One-directional: down.
- **State** — data a component owns and can change. `useState`. Changing it triggers a **re-render**.
- **Hook** — a function starting with `use` that plugs into React's lifecycle. `useState`, `useEffect`, `useContext`. Must be called at the top level of a component, never inside a condition or loop.
- **`useEffect`** — run code *after* render, for things outside React: fetching data, timers, subscriptions. The **dependency array** (the `[]` at the end) controls when it re-runs; `[]` means "once, on mount."
- **Mount / unmount** — when a component is first added to, or removed from, the screen.
- **Context** — a way to pass data to deeply nested components without threading props through every level. Your `AuthContext` is this.
- **Provider** — the component that supplies a context's value to everything inside it. `<AuthProvider>`.
- **Controlled input** — a form field whose value comes from state, with `onChange` writing back to state. Every input in your `LoginPage` is controlled.
- **Lifting state up** — moving state to a shared parent when two siblings need it.
- **Conditional rendering** — `{error && <p>...</p>}`. Renders only when the condition is truthy.
- **Key prop** — the unique `key` React needs when rendering a list, so it can tell items apart between renders. You'll need this on every bill/debt/goal list.
- **Loading / error / empty states** — the three non-happy paths every data-driven screen needs. Skipping them is the most common reason a frontend feels broken.
- **Optimistic update** — updating the UI immediately, before the server confirms, then rolling back on failure. Makes an app feel instant.
- **Router / route guard** — the library mapping URLs to components (`react-router-dom`), and the wrapper that blocks unauthenticated access.
- **SPA** — Single Page Application. One HTML file; JavaScript swaps the content. Your app is one.
- **Design token** — a named design value (`$gold`, `$radius-md`) used instead of a raw hex or pixel value, so the whole look changes from one file. Your `_variables.scss`.
- **BEM** — the `block__element--modifier` CSS naming convention. You're already using it: `login__button`.

### Engineering concepts

- **Pure function** — same input always produces the same output, with no side effects. Your `surplus.js` and `debtPayoff.js` are pure. **This is why they're trivially testable** — no database, no mocking, no setup.
- **Side effect** — anything a function does beyond returning a value: writing to a database, logging, mutating shared state.
- **Separation of concerns** — each file has one job. Your projection folder does this well: pure math in the math files, database access only in `engine.js`.
- **Source of truth vs. derived data** — what you store versus what you calculate. Balance is a source of truth (a user snapshot); the forecast is derived. **Never store derived data** — it drifts out of sync with its inputs. Your engine recomputes on every request, which is right.
- **Idempotent** — an operation safe to repeat with the same result. GET is idempotent; POST usually isn't.
- **Unit test** — tests one function in isolation. **Integration test** — tests several pieces together, e.g. a real HTTP request against a test database.
- **Fixture** — a fixed set of fake data a test runs against.
- **Regression** — something that used to work and broke. Tests exist mainly to catch regressions.
- **Floating-point error** — computers can't represent decimals exactly, so `0.1 + 0.2 !== 0.3`. Why money math needs rounding to cents, which your `round2` helper does. (The industrial-strength fix is storing money as integer cents — worth considering later.)
- **UTC normalization** — forcing all dates to a single timezone so day comparisons don't shift. Your `dateUtils.js` does this deliberately. Note: your engine works in **UTC**, but users think in **local time** — a bill "due Friday" for a Texas user is Friday in UTC only if you're careful. Worth revisiting before launch.
- **Anchor date** — a known occurrence of a recurring event, used to figure out all the others. Blocker 2 is entirely about missing anchor dates.
- **Recurrence rule** — the pattern describing when something repeats. Your `generateOccurrences` implements one.
- **Amortization** — how a loan payment splits between **interest** (cost of borrowing) and **principal** (actual debt reduction). Early payments are mostly interest; later ones mostly principal. Your `debtPayoff.js` is a standard monthly-compounding amortization.
- **APR** — Annual Percentage Rate. Divided by 12 to get a monthly rate, exactly as your engine does.
- **Technical debt** — a shortcut you accept now knowing it costs you later. Section 4 is a list of yours. Naming it is how you keep it from compounding.
- **Refactor** — restructuring code without changing behavior.
- **Feature flag** — a switch to turn a feature on or off without redeploying. Useful for shipping the AI layer to yourself first.

---

## 8. Open decisions

These are product calls, not technical ones. Deciding them prevents rework:

1. **Safety buffer in investable surplus** — currently the number is income minus everything, which means "$0 left over" reads as "$0 to invest." Should surplus reserve a buffer first? A one-month-expenses floor?
2. **Debt payoff strategy** — snowball (smallest balance first, for momentum) or avalanche (highest interest first, mathematically optimal)? Or user's choice? This shapes the debt screen.
3. **Forecast window** — the engine defaults to 90 days. Is that the product default, or should the user pick 30/60/90?
4. **Irregular income display** — a single averaged line, or a range ("likely $2,000–$3,500")? A range is more honest for a real estate agent and is a real differentiator, but it's meaningfully more math.
5. **What happens at $0 balance** — the encouraging-tone promise gets hardest exactly when the news is bad. Worth writing the actual copy for a shortfall alert before building the component that displays it.
