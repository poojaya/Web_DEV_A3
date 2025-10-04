// Keep this in sync with your other pages
const API_BASE = 'http://localhost:3060/api';

function qs(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function fmt(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString();
}

async function loadEvent() {
  const id = qs('id');
  if (!id) {
    document.getElementById('event').textContent = 'Missing event id';
    document.getElementById('reg-form').style.display = 'none';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const e = await res.json();
    document.getElementById('event').innerHTML = `
      <strong>${e.title}</strong><br>
      ${fmt(e.start_datetime)}${e.end_datetime ? ' – ' + fmt(e.end_datetime) : ''}<br>
      ${[e.venue, e.city, e.state, e.country].filter(Boolean).join(', ')}<br>
      <em>${e.category_name} · ${e.org_name}</em>
    `;
  } catch (err) {
    document.getElementById('event').textContent = `Failed to load event: ${err.message}`;
    document.getElementById('reg-form').style.display = 'none';
  }
}

async function handleSubmit(ev) {
  ev.preventDefault();
  const msg = document.getElementById('msg');
  msg.textContent = '';

  const event_id = Number(qs('id'));
  const full_name = document.getElementById('full_name').value.trim();
  const email     = document.getElementById('email').value.trim();
  const phone     = document.getElementById('phone').value.trim() || null;
  const tickets   = Number(document.getElementById('tickets').value) || 1;

  if (!full_name || !email || tickets < 1) {
    msg.style.color = 'crimson';
    msg.textContent = 'Please complete required fields (name, email, tickets ≥ 1).';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ event_id, full_name, email, phone, tickets })
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}

    if (!res.ok) {
      msg.style.color = 'crimson';
      msg.textContent = data.error || `Server error (${res.status})`;
      return;
    }

    msg.style.color = 'green';
    msg.textContent = 'Registration complete! Redirecting…';
    setTimeout(() => location.href = `/event.html?id=${event_id}`, 900);
  } catch (e) {
    msg.style.color = 'crimson';
    msg.textContent = `Network error: ${e.message}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadEvent();
  document.getElementById('reg-form').addEventListener('submit', handleSubmit);
});
