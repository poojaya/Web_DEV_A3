const API = window.API_BASE || 'http://localhost:3060/api';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function pad2(n){return String(n).padStart(2,'0')}
function toMySQL(dtLocal){
  if(!dtLocal) return null;
  const d = new Date(dtLocal);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}
function fromMySQL(iso){
  if(!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16); // yyyy-mm-ddThh:mm
}
function msg(text, ok=false){ const el=$("#msg"); el.className = ok?'ok':'danger'; el.textContent=text; }

async function fetchJSON(url, opt){ const r = await fetch(url, opt); const t=await r.text(); try { var j=JSON.parse(t) } catch { j={raw:t} } if(!r.ok) throw new Error(j.error||`HTTP ${r.status}`); return j; }

async function loadLookups(){
  const [cats, orgs] = await Promise.all([
    fetchJSON(`${API}/categories`),
    fetchJSON(`${API}/organisations`)
  ]);
  $('#category_id').innerHTML = cats.map(c=>`<option value="${c.category_id}">${c.name}</option>`).join('');
  $('#org_id').innerHTML = orgs.map(o=>`<option value="${o.org_id}">${o.name}</option>`).join('');
}

function renderEvents(rows){
    const tb = $('#events-body');
    if(!rows.length){
      tb.innerHTML = `<tr><td colspan="7">No events.</td></tr>`;
      return;
    }
    tb.innerHTML = rows.map(e => `
      <tr>
        <td>${e.event_id}</td>
        <td>${e.title}</td>
        <td>${e.category_name ?? '-'}</td>
        <td>${e.org_name ?? '-'}</td>
        <td>${e.city ?? '-'}</td>
        <td>${new Date(e.start_datetime).toLocaleString()}</td>
        <td>
          <button class="edit-btn"   data-id="${e.event_id}">Edit</button>
          <button class="delete-btn" data-id="${e.event_id}">Delete</button>
          <button class="regs-btn"   data-id="${e.event_id}">Regs</button>
        </td>
      </tr>
    `).join('');
  }
  

function fillForm(e){
  $('#form-title').textContent = `Edit event #${e.event_id}`;
  $('#event_id').value = e.event_id;
  $('#org_id').value = e.org_id;
  $('#category_id').value = e.category_id;
  $('#title').value = e.title || '';
  $('#description').value = e.description || '';
  $('#start_datetime').value = fromMySQL(e.start_datetime);
  $('#end_datetime').value   = fromMySQL(e.end_datetime);
  ['venue','city','state','country','capacity','ticket_price','goal_amount'].forEach(k=>{
    const v = e[k]; const el = document.getElementById(k);
    el.value = (v==null?'':v);
  });
}

function clearForm(){
  $('#form-title').textContent = 'New event';
  $('#event_id').value='';
  $('#event-form').reset();
  $('#regs-body').innerHTML = `<tr><td colspan="5">Select an event.</td></tr>`;
  $('#form-msg').textContent='';
}

async function selectEvent(id) {
    const evt = await fetchJSON(`${API}/events/${id}`);
    fillForm(evt);
    await loadRegs(id);
  }
  

async function loadEvents(){
  const rows = await fetchJSON(`${API}/events`);
  renderEvents(rows);
}

async function loadRegs(event_id){
  const e = await fetchJSON(`${API}/events/${event_id}`);
  $('#regs-body').innerHTML = (e.registrations||[]).map(r=>`
    <tr><td>${new Date(r.registered_at).toLocaleString()}</td>
        <td>${r.full_name}</td>
        <td>${r.tickets}</td>
        <td>${r.email||'-'}</td>
        <td>${r.phone||'-'}</td></tr>
  `).join('') || `<tr><td colspan="5">No registrations.</td></tr>`;
}

async function upsert(ev){
  ev.preventDefault();
  const id = $('#event_id').value;
  const payload = {
    org_id: Number($('#org_id').value),
    category_id: Number($('#category_id').value),
    title: $('#title').value.trim(),
    description: $('#description').value.trim() || null,
    start_datetime: toMySQL($('#start_datetime').value),
    end_datetime: toMySQL($('#end_datetime').value) || null,
    venue: $('#venue').value.trim() || null,
    city: $('#city').value.trim() || null,
    state: $('#state').value.trim() || null,
    country: $('#country').value.trim() || null,
    capacity: $('#capacity').value ? Number($('#capacity').value) : null,
    ticket_price: $('#ticket_price').value ? Number($('#ticket_price').value) : null,
    goal_amount: $('#goal_amount').value ? Number($('#goal_amount').value) : null
  };
  const opt = {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  };
  const url = id ? `${API}/events/${id}` : `${API}/events`;
  await fetchJSON(url, opt);
  $('#form-msg').textContent = 'Saved ✓';
  msg('Saved', true);
  await loadEvents();
}

async function remove(id){
  if(!confirm(`Delete event #${id}? This is permanent.`)) return;
  try{
    await fetchJSON(`${API}/events/${id}`, { method:'DELETE' });
    msg(`Deleted #${id}`, true);
    await loadEvents();
    clearForm();
  }catch(e){
    msg(e.message, false);
  }
}


document.addEventListener('DOMContentLoaded', async ()=>{
  $('#event-form').addEventListener('submit', upsert);
  $('#resetBtn').addEventListener('click', clearForm);
  $('#reloadBtn').addEventListener('click', loadEvents);
  try{
    await loadLookups();
    await loadEvents();
    msg(`Connected to API: ${API}`, true);
  }catch(e){
    msg(`API error: ${e.message}`);
  }
});

const tbody = document.getElementById('events-body');

tbody.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;

  const id = Number(btn.dataset.id);

  if (btn.classList.contains('edit-btn')) {
    await selectEvent(id);           // fills the form + renders regs
    return;
  }

  if (btn.classList.contains('delete-btn')) {
    await remove(id);                // your existing delete flow
    return;
  }

  if (btn.classList.contains('regs-btn')) {
    await selectEvent(id);           // loads regs
    document.getElementById('regs-card')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
});
