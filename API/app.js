require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:8080' })); // web app origin
app.use(express.json());

app.use('/api/events', require('./routes/events')); // your events router
// (add other routers: /api/categories, /api/organisations if needed)

app.get('/api/health', (_,res)=>res.json({ok:true}));
const PORT = process.env.PORT || 3060;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
app.get('/', (_req, res) => {
    res.send('Charity API is running. Try GET /api/events');
  });

const meta = require('./routes/meta');
app.use('/api', meta);

app.get('/api/categories', async (_req, res) => {
    try {
      const rows = await db.query('SELECT category_id, name FROM categories ORDER BY name');
      res.json(rows);
    } catch (e) { res.status(500).json({error:'Server error'}); }
  });
  
  app.get('/api/organisations', async (_req, res) => {
    try {
      const rows = await db.query("SELECT org_id, name FROM organisations WHERE status='ACTIVE' ORDER BY name");
      res.json(rows);
    } catch (e) { res.status(500).json({error:'Server error'}); }
  });
  
  const registrations = require('./routes/registrations');
  app.use('/api/registrations', registrations);
