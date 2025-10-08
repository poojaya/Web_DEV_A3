const API = window.API_BASE || 'http://localhost:3060/api';
const qs = k => new URLSearchParams(location.search).get(k);

function fmt(iso){ return iso ? new Date(iso).toLocaleString() : '-'; }

async function fetchJSON(u){ const r=await fetch(u); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

async function load(){
  const id = Number(qs('id'));
  const apiParam = encodeURIComponent((window.API_BASE || '').replace(/\/$/,''));
  document.getElementById('back-link').href = `index.html?api=${apiParam}`;

  if(!id){
    document.getElementById('title').textContent = 'Missing event id';
    document.getElementById('regs-body').innerHTML = `<tr><td colspan="5">—</td></tr>`;
    return;
  }

  const ev = await fetchJSON(`${API}/events/${id}`);
  document.getElementById('title').textContent = ev.title;
  document.getElementById('meta').textContent =
    `${fmt(ev.start_datetime)} — ${ev.city || ''} ${ev.state || ''}`.trim();

  const regs = ev.registrations || [];
  const tbody = document.getElementById('regs-body');
  if(!regs.length){
    tbody.innerHTML = `<tr><td colspan="5">No registrations.</td></tr>`;
    return;
  }
  tbody.innerHTML = regs.map(r=>`
    <tr>
      <td>${fmt(r.registered_at)}</td>
      <td>${r.full_name}</td>
      <td>${r.tickets}</td>
      <td>${r.email || '-'}</td>
      <td>${r.phone || '-'}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', load);
