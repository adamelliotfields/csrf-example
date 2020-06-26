const consola = require('consola');
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.use(morgan('dev'));
app.use(express.static(path.resolve(__dirname, 'static')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

const server = http.createServer(app);

server.listen({
  host: '0.0.0.0',
  port: 3002,
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
