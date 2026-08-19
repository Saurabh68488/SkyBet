// ============================================
// PM2 Ecosystem Config
// Production process management
// ============================================

module.exports = {
  apps: [
    {
      name: 'skybet-server',
      cwd: './apps/server',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'skybet-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
