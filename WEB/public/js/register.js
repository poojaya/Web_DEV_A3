// public/js/register.js
const API_BASE = (window.API_BASE || 'http://localhost:3060/api').replace(/\/$/, '');

const $ = s => document.querySelector(s);
const fmt = iso => (iso ? new Date(iso).toLocaleString() : '');
const money = n =>
  n == null ? 'Free' :
  Number(n).toLocaleString(undefined, { style: 'currency', currency: 'AUD' });

const setMsg = (t, ok=false) => {
  const el = $('#msg');
  if (!el) return;
  el.textContent = t || '';
  el.style.color = ok ? '#0a0' : '#b00';
};

async function init() {
  const params  = new URLSearchParams(location.search);
  const eventId = Number(params.get('event_id'));
  if (!eventId) { setMsg('Missing event id'); return; }

  const back = $('#back-link');
  if (back) back.href = `/event.html?id=${eventId}`;

  // load event header
  try {
    const r = await fetch(`${API_BASE}/events/${eventId}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ev = await r.json();

    $('#event-title').textContent = ev.title || '';
    const when = ev.end_datetime
      ? `${fmt(ev.start_datetime)} — ${fmt(ev.end_datetime)}`
      : fmt(ev.start_datetime);
    const where = [ev.venue, ev.city, ev.state, ev.country].filter(Boolean).join(', ');
    $('#event-brief').textContent =
      `When: ${when} · Where: ${where || '-'} · Ticket: ${money(ev.ticket_price)}`;
    setMsg('');
  } catch (e) {
    setMsg('Failed to load event: ' + e.message);
    return;
  }

  // submit handler
  $('#reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');

    const payload = {
      event_id: eventId,
      full_name: $('#full_name').value.trim(),
      email:     $('#email').value.trim(),
      phone:     $('#phone').value.trim() || null,
      tickets:   Math.max(1, Number($('#tickets').value) || 1),
    };

    if (!payload.full_name || !payload.email) {
      setMsg('Please fill full name and email');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 409) {
        const j = await res.json().catch(()=> ({}));
        setMsg(j.error || 'You already registered for this event with this email');
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(()=> ({}));
        setMsg(j.error || `Server error (${res.status})`);
        return;
      }

      setMsg('Thank you! Your registration has been recorded.', true);
      e.target.reset();
      $('#tickets').value = 1;
      setTimeout(() => location.href = `/event.html?id=${eventId}`, 800);
    } catch (err) {
      setMsg('Network error: ' + err.message);
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
