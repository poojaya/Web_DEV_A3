// WEB/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () => console.log(`WEB listening on ${PORT}`));
