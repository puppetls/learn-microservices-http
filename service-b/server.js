const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3010;

app.use(express.json());

app.post('/ping', (req, res) => {
  const { message, timestamp, from } = req.body;
  console.log(`📥 Received: ${message} at ${timestamp} from ${from}`);
  
  res.json({
    reply: "Pong from Service B",
    receivedAt: new Date().toISOString()
  });
});

const SERVICE_C_URL = 'http://localhost:3020/ping';

async function pingServiceC() {
  const payload = {
    message: "Ping from Service B",
    timestamp: new Date().toISOString(),
    from: "Service B"
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
  console.log(`Service B listening on http://localhost:${PORT}`);
});

console.log('Service B started - pinging Service C every 10 seconds');
setInterval(pingServiceC, 10000);

pingServiceC();