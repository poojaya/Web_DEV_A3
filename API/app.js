require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');                

const app = express();

const allowList = [
  'http://localhost:8080',                  
  'http://localhost:8090',                  
  process.env.WEB_ORIGIN,
  process.env.ADMIN_ORIGIN
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);     
    if (allowList.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());

app.use(express.json());

app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await db.query(
      'SELECT category_id, name FROM categories ORDER BY name'
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /categories', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/organisations', async (_req, res) => {
  try {
    const rows = await db.query(
      'SELECT org_id, name FROM organisations ORDER BY name'
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /organisations', e);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3060;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));

app.get('/', (_req, res) => {
  res.send('Charity API is running. Try GET /api/events');
});