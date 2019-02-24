const http = require('http');
const prom = require('prom-client');
const pm2 = require('pm2');

const { argv } = process;

const prefix = 'pm2';
const labels = ['name', 'instance'];
const map = [
  ['up', 'Is the process running'],
  ['cpu', 'Process cpu usage'],
  ['memory', 'Process memory usage'],
  ['uptime', 'Process uptime'],
  ['instances', 'Process instances'],
  ['restarts', 'Process restarts'],
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
  prom.register.clear();
  map.forEach(m => {
    pm[m[0]] = new prom.Gauge(prefix + '_' + m[0], m[1], labels);
  });
  return pm2c('list').then(list => {
    list.forEach(p => {
      const conf = {
        name: p.name,
        instance: p.pm2_env.NODE_APP_INSTANCE,
      };

      const values = {
        up: p.pm2_env.status === 'online' ? 1 : 0,
        cpu: p.monit.cpu,
        memory: p.monit.memory,
        uptime: Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000),
        instances: p.pm2_env.instances || 1,
        restarts: p.pm2_env.restart_time,
      };

      const names = Object.keys(p.pm2_env.axm_monitor);

      for (let index = 0; index < names.length; index++) {
        const name = names[index];

        try {
          let value;
          if (name === 'Loop delay') {
            value = parseFloat(p.pm2_env.axm_monitor[name].value.match(/^[\d.]+/)[0]);
          } else {
            value = p.pm2_env.axm_monitor[name].value;
          }

          const metricName = prefix + '_' + name.replace(/[^A-Z0-9]+/gi, '_').toLowerCase();

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

        pm[k].set(conf, values[k]);
      });
    });

    return prom.register.metrics();
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

  const port = Number(argv[1]) || 9209;

  server.listen(port);
  console.log('pm2-prometheus-exporter listening at %s', port);
}

exporter();
