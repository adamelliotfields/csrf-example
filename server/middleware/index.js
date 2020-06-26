const createError = require('http-errors');
const Tokens = require('csrf');

const SECRET = 'secret';

const tokens = new Tokens();

function verifyCsrfToken(req, res, next) {
  const csrfToken = req.get('x-xsrf-token');

  if (typeof csrfToken === 'undefined' || !tokens.verify(SECRET, csrfToken)) {
    return next(createError(403));
  }

  return next();
}

module.exports.verifyCsrfToken = verifyCsrfToken;
