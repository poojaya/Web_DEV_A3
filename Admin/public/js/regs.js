// Admin/public/js/regs.js
const API = window.API_BASE || 'http://localhost:3060/api';

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const qs = (k) => new URLSearchParams(location.search).get(k);

function pad2(n){ return String(n).padStart(2,'0'); }
function fmtDT(iso){
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function currency(n){
  if (n == null) return '-';
  return Number(n).toLocaleString(undefined, { style:'currency', currency:'AUD' });
}

function msg(text, ok=false){
  const el = $("#msg"); el.textContent = text || '';
  el.style.color = ok ? '#0a0' : '#b00';
}

async function fetchJSON(url, opt){
  const r = await fetch(url, opt);
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw:t }; }
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

function renderEventHeader(ev){
  $("#page-title").textContent = `Registrations • ${ev.title}`;
  const when = `${fmtDT(ev.start_datetime)}${ev.end_datetime ? ' – ' + fmtDT(ev.end_datetime) : ''}`;
  const where = [ev.venue, ev.city, ev.state, ev.country].filter(Boolean).join(', ');
  $("#event-brief").textContent = `When: ${when} • Where: ${where || '-'} • Ticket: ${currency(ev.ticket_price)} • Org: ${ev.org_name}`;
}

function renderRegs(regs, ticketPrice){
  const tb = $("#regs-body");
  if (!regs || !regs.length){
    tb.innerHTML = `<tr><td colspan="5">No registrations yet.</td></tr>`;
    $("#regs-summary").textContent = '';
    return;
  }
  tb.innerHTML = regs.map(r => `
    <tr>
      <td>${fmtDT(r.registered_at)}</td>
      <td>${r.full_name}</td>
      <td>${r.tickets}</td>
      <td>${r.email || '-'}</td>
      <td>${r.phone || '-'}</td>
    </tr>
  `).join('');

  const totalRegs    = regs.length;
  const totalTickets = regs.reduce((s, r) => s + (Number(r.tickets)||0), 0);
  const estRaised    = ticketPrice ? totalTickets * Number(ticketPrice) : null;

  $("#regs-summary").textContent =
    `Total registrations: ${totalRegs} • Tickets: ${totalTickets}`
    + (estRaised != null ? ` • Estimated raised: ${currency(estRaised)}` : '');
}

async function load(){
  const api = API;
  const id  = Number(qs('id'));
  if (!id){ msg('Missing event id'); return; }

  // make the back link preserve ?api=…
  const apiParam = encodeURIComponent(api);
  $("#back-link").href = `index.html?api=${apiParam}`;

  try {
    const ev = await fetchJSON(`${api}/events/${id}`);
    renderEventHeader(ev);
    renderRegs(ev.registrations || [], ev.ticket_price);
    msg(`Loaded from ${api}`, true);
  } catch (e) {
    $("#regs-body").innerHTML = `<tr><td colspan="5" style="color:#b00">Failed: ${e.message}</td></tr>`;
    msg(e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $("#reloadBtn").addEventListener('click', load);
  load();
});
