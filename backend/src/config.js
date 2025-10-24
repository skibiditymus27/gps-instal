const parseList = (value = '') => value.split(',').map(item => item.trim()).filter(Boolean);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  allowOrigins: parseList(process.env.ALLOW_ORIGINS || ''),
  rateLimitWindowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  database: {
    host: process.env.PGHOST || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'gpsinstal',
    user: process.env.PGUSER || 'gpsinstal',
    password: process.env.PGPASSWORD || 'gpsinstal',
    ssl: process.env.PGSSL === 'true'
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO
  }
};

module.exports = config;
