# Web UI Control Panel

A web-based control panel for managing and monitoring the microservices.

## Accessing the UI

Open your browser and navigate to any of the following URLs:

- **Service A**: https://localhost:3030
- **Service B**: https://localhost:3031
- **Service C**: https://localhost:3032

> **Note**: On first access, your browser will show a security warning because the services use self-signed SSL certificates. Click "Advanced" → "Proceed to localhost (unsafe)" to continue.

## Features

### Status Panel
The top section displays:
- **Service**: The name of the service (A, B, or C)
- **Port**: The port number the service is running on
- **Targets**: The asymmetric list of services this one pings
  - Service A → B, C
  - Service B → C
  - Service C → A
- **Pinging**: Whether the automatic ping interval is running (Yes/No)

### Controls
- **Start Pinging**: Starts the automatic 10-second ping interval
- **Stop Pinging**: Stops the automatic ping interval

### Custom Ping
Send a custom ping message to a target service:
1. Select a target from the dropdown
2. Enter a custom message (optional)
3. Click "Send Ping"

The response from the target service will be displayed in the console and logged to the database.

### Recent Messages
View the last 50 messages stored in the local database:
- **Direction**: Sent (outgoing) or Received (incoming)
- **Service**: Which service sent/received the message
- **Payload**: The message content and metadata
- **Status**: Success or error

Click "Refresh" to reload the message list.

## API Endpoints

The following endpoints are available for programmatic access:

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/status` | Get service status and targets |
| GET | `/api/messages?limit=N` | Get recent messages (default: 50) |
| POST | `/api/ping/start` | Start automatic pinging |
| POST | `/api/ping/stop` | Stop automatic pinging |
| POST | `/api/ping/custom` | Send custom ping (body: `{ message, target }`) |

## Starting the Services

If services are not running, start them with:

```bash
# Terminal 1
cd service-a && node client.js

# Terminal 2
cd service-b && node server.js

# Terminal 3
cd service-c && node server.js
```

All services must be running for the full ping cycle to work.
