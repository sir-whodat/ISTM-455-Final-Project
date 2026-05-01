# ISTM-455 Final Project

Minimal contacts-book app with CRUD operations, SQLite storage, a browser UI, automated tests, and Docker deployment.

## Stack

- Node.js ≥ 24 (required for the built-in `node:sqlite` module)
- Express REST API
- Vanilla frontend served by Express
- SQLite database via Node's built-in `node:sqlite`
- Vitest and Supertest for testing
- Docker and Docker Compose for deployment
- HTTPS using a combined `certs/server.pem` file with a self-signed certificate

## Features

- Browse 10 seeded sample contacts on first launch
- Create, read, update, and delete contacts
- Validate required fields before save
- Store data in a local SQLite file

## Install

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate the self-signed certificate bundle if you need to recreate it:

   ```bash
   npm run cert:generate
   ```

## Run Locally

Start the HTTPS server:

```bash
npm start
```

Open:

```text
https://localhost:8443
```

Your browser will warn about the self-signed certificate. Accept it to continue.

## Test

Run the API tests:

```bash
npm test
```

## Build

Prepare the production static assets:

```bash
npm run build
```

This copies the frontend files into `dist/public` for the production image.

## Docker

1. Generate the self-signed certificate if you haven't already:

   ```bash
   npm run cert:generate
   ```

   This creates `certs/server.pem` which is mounted read-only into the container by Docker Compose.

2. Build and run with Compose:

   ```bash
   docker compose up --build
   ```

The app is exposed on port `8443`.

## API

- `GET /api/contacts`
- `GET /api/contacts/:id`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`

## Project Layout

- `src/` app server, database, and API logic
- `public/` browser UI assets
- `tests/` Vitest coverage
- `scripts/` build and certificate helpers
- `certs/server.pem` combined private key and certificate