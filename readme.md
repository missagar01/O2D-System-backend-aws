# Oracle + Postgres Backend

Express-based API that:
- Opens an SSH tunnel to reach Oracle (for weighbridge data).
- Uses Oracle for business data and Postgres (AWS RDS) for auth.
- Issues JWTs for login (passwords stored as provided; no hashing by design).

## Prerequisites
- Node.js 20+
- npm
- SSH access to `115.244.175.130` as `pipe` (password from `.env`).
- Oracle Instant Client available at `C:\oracle\instantclient_23_9` (Thick mode) or fallback to bundled `/app/oracle_client/instantclient_23_26`.

## Environment
Configure `.env` (already present):
```
NODE_ENV=development
PORT=3005
LOG_LEVEL=info

# Oracle via SSH tunnel
ORACLE_USER=srmplerp
ORACLE_PASSWORD=srmplerp
SSH_HOST=115.244.175.130
SSH_PORT=22
SSH_USER=pipe
SSH_PASSWORD="@dmin*$121#"
LOCAL_ORACLE_PORT=1522
ORACLE_HOST=127.0.0.1

# Postgres (AWS RDS)
PG_HOST=database-3.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=sagarpipe
PG_DATABASE=Batchcode
PG_SSL=true

# Auth
JWT_SECRET=choose-a-long-random-string
JWT_EXPIRES_IN=1d
```

## Install & Run
```
npm install
npm run dev
```
Server listens on `PORT` (default 3005).

## API Endpoints
### Auth (Postgres)
- **POST `/auth/register`**  
  Body:
  ```json
  {
    "username": "user1",
    "password": "plain-text",
    "access": "optional",
    "supervisor_name": "optional",
    "item_name": "optional",
    "quality_controller": "optional",
    "role": "optional",
    "loading_incharge": "optional"
  }
  ```
  Response `201`:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "username": "user1",
        "access": "optional",
        "supervisor_name": "optional",
        "item_name": "optional",
        "quality_controller": "optional",
        "role": "optional",
        "loading_incharge": "optional",
        "created_at": "2025-11-22T12:00:00.000Z",
        "updated_at": "2025-11-22T12:00:00.000Z"
      },
      "token": "jwt-token"
    }
  }
  ```

- **POST `/auth/login`**  
  Body:
  ```json
  { "username": "user1", "password": "plain-text" }
  ```
  Response `200`:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "username": "user1",
        "access": "optional",
        "supervisor_name": "optional",
        "item_name": "optional",
        "quality_controller": "optional",
        "role": "optional",
        "loading_incharge": "optional",
        "created_at": "2025-11-22T12:00:00.000Z",
        "updated_at": "2025-11-22T12:00:00.000Z"
      },
      "token": "jwt-token"
    }
  }
  ```

- **POST `/auth/logout`**  
  Stateless; returns success and expects the client to discard the JWT.

- **GET `/auth/users`**  
  List all users.
  Response `200`:
  ```json
  { "success": true, "data": [ { "id": 1, "username": "user1", "...": "..." } ] }
  ```

- **GET `/auth/users/:id`**  
  Fetch one user by id. Response `200` similar to above.

- **PUT `/auth/users/:id`**  
  Body (any subset of fields):
  ```json
  {
    "username": "newname",
    "password": "new-plain-password",
    "access": "optional",
    "supervisor_name": "optional",
    "item_name": "optional",
    "quality_controller": "optional",
    "role": "optional",
    "loading_incharge": "optional"
  }
  ```
  Response `200` with updated user.

- **DELETE `/auth/users/:id`**  
  Response `200`: `{ "success": true, "message": "User deleted" }`

### Weighbridge (Oracle via SSH tunnel)
All return `{ "success": true, "data": [...] }` on success.
- **GET `/first-weight/...`** – first weight data (see routes for specifics).
- **GET `/second-weight/pending`** – pending second weight list with filters `page`, `limit`, `customer`, `search`.
- **GET `/second-weight/history`** – historical second weights with filters `page`, `limit`, `customer`, `search`.
- **GET `/invoice/...`**, **`/gate-out/...`**, **`/payment/...`** – see respective route files for payloads.

### Error Shape
Errors respond with:
```json
{ "success": false, "message": "description" }
```
