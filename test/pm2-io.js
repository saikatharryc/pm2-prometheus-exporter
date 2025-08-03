const test = require('ava');
const probe = require('@pm2/io');

const iteration = 10;
// Here the value function will be called each second to get the value
// returned by Object.keys(users).length

// Here we are going to call valvar.set() to set the new value
const metric_2 = probe.metric({
  name: 'Metric 2',
});

const meter = probe.meter({
  name: 'Meter req/sec',
  samples: 1, // This is per second. To get per min set this value to 60
  timeframe: 60,
});

const counter = probe.counter({
  name: 'Counter',
});

const histogram = probe.histogram({
  name: 'Histogram',
  measurement: 'mean',
});

let latency = 0;

const func = () => {
  for (let i = 0; i < iteration; i += 1) {
    metric_2.set(i);

    // Console.log(metric_2.value, i);
    counter.inc();
    // Console.log(counter._count, i + 1);
    meter.mark();

    latency = Math.round(Math.random() * 100);
    histogram.update(latency);
  }

  test('on Metric Value ', t => {
    t.is(metric_2.value, iteration - 1);
    t.pass();
  });
  test('on counter ', t => {
     
    t.is(counter._count, iteration);
    t.pass();
  });
};

func();
