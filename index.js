require('dotenv').config();

const axios = require('axios');
const express = require('express');
const { param } = require('express/lib/request');

const port = 8888;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// auth approach and helper functions from spotify documentation and examples:
// https://github.com/spotify/web-api-auth-examples/blob/master/authorization_code/app.js
const generateRandomString = length => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = 'spotify_auth_state';

const app = express();

app.get('/', (req, res) => {
  res.send('Tada!');
});

// spotify auth documentation: https://developer.spotify.com/documentation/general/guides/authorization/
app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email';

  const paramsObj = {
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope,
  }
  const params = new URLSearchParams(paramsObj);
  const queryParams = params.toString();

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', (req, res) => {
  // code is the authorizationCode returned in the query param on the callback
  const code = req.query.code || null;

  const paramsObj = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI
  }
  const params = new URLSearchParams(paramsObj);
  const postParams = params.toString();

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: postParams,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  }).then(response => {
    if (response.status === 200) {
      res.send(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
    } else {
      res.send(response);
    }
  })
  .catch(error => {
    res.send(error);
  })
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
});
