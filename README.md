# eDrafter B2B

A full-stack stamp paper ordering platform with separate Admin and Client portals. Built with React + Vite (frontend) and Express + MongoDB (backend).

---

## Quick Start (Get Running in 5 Minutes)

### Prerequisites

- **Node.js** v18+ — [download here](https://nodejs.org/)
- **MongoDB** — either [install locally](https://www.mongodb.com/docs/manual/installation/) or use [MongoDB Atlas](https://cloud.mongodb.com) (free tier works)
- **Git** — to clone this repo

### 1. Clone the repo

```bash
git clone https://github.com/ayushgupta80/edrafter-b2b.git
cd edrafter-b2b
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Create the `.env` file

Create a file called `.env` inside the `server/` folder:

```bash
# server/.env
PORT=3001
MONGO_URI=mongodb://localhost:27017/edrafter
JWT_SECRET=any_random_string_here_for_signing_tokens
```

> If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/edrafter?retryWrites=true&w=majority`

### 4. Create an admin user

```bash
cd server
node createAdmin.js
```

This creates an admin account:
- **Email:** `admin@edrafterb2b.in`
- **Password:** `eD%admin-007`

### 5. Run the app

Open **two terminals**:

```bash
# Terminal 1 — Backend (runs on port 3001)
cd server
npm run dev

# Terminal 2 — Frontend (runs on port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser and log in with the admin credentials above.

---

## Project Structure

```
edrafter-b2b/
├── package.json                 # Root package.json (for deployment builds)
├── client/                      # React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js           # Dev server config + proxy rules
│   ├── package.json
│   └── src/
│       ├── main.jsx             # App entry point
│       ├── App.jsx              # Route definitions
│       ├── index.css            # Global styles (Tailwind v4)
│       ├── api/
│       │   └── axios.js         # Axios instance (base URL: /api)
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state (user, profile, login/logout)
│       ├── components/
│       │   ├── Layout.jsx       # Main layout (sidebar + header + notifications)
│       │   ├── Sidebar.jsx      # Navigation sidebar
│       │   ├── ProtectedRoute.jsx  # Auth guard + admin-only wrapper
│       │   └── StatCard.jsx     # Reusable stat card component
│       └── pages/
│           ├── Dashboard.jsx    # Main dashboard (charts + stats)
│           ├── Orders.jsx       # Order list
│           ├── OrderDetail.jsx  # Single order view
│           ├── CreateOrder.jsx  # New order form
│           ├── Clients.jsx      # Client management (admin only)
│           ├── Products.jsx     # State/product management (admin only)
│           ├── Transactions.jsx # Transaction history
│           ├── Tickets.jsx      # Support ticket list
│           ├── TicketDetail.jsx # Single ticket view
│           ├── Profile.jsx      # User profile (editable)
│           ├── TopUp.jsx        # Client wallet top-up request
│           ├── TopupRequests.jsx# Admin top-up approval (admin only)
│           ├── ApiDocs.jsx      # API documentation page
│           ├── Login.jsx        # Login page
│           └── ForgotPassword.jsx
│
└── server/                      # Express backend
    ├── server.js                # App entry point + route mounting
    ├── package.json
    ├── createAdmin.js           # Script to seed admin user
    ├── config/
    │   └── db.js                # MongoDB connection
    ├── middleware/
    │   ├── authMiddleware.js    # JWT token verification (protect)
    │   ├── adminMiddleware.js   # Admin role check (adminCheck)
    │   ├── authApiKey.js        # API key auth for external API
    │   └── multer.js            # File upload config
    ├── models/
    │   ├── User.js              # User schema (admin + client)
    │   ├── Order.js             # Stamp paper order
    │   ├── Product.js           # State/product (serviceable states)
    │   ├── Transaction.js       # Wallet transaction log
    │   ├── Ticket.js            # Support ticket
    │   ├── Topup.js             # Wallet top-up request
    │   ├── Cart.js              # Cart (legacy)
    │   └── Category.js          # Category (legacy)
    └── routes/
        ├── userRoutes.js        # /api/users/* (login, profile, orders, tickets, transactions)
        ├── adminRoutes.js       # /api/admin/* (client mgmt, order mgmt, analytics)
        ├── productRoutes.js     # /api/products/*
        ├── apiRoutes.js         # /api/v1/* (external API for clients)
        ├── cartRoutes.js        # /api/cart/* (legacy)
        └── categoryRoutes.js    # /api/categories/* (legacy)
```

---

## Tech Stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Recharts 3 |
| Backend  | Express 4, Mongoose 8, JWT, Multer            |
| Database | MongoDB                                       |
| Icons    | lucide-react                                  |
| Toasts   | react-hot-toast                               |

---

## How the Frontend Talks to the Backend

The Axios instance in `client/src/api/axios.js` uses **`/api`** as the base URL.

In development, Vite proxies all `/api/*` requests to `http://localhost:3001` (configured in `vite.config.js`):

```
Browser (localhost:5173) → Vite Proxy → Express (localhost:3001)
```

> **Important:** Do NOT create any frontend routes starting with `/api` — the Vite proxy will intercept them. That's why the API docs page is at `/developer` instead of `/api-docs`.

---

## Authentication Flow

1. User logs in via `POST /api/users/login` → receives a JWT token
2. Token is stored in `localStorage` under the key `user`
3. Every API request attaches `Authorization: Bearer <token>` via Axios interceptor
4. If any request returns 401, the user is auto-logged out

The `AuthContext` provides:
```js
const { user, profile, loading, login, logout, refreshProfile } = useAuth();
```

| Value           | Type     | Description                                       |
|-----------------|----------|---------------------------------------------------|
| `user`          | Object   | `{ _id, name, email, isAdmin, token }`            |
| `profile`       | Object   | Full profile from GET /api/users/profile           |
| `loading`       | Boolean  | True while profile is loading                      |
| `login(email, password)` | Function | Logs in and sets user + profile          |
| `logout()`      | Function | Clears localStorage and resets state               |
| `refreshProfile()` | Function | Re-fetches the profile from the server          |

---

## User Roles

There are two roles: **Admin** and **Client**.

### Admin
- Manages clients (create, edit, toggle API access, set service charges)
- Manages orders (accept, upload stamps, complete, cancel)
- Manages products/states (add/remove serviceable states)
- Approves wallet top-up requests
- Views analytics dashboard (revenue charts, top clients, etc.)

### Client
- Places stamp paper orders
- Views own orders and downloads stamps
- Requests wallet top-ups
- Views own transactions
- Submits support tickets
- Accesses API docs (if API is enabled by admin)

---

## Database Models

### User
| Field          | Type       | Notes                                |
|----------------|------------|--------------------------------------|
| name           | String     | Required                             |
| company        | String     | Required                             |
| email          | String     | Required, unique                     |
| phone          | String     | Optional                             |
| address        | String     | Optional                             |
| gstin          | String     | Optional (GST number)                |
| userId         | String     | Required, unique (display ID)        |
| balance        | Number     | Wallet balance (default 0)           |
| password       | String     | Bcrypt hashed automatically          |
| isAdmin        | Boolean    | Default false                        |
| api_enabled    | Boolean    | If true, client can access API       |
| api_key        | String     | Auto-generated when API is enabled   |
| serviceCharges | Array      | Per-state pricing `[{ product, charges, shipping }]` |
| orders         | [ObjectId] | Refs to Order model                  |

### Order
| Field          | Type       | Notes                                |
|----------------|------------|--------------------------------------|
| _idd           | Number     | Display ID (auto-incrementing)       |
| user           | ObjectId   | Ref to User                          |
| firstParty     | String     | Required                             |
| secondParty    | String     | Required                             |
| address        | String     | Required                             |
| purchasedBy    | String     | Required                             |
| product        | ObjectId   | Ref to Product (state)               |
| dutyPaidBy     | String     | Required                             |
| purpose        | String     | Required                             |
| quantity       | Number     | Number of stamp papers               |
| denomination   | Number     | Value per stamp paper in INR         |
| status         | String     | Pending / Processing / Completed / Cancelled |
| totalAmount    | Number     | Auto-calculated                      |
| stampsUploaded | Array      | `[{ id, file (URL) }]`              |
| invoice        | String     | Invoice file URL                     |

### Transaction
| Field          | Type       | Notes                                |
|----------------|------------|--------------------------------------|
| user           | ObjectId   | Ref to User                          |
| type           | String     | "Debit" or "Credit"                  |
| amount         | Number     | Transaction amount                   |
| balanceBefore  | Number     | Balance before this transaction      |
| balanceAfter   | Number     | Balance after this transaction       |
| description    | String     | What the transaction was for         |

### Product
| Field       | Type    | Notes                           |
|-------------|---------|----------------------------------|
| state       | String  | State name (e.g., "Maharashtra") |
| serviceable | Boolean | Whether orders can be placed     |

---

## API Routes Summary

### User Routes (`/api/users/`)
| Method | Endpoint                | Auth     | Description              |
|--------|-------------------------|----------|--------------------------|
| POST   | /login                  | None     | Login                    |
| GET    | /profile                | Token    | Get profile + stats      |
| PUT    | /profile                | Token    | Update profile           |
| POST   | /forgot-password        | None     | Send reset code          |
| POST   | /reset-password         | None     | Reset password           |
| POST   | /orders                 | Token    | Create new order         |
| GET    | /orders                 | Token    | List user's orders       |
| GET    | /orders/:id             | Token    | Get single order         |
| GET    | /transactions           | Token    | List transactions        |
| POST   | /tickets                | Token    | Create ticket            |
| GET    | /tickets                | Token    | List tickets             |
| POST   | /topup                  | Token    | Request wallet top-up    |

### Admin Routes (`/api/admin/`)
| Method | Endpoint                | Auth         | Description              |
|--------|-------------------------|--------------|--------------------------|
| GET    | /clients                | Admin token  | List all clients         |
| POST   | /clients                | Admin token  | Create new client        |
| PUT    | /clients/:id            | Admin token  | Update client            |
| GET    | /orders                 | Admin token  | List all orders          |
| PUT    | /orders/:id/accept      | Admin token  | Accept order             |
| PUT    | /orders/:id/complete    | Admin token  | Complete order           |
| PUT    | /orders/:id/cancel      | Admin token  | Cancel order             |
| POST   | /orders/:id/upload      | Admin token  | Upload stamp files       |
| GET    | /analytics              | Admin token  | Dashboard analytics data |
| POST   | /approve-topup/:id      | Admin token  | Approve top-up request   |

---

## Dashboard Deep Dive

**File:** `client/src/pages/Dashboard.jsx`

The dashboard renders two different views based on the logged-in user's role.

### Admin Dashboard

1. **Stat Cards** — Total Revenue, Clients, Orders, Completed orders
2. **Revenue Area Chart** (Recharts) — 6-month revenue + order count trend
3. **Order Status Pie Chart** (Recharts) — Donut chart of Pending/Processing/Completed/Cancelled
4. **Top Clients Table** — Top 5 clients ranked by total spend
5. **Recent Activity Feed** — Last 10 transactions across all users
6. **Recent Orders Table** — Latest orders with status badges

### Client Dashboard

1. **Stat Cards** — Wallet Balance, Orders, Completed, Tickets
2. **Service Charges Table** — Per-state pricing assigned to this client
3. **Recent Orders Table** — Client's latest orders

### Analytics API

The admin charts fetch data from `GET /api/admin/analytics` (defined in `server/routes/adminRoutes.js` around line 1354).

Response shape:
```json
{
  "monthlyData": [
    { "month": "Jan", "orders": 45, "revenue": 125000.50 }
  ],
  "ordersByStatus": {
    "Pending": 12,
    "Processing": 8,
    "Completed": 280,
    "Cancelled": 5
  },
  "topClients": [
    { "name": "John Doe", "company": "ABC Corp", "totalSpent": 250000 }
  ],
  "recentActivity": [
    {
      "type": "Credit",
      "amount": 50000,
      "description": "Wallet top-up approved",
      "userName": "Jane Smith",
      "date": "2025-01-15T10:30:00Z"
    }
  ]
}
```

The frontend transforms `ordersByStatus` (object) to an array for Recharts:
```js
Object.entries(data.ordersByStatus).map(([status, count]) => ({ status, count }))
```

### StatCard Component

**File:** `client/src/components/StatCard.jsx`

```jsx
<StatCard
  icon={IndianRupee}       // Any lucide-react icon
  label="Total Revenue"    // Uppercase label
  value="₹5,00,000"        // Main display value
  sub="Optional subtitle"  // Small text below value (optional)
  color="green"            // primary | green | amber | red | purple
/>
```

### Chart Colors

- **Area Chart:** Indigo (#6366f1) for orders, Emerald (#10b981) for revenue
- **Pie Chart:** `['#f59e0b', '#3b82f6', '#10b981', '#ef4444']` — amber, blue, green, red
- **Status Badges:** Amber (Pending), Blue (Processing), Emerald (Completed), Red (Cancelled)

---

## Styling Guide

The app uses **Tailwind CSS v4** with the `@tailwindcss/vite` plugin.

### Conventions
- **Card containers:** `bg-white rounded-2xl border border-slate-100`
- **Section headers:** `text-[15px] font-bold text-slate-900`
- **Body text:** `text-[13px] text-slate-600`
- **Small labels:** `text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400`
- **Large values:** `text-[26px] font-extrabold text-slate-900 tracking-tight`
- **Primary color:** Custom `primary` scale (indigo-based) defined in CSS
- **Currency formatting:** Always use `toLocaleString('en-IN')` for Indian number format

### Animations
- `animate-slide-up` with `stagger-1` through `stagger-4` — for stat cards
- `animate-fade-in` — for chart and table sections
- `animate-scale-in` — for dropdowns and modals

---

## Common Tasks

### Add a new page
1. Create `client/src/pages/YourPage.jsx`
2. Add the route in `client/src/App.jsx`
3. Add a sidebar link in `client/src/components/Sidebar.jsx` (to `adminLinks` or `clientLinks`)

### Add a new API endpoint
1. Add the route handler in the appropriate file under `server/routes/`
2. Use `protect` middleware for authenticated routes, `adminCheck` for admin-only routes

### Add a new chart to admin dashboard
1. Import the chart component from `recharts`
2. If it needs new data, add a new aggregation query in the analytics endpoint (`server/routes/adminRoutes.js`)
3. Include the new data in the response JSON
4. Extract it in the Dashboard's `useEffect` where `setAnalytics()` is called
5. Render it inside the `{isAdmin && analytics && ( ... )}` block

### Seed test data
After creating an admin, log in at `http://localhost:5173` and:
1. Go to **Products (States)** — add states like "Maharashtra", "Karnataka"
2. Go to **Clients** — create a client with service charges
3. Log in as the client and place test orders

---

## Environment Variables

| Variable    | Required | Description                              |
|-------------|----------|------------------------------------------|
| PORT        | No       | Backend port (default: 3001)             |
| MONGO_URI   | Yes      | MongoDB connection string                |
| JWT_SECRET  | Yes      | Secret for signing JWT tokens            |
| SES_ACCESS_KEY | No   | AWS SES key (for emails, optional)       |
| SES_SECRET_KEY | No   | AWS SES secret (for emails, optional)    |
| SES_REGION  | No       | AWS SES region (for emails, optional)    |

---

## Troubleshooting

**"Cannot connect to MongoDB"**
- Make sure MongoDB is running: `mongosh` should connect
- Check your `MONGO_URI` in `server/.env`

**Frontend shows blank page**
- Check the browser console for errors
- Make sure backend is running on port 3001
- Vite proxy only works when both servers are running

**"Unauthorized" errors on every request**
- Check that `JWT_SECRET` in `.env` matches what was used when the admin user was created
- Try recreating the admin: `node createAdmin.js`

**Charts show empty on admin dashboard**
- You need actual order data in the database
- Create some test orders through the client portal first
