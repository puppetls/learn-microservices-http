# HTTPS Implementation Report

**Date:** 2026-04-03
**Project:** learn-microservices-http

---

## Summary

Migrated all three microservices from plain HTTP to HTTPS using self-signed TLS certificates for secure local development communication.

---

## Changes Made

### 1. Port Reassignment

| Service | Old Port | New Port |
|---------|----------|----------|
| Service A | 3000 | 3030 |
| Service B | 3010 | 3031 |
| Service C | 3020 | 3032 |

### 2. TLS Certificate Generation

- **Tool:** OpenSSL
- **Type:** Self-signed X.509 certificate (RSA 2048-bit)
- **Validity:** 365 days
- **Subject:** CN=localhost
- **Location:** `certs/key.pem` (private key) and `certs/cert.pem` (certificate)

### 3. Server-Side Changes

All services replaced `app.listen()` with `https.createServer()`:

```javascript
// Before (HTTP)
app.listen(PORT, () => { ... });

// After (HTTPS)
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'cert.pem'))
};
https.createServer(sslOptions, app).listen(PORT, () => { ... });
```

**Files modified:**
- `service-a/client.js:85` — `https.createServer()`
- `service-b/server.js:65` — `https.createServer()`
- `service-c/server.js:65` — `https.createServer()`

### 4. Client-Side Changes

All outgoing request URLs changed from `http://` to `https://`:

| Service | Target | Old URL | New URL |
|---------|--------|---------|---------|
| A | B | `http://localhost:3010/ping` | `https://localhost:3031/ping` |
| A | C | `http://localhost:3020/ping` | `https://localhost:3032/ping` |
| B | C | `http://localhost:3020/ping` | `https://localhost:3032/ping` |
| C | A | `http://localhost:3000/ping` | `https://localhost:3030/ping` |

### 5. Axios HTTPS Agent

Each service creates an HTTPS agent that accepts self-signed certificates:

```javascript
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
```

Passed to all `axios.post()` calls:
```javascript
await axios.post(SERVICE_URL, payload, { httpsAgent });
```

### 6. New Dependencies Added

Each service now imports:
- `https` — Node.js built-in HTTPS module
- `fs` — File system access for reading certificates
- `path` — Cross-platform path resolution

---

## Architecture (After)

```
┌─────────────────┐      HTTPS POST (TLS)      ┌─────────────────┐
│                 │ ───────────────────────────▶│                 │
│  Service A      │    { "message": "Ping..." } │  Service B      │
│  (Port: 3030)   │                             │  (Port: 3031)   │
│   [TLS]         │ ◀───────────────────────────│   [TLS]         │
└─────────────────┘    { "reply": "Pong..." }   └─────────────────┘
         │
         │      HTTPS POST (TLS)
         ▼ ──────────────────────────▶┌─────────────────┐
                                       │                 │
                                       │  Service C      │
                                       │  (Port: 3032)   │
                                       │   [TLS]         │
                                       └─────────────────┘
```

---

## Files Modified

| File | Changes |
|------|---------|
| `service-a/client.js` | HTTPS server, httpsAgent, updated URLs |
| `service-b/server.js` | HTTPS server, httpsAgent, updated URLs |
| `service-c/server.js` | HTTPS server, httpsAgent, updated URLs |

## Files Created

| File | Purpose |
|------|---------|
| `certs/key.pem` | RSA private key |
| `certs/cert.pem` | Self-signed certificate |
| `https-implementation-report.md` | This report |

---

## Security Notes

- **Self-signed certificates are for development only.** Production requires certificates from a trusted CA (e.g., Let's Encrypt).
- `rejectUnauthorized: false` disables certificate validation. Never use in production.
- The private key (`key.pem`) should be kept secure and never committed to version control.
- Consider adding `certs/` to `.gitignore`.

---

## Regenerating Certificates

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -subj "//CN=localhost"
```
