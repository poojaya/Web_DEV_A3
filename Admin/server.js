require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.static('public'));

// Expose API_BASE to the browser
app.get('/config.js', (_req, res) => {
  res.type('js').send(`window.API_BASE=${JSON.stringify(process.env.API_BASE || '')};`);
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`Admin listening on ${PORT}`));

const db = require('./db'); 

app.get('/api/stats', async (req, res) => {
  try {
    const evCnt = await db.query('SELECT COUNT(*) AS n FROM events');
    const regCnt = await db.query('SELECT COUNT(*) AS n FROM registrations');
    const avgTk  = await db.query('SELECT AVG(ticket_price) AS avg_price FROM events WHERE ticket_price IS NOT NULL');
    const sums   = await db.query(`
      SELECT
        COALESCE(SUM(r.tickets * e.ticket_price), 0) AS est_raised,
        COALESCE(SUM(e.goal_amount), 0)            AS sum_goal
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.event_id
    `);

    const total_events = Number(evCnt[0]?.n || 0);
    const total_regs   = Number(regCnt[0]?.n || 0);
    const avg_ticket   = avgTk[0]?.avg_price != null ? Number(avgTk[0].avg_price) : null;
    const estRaised    = Number(sums[0]?.est_raised || 0);
    const sumGoal      = Number(sums[0]?.sum_goal   || 0);
    const goal_coverage_pct = sumGoal > 0 ? Math.round((estRaised / sumGoal) * 100) : 0;

    res.json({ total_events, total_regs, avg_ticket, goal_coverage_pct });
  } catch (err) {
    console.error('GET /api/stats error', err);
    res.status(500).json({ error: 'Server error' });
  }
});
