// @ts-check

const http = require('http');
const prom = require('prom-client');
const pm2 = require('pm2');
const logger = require('pino')()

const io = require('@pm2/io');

const prefix = 'pm2';
const labels = ['id', 'name', 'instance', 'interpreter', 'node_version'];
const map = [
  ['up', 'Is the process running'],
  ['cpu', 'Process cpu usage'],
  ['memory', 'Process memory usage'],
  ['uptime', 'Process uptime'],
  ['instances', 'Process instances'],
  ['restarts', 'Process restarts'],
  ['prev_restart_delay', 'Previous restart delay']
];

function pm2c(cmd, args = []) {
  return new Promise((resolve, reject) => {
    pm2[cmd](args, (err, resp) => {
      if (err) return reject(err);
      resolve(resp);
    });
  });
}

function metrics() {
  const pm = {};
  const registry = new prom.Registry();
  map.forEach(m => {
    pm[m[0]] = new prom.Gauge({
      name: prefix + '_' + m[0],
      help: m[1],
      labelNames: labels,
      registers: [registry]
    });
  });
  return pm2c('list')
    .then(list => {
      list.forEach(p => {
        logger.debug(p, p.exec_interpreter, '>>>>>>');
        const conf = {
          id: p.pm_id,
          name: p.name,
          instance: p.pm2_env.NODE_APP_INSTANCE,
          interpreter: p.pm2_env.exec_interpreter,
          node_version: p.pm2_env.node_version,
        };

        const values = {
          up: p.pm2_env.status === 'online' ? 1 : 0,
          cpu: p.monit.cpu,
          memory: p.monit.memory,
          uptime: Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000),
          instances: p.pm2_env.instances || 1,
          restarts: p.pm2_env.restart_time,
          prev_restart_delay: p.pm2_env.prev_restart_delay,
        };

        const names = Object.keys(p.pm2_env.axm_monitor);

        for (let index = 0; index < names.length; index++) {
          const name = names[index];

          try {
            let value;
            if (name === 'Loop delay') {
              value = parseFloat(p.pm2_env.axm_monitor[name].value.match(/^[\d.]+/)[0]);
            } else if (name.match(/Event Loop Latency|Heap Size/)) {
              value = parseFloat(p.pm2_env.axm_monitor[name].value.toString().split('m')[0]);
            } else {
              value = parseFloat(p.pm2_env.axm_monitor[name].value);
            }

            if (isNaN(value)) {
              logger.warn('Ignoring metric name "%s" as value "%s" is not a number', name, value);

              continue;
            }

            const metricName = prefix + '_' + name.replace(/[^A-Z0-9]+/gi, '_').toLowerCase();

            if (!pm[metricName]) {
              pm[metricName] = new prom.Gauge({
                name: metricName,
                help: name,
                labelNames: labels,
                registers: [registry]
              });
            }

            values[metricName] = value;
          } catch (error) {
            logger.error(error);
          }
        }

        Object.keys(values).forEach(k => {
          if (values[k] === null) return null;

          // Prometheus client Gauge will throw an error if we don't return a number
          // so we will skip this metrics value
          if (values[k] === undefined) {
            return null;
          }

          pm[k].set(conf, values[k]);
        });
      });
      return registry.metrics()
    })
    .catch(err => {
      logger.error(err);
    });
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
