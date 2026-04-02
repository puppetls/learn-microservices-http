# Microservices HTTP Hello World

A simple direct HTTP communication example between three Node.js services without a message broker.

---

## Architecture Overview

```
┌─────────────────┐         HTTP POST         ┌─────────────────┐
│                 │ ──────────────────────────▶│                 │
│  Service A      │   { "message": "Ping..." } │  Service B      │
│  (Port: 3000)    │                            │  (Port: 3010)    │
│                 │ ◀──────────────────────────│                 │
└─────────────────┘   { "reply": "Pong..." }   └─────────────────┘
         │
         │         HTTP POST
         ▼ ──────────────────────────▶┌─────────────────┐
                                      │                 │
                                      │  Service C      │
                                      │  (Port: 3020)    │
                                      │                 │
                                      └─────────────────┘
```

**Communication Flow:**
- Service A pings Service B and Service C every 10 seconds
- Service B pings Service C every 10 seconds
- Service C pings Service A every 10 seconds

---

## URL/Endpoint Relationship

### How Services "Find" Each Other

```
http://localhost:3010/ping
│    │        │       │
│    │        │       └──📌 Endpoint (route) - specific "door" to hit
│    │        └──📌 Port (where the service listens)
│    └──📌 Hostname (same machine)
└──📌 Protocol
```

- **Protocol**: `http://` — HTTP protocol
- **Hostname**: `localhost` — same machine (could be an IP or domain in production)
- **Port**: Service port (3010 for B, 3020 for C)
- **Endpoint**: `/ping` — the specific route that handles our request

**Full URL = Protocol + Hostname + Port + Endpoint**

---

## Running the Services

### Prerequisites
- Node.js installed

### Step 1: Install Dependencies
```bash
cd service-b && npm install
cd service-c && npm install
cd service-a && npm install
```

### Step 2: Start Service B
```bash
cd service-b && npm start
```
Expected output:
```
Service B listening on http://localhost:3010
```

### Step 3: Start Service C
```bash
cd service-c && npm start
```
Expected output:
```
Service C listening on http://localhost:3020
Service C started - pinging Service A every 10 seconds
```

### Step 4: Start Service A
```bash
cd service-a && npm start
```
Expected output:
```
Service A listening on http://localhost:3000
Service A started - pinging Service B and Service C every 10 seconds
```

---

## Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js ^4.18.2
- **HTTP Client**: Axios ^1.6.0

---

## Project Structure

```
learn-microservices-http/
├── README.md
├── service-a/
│   ├── package.json
│   └── client.js
├── service-b/
│   ├── package.json
│   └── server.js
└── service-c/
    ├── package.json
    └── server.js
```

---

## Key Takeaways

1. **Direct HTTP** — No message broker needed, services talk directly
2. **Synchronous** — Each service waits for response before continuing
3. **URL matters** — Each service needs the full URL (host + port + endpoint)
4. **Error handling** — Use try/catch with error codes to detect offline services
5. **Interval pattern** — setInterval for periodic requests
6. **Full mesh communication** — All three services communicate with each other