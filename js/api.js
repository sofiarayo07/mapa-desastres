const BASE = () => (window.API_BASE || '/api');

export async function getIncidentes(){
  const r = await fetch(`${BASE()}/incidentes`, { headers:{Accept:'application/json'} });
  if(!r.ok) throw new Error(`GET /incidentes ${r.status}`);
  return await r.json();
}
export async function postIncidente(item){
  const r = await fetch(`${BASE()}/incidentes`, {
    method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'},
    body: JSON.stringify(item)
  });
  if(!r.ok) throw new Error(`POST /incidentes ${r.status}`);
  return await r.json();
}
export async function putIncidente(id, patch){
  const r = await fetch(`${BASE()}/incidentes/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json', Accept:'application/json'},
    body: JSON.stringify(patch)
  });
  if(!r.ok) throw new Error(`PUT /incidentes/${id} ${r.status}`);
  return await r.json();
}
export async function deleteIncidente(id){
  const r = await fetch(`${BASE()}/incidentes/${id}`, { method:'DELETE' });
  if(!r.ok) throw new Error(`DELETE /incidentes/${id} ${r.status}`);
  return true;
}
