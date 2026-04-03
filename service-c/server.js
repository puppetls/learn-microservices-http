const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');
const Database = require('./db');

const app = express();
const PORT = 3032;
const logger = new Logger('Service-C');
const db = new Database('Service-C');
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
    reply: "Pong from Service C",
    receivedAt: new Date().toISOString()
  };
  logger.sendResponse(from, response);
  
  await db.logIncoming(from, { message, timestamp }, response);
  res.json(response);
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
  setInterval(pingServiceA, 10000);

  pingServiceA();
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});