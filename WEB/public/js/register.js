const API_BASE = (window.API_BASE || 'http://localhost:3060/api');

function fmtDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

async function init() {
  const msg      = document.getElementById('msg');
  const titleEl  = document.getElementById('event-title');
  const briefEl  = document.getElementById('event-brief');
  const backLink = document.getElementById('back-link');

  // 1) Get event_id from the query string
  const params  = new URLSearchParams(location.search);
  const eventId = Number(params.get('event_id'));
  if (!eventId) {
    msg.textContent = 'Missing event id';
    msg.style.color = 'red';
    return;
  }
  backLink.href = `/event.html?id=${eventId}`;

  // 2) Load the event (for header/summary)
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ev = await res.json();

    titleEl.textContent = ev.title;
    briefEl.textContent = `When: ${fmtDateTime(ev.start_datetime)} — ${fmtDateTime(ev.end_datetime)} · ` +
      `Where: ${[ev.venue, ev.city, ev.state, ev.country].filter(Boolean).join(', ')} · ` +
      `Ticket: ${ev.ticket_price != null ? `A$${Number(ev.ticket_price).toFixed(2)}` : 'Free'}`;
    msg.textContent = '';
  } catch (e) {
    msg.textContent = 'Failed to load event: ' + e.message;
    msg.style.color = 'red';
    return;
  }

  // 3) Handle submit (prevent default GET which drops event_id)
  document.getElementById('reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const payload = {
      event_id: eventId,
      full_name: document.getElementById('full_name').value.trim(),
      email:     document.getElementById('email').value.trim(),
      phone:     document.getElementById('phone').value.trim() || null,
      tickets:   Number(document.getElementById('tickets').value) || 1,
    };

    if (!payload.full_name || !payload.email) {
      msg.textContent = 'Please fill full name and email';
      msg.style.color = 'red';
      return;
    }

    try {
      const res  = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        msg.textContent = data.error || `Server error (${res.status})`;
        msg.style.color = 'red';
        return;
      }

      msg.textContent = 'Thank you! Registration recorded.';
      msg.style.color = 'green';
      setTimeout(() => location.href = `/event.html?id=${eventId}`, 800);
    } catch (err) {
      msg.textContent = 'Network error: ' + err.message;
      msg.style.color = 'red';
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
