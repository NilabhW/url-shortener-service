# 🔗 URL Shortener Service

A full-stack URL shortening service built with **Node.js**, **Express**, and **MongoDB**. Converts long URLs into compact 6-character short codes, tracks click analytics, and redirects users transparently — similar in concept to services like Bitly or TinyURL.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Design](#system-design)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Design Decisions](#design-decisions)
- [Potential Improvements](#potential-improvements)

---

## Overview

This service solves a classic backend engineering problem: storing a mapping between a long URL and a short, unique identifier, then redirecting users who visit the short link to the original destination. Beyond basic shortening, the service also tracks how many times each short link has been clicked, enabling basic link analytics.

---

## Features

- ✅ **URL Shortening** — Generates a unique 6-character alphanumeric short code for any URL
- ✅ **Instant Redirect** — Visiting `/{shortCode}` transparently redirects to the original URL
- ✅ **Click Analytics** — Tracks total click count per short link; queryable via a dedicated endpoint
- ✅ **Persistent Storage** — All links and metadata are stored in MongoDB, surviving server restarts
- ✅ **Simple Frontend UI** — A minimal HTML/JS interface served statically for quick manual testing

---

## Tech Stack

| Layer      | Technology                  | Purpose                                      |
|------------|-----------------------------|----------------------------------------------|
| Runtime    | Node.js                     | JavaScript server-side runtime               |
| Framework  | Express 5                   | HTTP server, routing, and middleware         |
| Database   | MongoDB (local)             | Persistent NoSQL document storage            |
| ODM        | Mongoose 9                  | Schema definition, validation, and queries   |
| ID Gen     | nanoid 3                    | Cryptographically-sound short code generation|
| Frontend   | Vanilla HTML + CSS + JS     | Static UI for submitting URLs                |

---

## System Design

```
┌─────────────────────┐        POST /shorten        ┌───────────────────────┐
│   Browser / Client  │ ─────────────────────────► │   Express Server      │
│                     │                             │   (index.js)          │
│                     │ ◄────────── short URL ───── │                       │
│                     │                             │   ┌───────────────┐   │
│  Visits /{shortCode}│ ─────────────────────────► │   │  MongoDB      │   │
│                     │ ◄──── 302 Redirect ──────── │   │  (Mongoose)   │   │
│                     │                             │   └───────────────┘   │
│  GET /analytics/:c  │ ─────────────────────────► │                       │
│                     │ ◄──── { clickCount, ... } ──│                       │
└─────────────────────┘                             └───────────────────────┘
```

**Request Lifecycle for URL Shortening:**
1. Client sends `POST /shorten` with `{ originalUrl }` in the request body
2. Server generates a unique 6-character code using `nanoid`
3. A new document is saved to MongoDB with the original URL, short code, click count, and timestamp
4. Server responds with the full `shortUrl` (`http://localhost:3000/{code}`)

**Request Lifecycle for Redirect:**
1. Client visits `GET /{shortCode}`
2. Server queries MongoDB for a document matching that `shortCode`
3. If found, increments `clickCount` and saves, then issues a `302` redirect to `originalUrl`
4. If not found, returns `404`

---

## Project Structure

```
url-shortener-service/
├── index.js            # Entry point — Express app, DB connection, all routes
├── models/
│   └── Url.js          # Mongoose schema & model for URL documents
├── public/
│   └── index.html      # Static frontend UI (served by Express)
├── package.json        # Project metadata and dependencies
└── README.md
```

---

## Database Schema

**Collection:** `urls`

| Field        | Type     | Required | Default      | Description                              |
|--------------|----------|----------|--------------|------------------------------------------|
| `originalUrl`| `String` | ✅ Yes   | —            | The original long URL submitted by user  |
| `shortCode`  | `String` | ✅ Yes   | —            | Unique 6-char identifier (nanoid)        |
| `clickCount` | `Number` | ❌ No    | `0`          | Number of times the short link was used  |
| `date`       | `Date`   | ❌ No    | `Date.now`   | Timestamp of when the short link was created |

The `shortCode` field has a `unique: true` constraint enforced at the MongoDB index level, preventing duplicate codes.

---

## API Reference

### `POST /shorten`
Creates a new short URL.

**Request Body:**
```json
{
  "originalUrl": "https://www.example.com/very/long/path?query=value"
}
```

**Success Response `200 OK`:**
```json
{
  "originalUrl": "https://www.example.com/very/long/path?query=value",
  "shortCode": "aB3xYz",
  "shortUrl": "http://localhost:3000/aB3xYz"
}
```

**Error Response `400 Bad Request`:**
```json
{ "error": "URL is required" }
```

---

### `GET /:code`
Redirects to the original URL and increments the click counter.

| Scenario      | HTTP Status | Behaviour                          |
|---------------|-------------|------------------------------------|
| Code found    | `302`       | Redirect to `originalUrl`          |
| Code not found| `404`       | Returns `"No URL found"`           |

---

### `GET /analytics/:code`
Returns click analytics for a given short code.

**Success Response `200 OK`:**
```json
{
  "originalUrl": "https://www.example.com/very/long/path?query=value",
  "shortCode": "aB3xYz",
  "clickCount": 42
}
```

**Error Response `404 Not Found`:**
```json
{ "error": "Short code not found" }
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NilabhW/url-shortener-service.git
cd url-shortener-service

# 2. Install dependencies
npm install

# 3. Start MongoDB (if not already running as a service)
mongod

# 4. Start the server
node index.js
```

The server will be available at **http://localhost:3000**

### Quick Test with cURL

```bash
# Shorten a URL
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'

# Check analytics (replace aB3xYz with your actual shortCode)
curl http://localhost:3000/analytics/aB3xYz

# Redirect (browser or curl -L to follow)
curl -L http://localhost:3000/aB3xYz
```

---

## How It Works

### Short Code Generation — `nanoid`

Instead of auto-incrementing integers (which are predictable and can be enumerated), this service uses **nanoid** to generate a URL-safe, cryptographically random 6-character string (e.g., `aB3xYz`). With 64 possible characters per position, a 6-char code yields **64⁶ = ~68 billion** possible unique codes — sufficient for most use cases without collision risk.

### Click Counting

The redirect route (`GET /:code`) performs an **atomic read-modify-write** on the document: it fetches the URL record, increments `clickCount` in memory, and saves the updated document back to MongoDB before issuing the redirect. This ensures every click is captured even under concurrent traffic (at the cost of an extra DB write per redirect).

### Static File Serving

Express serves the `public/` directory statically. Placing `index.html` there means the frontend UI is available at the root `/` without requiring any additional routing logic.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **nanoid over UUID** | Shorter output (6 chars vs 36), URL-safe by default, and cryptographically random |
| **MongoDB over SQL** | Schema-less document store is a natural fit for URL mappings; easy to add new fields later (e.g., custom alias, expiry) without migrations |
| **Mongoose ODM** | Provides schema validation and a clean model abstraction over raw MongoDB driver |
| **Express 5** | Async error propagation is handled automatically — no need to wrap routes in try/catch for unhandled promise rejections in newer Express |
| **Single-file server** | Keeps the codebase approachable and self-contained; would be split into `routes/`, `controllers/`, `config/` in a production setup |

---

## Potential Improvements

These are natural conversation topics in a technical interview context:

- **Custom Aliases** — Allow users to choose a custom short code (e.g., `/my-promo`) instead of a generated one
- **Link Expiry** — Add a `expiresAt` field and reject redirects for expired codes via a TTL index in MongoDB
- **Rate Limiting** — Use `express-rate-limit` to prevent abuse of the `/shorten` endpoint
- **Validation** — Validate that `originalUrl` is a well-formed URL before saving (e.g., using the `validator` package)
- **Environment Variables** — Move `PORT`, `MONGO_URI`, and `BASE_URL` to a `.env` file using `dotenv` instead of hardcoding them
- **Collision Handling** — In the rare case of a nanoid collision, retry code generation instead of failing silently
- **Horizontal Scaling** — Use a Redis cache in front of MongoDB for redirect lookups to reduce DB load at high traffic
- **HTTPS & Custom Domains** — Deploy behind a reverse proxy (Nginx) with TLS termination for production readiness

---

## License

ISC