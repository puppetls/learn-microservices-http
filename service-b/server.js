const express = require('express');
const app = express();
const PORT = 3010;

app.use(express.json());

app.post('/ping', (req, res) => {
  const { message, timestamp } = req.body;
  console.log(`📥 Received: ${message} at ${timestamp}`);
  
  res.json({
    reply: "Pong from Service B",
    receivedAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Service B listening on http://localhost:${PORT}`);
});
