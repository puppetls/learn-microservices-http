const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');
const Database = require('./db');

const app = express();
const PORT = 3031;
const logger = new Logger('Service-B');
const db = new Database('Service-B');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'cert.pem'))
};

app.use(express.json());

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
  setInterval(pingServiceC, 10000);

  pingServiceC();
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});