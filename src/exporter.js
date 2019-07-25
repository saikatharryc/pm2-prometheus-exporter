// @ts-check

const http = require('http');
const prom = require('prom-client');
const logger = require('pino')()
const io = require('@pm2/io');
const { pm2Registry } = require('./pm2-metrics');

function metrics() {
  return pm2Registry().then( pm2reg => {
    return prom.Registry.merge([
      pm2reg
    ]).metrics();
  })
}

function exporter() {
  const server = http.createServer((req, res) => {
    switch (req.url) {
      case '/':
        return res.end('<html>PM2 metrics: <a href="/metrics">/metrics</a></html>');
      case '/metrics':
        return metrics().then(data => res.end(data));
      default:
        return res.end('404');
    }
  });

  const conf = io.initModule();
  const port = conf.port || 9209;
  const host = conf.host || '0.0.0.0';

  server.listen(port, host);
  logger.info('pm2-prometheus-exporter listening at %s:%s', host, port);
}

exporter();
