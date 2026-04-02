# Microservices HTTP Hello World

A simple direct HTTP communication example between two Node.js services without a message broker.

---

## Architecture Overview

```
┌─────────────────┐         HTTP POST         ┌─────────────────┐
│                 │ ──────────────────────────▶│                 │
│  Service A      │   { "message": "Ping..." } │  Service B      │
│  (Requester)    │                            │  (Provider)     │
│                 │ ◀──────────────────────────│                 │
│  Port: none     │   { "reply": "Pong..." }   │  Port: 3010     │
│  (client only)  │                            │                 │
└─────────────────┘                            └─────────────────┘
```

---

## URL/Endpoint Relationship

### How Service A "Finds" Service B

```
http://localhost:3010/ping
│    │        │       │
│    │        │       └──📌 Endpoint (route) - specific "door" to hit
│    │        └──📌 Port (where Service B listens)
│    └──📌 Hostname (same machine)
└──📌 Protocol
```

- **Protocol**: `http://` — HTTP protocol
- **Hostname**: `localhost` — same machine (could be an IP or domain in production)
- **Port**: `3010` — where Service B is listening
- **Endpoint**: `/ping` — the specific route that handles our request

**Full URL = Protocol + Hostname + Port + Endpoint**

---

## Service B (The Provider)

### Description
Express.js server that receives POST requests and responds with a "Pong" message.

### Code (`service-b/server.js`)
```javascript
const express = require('express');
const app = express();
const PORT = 3010;

app.use(express.json());

app.post('/ping', (req, res) => {
  const { message, timestamp } = req.body;
  console.log(`📥 Received: ${message} at ${timestamp}`);
  
  res.json({
    reply: "Pong from Service B",
    receivedAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Service B listening on http://localhost:${PORT}`);
});
```

### How It Works
1. **Express.json()** — middleware to parse JSON request bodies
2. **app.post('/ping', ...)** — defines the endpoint that accepts POST requests
3. **req.body** — contains the JSON data sent by Service A
4. **res.json()** — sends a JSON response back to Service A

---

## Service A (The Requester)

### Description
Client that sends POST requests to Service B every 10 seconds and handles responses.

### Code (`service-a/client.js`)
```javascript
const axios = require('axios');

const SERVICE_B_URL = 'http://localhost:3010/ping';

async function pingServiceB() {
  const payload = {
    message: "Ping from Service A",
    timestamp: new Date().toISOString()
  };

  try {
    const response = await axios.post(SERVICE_B_URL, payload);
    console.log('📤 Response from Service B:', response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Service B is down, retrying...');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

console.log('Service A started - pinging Service B every 10 seconds');
setInterval(pingServiceB, 10000);

pingServiceB();
```

### How It Works
1. **axios.post()** — sends HTTP POST request to Service B
2. **await** — waits for response (async/await pattern)
3. **response.data** — contains the JSON body from Service B's response
4. **try/catch** — handles errors gracefully
5. **setInterval()** — runs the function every 10 seconds (10000ms)

---

## Handling the Response from Service B

When Service B responds successfully, Service A receives:

```javascript
{
  reply: "Pong from Service B",
  receivedAt: "2026-03-31T15:23:13.000Z"
}
```

Service A accesses this via `response.data` and logs it:
```
📤 Response from Service B: { reply: 'Pong from Service B', receivedAt: '...' }
```

---

## Error Handling

### When Service B is Offline

If Service B is not running, axios throws an error with code:
- `ECONNREFUSED` — connection refused (server not listening)
- `ETIMEDOUT` — connection timed out

Service A catches this and logs:
```
⚠️  Service B is down, retrying...
```

The loop continues — it will try again in 10 seconds automatically!

---

## Running the Services

### Prerequisites
- Node.js installed

### Step 1: Install Dependencies
```bash
cd service-b && npm install
cd service-a && npm install
```

### Step 2: Start Service B (Provider)
```bash
cd service-b && npm start
```
Expected output:
```
Service B listening on http://localhost:3010
```

### Step 3: Start Service A (Requester)
```bash
cd service-a && npm start
```
Expected output:
```
Service A started - pinging Service B every 10 seconds
📤 Response from Service B: { reply: 'Pong from Service B', receivedAt: '...' }
```

---

## Project Structure

```
learn-microservices-http/
├── README.md
├── service-a/
│   ├── package.json
│   └── client.js
└── service-b/
    ├── package.json
    └── server.js
```

---

## Key Takeaways

1. **Direct HTTP** — No message broker needed, services talk directly
2. **Synchronous** — Service A waits for response before continuing
3. **URL matters** — Service A needs the full URL (host + port + endpoint)
4. **Error handling** — Use try/catch with error codes to detect offline services
5. **Interval pattern** — setInterval for periodic requests