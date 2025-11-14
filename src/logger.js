import { logging as config } from './config.js';

class Logger {
  httpLogger = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (resBody) {
      const logData = {
        authorized: !!req.headers.authorization,
        path: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: JSON.stringify(req.body),
        resBody: JSON.stringify(resBody),
      };
      const level = Logger.statusToLogLevel(res.statusCode);
      logger.log(level, 'http', logData);
      return originalSend.call(this, resBody);
    };
    next();
  };

  dbLogger(query, params) {
    this.log('info', 'database', {
      query: this.sanitize(query),
      params: this.sanitize(JSON.stringify(params || [])),
    });
  }

  factoryLogger(request, response) {
    this.log('info', 'factory', {
      request: this.sanitize(JSON.stringify(request)),
      response: this.sanitize(JSON.stringify(response)),
    });
  }

  unhandledErrorLogger = (err, req, res, next) => {
    this.log('error', 'unhandled-exception', {
      message: err.message,
      stack: err.stack,
      path: req?.originalUrl,
      method: req?.method,
    });
    next(err);
  };

  log(level, type, logData) {
    const labels = {
      component: config.logging.source,
      level: level,
      type: type,
    };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { streams: [{ stream: labels, values: [values] }] };

    this.sendLogToGrafana(logEvent);
  }

  static statusToLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  sanitize(data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    // Sanitize passwords
    data = data.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
    data = data.replace(/"password":\s*"[^"]*"/g, '"password": "*****"');
    // Sanitize API keys
    data = data.replace(/\\"apiKey\\":\s*\\"[^"]*\\"/g, '\\"apiKey\\": \\"*****\\"');
    data = data.replace(/"apiKey":\s*"[^"]*"/g, '"apiKey": "*****"');
    return data;
  }

  sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(config.logging.url, {
      method: 'post',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
      },
    })
      .then((res) => {
        if (!res.ok) console.log('Failed to send log to Grafana');
      })
      .catch((err) => {
        console.log('Error sending log to Grafana:', err.message);
      });
  }
}

const logger = new Logger();
export default logger;
