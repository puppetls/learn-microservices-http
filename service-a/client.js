const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/ping', (req, res) => {
  const { message, timestamp, from } = req.body;
  console.log(`📥 Received: ${message} at ${timestamp} from ${from}`);
  
  res.json({
    reply: "Pong from Service A",
    receivedAt: new Date().toISOString()
  });
});

const SERVICE_B_URL = 'http://localhost:3010/ping';
const SERVICE_C_URL = 'http://localhost:3020/ping';

async function pingServiceB() {
  const payload = {
    message: "Ping from Service A",
    timestamp: new Date().toISOString(),
    from: "Service A"
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

async function pingServiceC() {
  const payload = {
    message: "Ping from Service A",
    timestamp: new Date().toISOString(),
    from: "Service A"
  };

  try {
    const response = await axios.post(SERVICE_C_URL, payload);
    console.log('📤 Response from Service C:', response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Service C is down, retrying...');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

app.listen(PORT, () => {
  console.log(`Service A listening on http://localhost:${PORT}`);
});

console.log('Service A started - pinging Service B and Service C every 10 seconds');
setInterval(() => {
  pingServiceB();
  pingServiceC();
}, 10000);

pingServiceB();
pingServiceC();