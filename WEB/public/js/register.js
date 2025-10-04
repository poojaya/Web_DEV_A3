const API_BASE = (window.API_BASE || 'http://localhost:3060/api');

function qs(name){ return new URLSearchParams(location.search).get(name); }
function fmtDateTime(iso){ return iso ? new Date(iso).toLocaleString() : '-'; }

async function load() {
  const msg = document.getElementById('msg');

  // accept ?event_id=… or ?id=…
  const eventId = Number(qs('event_id') || qs('id'));
  if (!eventId) {
    msg.textContent = 'Missing event id';
    msg.style.color = 'red';
    return;
  }

  // back link points to event details
  document.getElementById('back-link').href = `/event.html?id=${eventId}`;

  // fetch & show a tiny event summary
  try {
    const r = await fetch(`${API_BASE}/events/${eventId}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ev = await r.json();
    document.getElementById('event-title').textContent = ev.title;
    document.getElementById('event-brief').textContent =
      `${fmtDateTime(ev.start_datetime)} · ${[ev.venue, ev.city, ev.state].filter(Boolean).join(', ') || '-'}`;
  } catch (e) {
    msg.textContent = `Failed to load event: ${e.message}`;
    msg.style.color = 'red';
    return;
  }

  // submit
  document.getElementById('reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const full_name = document.getElementById('full_name').value.trim();
    const email     = document.getElementById('email').value.trim();
    const phone     = document.getElementById('phone').value.trim();
    const tickets   = Number(document.getElementById('tickets').value || 1);

    if (!full_name || !email || tickets < 1) {
      msg.textContent = 'Please enter name, email and at least 1 ticket.';
      msg.style.color = 'red';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ event_id: eventId, full_name, email, phone, tickets })
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        msg.textContent = data.error ? `Error: ${data.error}` : `Error (${res.status})`;
        msg.style.color = 'red';
        return;
      }

      // success → back to event detail (it will show the new row)
      location.href = `/event.html?id=${eventId}`;
    } catch (err) {
      msg.textContent = `Network/JS error: ${err.message}`;
      msg.style.color = 'red';
    }
  });
}
window.addEventListener('DOMContentLoaded', load);
