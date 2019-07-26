const port = 9208;
const rpc = require('axon-rpc')
  ; const axon = require('axon');

const req = axon.socket('req');

const metricServer = () => {
  const data = {};
  const prom = require('prom-client');
  const rep = axon.socket('rep');
  rep.bind(port);
  const registry = new prom.Registry();
  new rpc.Server(rep).expose('metrics', function ({ type, method, createParams }, callParams, ) {
    if (typeof data[createParams.name] === "undefined") {
      data[createParams.name] = new prom[type]({
        ... createParams,
        registers: [ registry ]
      });
    }

    data[createParams.name][method](... callParams);
  });
  return {
    registry
  }
};

const metricClient = () => {
  const client = new rpc.Client(req);
  req.connect(port);
  return (
    {type, method, createParams}, // types: Counter, Gauge, Histogram, Summary, method: use https://github.com/siimon/prom-client  , for ex type "Counter" have: inc, reset, get, remove
    callParams // ex : array of params which using in method (for example: type Counter, method inc, the callParams can be empty, or [incrementvalue]
  ) => {
    client.call('metrics', {type, method, createParams,}, callParams, () => '')
  }
};


if (process.env.pmx_module) {
  module.exports = metricServer;
} else {
  module.exports = metricClient;
}
