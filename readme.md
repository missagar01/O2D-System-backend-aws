# Oracle + Postgres Weighbridge API

Express API that opens an SSH tunnel to Oracle (weighbridge + gate + payments data) and uses Postgres (AWS RDS) for authentication. JWTs are issued on login; passwords are intentionally stored as provided (no hashing).

## Stack & Architecture
- Node.js 20+, Express, CORS, JWT
- Oracle (business data) reached via SSH tunnel + Instant Client (Thick if available, otherwise Thin)
- Postgres (auth) via `pg` pool with optional SSL
- Connection pooling: Oracle (`oracledb`) and Postgres (`pg`)

## Prerequisites
- Node.js 20 or later and npm
- SSH reachability to `115.244.175.130` as `pipe`
- Oracle Instant Client:
  - Preferred Windows path: `C:\oracle\instantclient_23_9`
  - Fallback (container/Linux): `/app/oracle_client/instantclient_23_26` (bundled)
- Network access to AWS RDS Postgres endpoint

## Environment (.env)
The project expects a `.env` file at repo root. Example keys:
```
NODE_ENV=development
PORT=3005
LOG_LEVEL=info

# Oracle via SSH tunnel
ORACLE_USER=<oracle_user>
ORACLE_PASSWORD=<oracle_password>
SSH_HOST=115.244.175.130
SSH_PORT=22
SSH_USER=pipe
SSH_PASSWORD=<ssh_password>
LOCAL_ORACLE_PORT=1522
ORACLE_HOST=127.0.0.1

# Postgres (AWS RDS)
PG_HOST=database-3.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com
PG_PORT=5432
PG_USER=<pg_user>
PG_PASSWORD=<pg_password>
PG_DATABASE=Batchcode
PG_SSL=true

# Auth
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=1d
```

## Install & Run
```
npm install
npm run dev   # nodemon, uses src/server.js (default PORT 3005)
# npm start   # plain node
```
The server bootstraps Oracle + SSH pool on startup and logs `🚀 Server running at http://localhost:<PORT>`.

## API Usage
- Base path: `/`
- Auth-backed routes live under `/auth`; Oracle-backed weighbridge routes live under `/first-weight`, `/second-weight`, `/invoice`, `/gate-out`, `/payment`.
- All successful responses: `{ "success": true, "data": ... }`
- Errors: `{ "success": false, "message": "description" }` (and may include `error` for stack details)
- Pagination query params are consistent: `page` (default 1), `limit` (default 50), `customer` (string filter), `search` (string search across key columns).

### Auth (Postgres)
- `POST /auth/register`
  - Body: `username`, `password`, optional `access`, `supervisor_name`, `item_name`, `quality_controller`, `role`, `loading_incharge`
  - Response 201: user record (password stored as provided) + JWT
- `POST /auth/login`
  - Body: `username`, `password`
  - Response 200: user record + JWT (plain-text password comparison)
- `POST /auth/logout`
  - Stateless; returns success, client should discard JWT
- `GET /auth/users`
  - List all users
- `GET /auth/users/:id`
  - Fetch single user by id
- `PUT /auth/users/:id`
  - Body: any subset of user fields above; updates record
- `DELETE /auth/users/:id`
  - Deletes user; returns `{ success: true, message: "User deleted" }`

### First Weight (Oracle)
- `GET /first-weight/pending`
  - Query: `page`, `limit`, `customer`, `search`
  - Data fields: planned timestamp, order/vr numbers, party name, truck + driver info
- `GET /first-weight/history`
  - Same filters; includes actual timestamp and `wslip_no`

### Second Weight (Oracle)
- `GET /second-weight/pending`
  - Query: `page`, `limit`, `customer`, `search`
  - Data fields: planned timestamp, in-date, order/gate vrnos, weigh-slip, customer remark, truck
- `GET /second-weight/history`
  - Same filters; includes `outdate`

### Invoice (Oracle)
- `GET /invoice/pending`
  - Query: `page`, `limit`, `customer`, `search`
  - Returns vehicles that exited today with a first weight recorded but not yet invoiced (filters on `wslipno` not in `view_itemtran_engine`)
- `GET /invoice/history`
  - Query: `page`, `limit`, `customer`, `search`
  - Fields: planned/actual timestamps, order/gate vrnos, invoice number, party name, truck, waybill

### Gate Out (Oracle)
- `GET /gate-out/pending`
  - Query: `page`, `limit`, `customer`, `search`
  - Returns trucks with invoices generated and pending gate-out
- `GET /gate-out/history`
  - Query: `page`, `limit`, `customer`, `search`
  - Fields: outdate, order vrno, gate vrno, weigh-slip, ref vrno, party, truck
- `GET /gate-out/customers`
  - Returns distinct customer names from gate transactions

### Payment (Oracle)
- `GET /payment/pending`
  - Query: `page`, `limit`, `customer`, `search`
  - Aggregated invoice amounts with received/balance; filters to outstanding payments
- `GET /payment/history`
  - Query: `page`, `limit`, `customer`, `search`
  - Settled payments with totals and received amounts
- `GET /payment/customers`
  - Distinct customer names from payment data

### Dashboard (Oracle)
- `GET /dashboard/summary`
  - Returns aggregate counts: `totalgatein`, `totalgateout`, `pendinggatepass` for gate transactions since 01-Apr-2025 (filters cancelled records out).

## Legacy/Experimental (not wired into `npm start`)
`src/index.js` contains older Oracle-only utilities (`/users`, `/schema`, `/current-schema`, `/store-indent` CRUD) and runs on port 3000. The main entry (`src/server.js`) does not mount these routes; run that file directly only if you need the legacy utilities.
  
