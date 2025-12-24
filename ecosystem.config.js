module.exports = {
  apps: [
    {
      name: 'lumir-evaluation-system',
      script: 'npm',
      args: 'run start',
      cwd: '/home/ubuntu/services/Back_EvaludationManagementSystem',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/home/ubuntu/.pm2/logs/lumir-evaluation-system-error.log',
      out_file: '/home/ubuntu/.pm2/logs/lumir-evaluation-system-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

