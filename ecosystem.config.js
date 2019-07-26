module.exports = {
  apps : [{
    name: 'pm2-metrics',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      pmx_module: true,
      NODE_ENV: 'development'
    },
    env_production: {
      pmx_module: true,
      NODE_ENV: 'production'
    }
  }]
};
