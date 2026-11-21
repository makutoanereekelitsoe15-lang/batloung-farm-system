# Batloung Farm Distribution System — Video Demonstration & Testing Guide

This guide walks you through demonstrating every feature required by the **(DIWA2110) Web Application Development Take-Home Test** for your submission video and presentation.

---

## 1. Quick Startup
1. Double-click `start-system.bat` in the root folder.
2. It launches the Backend API (port 5000) and Frontend App (port 5173), then opens `http://localhost:5173` in your browser.

---

## 2. Step-by-Step Demonstration Script (Matching the Rubric)

### Step 1: Dashboard Overview
* **Navigate to:** `Dashboard` (Home)
* **What to show & explain:**
  * Point out the summary cards: Active Fruits (9), Stock Available (1,653 boxes), Registered Suppliers (12), Registered Vendors (10), Total Sales Revenue, and Outstanding Credit.
  * Point out the **Low Stock Warning Alert banner** showing items that need reordering.

### Step 2: Supplier Management (Part C: 2 Marks)
* **Navigate to:** `Suppliers`
* **What to show & explain:**
  * Show the list of suppliers from South African provinces (Gauteng, Free State, Western Cape, Limpopo, etc.).
  * Click **"+ Register New Supplier"**, enter details (e.g. "Bloemfontein Fruit Hub", Free State) and save.
  * Click **"Edit"** on a supplier to show update functionality.
  * Explain that foreign key constraints protect suppliers who already have purchase orders from being deleted accidentally.

### Step 3: Fruit Catalogue & Packaging Stock Design (Part A & C: 4 Marks)
* **Navigate to:** `Fruits`
* **What to show & explain:**
  * Show the fruit catalogue: Apples, Bananas, Oranges, Mangoes, Grapes, etc.
  * Show that each fruit has an `ACTIVE` status badge.
  * Add or edit a fruit variety to demonstrate full CRUD functionality.
* **Navigate to:** `Stock`
* **What to show & explain:**
  * **Critical Rubric Point:** Show that stock levels are tracked **separately for SMALL, MEDIUM, and LARGE packaging sizes**.
  * Click **"Low Stock Alerts Only"** button to filter items at or below reorder level (e.g. Large Apples has only 6 boxes remaining).

### Step 4: Street Vendor Management & Search (Part C: 2 Marks)
* **Navigate to:** `Vendors`
* **What to show & explain:**
  * Show registered street vendors operating in Maseru and across Lesotho.
  * Type in the search box (e.g. `Maseru` or a phone number like `5800`) and click **"Search"** to demonstrate live search.
  * Click **"+ Register New Vendor"** to add a new retailer.

### Step 5: Supplier Purchases & Stock Increment (Part C & D: 4 Marks)
* **Navigate to:** `Purchases`
* **What to show & explain:**
  * Click **"+ Record New Purchase"**.
  * Select a South African supplier.
  * Add multiple fruit lines (e.g., 20 boxes of Medium Bananas at R160/box, 15 boxes of Large Oranges at R190/box).
  * Show how the system **automatically calculates line totals and grand totals** without manual arithmetic.
  * Click **"Confirm & Save Purchase"**.
  * Navigate to `Stock` to show that the available quantity of those items increased immediately.
  * **Demonstrate Safe Cancellation:** 
    * Return to `Purchases`, find the purchase you just recorded, and click the red **"Cancel"** button (or click **"View Items"** and click **"Cancel this Purchase"**).
    * Confirm the prompt: the purchase status changes to `CANCELLED` and the added stock is safely and automatically reversed from inventory.
    * Mention the business rule: *If any boxes from a batch have already been sold to street vendors, the transaction aborts and prevents cancellation so stock can never go negative.*

