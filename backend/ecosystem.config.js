module.exports = {
  apps: [
    {
      name: 'reading-tracker-api',
      script: 'src/server.js',
      cwd: __dirname,
      node_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      time: true,
    },
  ],
}
