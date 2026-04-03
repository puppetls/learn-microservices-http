const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');
const Database = require('./db');

const app = express();
const PORT = 3030;
const startTime = Date.now();
const logger = new Logger('Service-A');
const db = new Database('Service-A');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'cert.pem'))
};
let pingInterval = null;

app.use(express.json());
app.use(express.static('public'));

app.post('/ping', async (req, res) => {
  const { message, timestamp, from } = req.body;
  logger.receiveMessage(from, { message, timestamp });

  const response = {
    reply: "Pong from Service A",
    receivedAt: new Date().toISOString()
  };
  logger.sendResponse(from, response);
  
  await db.logIncoming(from, { message, timestamp }, response);
  res.json(response);
});

app.get('/api/status', async (req, res) => {
  res.json({
    service: 'Service A',
    port: PORT,
    uptime: Date.now() - startTime,
    targets: ['Service B', 'Service C'],
    intervalRunning: pingInterval !== null
  });
});
});

app.get('/api/messages', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  try {
    const messages = await db.getMessages(limit);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ping', async (req, res) => {
  const { target } = req.body;
  if (target === 'Service B') {
    await pingServiceB();
    res.json({ success: true, target: 'Service B' });
  } else if (target === 'Service C') {
    await pingServiceC();
    res.json({ success: true, target: 'Service C' });
  } else {
    res.status(400).json({ error: 'Invalid target' });
  }
});

app.post('/api/ping', async (req, res) => {
  const { target } = req.body;
  if (target === 'Service B') {
    await pingServiceB();
    res.json({ success: true, target: 'Service B' });
  } else if (target === 'Service C') {
    await pingServiceC();
    res.json({ success: true, target: 'Service C' });
  } else {
    res.status(400).json({ error: 'Invalid target' });
  }
});

app.post('/api/ping/start', (req, res) => {
  if (pingInterval) {
    return res.json({ status: 'already running' });
  }
  pingInterval = setInterval(() => {
    pingServiceB();
    pingServiceC();
  }, 10000);
  pingServiceB();
  pingServiceC();
  res.json({ status: 'started' });
});

app.post('/api/ping/stop', (req, res) => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    res.json({ status: 'stopped' });
  } else {
    res.json({ status: 'already stopped' });
  }
});

app.post('/api/ping/custom', async (req, res) => {
  const { message, target } = req.body;
  const targets = {
    'Service B': 'https://localhost:3031/ping',
    'Service C': 'https://localhost:3032/ping'
  };
  const url = targets[target];
  if (!url) {
    return res.status(400).json({ error: 'Invalid target' });
  }
  const payload = {
    message: message || 'Custom ping',
    timestamp: new Date().toISOString(),
    from: 'Service A'
  };
  try {
    const response = await axios.post(url, payload, { httpsAgent });
    await db.logOutgoing(target, '/ping', payload, response.data);
    res.json({ target, response: response.data });
  } catch (error) {
    await db.logOutgoingError(target, '/ping', payload, error);
    res.status(500).json({ target, error: error.message });
  }
});

const SERVICE_B_URL = 'https://localhost:3031/ping';
const SERVICE_C_URL = 'https://localhost:3032/ping';

async function pingServiceB() {
  logger.pingSent('Service B');

  const payload = {
    message: "Ping from Service A",
    timestamp: new Date().toISOString(),
    from: "Service A"
  };
  logger.sendMessage('Service B', '/ping', payload);

  try {
    const response = await axios.post(SERVICE_B_URL, payload, { httpsAgent });
    logger.receiveResponse('Service B', response.data);
    await db.logOutgoing('Service B', '/ping', payload, response.data);
  } catch (error) {
    logger.connectionFailed('Service B', error);
    await db.logOutgoingError('Service B', '/ping', payload, error);
  }
}

async function pingServiceC() {
  logger.pingSent('Service C');

  const payload = {
    message: "Ping from Service A",
    timestamp: new Date().toISOString(),
    from: "Service A"
  };
  logger.sendMessage('Service C', '/ping', payload);

  try {
    const response = await axios.post(SERVICE_C_URL, payload, { httpsAgent });
    logger.receiveResponse('Service C', response.data);
    await db.logOutgoing('Service C', '/ping', payload, response.data);
  } catch (error) {
    logger.connectionFailed('Service C', error);
    await db.logOutgoingError('Service C', '/ping', payload, error);
  }
}

async function start() {
  await db.init();
  
  https.createServer(sslOptions, app).listen(PORT, () => {
    logger.serviceStarted(PORT);
  });

  logger.info('MAIN', 'Service A started - pinging Service B and Service C every 10 seconds');
  pingInterval = setInterval(() => {
    pingServiceB();
    pingServiceC();
  }, 10000);

  pingServiceB();
  pingServiceC();
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});