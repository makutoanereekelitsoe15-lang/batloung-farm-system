# Batloung Farm — Fresh Produce Distribution Management System

A complete, beginner-friendly MERN-style stack (React + Express + MySQL) that replaces
the notebooks and spreadsheets Batloung Farm currently uses to buy fruit in South Africa
and distribute it to vendors in Maseru, Lesotho.

---

## Folder structure (exactly what the assignment asks for)

```
batloung-farm-system/
├── database/
│   └── batloung_farm_db.sql        ← PART A : whole database + sample data + reports
│
├── backend/
│   ├── config/
│   │   └── db.js                   ← mysql2 connection pool
│   ├── controllers/
│   │   ├── supplierController.js
│   │   ├── fruitController.js
│   │   ├── vendorController.js
│   │   ├── purchaseController.js
│   │   ├── saleController.js
│   │   ├── paymentController.js
│   │   ├── stockController.js
│   │   └── reportController.js
│   ├── models/
│   │   ├── supplierModel.js
│   │   ├── fruitModel.js
│   │   ├── vendorModel.js
│   │   ├── purchaseModel.js
│   │   ├── saleModel.js
│   │   ├── paymentModel.js
│   │   ├── stockModel.js
│   │   └── reportModel.js
│   ├── routes/
│   │   ├── supplierRoutes.js
│   │   ├── fruitRoutes.js
│   │   ├── vendorRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── stockRoutes.js
│   │   └── reportRoutes.js
│   ├── middleware/
│   │   ├── errorHandler.js         ← notFound + central error handler
│   │   └── asyncHandler.js
│   ├── server.js
│   ├── .env                        ← your private credentials (NOT committed)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── components/  (Sidebar, StatCard, Modal, Alert, DataTable, LineItemEditor, StatusBadge)
        ├── pages/       (Dashboard, Suppliers, Fruits, Vendors, Purchases, Sales, Stock, Payments, Reports)
        ├── services/    (api.js + one file per module)
        ├── App.jsx
        ├── App.css
        └── main.jsx
```

---

## PART A — Database

### 1. Create the database

```bash
cd batloung-farm-system
mysql -u root -p < database/batloung_farm_db.sql
```

This one script creates `batloung_farm_db`, all **eight** tables with primary keys,
foreign keys, `NOT NULL`, `UNIQUE` and `CHECK` constraints, the extra `payments`
history table, realistic sample data, and the four report views.

### 2. Check it worked

```sql
USE batloung_farm_db;
SELECT * FROM v_dashboard_summary;
SELECT * FROM v_report_top_fruits;
SELECT * FROM v_report_top_vendor;
SELECT * FROM v_report_current_stock;
SELECT sale_day, revenue FROM v_report_revenue
  WHERE sale_day BETWEEN '2026-09-01' AND '2026-10-31';
```

The four required SQL reports (raw queries) live at the bottom of
`database/batloung_farm_db.sql` as views — open `backend/models/reportModel.js`
to see the same four queries written out as normal parameterised SQL.

---

## PART B — Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit .env with your MySQL password
npm run dev               # or: npm start
```

`.env` keys (validated at startup — the server refuses to start if one is missing):

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=batloung_farm_db
```

Health check: `GET http://localhost:5000/api/health`

---

## PART C — API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | server + database status |
| GET | `/api/dashboard` | dashboard totals |
| GET/POST | `/api/suppliers` | list / register supplier |
| GET/PUT/DELETE | `/api/suppliers/:id` | read / update / delete supplier |
| GET/POST | `/api/fruits` | list / register fruit |
| GET/PUT | `/api/fruits/:id` | read / update fruit |
| GET | `/api/vendors?search=` | list + search vendors |
| GET/POST | `/api/vendors` | list / register vendor |
| GET/PUT | `/api/vendors/:id` | read / update vendor |
| GET/POST | `/api/purchases` | list / create purchase (multi-item, transactional) |
| GET | `/api/purchases/:id` | purchase + its lines |
| GET/POST | `/api/sales` | list / create sale (multi-item, stock-checked, transactional) |
| GET | `/api/sales/:id` | sale + lines + payment history |
| GET | `/api/stock` | stock by fruit + packaging |
| GET | `/api/stock/low` | low-stock items |
| GET | `/api/stock/check?fruitId=1&packagingSize=LARGE` | one stock bucket |
| GET/POST | `/api/payments` | payment history / record a payment |
| GET | `/api/payments/outstanding` | vendor balances |
| GET | `/api/reports/top-fruits` | report 1 |
| GET | `/api/reports/revenue?startDate=&endDate=` | report 2 |
| GET | `/api/reports/top-vendor` | report 3 |
| GET | `/api/reports/stock` | report 4 |

Status codes used: **200** OK, **201** created, **400** invalid input / insufficient stock,
**404** not found, **409** duplicate, **500** unexpected error.

---

## PART D — Business logic

* Totals are always calculated on the server: `quantity × unit price`.
* Purchases run in one transaction: `BEGIN → insert purchase → insert lines → increase stock → COMMIT`.
* Sales run in one transaction: `BEGIN → lock stock rows WITH FOR UPDATE → check every box before
  changing anything → insert sale + lines → decrease stock → COMMIT`. Any failure → `ROLLBACK`,
  so a sale that fails halfway leaves the stock untouched.
* `UPDATE stock SET available_quantity = available_quantity - ? WHERE ... AND available_quantity >= ?`
  is used as a second safety net, plus a `CHECK (available_quantity >= 0)` in the database itself.
* Payments: CASH / MOBILE_MONEY / CREDIT with statuses PAID / PARTIALLY_PAID / UNPAID.
  A partial payment automatically moves the status to PARTIALLY_PAID.

---

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:5000`, so keep the backend running.
For production, `npm run build` creates `frontend/dist`, and the Express server already
serves that folder automatically when it exists.

---

## How to test everything quickly

A ready-made Postman collection is in `docs/Batloung Farm API.postman_collection.json`.
The step-by-step demonstration that satisfies section 9 of the assignment is in
`docs/TESTING.md` (each step lists the request, the expected result, and how to verify
stock in the UI).
