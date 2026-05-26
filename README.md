# Allo Inventory – Multi‑Warehouse Reservation System

A production‑ready inventory reservation system that prevents overselling during checkout by temporarily holding stock for a short window (15 minutes). Built with Next.js 15, Prisma, PostgreSQL (Supabase), and optional Redis for distributed locking.

## Live Demo

Deployed on Vercel – (https://allo-inventory-l4m5-p1s1auzpb-swethapcoders-projects.vercel.app/)

## Features

- Concurrency‑safe reservations (database transactions + optional Redis locks)
- 15‑minute hold window with live countdown timer
- Idempotent API (bonus – `Idempotency-Key` header)
- Multi‑warehouse stock management
- Clean dark‑theme UI with Tailwind CSS

## Tech Stack

- Next.js 15 (App Router, Turbopack)
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase / Neon)
- Redis (Upstash) – optional, for distributed locking
- Tailwind CSS
- Vercel (deployment)

## How to Run Locally

Follow these steps exactly to get the project running on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/swethapcoder/allo-inventory.git
cd allo-inventory
```
### 2. Install dependencies
```bash
npm install
```
### 3. Set up environment variables
Create a file named .env in the root directory with the following content:

env
# Required – your PostgreSQL connection string
```bash
DATABASE_URL="postgresql://user:password@host:5432/db"
```
# Optional – only needed for distributed locking / idempotency
```bash
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
Note: Redis is optional. If you don’t provide the Redis variables, the app will still work using database transactions alone (still race‑condition‑free for single‑instance deployments).
```
### 4. Run database migrations and generate Prisma client
```bash
npx prisma migrate dev --name init
npx prisma generate
```
### 5. Seed the database with sample data
```bash
npm run seed
This creates:

Two warehouses (Hyderabad, Bangalore)

Four products (iPhone 15, Samsung S24, Google Pixel 8, OnePlus 12)

Inventory records with totalUnits and reservedUnits (initial reserved = 0)
```
### 6. Start the development server
npm run dev
Open http://localhost:3000 in your browser.
 ###How to Test the Full Flow
On the product listing page, click Reserve for any warehouse with available stock.

You will be redirected to /reservation/{id}.

The page shows a countdown timer (15 minutes from creation) and two buttons: Confirm and Cancel.

Click Confirm – the stock is permanently deducted (totalUnits decreases, reservedUnits goes back to 0).
Click Cancel – only the temporary hold is removed (reservedUnits decreases, totalUnits unchanged).

Wait 15 minutes and try to confirm – you will see a 410 Reservation expired error (the stock is released automatically).

 ###Expiry Mechanism
Two complementary strategies:

Lazy cleanup – When fetching a reservation, if it is pending and expiresAt is in the past, the API releases the stock and marks it as EXPIRED.

Background cron – An endpoint /api/cron/release-expired can be called every minute (e.g., via Vercel Cron Jobs) to bulk‑release expired reservations. This is not required for local testing.

###Concurrency & Race Conditions
All stock updates are wrapped in Prisma transactions.

The reserve endpoint uses $transaction with a findUnique followed by an update. PostgreSQL row‑level locks prevent double‑booking.

For multi‑server deployments, a distributed lock via Redis (lib/lock.ts) provides an additional safety layer.


###License
This project is built for the Allo Engineering take‑home exercise.

text

## ✅ Now commit and push the README

```bash
git add README.md
git commit -m "Add detailed local setup instructions to README"
git push
