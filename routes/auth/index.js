const sign_in = require('./sign_in');
const sign_up = require('./sign_up');
const auth = require('express').Router();

auth.post('/sign_up', sign_up);
auth.post('/sign_in', sign_in);

module.exports = auth;