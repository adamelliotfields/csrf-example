const consola = require('consola');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use((req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof createError.HttpError) return res.status(err.status).json(err);

  return res
    .status(500)
    .json(
      createError(
        500,
        process.env.NODE_ENV === 'production' ? http.STATUS_CODES[500] : err.message,
      ),
    );
});

const server = http.createServer(app);

server.listen({
  host: '0.0.0.0',
  port: 3000,
});

server.on('listening', async () => {
  const address = server.address();
  consola.success(`Listening on http://${address.address}:${address.port}`);
});

server.on('error', (err) => {
  consola.fatal(err.message);
  process.exit(1);
});

['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) => {
  process.on(signal, () => {
    process.exit(0);
  });
});
