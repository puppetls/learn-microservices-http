# Microservice HTTP - Folder Structure

## Overview

This project demonstrates direct HTTP communication between three Node.js microservices without a message broker. Each service runs on its own port and communicates via HTTP POST requests.

---

## Root Level Structure

```
learn-microservices-http/
├── README.md
├── service-a/
├── service-b/
└── service-c/
```

| Item | Type | Description |
|------|------|-------------|
| `README.md` | File | Project documentation with architecture overview, running instructions, and key takeaways |
| `service-a/` | Directory | Client service (Port 3000) - initiates pings to Service B and C |
| `service-b/` | Directory | Server service (Port 3010) - receives pings and responds |
| `service-c/` | Directory | Server service (Port 3020) - receives pings and responds |

---

## Service A (Port 3000) - Client

```
service-a/
├── client.js
├── db.js
├── logger.js
├── logs/
│   ├── combined.log
│   └── Service-A.log
├── node_modules/
├── package-lock.json
└── package.json
```

| Item | Type | Description |
|------|------|-------------|
| `client.js` | File | Main entry point - acts as HTTP client to ping Service B and C |
| `db.js` | File | Database configuration/connection module |
| `logger.js` | File | Logging utility module |
| `logs/` | Directory | Contains log output files |
| `logs/combined.log` | File | Combined log output |
| `logs/Service-A.log` | File | Service-specific log file |
| `node_modules/` | Directory | NPM dependencies |
| `package-lock.json` | File | Dependency lock file |
| `package.json` | File | Package configuration and dependencies |

---

## Service B (Port 3010) - Server

```
service-b/
├── db.js
├── logger.js
├── logs/
│   ├── combined.log
│   └── Service-B.log
├── node_modules/
├── package-lock.json
├── package.json
└── server.js
```

| Item | Type | Description |
|------|------|-------------|
| `server.js` | File | Main entry point - HTTP server that listens and responds to pings |
| `db.js` | File | Database configuration/connection module |
| `logger.js` | File | Logging utility module |
| `logs/` | Directory | Contains log output files |
| `logs/combined.log` | File | Combined log output |
| `logs/Service-B.log` | File | Service-specific log file |
| `node_modules/` | Directory | NPM dependencies |
| `package-lock.json` | File | Dependency lock file |
| `package.json` | File | Package configuration and dependencies |

---

## Service C (Port 3020) - Server

```
service-c/
├── db.js
├── logger.js
├── logs/
│   ├── combined.log
│   └── Service-C.log
├── node_modules/
├── package-lock.json
├── package.json
└── server.js
```

| Item | Type | Description |
|------|------|-------------|
| `server.js` | File | Main entry point - HTTP server that listens and responds to pings |
| `db.js` | File | Database configuration/connection module |
| `logger.js` | File | Logging utility module |
| `logs/` | Directory | Contains log output files |
| `logs/combined.log` | File | Combined log output |
| `logs/Service-C.log` | File | Service-specific log file |
| `node_modules/` | Directory | NPM dependencies |
| `package-lock.json` | File | Dependency lock file |
| `package.json` | File | Package configuration and dependencies |

---

## Communication Flow

```
Service A (3000) ──HTTP POST──> Service B (3010)
Service A (3000) ──HTTP POST──> Service C (3020)
Service B (3010) ──HTTP POST──> Service C (3020)
Service C (3020) ──HTTP POST──> Service A (3000)
```

- **Service A** pings Service B and Service C every 10 seconds
- **Service B** pings Service C every 10 seconds
- **Service C** pings Service A every 10 seconds

---

## Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js ^4.18.2
- **HTTP Client**: Axios ^1.6.0

---

## Key Takeaways

1. **Direct HTTP** - No message broker needed, services talk directly
2. **Synchronous** - Each service waits for response before continuing
3. **URL matters** - Each service needs the full URL (host + port + endpoint)
4. **Error handling** - Use try/catch with error codes to detect offline services
5. **Interval pattern** - setInterval for periodic requests
6. **Full mesh communication** - All three services communicate with each other
