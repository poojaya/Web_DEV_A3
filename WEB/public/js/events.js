const API_BASE = 'http://localhost:3060/api';

function fmtDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString();
}
function currency(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString(undefined, { style: 'currency', currency: 'AUD' });
}

async function runSearch(ev) {
  if (ev) ev.preventDefault();

  const params = new URLSearchParams();
  const q     = document.getElementById('q').value.trim();
  const cat   = document.getElementById('category').value;
  const org   = document.getElementById('org').value;
  const city  = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const date  = document.getElementById('date').value;

  if (q) params.set('q', q);
  if (cat) params.set('category', cat);
  if (org) params.set('org', org);
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  if (date) params.set('date', date);

  try {
    const res = await fetch(`${API_BASE}/events?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    renderTable(rows);
  } catch (e) {
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = `<tr><td colspan="7" style="color:red">Failed to load: ${e.message}</td></tr>`;
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('results-body');
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">No results</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(e => `
    <tr>
      <td>${fmtDateTime(e.start_datetime)}</td>
      <td>${e.title}</td>
      <td>${e.category_name ?? '-'}</td>
      <td>${e.org_name ?? '-'}</td>
      <td>${[e.city, e.state].filter(Boolean).join(', ')}</td>
      <td>${currency(e.goal_amount)}</td>
      <td><a href="/event.html?id=${e.event_id}">View</a></td>
    </tr>
  `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-form').addEventListener('submit', runSearch);
  document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('search-form').reset();
    runSearch();
  });
  runSearch(); // initial load
});

// GET /events/:id  (now also returns registrations[])
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.query(
      `
      SELECT e.*, c.name AS category_name, o.name AS org_name
      FROM events e
      JOIN categories c   ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id     = e.org_id
      WHERE e.event_id = ?
      `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const regs = await db.query(
      `SELECT registration_id, full_name, email, phone, tickets, registered_at
         FROM registrations
        WHERE event_id = ?
        ORDER BY registered_at DESC`,
      [id]
    );

    const event = rows[0];
    event.registrations = regs; // attach registrations
    res.json(event);
  } catch (err) {
    console.error('GET /events/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /events/:id  (blocked if registrations exist)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const cnt = await db.query(
      'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
      [id]
    );
    if (cnt[0].count > 0) {
      return res.status(409).json({
        error: 'Cannot delete event that has registrations.'
      });
    }

    const result = await db.query('DELETE FROM events WHERE event_id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /events/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});
