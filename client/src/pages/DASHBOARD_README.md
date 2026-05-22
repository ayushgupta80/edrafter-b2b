# Dashboard Page — Developer Documentation

**File path:** `client/src/pages/Dashboard.jsx`

---

## Overview

The Dashboard is the main landing page after login. It renders **two completely different views** based on the user's role:

- **Admin Dashboard** — Revenue charts, order status pie chart, top clients table, recent activity feed
- **Client Dashboard** — Balance/order stat cards, service charges table, recent orders table

---

## File Structure

```
client/src/
  pages/
    Dashboard.jsx          <-- THIS FILE (main dashboard component)
  components/
    StatCard.jsx           <-- Reusable stat card used by dashboard
    Layout.jsx             <-- Wrapping layout (sidebar + header)
  context/
    AuthContext.jsx         <-- Provides user, profile, loading
  api/
    axios.js               <-- Axios instance (base URL: /api)
```

---

## Dependencies

| Package     | Version | Usage                                        |
|-------------|---------|----------------------------------------------|
| react       | ^19     | Core UI library                              |
| recharts    | ^3.8    | AreaChart, PieChart for admin analytics       |
| lucide-react| ^1.14   | Icons (ShoppingCart, Wallet, etc.)            |
| react-router-dom | ^7 | Link component for navigation                |

---

## Data Flow

### Authentication Context (`useAuth()`)

The Dashboard consumes these values from `AuthContext`:

```js
const { user, profile, loading } = useAuth();
```

| Field     | Type    | Description                                       |
|-----------|---------|---------------------------------------------------|
| `user`    | Object  | `{ _id, name, email, isAdmin, token }`            |
| `profile` | Object | Full profile payload from `GET /api/users/profile` |
| `loading` | Boolean | True while profile is being fetched               |

### Profile Shape — Admin

```json
{
  "user": {
    "name": "Admin Name",
    "email": "admin@example.com",
    "orders": [
      { "_id": "...", "_idd": 100042, "firstParty": "...", "quantity": 10, "totalAmount": 1250.50, "status": "Completed" }
    ]
  },
  "adminStats": {
    "totalSales": 500000,
    "totalClients": 25,
    "totalOrders": 340,
    "completedOrders": 280
  }
}
```

### Profile Shape — Client

```json
{
  "user": {
    "name": "Client Name",
    "email": "client@example.com",
    "balance": 50000,
    "company": "Some Corp",
    "orders": [...],
    "serviceCharges": [
      { "product": { "state": "Maharashtra", "serviceable": true }, "charges": 125 }
    ]
  },
  "stats": {
    "totalOrders": 18,
    "completedOrders": 14,
    "userTickets": 3
  }
}
```

### Admin Analytics API

**Endpoint:** `GET /api/admin/analytics`
**Auth:** Bearer token (admin only)
**Backend file:** `server/routes/adminRoutes.js` (line ~1354)

Response:

