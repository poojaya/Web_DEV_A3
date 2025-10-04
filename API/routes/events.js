// /API/routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// helper: build WHERE clause + params for /events? filters
function buildFilters(q) {
  const where = [];
  const params = [];

  if (q.category) { where.push('e.category_id = ?'); params.push(Number(q.category)); }
  if (q.org)      { where.push('e.org_id = ?');      params.push(Number(q.org)); }
  if (q.city)     { where.push('e.city LIKE ?');     params.push(`%${q.city}%`); }
  if (q.state)    { where.push('e.state LIKE ?');    params.push(`%${q.state}%`); }
  if (q.date)     { where.push('DATE(e.start_datetime) = ?'); params.push(q.date); } // yyyy-mm-dd
  if (q.after)    { where.push('e.start_datetime >= ?'); params.push(q.after); }     // iso datetime
  if (q.q) {
    where.push('(e.title LIKE ? OR e.description LIKE ?)');
    params.push(`%${q.q}%`, `%${q.q}%`);
  }
  return { sql: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

// GET /events (list + filters)
router.get('/', async (req, res) => {
  try {
    const { sql, params } = buildFilters(req.query);
    const rows = await db.query(
      `
      SELECT
        e.*,
        c.name  AS category_name,
        o.name  AS org_name
      FROM events e
      JOIN categories c ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id = e.org_id
      ${sql}
      ORDER BY e.start_datetime ASC
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /events error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /events/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.query(
      `
      SELECT e.*, c.name AS category_name, o.name AS org_name
      FROM events e
      JOIN categories c ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id = e.org_id
      WHERE e.event_id = ?
      `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /events/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /events (create)
router.post('/', async (req, res) => {
  try {
    const {
      org_id, category_id, title, description,
      start_datetime, end_datetime,
      venue, city, state, country,
      capacity, ticket_price,
      goal_amount, raised_amount
    } = req.body;

    if (!org_id || !category_id || !title || !start_datetime) {
      return res.status(400).json({ error: 'org_id, category_id, title, start_datetime are required' });
    }

    const result = await db.query(
      `
      INSERT INTO events
      (org_id, category_id, title, description, start_datetime, end_datetime,
       venue, city, state, country, capacity, ticket_price, goal_amount, raised_amount)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        Number(org_id), Number(category_id), title, description || null,
        start_datetime, end_datetime || null,
        venue || null, city || null, state || null, country || null,
        capacity ? Number(capacity) : null,
        ticket_price != null ? Number(ticket_price) : null,
        goal_amount != null ? Number(goal_amount) : 0,
        raised_amount != null ? Number(raised_amount) : 0
      ]
    );

    const inserted = await db.query(
      `SELECT e.*, c.name AS category_name, o.name AS org_name
       FROM events e
       JOIN categories c ON c.category_id = e.category_id
       JOIN organisations o ON o.org_id = e.org_id
       WHERE e.event_id = ?`, [result.insertId]);

    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('POST /events error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /events/:id (update)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = [
      'org_id','category_id','title','description','start_datetime','end_datetime',
      'venue','city','state','country','capacity','ticket_price','goal_amount','raised_amount'
    ];
    const fields = [];
    const params = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields' });

    params.push(id);
    await db.query(`UPDATE events SET ${fields.join(', ')} WHERE event_id = ?`, params);

    const updated = await db.query(
      `SELECT e.*, c.name AS category_name, o.name AS org_name
       FROM events e
       JOIN categories c ON c.category_id = e.category_id
       JOIN organisations o ON o.org_id = e.org_id
       WHERE e.event_id = ?`, [id]);

    res.json(updated[0]);
  } catch (err) {
    console.error('PUT /events/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /events/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db.query('DELETE FROM events WHERE event_id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /events/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
// routes/events.js  (GET /api/events/:id)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db.query(`
    SELECT e.*, c.name AS category_name, o.name AS org_name
    FROM events e
    JOIN categories c   ON c.category_id = e.category_id
    JOIN organisations o ON o.org_id     = e.org_id
    WHERE e.event_id = ?`, [id]);

  if (!rows.length) return res.status(404).json({ error: 'Not found' });

  const regs = await db.query(`
    SELECT registration_id, full_name, email, phone, tickets, registered_at
    FROM registrations
    WHERE event_id = ?
    ORDER BY registered_at DESC`, [id]);

  const event = rows[0];
  event.registrations = regs;
  res.json(event);
});
