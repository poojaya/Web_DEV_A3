// WEB/public/js/event.js
const API_BASE = (window.API_BASE || 'http://localhost:3060/api');

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}
function fmtDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}
function currency(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString(undefined, { style: 'currency', currency: 'AUD' });
}

function renderEvent(ev) {
  const el = document.getElementById('event-detail');
  el.innerHTML = `
    <h1>${ev.title}</h1>

    <p><strong>When:</strong> ${fmtDateTime(ev.start_datetime)}
      ${ev.end_datetime ? `– ${fmtDateTime(ev.end_datetime)}` : ''}</p>

    <p><strong>Where:</strong> ${[
      ev.venue, ev.city, ev.state, ev.country
    ].filter(Boolean).join(', ') || '-'}</p>

    <p><strong>Category:</strong> ${ev.category_name || '-'}
       · <strong>Organisation:</strong> ${ev.org_name || '-'}</p>

    <p><strong>Ticket:</strong> ${currency(ev.ticket_price)}</p>

    <p>
      <strong>Goal:</strong> <span id="ev-goal">${currency(ev.goal_amount)}</span>
      · <strong>Raised:</strong> <span id="ev-raised">A$0.00</span>
    </p>

    <!-- tiny progress bar -->
    <div id="ev-progress-wrap"
         style="margin:8px 0;width:420px;height:10px;background:#eee;border-radius:6px;overflow:hidden">
      <div id="ev-progress" style="height:10px;width:0;background:#4caf50"></div>
    </div>

    <p>${ev.description ? ev.description : ''}</p>
  `;
}


function renderRegs(regs, eventForTotals) {
  const tbody = document.getElementById('regs-body');
  const summary = document.getElementById('regs-summary');

  if (!regs || regs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No registrations yet.</td></tr>`;
    summary.textContent = '';
    // also reset raised/progress if the event has a goal
    const goal = Number(eventForTotals?.goal_amount || 0);
    const raisedEl = document.getElementById('ev-raised');
    const bar = document.getElementById('ev-progress');
    if (raisedEl) raisedEl.textContent = currency(0);
    if (bar) bar.style.width = goal > 0 ? '0%' : '0';
    return;
  }

  // table rows
  tbody.innerHTML = regs.map(r => `
    <tr>
      <td>${fmtDateTime(r.registered_at)}</td>
      <td>${r.full_name}</td>
      <td>${r.tickets}</td>
      <td>${r.email || '-'}</td>
      <td>${r.phone || '-'}</td>
    </tr>
  `).join('');

  // totals
  const totalTickets = regs.reduce((s, r) => s + (Number(r.tickets) || 0), 0);
  const perTicket    = Number(eventForTotals?.ticket_price || 0);
  const estRaised    = totalTickets * perTicket;
  const goal         = Number(eventForTotals?.goal_amount || 0);

  summary.textContent =
    `Total registrations: ${regs.length} · Tickets: ${totalTickets}` +
    (perTicket ? ` · Estimated raised: ${currency(estRaised)}` : '');

  // update "Raised" + progress bar
  const raisedEl = document.getElementById('ev-raised');
  if (raisedEl) raisedEl.textContent = currency(estRaised);

  const bar = document.getElementById('ev-progress');
  if (bar) {
    const pct = goal > 0 ? Math.min(100, Math.round((estRaised / goal) * 100)) : 0;
    bar.style.width = `${pct}%`;
    bar.title = `${pct}%`;
  }

  // keep goal text in sync (in case it was null/undefined)
  const goalEl = document.getElementById('ev-goal');
  if (goalEl) goalEl.textContent = currency(goal);
}


async function load() {
  const id = Number(qs('id'));
  if (!id) {
    document.getElementById('event-detail').textContent = 'Missing event id.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ev = await res.json();

    renderEvent(ev);
    renderRegs(ev.registrations || [], ev);

    // wire up the Register link to your registration page
    const regLink = document.getElementById('register-link');
    if (regLink) regLink.href = `/register.html?event_id=${id}`;
  } catch (e) {
    document.getElementById('event-detail').innerHTML =
      `<span style="color:red">Failed to load event: ${e.message}</span>`;
    document.getElementById('regs-body').innerHTML =
      `<tr><td colspan="5" style="color:red">Failed to load registrations.</td></tr>`;
  }
}

window.addEventListener('DOMContentLoaded', load);
