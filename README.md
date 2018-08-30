
[![NPM](https://nodei.co/npm/pm2-metrics.png?downloads=true)](https://nodei.co/npm/pm2-metrics/)

### Easy Install:
#### install with PM2

```
pm2 install pm2-metrics
```

#### Or Clone and run as a seperate application
```shell
    $ git clone https://github.com/saikatharryc/pm2-prometheus-exporter.git
    $ npm install
    $ pm2 start exporter.js --name pm2-metrics
```



####  Open your browser : 
```shell
http://localhost:9209/metrics
```

#### Prometheus config:
in `prometheus.yaml`
 inside `scrape_configs` add this block:

    - job_name: pm2-metrics
    scrape_interval: 10s
    scrape_timeout: 10s
    metrics_path: /metrics
    scheme: http
    static_configs:
      - targets:
          - localhost:9209
######  PR(s) & issue(s) are welcome, 
###### *change host name from `localhost` on basics where you are hosting.
###### Modified & Working Version from  [pm2-prometheus-exporter by @burningtree](https://github.com/burningtree/pm2-prometheus-exporter)
