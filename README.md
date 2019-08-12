[![Codacy Badge](https://api.codacy.com/project/badge/Grade/ba9d24be1fb14431a7d8e84808e11f5a)](https://app.codacy.com/app/saikatharryc/pm2-prometheus-exporter?utm_source=github.com&utm_medium=referral&utm_content=saikatharryc/pm2-prometheus-exporter&utm_campaign=Badge_Grade_Dashboard)
[![Build Status](https://travis-ci.org/saikatharryc/pm2-prometheus-exporter.svg?branch=master)](https://travis-ci.org/saikatharryc/pm2-prometheus-exporter) [![codecov](https://codecov.io/gh/saikatharryc/pm2-prometheus-exporter/branch/master/graph/badge.svg)](https://codecov.io/gh/saikatharryc/pm2-prometheus-exporter) [![npm](https://img.shields.io/npm/v/pm2-metrics.svg)](https://npmjs.com/package/pm2-metrics) [![NPM Downloads](https://img.shields.io/npm/dm/pm2-metrics.svg)](https://www.npmjs.com/package/pm2-metrics)

[![NPM](https://nodei.co/npm/pm2-metrics.png?downloads=true)](https://nodei.co/npm/pm2-metrics/) [![Greenkeeper badge](https://badges.greenkeeper.io/saikatharryc/pm2-prometheus-exporter.svg)](https://greenkeeper.io/)

# PM2 Metrics

#### Easy Install with PM2

```shell
pm2 install pm2-metrics
```

#### Or Clone and run as a seperate application

```shell
    $ git clone https://github.com/saikatharryc/pm2-prometheus-exporter.git
    $ npm install
    $ pm2 start exporter.js --name pm2-metrics
```

#### Open your browser

```shell
http://<HOST>:9209/metrics
```

#### For Prometheus Config

in `prometheus.yaml`
inside `scrape_configs` add this block:

```yml
- job_name: pm2-metrics
scrape_interval: 10s
scrape_timeout: 10s
metrics_path: /metrics
scheme: http
static_configs:
  - targets:
      - localhost:9209
```

#### Grafana dashboard [#1 (comment)](https://github.com/saikatharryc/pm2-prometheus-exporter/issues/1#issuecomment-499551831)

###### PR(s) & issue(s) are welcome

###### \*change host name from `localhost` on basics where you are hosting

###### Modified & Working Version from [pm2-prometheus-exporter by @burningtree](https://github.com/burningtree/pm2-prometheus-exporter)
