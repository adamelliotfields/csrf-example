const consola = require('consola');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const morgan = require('morgan');
const ms = require('ms');
const Tokens = require('csrf');

const { verifyCsrfToken } = require('./middleware');

const SECRET = 'secret';

const app = express();
const tokens = new Tokens();

app.use(morgan('dev'));
// We want to show the response in the iframe.
app.use(helmet({ frameguard: false }));
// We can't use the default `origin: '*'` because it will not work with cookies.
// Alternatively, you can set `origin: true` to set the Allow-Origin header to match the Origin.
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(cookieParser());

app.post('/login', (req, res) => {
  const expires = new Date(Date.now() + ms('1h'));
  const xsrfToken = tokens.create(SECRET);

  // Note that by not setting the domain on the cookie, the browser will set it to the current URL.
  res.cookie('access_token', 'token', { expires, httpOnly: true, sameSite: 'lax' });
  res.cookie('xsrf-token', xsrfToken, { expires, sameSite: 'lax' });

  return res.json({ message: 'Login success!' });
});

app.post('/logout', (req, res) => {
  res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax' });
  res.clearCookie('xsrf-token', { sameSite: 'lax' });
  return res.json({ message: 'Logout success!' });
});

// Simulate doing something with your account.
app.post('/account', [verifyCsrfToken], (req, res) => {
  const { access_token: accessToken } = req.cookies;

  if (typeof accessToken === 'undefined') {
    return res.status(401).json({ message: http.STATUS_CODES[401] });
  }

  return res.status(201).json({ message: 'Transaction success!' });
});

// Same as above, but without the CSRF token middleware.
app.post('/account/insecure', (req, res) => {
  const { access_token: accessToken } = req.cookies;

  if (typeof accessToken === 'undefined') {
    return res.status(401).json({ message: http.STATUS_CODES[401] });
  }

  return res.status(201).json({ message: 'Transaction success!' });
});

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
  port: 3001,
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
