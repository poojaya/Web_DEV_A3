// routes/registrations.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { event_id, full_name, email, phone = null, tickets = 1 } = req.body || {};
  if (!event_id || !full_name || !email) {
    return res.status(400).json({ error: 'event_id, full_name, email are required' });
  }
  const t = Number(tickets) || 1;
  if (t < 1) return res.status(400).json({ error: 'tickets must be >= 1' });

  try {
    // no array destructuring here
    const result = await db.query(
      `INSERT INTO registrations (event_id, full_name, email, phone, tickets, registered_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [event_id, full_name.trim(), email.trim(), phone, t]
    );

    return res.status(201).json({ ok: true, registration_id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You already registered for this event with this email' });
    }
    if (e.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Unknown event_id' });
    }
    console.error('POST /registrations', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
