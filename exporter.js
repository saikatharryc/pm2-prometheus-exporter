// @ts-check

const http = require('http');
const os = require('os');
const prom = require('prom-client');
const pm2 = require('pm2');
const bytes = require('bytes');
const io = require('@pm2/io');

const port = 9209;
const host = '0.0.0.0';
const prefix = 'pm2';
const labels = ['id', 'app', 'service', 'instance', 'interpreter', 'node_version'];
const map = [
  ['up', 'Is the process running'],
  ['cpu', 'Process cpu usage'],
  ['memory', 'Process memory usage'],
  ['uptime', 'Process uptime'],
  ['instances', 'Process instances'],
  ['restarts', 'Process restarts'],
  ['prev_restart_delay', 'Previous restart delay'],
];

function pm2c(cmd, args = []) {
  return new Promise((resolve, reject) => {
    pm2[cmd](args, (err, resp) => {
      if (err) return reject(err);
      resolve(resp);
    });
  });
}

function getInstanceIP() {
  // only get instance ip from eth0
  const { eth0 } = os.networkInterfaces();

  // get address from IPv4
  const ip = eth0.filter(obj => obj.family === 'IPv4')[0].address;

  return `${ip}:${port}`;
}

function getUptime(pm2Env) {
  const { status } = pm2Env;
  const uptime = pm2Env.pm_uptime && status === 'online' ? Math.floor((Date.now() - pm2Env.pm_uptime) / 1000) : 0;

  return uptime;
}

function metrics() {
  const pm = {};
  prom.register.clear();
  map.forEach(m => {
    pm[m[0]] = new prom.Gauge(`${prefix}_${m[0]}`, m[1], labels);
  });
  return pm2c('list')
    .then(list => {
      list.forEach(p => {
        const conf = {
          id: p.pm_id,
          service: p.name,
          app: os.hostname(),
          instance: p.pm2_env.NODE_APP_INSTANCE || getInstanceIP(),
          interpreter: p.pm2_env.exec_interpreter,
          node_version: p.pm2_env.node_version,
        };

        const values = {
          up: p.pm2_env.status === 'online' ? 1 : 0,
          cpu: p.monit.cpu,
          memory: p.monit.memory,
          uptime: getUptime(p.pm2_env),
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
            } else if (name === 'Event Loop Latency') {
              value = parseFloat(p.pm2_env.axm_monitor[name].value.toString().split('m')[0]);
            } else if (name === 'Network In' || name === 'Network Out') {
              const [currentVal] = p.pm2_env.axm_monitor[name].value.split('/s');
              value = bytes(currentVal);
            } else {
              value = p.pm2_env.axm_monitor[name].value;
            }

            const metricName = `${prefix}_${name.replace(/[^A-Z0-9]+/gi, '_')}`.toLowerCase();

            if (!pm[metricName]) {
              pm[metricName] = new prom.Gauge(metricName, name, labels);
            }

            values[metricName] = value;
          } catch (error) {
            console.log(error);
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
      return prom.register.metrics();
    })
    .catch(err => {
      console.log(err);
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

  io.init({
    metrics: {
      network: true,
    },
  });

  server.listen(port, host);
  console.log('pm2-prometheus-exporter listening at %s:%s', host, port);
}

exporter();
