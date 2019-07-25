if (process.env.pmx_module) {
  const { exporter } = require('./http-server');
  exporter();
} else {
  module.exports = require('./custom-metrics');
}
