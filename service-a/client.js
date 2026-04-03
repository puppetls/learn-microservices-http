const express = require('express');
const axios = require('axios');
const Logger = require('./logger');
const Database = require('./db');

const app = express();
const PORT = 3000;
const logger = new Logger('Service-A');
const db = new Database('Service-A');

app.use(express.json());

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

const SERVICE_B_URL = 'http://localhost:3010/ping';
const SERVICE_C_URL = 'http://localhost:3020/ping';

async function pingServiceB() {
  logger.pingSent('Service B');

  const payload = {
    message: "Ping from Service A",
    timestamp: new Date().toISOString(),
    from: "Service A"
  };
  logger.sendMessage('Service B', '/ping', payload);

  try {
    const response = await axios.post(SERVICE_B_URL, payload);
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
    const response = await axios.post(SERVICE_C_URL, payload);
    logger.receiveResponse('Service C', response.data);
    await db.logOutgoing('Service C', '/ping', payload, response.data);
  } catch (error) {
    logger.connectionFailed('Service C', error);
    await db.logOutgoingError('Service C', '/ping', payload, error);
  }
}

async function start() {
  await db.init();
  
  app.listen(PORT, () => {
    logger.serviceStarted(PORT);
  });

  logger.info('MAIN', 'Service A started - pinging Service B and Service C every 10 seconds');
  setInterval(() => {
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