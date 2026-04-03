const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.dbDir = path.join(__dirname, 'data');
    this.dbFile = path.join(this.dbDir, serviceName + '.db');
    this.db = null;
    if (!fs.existsSync(this.dbDir)) fs.mkdirSync(this.dbDir, { recursive: true });
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbFile, (err) => {
        if (err) { reject(err); return; }
        console.log('[DB] Connected to ' + this.dbFile);
        this.db.run(
          'CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, direction TEXT NOT NULL, service TEXT NOT NULL, endpoint TEXT, payload TEXT, response TEXT, status TEXT, error TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
          (err) => { if (err) { reject(err); return; } console.log('[DB] Table ready'); resolve(this); }
        );
      });
    });
  }

  logMessage({ type, direction, service, endpoint, payload, response, status = 'success', error = null }) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO messages (type, direction, service, endpoint, payload, response, status, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [type, direction, service, endpoint, JSON.stringify(payload), JSON.stringify(response), status, error],
        function (err) { if (err) { reject(err); return; } resolve(this.lastID); }
      );
    });
  }

  logOutgoing(service, endpoint, payload, response) {
    return this.logMessage({ type: 'outgoing', direction: 'sent', service, endpoint, payload, response, status: 'success' });
  }

  logOutgoingError(service, endpoint, payload, error) {
    return this.logMessage({ type: 'outgoing', direction: 'sent', service, endpoint, payload, response: null, status: 'error', error: error?.message || String(error) });
  }

  logIncoming(service, payload, response) {
    return this.logMessage({ type: 'incoming', direction: 'received', service, endpoint: '/ping', payload, response, status: 'success' });
  }

  getMessages(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM messages ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) { reject(err); return; }
        resolve(rows);
      });
    });
  }

  getMessageCount() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM messages', (err, row) => {
        if (err) { reject(err); return; }
        resolve(row.count);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) this.db.close((err) => { if (err) { reject(err); return; } resolve(); });
      else resolve();
    });
  }
}

module.exports = Database;
