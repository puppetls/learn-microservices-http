# Microservices HTTPS Hello World

A simple direct HTTPS communication example between three Node.js services without a message broker. All inter-service communication is encrypted via TLS using self-signed certificates.

---

## Architecture Overview

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

**Communication Flow:**
- Service A pings Service B and Service C every 10 seconds
- Service B pings Service C every 10 seconds
- Service C pings Service A every 10 seconds

---

## URL/Endpoint Relationship

```
https://localhost:3031/ping
│     │        │       │
│     │        │       └──📌 Endpoint (route) - specific "door" to hit
│     │        └──📌 Port (where the service listens)
│     └──📌 Hostname (same machine)
└──📌 Protocol (HTTPS/TLS encrypted)
```

- **Protocol**: `https://` — HTTPS protocol with TLS encryption
- **Hostname**: `localhost` — same machine (could be an IP or domain in production)
- **Port**: Service port (3031 for B, 3032 for C)
- **Endpoint**: `/ping` — the specific route that handles our request

**Full URL = Protocol + Hostname + Port + Endpoint**

---

## HTTPS Configuration

This project uses **self-signed TLS certificates** for encrypted local development.

### Certificate Details

| Property | Value |
|----------|-------|
| Type | Self-signed X.509 |
| Key | RSA 2048-bit |
| Validity | 365 days |
| Subject | CN=localhost |
| Location | `certs/key.pem` + `certs/cert.pem` |

### How It Works

1. **Server-side**: Each service uses `https.createServer()` with the shared certificate
2. **Client-side**: Axios uses an HTTPS agent with `rejectUnauthorized: false` to accept self-signed certs
3. **All traffic** between services is encrypted via TLS

