module.exports = {
  apps: [
    {
      name: 'add-backend',
      script: 'dist/index.js',
      interpreter: 'node',
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,

      watch: false,
      max_memory_restart: '500M',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true
    }
  ]
}
