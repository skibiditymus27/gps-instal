const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { securityMiddleware, corsMiddleware } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const contactRouter = require('./routes/contact');
const healthRouter = require('./routes/health');

const app = express();

app.set('trust proxy', 'loopback');

securityMiddleware.forEach(mw => app.use(mw));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

app.use('/api/health', healthRouter);
app.use('/api/contact', contactRouter);

app.use('/api/*', corsMiddleware, (req, res) => {
  res.status(404).json({ status: 'error', message: 'Nie znaleziono zasobu.' });
});

app.use(errorHandler);

module.exports = app;