```json
{
  "monthlyData": [
    { "month": "Jan", "orders": 45, "revenue": 125000.50 },
    { "month": "Feb", "orders": 52, "revenue": 148000.75 }
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

**Frontend transformation** (in `useEffect`):

The `ordersByStatus` object is converted to an array for Recharts:
```js
Object.entries(data.ordersByStatus).map(([status, count]) => ({ status, count }))
```

---

## Component Sections

### 1. Welcome Header (Both roles)

- Displays user name, role label, and a "New Order" CTA button
- Links to `/orders/new`

### 2. Stat Cards (Both roles, different data)

Uses the `<StatCard>` component from `components/StatCard.jsx`.

**Admin cards:**
| Label        | Data field              | Color  |
|--------------|-------------------------|--------|
| Total Revenue| `adminStats.totalSales` | green  |
| Clients      | `adminStats.totalClients`| purple |
| Orders       | `adminStats.totalOrders` | primary|
| Completed    | `adminStats.completedOrders`| green |

**Client cards:**
| Label    | Data field              | Color   |
|----------|-------------------------|---------|
| Balance  | `user.balance`          | green   |
| Orders   | `stats.totalOrders`     | primary |
| Completed| `stats.completedOrders` | green   |
| Tickets  | `stats.userTickets`     | amber   |

### 3. Revenue Area Chart (Admin only)

- **Library:** Recharts `<AreaChart>`
- **Data:** `analytics.monthly` array
- **Series:** Two areas — `orders` (indigo) and `revenue` (emerald)
- **Gradient fills:** Linear gradients `colorRevenue` and `colorOrders`
- **Custom tooltip:** `<CustomTooltip>` formats revenue as `₹X,XXX`
- **Height:** 260px in a `<ResponsiveContainer>`

### 4. Order Status Pie Chart (Admin only)

- **Library:** Recharts `<PieChart>` with donut style (innerRadius=45, outerRadius=75)
- **Data:** `analytics.statusBreakdown` array `[{ status, count }]`
- **Colors:** `['#f59e0b', '#3b82f6', '#10b981', '#ef4444']` (amber, blue, green, red)
- **Legend:** Manual grid of colored dots below the chart

### 5. Top Clients Table (Admin only)

- Shows top 5 clients by total spend
- Columns: Rank #, Client Name, Company, Total Spent
- "View all" link to `/clients`

### 6. Recent Activity Feed (Admin only)

- Last 10 transactions across all users
- Credit = green arrow down-right icon, Debit = red arrow up-right icon
- Shows: description, user name, date, and amount

### 7. Service Charges Table (Client only)

- Lists `profile.user.serviceCharges`
- Columns: State, Charges/Unit (INR), Status (Active/Inactive badge)

### 8. Recent Orders Table (Both roles)

- Lists `profile.user.orders`
- Columns: Order ID (link to detail), First Party, Qty, Total, Status badge
- "View all" link to `/orders`

---

## Styling Notes

- **Design system:** Tailwind CSS v4 with custom `primary` color scale
- **Card style:** `bg-white rounded-2xl border border-slate-100` (consistent across all sections)
- **Font sizes:** Headers `text-[15px]`, body `text-[13px]`, labels `text-[11px]` uppercase
- **Animations:** Cards use `animate-slide-up` with `stagger-1` through `stagger-4` classes, sections use `animate-fade-in`
- **Status badges:** Color-coded via `statusColors` map — amber (Pending), blue (Processing), emerald (Completed), red (Cancelled)
- **Currency formatting:** `toLocaleString('en-IN')` for Indian number formatting

---

## StatCard Component API

**File:** `client/src/components/StatCard.jsx`

```jsx
<StatCard
  icon={IndianRupee}       // lucide-react icon component
  label="Total Revenue"    // uppercase label text
  value="₹5,00,000"        // main display value (string)
  sub="Optional subtitle"  // optional small text below value
  color="green"            // theme: primary | green | amber | red | purple
/>
```

---

## How to Modify

### Add a new stat card
1. Add a new `<StatCard>` inside the admin or client grid (the `grid-cols-4` section)
2. If adding a 5th card, change grid to `lg:grid-cols-5`

### Add a new chart section
1. Import the chart type from `recharts`
2. Add a new section inside the `{isAdmin && analytics && ( ... )}` block
3. If it needs new backend data, update `GET /api/admin/analytics` in `server/routes/adminRoutes.js`

### Change chart colors
- Area chart: Modify stroke colors and gradient `stopColor` values in the `<defs>` section
- Pie chart: Edit the `PIE_COLORS` array at the top of the file

### Add new data to the analytics API
1. Add a new aggregation query in `server/routes/adminRoutes.js` (the analytics endpoint around line 1354)
2. Include it in the response JSON
3. Extract it in the frontend `useEffect` where `setAnalytics(...)` is called

---

## Running Locally

```bash
# From project root
cd client
npm install
npm run dev
# Runs on http://localhost:5173 with proxy to backend at :3001

# Backend (separate terminal)
cd server
npm install
npm run dev
# Runs on http://localhost:3001
```

Admin login required to see the analytics charts. Client login shows the simpler stat cards + tables view.
