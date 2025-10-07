require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.static('public'));

// Inject API_BASE into the page at /config.js (safer than inline env)
app.get('/config.js', (req, res) => {
  res.type('js').send(`window.API_BASE=${JSON.stringify(process.env.API_BASE || '')};`);
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`Admin listening on ${PORT}`));
