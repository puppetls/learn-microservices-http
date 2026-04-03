const API_BASE = '';

async function loadStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();
    document.getElementById('service-title').textContent = `${data.service} Control Panel`;
    document.getElementById('service-name').textContent = data.service;
    document.getElementById('service-port').textContent = data.port;
    document.getElementById('service-targets').textContent = data.targets.join(', ');
    document.getElementById('pinging-status').textContent = data.pinging ? 'Yes' : 'No';
    document.getElementById('pinging-status').style.color = data.pinging ? '#00c853' : '#ff1744';
    
    const targetSelect = document.getElementById('target-select');
    targetSelect.innerHTML = '';
    data.targets.forEach(target => {
      const option = document.createElement('option');
      option.value = target;
      option.textContent = target;
      targetSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load status:', error);
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/api/messages?limit=50`);
    const messages = await res.json();
    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';
    
    if (messages.length === 0) {
      messagesList.innerHTML = '<p style="color: #a0a0a0; text-align: center;">No messages yet</p>';
      return;
    }
    
    messages.forEach(msg => {
      const item = document.createElement('div');
      item.className = 'message-item';
      const directionClass = msg.direction === 'sent' ? 'sent' : 'received';
      const statusClass = msg.status === 'success' ? 'success' : 'error';
      const payload = msg.payload ? JSON.parse(msg.payload) : {};
      const response = msg.response ? JSON.parse(msg.response) : {};
      
      item.innerHTML = `
        <div class="meta">
          <span class="direction ${directionClass}">${msg.direction}</span>
          <span>${msg.service}</span>
          <span>${new Date(msg.created_at).toLocaleString()}</span>
        </div>
        <div class="payload">${payload.message || 'N/A'}</div>
        <div class="status ${statusClass}">${msg.status}${msg.error ? ': ' + msg.error : ''}</div>
      `;
      messagesList.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

document.getElementById('start-btn').addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/api/ping/start`, { method: 'POST' });
    loadStatus();
  } catch (error) {
    console.error('Failed to start pinging:', error);
  }
});

document.getElementById('stop-btn').addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/api/ping/stop`, { method: 'POST' });
    loadStatus();
  } catch (error) {
    console.error('Failed to stop pinging:', error);
  }
});

document.getElementById('custom-ping-btn').addEventListener('click', async () => {
  const target = document.getElementById('target-select').value;
  const message = document.getElementById('message-input').value;
  
  if (!target) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/ping/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, message })
    });
    const data = await res.json();
    console.log('Custom ping response:', data);
    document.getElementById('message-input').value = '';
    loadMessages();
  } catch (error) {
    console.error('Failed to send custom ping:', error);
  }
});

document.getElementById('refresh-messages').addEventListener('click', loadMessages);

loadStatus();
loadMessages();
setInterval(loadStatus, 5000);
setInterval(loadMessages, 10000);
