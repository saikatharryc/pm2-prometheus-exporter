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
  new rpc.Server(rep).expose('metrics', function (name, labelObject) {
    if (typeof data[name] === "undefined") {
      data[name] = new prom.Counter({
        name,
        help: name,
        labelNames: Object.keys(labelObject),
        registers: [ registry ]
      });
    }

    data[name].inc(labelObject);
  });
  return {
    registry
  }
};

const metricClient = () => {
  const client = new rpc.Client(req);
  req.connect(port);
  const incrementMetric = (name, labelObject) => {
    client.call('metrics', name, labelObject, () => '')
  };

  return { incrementMetric }
};


if (process.env.pmx_module) {
  module.exports = metricServer;
} else {
  module.exports = metricClient;
}
