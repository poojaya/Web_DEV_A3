// GET /events/:id/registrations  (list for one event)
router.get('/:id/registrations', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await db.query(
        `SELECT registration_id, full_name, email, phone, tickets, registered_at
           FROM registrations
          WHERE event_id = ?
          ORDER BY registered_at DESC`,
        [id]
      );
      res.json(rows);
    } catch (err) {
      console.error('GET /events/:id/registrations error', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // POST /events/:id/registrations  (create registration for an event)
  router.post('/:id/registrations', async (req, res) => {
    try {
      const event_id  = Number(req.params.id);
      const {
        full_name,
        email,
        phone,
        tickets
      } = req.body || {};
  
      // basic validation
      if (!event_id || !full_name || !email || !tickets) {
        return res.status(400).json({ error: 'event_id, full_name, email, tickets are required' });
      }
      const t = Number(tickets);
      if (!Number.isFinite(t) || t < 1) {
        return res.status(400).json({ error: 'tickets must be a positive integer' });
      }
  
      // insert
      const result = await db.query(
        `INSERT INTO registrations (event_id, full_name, email, phone, tickets)
         VALUES (?,?,?,?,?)`,
        [event_id, full_name, String(email).toLowerCase(), phone || null, t]
      );
  
      // return created row
      const created = await db.query(
        `SELECT registration_id, full_name, email, phone, tickets, registered_at
           FROM registrations
          WHERE registration_id = ?`,
        [result.insertId]
      );
  
      res.status(201).json(created[0]);
    } catch (err) {
      // handle duplicates (unique one registration per event/email)
      if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
        return res.status(409).json({ error: 'This email is already registered for this event.' });
      }
      // handle missing event FK
      if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
        return res.status(400).json({ error: 'Invalid event_id.' });
      }
  
      console.error('POST /events/:id/registrations error', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  