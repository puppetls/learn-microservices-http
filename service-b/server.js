const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');
const Database = require('./db');

const app = express();
const PORT = 3031;
const startTime = Date.now();
const logger = new Logger('Service-B');
const db = new Database('Service-B');
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
    reply: "Pong from Service B",
    receivedAt: new Date().toISOString()
  };
  logger.sendResponse(from, response);
  
  await db.logIncoming(from, { message, timestamp }, response);
  res.json(response);
});

app.get('/api/status', async (req, res) => {
  res.json({
    service: 'Service B',
    port: PORT,
    uptime: Date.now() - startTime,
    targets: ['Service C'],
    intervalRunning: pingInterval !== null
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

app.post('/api/ping/start', (req, res) => {
  if (pingInterval) {
    return res.json({ status: 'already running' });
  }
  pingInterval = setInterval(pingServiceC, 10000);
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
    'Service C': 'https://localhost:3032/ping'
  };
  const url = targets[target];
  if (!url) {
    return res.status(400).json({ error: 'Invalid target' });
  }
  const payload = {
    message: message || 'Custom ping',
    timestamp: new Date().toISOString(),
    from: 'Service B'
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

const SERVICE_C_URL = 'https://localhost:3032/ping';

async function pingServiceC() {
  logger.pingSent('Service C');

  const payload = {
    message: "Ping from Service B",
    timestamp: new Date().toISOString(),
    from: "Service B"
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

  logger.info('MAIN', 'Service B started - pinging Service C every 10 seconds');
  pingInterval = setInterval(pingServiceC, 10000);

  pingServiceC();
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
