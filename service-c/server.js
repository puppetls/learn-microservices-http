const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');
const Database = require('./db');

const app = express();
const PORT = 3032;
const startTime = Date.now();
const logger = new Logger('Service-C');
const db = new Database('Service-C');
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
    reply: "Pong from Service C",
    receivedAt: new Date().toISOString()
  };
  logger.sendResponse(from, response);
  
  await db.logIncoming(from, { message, timestamp }, response);
  res.json(response);
});

app.get('/api/status', async (req, res) => {
  res.json({
    service: 'Service C',
    port: PORT,
    uptime: Date.now() - startTime,
    targets: ['Service A'],
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
  if (target === 'Service A') {
    await pingServiceA();
    res.json({ success: true, target: 'Service A' });
  } else {
    res.status(400).json({ error: 'Invalid target' });
  }
});

app.post('/api/ping/start', (req, res) => {
  if (pingInterval) {
    return res.json({ status: 'already running' });
  }
  pingInterval = setInterval(pingServiceA, 10000);
  pingServiceA();
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
    'Service A': 'https://localhost:3030/ping'
  };
  const url = targets[target];
  if (!url) {
    return res.status(400).json({ error: 'Invalid target' });
  }
  const payload = {
    message: message || 'Custom ping',
    timestamp: new Date().toISOString(),
    from: 'Service C'
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

const SERVICE_A_URL = 'https://localhost:3030/ping';

async function pingServiceA() {
  logger.pingSent('Service A');

  const payload = {
    message: "Ping from Service C",
    timestamp: new Date().toISOString(),
    from: "Service C"
  };
  logger.sendMessage('Service A', '/ping', payload);

  try {
    const response = await axios.post(SERVICE_A_URL, payload, { httpsAgent });
    logger.receiveResponse('Service A', response.data);
    await db.logOutgoing('Service A', '/ping', payload, response.data);
  } catch (error) {
    logger.connectionFailed('Service A', error);
    await db.logOutgoingError('Service A', '/ping', payload, error);
  }
}

async function start() {
  await db.init();
  
  https.createServer(sslOptions, app).listen(PORT, () => {
    logger.serviceStarted(PORT);
  });

  logger.info('MAIN', 'Service C started - pinging Service A every 10 seconds');
  pingInterval = setInterval(pingServiceA, 10000);

  pingServiceA();
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});