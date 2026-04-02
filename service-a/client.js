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