> **Note:** Self-signed certificates are for development only. Production requires certificates from a trusted CA (e.g., Let's Encrypt).

### Security Best Practices

- The private key (`key.pem`) must be kept secure and **never committed to version control**.
- The `certs/` folder is included in `.gitignore` to prevent accidental commits.
- In production, use a secrets manager or environment variables to handle certificates.

### Security Best Practices

- The private key (`key.pem`) must be kept secure and **never committed to version control**.
- The `certs/` folder is included in `.gitignore` to prevent accidental commits.
- In production, use a secrets manager or environment variables to handle certificates.

### Regenerating Certificates

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -subj "//CN=localhost"
```

---

## Running the Services

### Prerequisites
- Node.js installed
- OpenSSL installed (for certificate generation, already done)

### Check Running Ports

To see all active listening ports on your machine:

**Windows (CMD):**
```cmd
netstat -ano | findstr LISTENING
```

**Windows (PowerShell):**
```powershell
Get-NetTCPConnection -State Listen
```

**Linux/macOS:**
```bash
ss -tuln
```

### Free Ports Before Running

Each service requires a specific port. Make sure these ports are **not in use** before starting:

| Service   | Port |
|-----------|------|
| Service A | 3030 |
| Service B | 3031 |
| Service C | 3032 |

If a port is already in use, you'll get an `EADDRINUSE` error. To free a port, kill any existing Node.js processes:

**Windows (CMD):**
```cmd
tasklist | findstr node
taskkill /PID <PID> /F
```

**Windows (PowerShell):**
```powershell
Get-Process -Name node | Stop-Process -Force
```

**Linux/macOS:**
```bash
lsof -i :3030 -i :3031 -i :3032
kill -9 <PID>
```

### Step 1: Install Dependencies

Each service has its own `package.json` and requires separate dependency installation:

```bash
cd service-a && npm install
cd service-b && npm install
cd service-c && npm install
```

### Step 2: Start Services (in separate terminals)

Start in order: **Service B → Service C → Service A**

```bash
# Terminal 1 - Service B (Port 3031, HTTPS)
cd service-b && npm start

# Terminal 2 - Service C (Port 3032, HTTPS)
cd service-c && npm start

# Terminal 3 - Service A (Port 3030, HTTPS)
cd service-a && npm start
```

This order ensures target services are listening before pings begin. However, error handling allows flexible startup order — offline services will log errors and retry on the next interval.

---

## Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js ^4.18.2
- **HTTP Client**: Axios ^1.6.0
- **TLS**: Node.js built-in `https` module with self-signed certificates

---

## Project Structure

```
learn-microservices-http/
├── README.md
├── https-implementation-report.md
├── certs/
│   ├── key.pem
│   └── cert.pem
├── service-a/
│   ├── client.js
│   ├── db.js
│   ├── logger.js
│   ├── logs/
│   ├── node_modules/
│   ├── package.json
│   └── package-lock.json
├── service-b/
│   ├── server.js
│   ├── db.js
│   ├── logger.js
│   ├── logs/
│   ├── node_modules/
│   ├── package.json
│   └── package-lock.json
└── service-c/
    ├── server.js
    ├── db.js
    ├── logger.js
    ├── logs/
    ├── node_modules/
    ├── package.json
    └── package-lock.json
```

## Why Separate Dependencies?

Each service is an independent Node.js project with its own `package.json`. This is intentional for microservices architecture:
- **Isolation**: Each service can use different dependency versions without conflicts
- **Independent Deployment**: In production, each service runs in its own container/server
- **No Shared State**: Services should not rely on shared files or modules

**Alternative**: Convert to a monorepo using npm workspaces, Turborepo, or Nx to manage all services from a root `package.json` with a single `npm install`.

---

## HTTP to HTTPS Migration

This project was originally built with plain HTTP. The migration to HTTPS involved:

1. **Port reassignment**: 3000→3030, 3010→3031, 3020→3032
2. **Certificate generation**: Self-signed TLS certs via OpenSSL
3. **Server upgrade**: `app.listen()` → `https.createServer()`
4. **Client upgrade**: All URLs changed from `http://` to `https://`
5. **Certificate handling**: Axios configured with custom HTTPS agent

See [https-implementation-report.md](https-implementation-report.md) for full details.

---

## Development vs Production

This project uses **direct HTTPS with hardcoded URLs** for simplicity — perfect for learning. However, real-world production environments use very different patterns:

| Aspect | Your Setup (Development) | Production |
|--------|-------------------------|------------|
| Service URLs | Hardcoded `localhost:3030` | Dynamic discovery |
| Communication | Direct HTTPS calls | Load balancers, gateways |
| TLS Certificates | Self-signed | Trusted CA (Let's Encrypt, etc.) |
| Scaling | Fixed ports | Services scale horizontally |
| Service Discovery | Manual | Automatic via registry |

### Real-World Patterns

**1. Service Discovery**
Services don't hardcode URLs. Instead, they query a registry (Consul, Eureka, Kubernetes DNS):
```
Service A → asks registry "Where is Service B?" → gets dynamic IP:Port
```

**2. API Gateway**
All requests route through a single entry point:
```
Client → API Gateway (Kong/Nginx/AWS API Gateway) → routes to appropriate service
```

**3. Message Queues**
Async communication via queues (RabbitMQ, Kafka):
```
Service A → Queue → Service B (decoupled, handles high load)
```

**4. Service Mesh**
Infrastructure layer handling service-to-service communication (Istio, Linkerd)

### Why Not Hardcoded URLs in Production?

- Services scale horizontally (multiple instances running)
- IPs change on container/restart
- Manual tracking impossible for hundreds of services
- No load balancing or failover

---

## Key Takeaways

1. **Direct HTTPS** — Encrypted communication without a message broker
2. **TLS encryption** — All inter-service traffic is encrypted via self-signed certificates
3. **Synchronous** — Each service waits for response before continuing
4. **URL matters** — Each service needs the full URL (host + port + endpoint)
5. **Error handling** — Use try/catch with error codes to detect offline services
6. **Interval pattern** — setInterval for periodic requests
7. **Full mesh communication** — All three services communicate with each other