### Step 6: Atomic Sales Transaction & The 10 vs 6 Rollback Test (Part C & D: 7 Marks)
* **Navigate to:** `Sales`
* **Demonstrate the Assignment Test Case (Page 6 of PDF):**
  > *"A vendor requests 10 large boxes of apples, but only 6 large boxes are available. The API must reject the entire sale without reducing the available stock or creating an incomplete transaction."*
  1. Click **"+ Record New Sale"**.
  2. Select any vendor (e.g. *Thabo Fruit Corner*).
  3. Under Fruit, select **Apples**, packaging size **LARGE**, quantity **10**.
  4. Note the warning indicator showing only **6 boxes available**.
  5. Click **"Complete & Record Sale"**.
  6. **Result:** An error alert appears: *"Insufficient stock for Apples (LARGE): only 6 box(es) available but 10 requested. The whole sale was rejected."*
  7. Explain that the backend uses a MySQL transaction (`BEGIN ... ROLLBACK`) ensuring **zero partial writes** and preserving stock integrity.
* **Demonstrate a Successful Sale with Credit:**
  1. Record a valid sale of 2 Large Apples and 5 Medium Bananas.
  2. Under Payment, choose **CASH** and pay a partial amount (e.g. R200 of an R800 total).
  3. Submit. Point out that the sale status becomes `PARTIALLY_PAID` and the balance moves to outstanding credit.

### Step 7: Vendor Payments & Outstanding Credit (Part D: 2 Marks)
* **Navigate to:** `Payments`
* **What to show & explain:**
  * Show the **Outstanding Balances by Vendor** table with each retailer's open invoices and total balance owed.
  * Click **"+ Record New Payment"**.
  * Select the unpaid/partially paid invoice, choose payment method (**Cash** or **Mobile Money - M-Pesa**), enter payment amount, and save.
  * Show how the vendor's balance decreases and the invoice updates to `PAID`.
  * Click the **"Payment Transaction History"** tab to show the recorded receipt.

### Step 8: The 4 SQL Analytical Reports (Part D: 2 Marks)
* **Navigate to:** `Reports`
* **Show all 4 tabs one-by-one:**
  1. **Top 5 Most Frequently Sold Fruits:** Shows ranked fruits, boxes sold, transactions count, and revenue.
  2. **Revenue by Date Range:** Select date range and click **"Generate Report"** to show total revenue, transaction counts, and the daily breakdown.
  3. **Top Performing Vendor:** Shows the vendor who purchased the highest cumulative number of boxes.
  4. **Current Stock Levels:** Complete inventory status across all fruits and Small/Medium/Large packaging sizes.

---

### Step 9: Creative Value-Added Highlights (Bonus Creativity for Limkokwing)
* **1. Printable Official Vendor Receipt & Tax Invoice:**
  * In `Sales`, click the **"🖨️ Receipt"** button on any sale.
  * Show the official Batloung Farm branded receipt with itemized breakdown, Maseru depot details, and the colored status stamp (`PAID IN FULL`, `PARTIALLY PAID`, or `UNPAID / CREDIT`).
  * Click **"Print / Save PDF"** to demonstrate that it opens the clean printer layout.
* **2. Lesotho Maloti (M) / ZAR (R) Currency Switcher:**
  * Point to the sidebar: show the **CURRENCY DISPLAY** toggle between `R (ZAR)` and `M (Maloti)`.
  * Click `M (Maloti)` and show how all prices, invoices, totals, and balances across the whole application instantly switch to Lesotho Maloti!
* **3. One-Click Quick Reorder from Stock to Purchases:**
  * Go to `Stock`, find an item marked `LOW` or `OUT_OF_STOCK` (e.g. Large Apples), and click **"🛒 Reorder →"**.
  * Show how it automatically jumps to `Purchases`, opens the batch order form, and pre-populates the fruit variety and packaging size.

---

## 3. Rubric Checklist & Marks Breakdown

| Section | Description | Marks | Status |
| :--- | :--- | :---: | :---: |
| **Part A** | MySQL Database (8 tables, constraints, sample data, size-specific stock) | **10** | Complete |
| **Part B** | Node.js Backend (MVC structure, pool connection, .env, async/await) | **8** | Complete |
| **Part C** | Express REST API (Supplier, Fruit, Vendor, Purchase, Sale endpoints, HTTP codes) | **14** | Complete |
| **Part D** | Business Logic & Transactions (Rollback, stock checks, 4 SQL reports, payments) | **10** | Complete |
| **Total** | | **42 / 42** | **100% Ready** |
