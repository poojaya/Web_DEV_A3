const API = window.API_BASE || 'http://localhost:3060/api';
const $ = s => document.querySelector(s);

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
  return local.toISOString().slice(0,16);
}
function msg(text, ok=false){
  const el=$("#msg");
  el.className = ok?'ok':'danger';
  el.textContent=text;
}
async function fetchJSON(url, opt){
  const r = await fetch(url, opt);
  const t = await r.text();
  let j; try{ j=JSON.parse(t) } catch { j={ raw:t } }
  if(!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

async function loadLookups(){
  const [cats, orgs] = await Promise.all([
    fetchJSON(`${API}/categories`),
    fetchJSON(`${API}/organisations`)
  ]);
  $('#category_id').innerHTML = cats.map(c=>`<option value="${c.category_id}">${c.name}</option>`).join('');
  $('#org_id').innerHTML      = orgs.map(o=>`<option value="${o.org_id}">${o.name}</option>`).join('');
}

function renderEvents(rows){
  const tb = document.getElementById('events-body');
  if(!rows.length){
    tb.innerHTML = `<tr><td colspan="7">No events.</td></tr>`;
    return;
  }
  const apiParam = encodeURIComponent((window.API_BASE || '').replace(/\/$/,''));
  tb.innerHTML = rows.map(e => `
    <tr>
      <td>${e.event_id}</td>
      <td>${e.title}</td>
      <td>${e.category_name ?? '-'}</td>
      <td>${e.org_name ?? '-'}</td>
      <td>${e.city ?? '-'}</td>
      <td>${new Date(e.start_datetime).toLocaleString()}</td>
      <td>
        <button data-edit="${e.event_id}">Edit</button>
        <button data-del="${e.event_id}">Delete</button>
        <a class="regs-link" href="regs.html?id=${e.event_id}&api=${apiParam}">Regs</a>
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
  $('#form-msg').textContent='';
}

async function selectEvent(id){
  const evt = await fetchJSON(`${API}/events/${id}`);
  fillForm(evt);
}

async function loadEvents(){
  const rows = await fetchJSON(`${API}/events`);
  renderEvents(rows);
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
  const opt = { method: id ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) };
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
tbody.addEventListener('click', async (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) {
    const id = Number(edit.dataset.edit);
    try { await selectEvent(id); } catch (err) { msg(err.message); }
    return;
  }
  const del = e.target.closest('[data-del]');
  if (del) {
    await remove(Number(del.dataset.del));
    return;
  }
});
