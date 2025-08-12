module.exports = {
  apps: [
    {
      name: 'add-backend',
      script: 'dist/index.js',
      interpreter: 'bun',
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true
    }
  ]
}
