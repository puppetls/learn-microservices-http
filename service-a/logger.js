const fs = require('fs');
const path = require('path');

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logDir = path.join(__dirname, 'logs');
    this.logFile = path.join(this.logDir, `${serviceName}.log`);
    this.combinedLogFile = path.join(this.logDir, 'combined.log');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _formatTimestamp() {
    return new Date().toISOString();
  }

  _writeLog(level, type, message, data = null) {
    const timestamp = this._formatTimestamp();
    const logLine = `[${timestamp}] [${this.serviceName}] [${level.toUpperCase()}] [${type}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}`;

    if (level === 'error') {
      console.error(logLine);
    } else {
      console.log(logLine);
    }

    fs.appendFileSync(this.logFile, logLine + '\n');
    fs.appendFileSync(this.combinedLogFile, logLine + '\n');

    return logLine;
  }

  serviceStarted(port) {
    return this._writeLog('info', 'SERVICE', `${this.serviceName} started`, { port });
  }

  serviceStopped() {
    return this._writeLog('info', 'SERVICE', `${this.serviceName} stopped`);
  }

  sendMessage(targetService, endpoint, payload) {
    return this._writeLog('info', 'OUTGOING', `Sending to ${targetService}`, { target: targetService, endpoint, payload });
  }

  receiveResponse(sourceService, response) {
    return this._writeLog('info', 'RESPONSE', `Response from ${sourceService}`, { source: sourceService, data: response });
  }

  receiveMessage(sourceService, payload) {
    return this._writeLog('info', 'INCOMING', `Received from ${sourceService}`, { source: sourceService, data: payload });
  }

  sendResponse(targetService, response) {
    return this._writeLog('info', 'RESPONSE_SENT', `Sent response to ${targetService}`, { target: targetService, data: response });
  }

  error(type, message, err) {
    return this._writeLog('error', type, message, { error: err?.message || err, code: err?.code });
  }

  warning(type, message, details = null) {
    return this._writeLog('warn', type, message, details);
  }

  connectionFailed(targetService, err) {
    if (err?.code === 'ECONNREFUSED') {
      return this.warning('CONNECTION', `${targetService} is down, retrying...`, { target: targetService, code: err.code });
    }
    return this.error('CONNECTION', `Failed to connect to ${targetService}`, err);
  }

  info(type, message, data = null) {
    return this._writeLog('info', type, message, data);
  }

  pingSent(targetService) {
    return this._writeLog('info', 'PING', `Pinging ${targetService}`, { target: targetService });
  }

  pingReceived(sourceService) {
    return this._writeLog('info', 'PING', `Ping received from ${sourceService}`, { source: sourceService });
  }

  listLogFiles() {
    try {
      return fs.readdirSync(this.logDir);
    } catch {
      return [];
    }
  }

  clearLogs() {
    try {
      fs.writeFileSync(this.logFile, '');
      fs.writeFileSync(this.combinedLogFile, '');
    } catch (err) {
      console.error('Failed to clear logs:', err.message);
    }
  }
}

module.exports = Logger;