module.exports = {
  apps: [
    {
      name: 'gskarting-frontend',
      cwd: '/opt/websites/gsracing-twa.klik1.ru/frontend-sveltekit',
      script: 'build/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3006',
        ORIGIN: 'https://gsracing-twa.klik1.ru',
        SESSION_SECRET: 'iU7aT1XQVSfmxwywiuFvX++IXmKRY6LmrjaCHlmlm8s=',
        PUBLIC_BACKEND_URL: 'https://gsracing-twa.klik1.ru'
      },
      error_file: '/opt/websites/gsracing-twa.klik1.ru/logs/frontend-error.log',
      out_file: '/opt/websites/gsracing-twa.klik1.ru/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'gskarting-backend',
      cwd: '/opt/websites/gsracing-twa.klik1.ru/backend-expressjs',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3007',
        SESSION_SECRET: 'iU7aT1XQVSfmxwywiuFvX++IXmKRY6LmrjaCHlmlm8s=',
        JWT_SECRET: 'gskarting-jwt-secret-2026',
        TELEGRAM_BOT_TOKEN: '7977874487:AAH4m0eIjHT3ToEbF5Z3rtPs0aDbLhC9wQQ',
        DATABASE_TYPE: 'sqlite',
        ONEC_MOCK: 'true'
      },
      error_file: '/opt/websites/gsracing-twa.klik1.ru/logs/backend-error.log',
      out_file: '/opt/websites/gsracing-twa.klik1.ru/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
