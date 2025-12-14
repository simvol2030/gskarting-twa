module.exports = {
  apps: [
    {
      name: 'granat-backend-dev',
      cwd: '/opt/websites/granat.klik1.ru/backend-expressjs',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3012',
        SESSION_SECRET: 'V3WUe70jkLt6n8jhIItDgMu515aSCQupUMdP/gqfoos=',
        DATABASE_PATH: '../data/db/sqlite/app.db'
      },
      error_file: '/opt/websites/granat.klik1.ru/data/logs/backend-error.log',
      out_file: '/opt/websites/granat.klik1.ru/data/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'granat-frontend-dev',
      cwd: '/opt/websites/granat.klik1.ru/frontend-sveltekit',
      script: 'build/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3013',
        ORIGIN: 'https://granat.klik1.ru',
        SESSION_SECRET: 'V3WUe70jkLt6n8jhIItDgMu515aSCQupUMdP/gqfoos=',
        PUBLIC_BACKEND_URL: 'https://granat.klik1.ru',
        DATABASE_PATH: '../data/db/sqlite/app.db'
      },
      error_file: '/opt/websites/granat.klik1.ru/data/logs/frontend-error.log',
      out_file: '/opt/websites/granat.klik1.ru/data/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'granat-bot-dev',
      cwd: '/opt/websites/granat.klik1.ru/telegram-bot',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3014',
        DATABASE_PATH: '../data/db/sqlite/app.db'
      },
      error_file: '/opt/websites/granat.klik1.ru/data/logs/bot-error.log',
      out_file: '/opt/websites/granat.klik1.ru/data/logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
