// app.js - VERSIÓN FINAL: SIN SERVICIOS
// ============================================================

const SUPABASE_URL = 'https://yhikslflzazeodazxpyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWtzbGZsemF6ZW9kYXp4cHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDg1NTUsImV4cCI6MjA4NTk4NDU1NX0.H5T_YmsetExRyy5DjwbEFvMi4D6GzImEOFcOZL0Pwxk';

let supabase = null;
let currentEditId = null;
let tempParticipants = [];
let tempGallery = [];
let newGalleryFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando AESFACT App Pro (Final V4)...');
    await initSupabase();
    await renderPublic(); 
    bindSidebar();
    renderNav();
    bindContact();
    bindNewsModal();
    if (document.body.classList.contains('admin')) initAdmin();
});

async function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase conectado');
        setupRealtime();
    } else console.error('❌ Librería no encontrada');
}

function setupRealtime() {
    if (!supabase) return;
    supabase.channel('custom-all-channel').on('postgres_changes', { event: '*', schema: 'public' }, () => {
        renderPublic();
        if (document.body.classList.contains('admin') && !document.getElementById('admin-panel').classList.contains('hidden')) {
            const s1 = document.getElementById('search-mem');
            const s2 = document.getElementById('proj-member-search');
            if ((!s1 || document.activeElement !== s1) && (!s2 || document.activeElement !== s2)) loadAdminLists();
        }
    }).subscribe();
}

async function uploadImageToStorage(file, folderName) {
    try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
        const filePath = `${folderName}/${Date.now()}_${cleanName}`;
        const { data, error } = await supabase.storage.from('media').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
        return publicUrl;
    } catch (e) { console.error(e); alert('Error subiendo imagen'); return null; }
}

async function readData() {
    if (!supabase) return null;
    // Eliminado: services
    const dataStore = { mision:'', vision:'', valores:[], politica:'', objetivos:[], objetivos_calidad:[], news:[], projects:[], events:[], members:[], aesfact:{year:'',image:''}, gallery:[] };
    try {
        const [conf, nw, pr, ev, me, ae] = await Promise.all([
            supabase.from('config').select('*'),
            supabase.from('news').select('*').order('date', { ascending: false }),
            supabase.from('projects').select('*').order('date', { ascending: false }),
            supabase.from('events').select('*').order('date', { ascending: true }),
            supabase.from('members').select('*'),
            supabase.from('aesfact').select('*').eq('id', 'aesfact').single()
        ]);
        if(conf.data) conf.data.forEach(i=>{ try{ if(['valores','objetivos','objetivos_calidad'].includes(i.key)) dataStore[i.key]=JSON.parse(i.value); else dataStore[i.key]=i.value; }catch(e){} });
        dataStore.news=nw.data||[]; dataStore.projects=pr.data||[]; dataStore.events=ev.data||[]; dataStore.members=me.data||[];
        if(ae.data) dataStore.aesfact=ae.data;
        if(dataStore.aesfact.image) dataStore.gallery.push(dataStore.aesfact.image);
        dataStore.news.forEach(n=>{if(n.image)dataStore.gallery.push(n.image)});
        return dataStore;
    } catch(e) { return null; }
}

async function renderPublic() {
    const data = await readData(); if (!data) return;
    const txt=(i,v)=>{const e=document.getElementById(i);if(e)e.textContent=v||''};
    const lst=(i,a)=>{const e=document.getElementById(i);if(e){e.innerHTML='';(a||[]).forEach(x=>{const l=document.createElement('li');l.textContent=x;e.appendChild(l)})}};
    
    txt('mision',data.mision); txt('vision',data.vision); txt('politica',data.politica);
    lst('valores',data.valores); lst('objetivos',data.objetivos); lst('objetivos-calidad',data.objetivos_calidad);
    txt('aesfact-year',data.aesfact.year);
    const ai=document.getElementById('aesfact-image'); if(ai) ai.src=data.aesfact.image||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%2304293a' width='1280' height='720'/%3E%3Ctext x='50%' y='50%' fill='white' font-size='48' dominant-baseline='middle' text-anchor='middle'%3EAESFACT%3C/text%3E%3C/svg%3E";

    const render=(id,it,fn)=>{const e=document.getElementById(id);if(e){e.innerHTML='';it.forEach(x=>e.appendChild(fn(x)))}};
    
    // Eliminado render de services-list

    render('events-list',data.events,e=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<h4>${escapeHtml(e.title)} <small class="muted">${e.date}</small></h4><p>${escapeHtml(e.desc)}</p>`;return d});
    renderMembersByRole(data.members);
    render('news-list',data.news,n=>{
        const a=document.createElement('article');a.className='card';
        const img=n.image?`<img src="${n.image}" alt="Img">`:`<div style="height:200px;background:#04293a;display:flex;align-items:center;justify-content:center;color:white;">Sin imagen</div>`;
        a.innerHTML=`${img}<div class="news-content"><h4>${escapeHtml(n.title)}</h4><small>${n.date}</small><p>${escapeHtml(n.body.substring(0,120))}...</p><a class="read-more" onclick="openNewsModal('${escapeHtml(n.title)}','${n.date}','${escapeHtml(n.body)}','${n.image||''}')">Leer más →</a></div>`; return a;
    });
    initCarousel(data.news.slice(0,5));
    const gl=document.getElementById('gallery-list');if(gl){gl.innerHTML='';data.gallery.forEach(i=>{const d=document.createElement('div');d.className='gallery-item';d.innerHTML=`<img src="${i}" onclick="openPhotoViewer('${i}')">`;gl.appendChild(d)})}

    // PROYECTOS
    const pl=document.getElementById('projects-list-container')||document.getElementById('projects-list');
    if(pl){
        pl.innerHTML='';
        if(data.projects.length===0) pl.innerHTML='<div class="card"><p class="muted">No hay proyectos.</p></div>';
        data.projects.forEach((p,idx)=>{
            const c=document.createElement('div'); c.className='project-card-wide';
            let sc='curso'; if(p.status==='Terminado')sc='terminado'; if(p.status==='Cancelado')sc='cancelado';
            
            let galHtml='';
            if(p.gallery&&p.gallery.length>0){
                const sid=`ps-${idx}`;
                let slides=''; p.gallery.forEach((g,i)=>slides+=`<div class="project-slide ${i===0?'active':''}" data-i="${i}"><img src="${g}" onclick="openPhotoViewer('${g}')"></div>`);
                const ctrls=p.gallery.length>1?`<button class="p-nav prev" onclick="moveSlide('${sid}',-1)">&#10094;</button><button class="p-nav next" onclick="moveSlide('${sid}',1)">&#10095;</button><div class="p-counter"><span id="${sid}-c">1</span>/${p.gallery.length}</div>`:'';
                galHtml=`<div class="project-gallery-wrapper" id="${sid}">${slides}${ctrls}</div>`;
            }

            let fbHtml=''; if((p.status==='Terminado'||p.status==='Cancelado')&&p.feedback) fbHtml=`<div class="project-extra"><strong style="color:var(--blue-accent)">${p.status==='Terminado'?'🏁 Resultados / Conclusiones':'⚠️ Motivo de cancelación'}</strong><p style="margin:5px 0 0 0;color:var(--muted)">${escapeHtml(p.feedback)}</p></div>`;
            
            let partHtml='';
            if(p.status==='Terminado'&&p.participants&&p.participants.length>0){
                let cardsHtml = '';
                p.participants.forEach(part => {
                    let photoUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";
                    let role = "Voluntario";
                    let isExt = false;
                    if (part.type === 'member') {
                        const realMember = data.members.find(m => m.id === part.id);
                        if (realMember) {
                            if (realMember.photo) photoUrl = realMember.photo;
                            role = realMember.role || part.role;
                        } else role = part.role;
                    } else { isExt = true; role = "Externo / Voluntario"; }

                    cardsHtml += `<div class="mini-member-card ${isExt ? 'external' : ''}"><img src="${photoUrl}" onclick="openPhotoViewer('${photoUrl}')" alt="${escapeHtml(part.name)}"><div class="mini-member-info"><h5>${escapeHtml(part.name)}</h5><p>${escapeHtml(role)}</p></div></div>`;
                });
                partHtml = `<div style="margin-top:25px;"><div style="font-size:0.85rem; font-weight:700; color:var(--blue-light); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">👥 Equipo Participante</div><div class="project-participants-grid">${cardsHtml}</div></div>`;
            }

            c.innerHTML=`<div class="project-header"><div><h3>${escapeHtml(p.title)}</h3><span class="project-date">📅 ${p.date||'Pendiente'}</span></div><span class="status-badge ${sc}">${p.status}</span></div><div class="project-body">${galHtml}<div class="project-description">${escapeHtml(p.desc).replace(/\n/g,'<br>')}</div>${fbHtml}${partHtml}</div>`;
            pl.appendChild(c);
        });
    }
}

window.moveSlide = (sid, dir) => {
    const w = document.getElementById(sid); if(!w) return;
    const s = w.querySelectorAll('.project-slide'); const t = s.length;
    let c = 0; s.forEach((x,i)=>{if(x.classList.contains('active'))c=i;x.classList.remove('active')});
    let n = c+dir; if(n<0)n=t-1; if(n>=t)n=0;
    s[n].classList.add('active'); const cnt=document.getElementById(`${sid}-c`); if(cnt)cnt.textContent=n+1;
};

// ADMIN
const AUTHS = [{u:'SysAdmin',p:'AESFAC_2026'},{u:'Ryzen8',p:'Radeon2025'}];
function initAdmin() {
    document.getElementById('login-btn')?.addEventListener('click', () => {
        const u = document.getElementById('admin-email').value.trim();
        const p = document.getElementById('admin-pass').value.trim();
        if(AUTHS.some(x=>x.u===u && x.p===p)) {
            sessionStorage.setItem('aesfact_session', 'active');
            toggleAdmin(true); loadAdminData(); loadAdminLists();
        } else alert('Credenciales incorrectas');
    });
    document.getElementById('logout-btn')?.addEventListener('click',()=>{sessionStorage.removeItem('aesfact_session');location.reload()});
    if(sessionStorage.getItem('aesfact_session')==='active'){toggleAdmin(true);loadAdminData();loadAdminLists();}
    setupAdminListeners();
}
function toggleAdmin(show){
    if(show){ document.getElementById('login-panel').classList.add('hidden'); document.getElementById('public-admin-title').classList.add('hidden'); document.getElementById('admin-panel').classList.remove('hidden'); }
}

async function loadAdminData() {
    const d = await readData(); if(!d)return;
    const set=(i,v)=>{const e=document.getElementById(i);if(e)e.value=v||''};
    set('edit-mision',d.mision); set('edit-vision',d.vision); set('edit-valores',d.valores.join('\n'));
    set('edit-politica',d.politica); set('edit-objetivos',d.objetivos.join('\n')); set('edit-objetivos-calidad',d.objetivos_calidad.join('\n'));
    set('aesfact-year',d.aesfact.year); setupProjectManager(d.members);
}

function setupAdminListeners() {
    document.getElementById('save-about')?.addEventListener('click',async()=>{
        const v=id=>document.getElementById(id)?.value||''; const a=id=>v(id).split('\n').filter(Boolean);
        const up=[{key:'mision',value:v('edit-mision')},{key:'vision',value:v('edit-vision')},{key:'politica',value:v('edit-politica')},{key:'valores',value:JSON.stringify(a('edit-valores'))},{key:'objetivos',value:JSON.stringify(a('edit-objetivos'))},{key:'objetivos_calidad',value:JSON.stringify(a('edit-objetivos-calidad'))}];
        for(let u of up) await supabase.from('config').upsert({key:u.key,value:u.value}); alert('Guardado');
    });
    document.getElementById('save-aesfact')?.addEventListener('click',async()=>{
        const y=document.getElementById('aesfact-year').value; let i=document.getElementById('aesfact-image-url').value;
        const f=document.getElementById('aesfact-image-file'); if(f.files[0]) i=await uploadImageToStorage(f.files[0],'aesfact')||i;
        await supabase.from('aesfact').upsert({id:'aesfact',year:y,image:i}); alert('Guardado');
    });
    setupCrud('news','news',['title','body','date','image'],'noticias');
    setupCrud('evt','events',['title','desc','date'],'eventos');
    setupCrud('mem','members',['name','role','email','phone','photo'],'integrantes');
    // Removed services setupCrud
}

function setupProjectManager(allMembers) {
    const status=document.getElementById('proj-status');
    const search=document.getElementById('proj-member-search');
    const res=document.getElementById('proj-member-results');
    
    status.addEventListener('change',()=>{
        const v=status.value;
        document.getElementById('proj-feedback-section').classList.add('hidden');
        document.getElementById('proj-participants-section').classList.add('hidden');
        if(v==='Terminado'){document.getElementById('proj-feedback-section').classList.remove('hidden');document.getElementById('proj-participants-section').classList.remove('hidden');}
        else if(v==='Cancelado')document.getElementById('proj-feedback-section').classList.remove('hidden');
    });

    search.addEventListener('input',(e)=>{
        const t=e.target.value.toLowerCase(); if(t.length<2){res.style.display='none';return}
        const m=allMembers.filter(x=>x.name.toLowerCase().includes(t));
        res.innerHTML='';
        if(m.length){
            res.style.display='block';
            m.forEach(x=>{
                const d=document.createElement('div'); d.style.padding='8px'; d.style.cursor='pointer'; d.style.borderBottom='1px solid #eee'; d.textContent=`${x.name} (${x.role})`;
                d.onmouseover=()=>d.style.background='#f0f0f0'; d.onmouseout=()=>d.style.background='white';
                d.onclick=()=>{ 
                    // CAPTURAMOS EL ROL AQUÍ
                    addParticipant({id:x.id,name:x.name,role:x.role,type:'member'}); 
                    search.value=''; res.style.display='none'; 
                };
                res.appendChild(d);
            });
        } else res.style.display='none';
    });

    document.getElementById('proj-add-external').onclick=()=>{
        const n=document.getElementById('proj-external-name').value.trim();
        if(n){addParticipant({id:Date.now(),name:n,role:'Externo',type:'external'});document.getElementById('proj-external-name').value='';}
    };

    window.addParticipant=(p)=>{if(tempParticipants.some(x=>x.name===p.name))return; tempParticipants.push(p); renderParts();};
    window.removeParticipant=(n)=>{tempParticipants=tempParticipants.filter(p=>p.name!==n); renderParts();};
    
    function renderParts(){
        const l=document.getElementById('proj-participants-list'); l.innerHTML='';
        tempParticipants.forEach(p=>{
            const s=document.createElement('span'); s.style.cssText=`padding:5px 10px;border-radius:15px;font-size:0.85rem;display:flex;align-items:center;gap:5px;${p.type==='member'?'background:#e3f2fd;color:#0d47a1':'background:#eee;color:#444'}`;
            // Muestra Rol en Admin también
            s.innerHTML=`${p.name} <small>(${p.role||''})</small> <span onclick="removeParticipant('${p.name}')" style="cursor:pointer;font-weight:bold">&times;</span>`;
            l.appendChild(s);
        });
    }

    document.getElementById('add-proj').onclick=async()=>{
        const btn=document.getElementById('add-proj'); btn.disabled=true; btn.textContent='Guardando...';
        const t=document.getElementById('proj-title').value; if(!t){alert('Falta título'); btn.disabled=false; return;}
        
        const f=document.getElementById('proj-gallery-files');
        if(f.files.length){ for(let file of f.files){const u=await uploadImageToStorage(file,'proyectos'); if(u)tempGallery.push(u);} }

        const pl={title:t, desc:document.getElementById('proj-desc').value, date:document.getElementById('proj-date').value, status:status.value, feedback:document.getElementById('proj-feedback').value, participants:tempParticipants, gallery:tempGallery};
        
        let err=null;
        if(currentEditId) { const r=await supabase.from('projects').update(pl).eq('id',currentEditId); err=r.error; }
        else { const r=await supabase.from('projects').insert([{...pl, id:Date.now().toString()}]); err=r.error; }

        if(err) alert('Error guardando'); else { alert('Guardado'); resetProj(); loadAdminLists(); }
        btn.disabled=false; btn.textContent='Guardar Proyecto';
    };
    document.getElementById('cancel-proj').onclick=resetProj;
}

function resetProj(){
    currentEditId=null;
    ['proj-title','proj-desc','proj-date','proj-feedback','proj-gallery-files','proj-member-search','proj-external-name'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('proj-status').value='En curso';
    ['proj-feedback-section','proj-participants-section','cancel-proj'].forEach(id=>document.getElementById(id).classList.add('hidden'));
    document.getElementById('add-proj').textContent='Guardar Proyecto';
    document.getElementById('proj-gallery-preview').innerHTML=''; tempParticipants=[]; tempGallery=[]; document.getElementById('proj-participants-list').innerHTML='';
}

function loadProjectToEdit(i){
    currentEditId=i.id;
    document.getElementById('proj-title').value=i.title; document.getElementById('proj-desc').value=i.desc||'';
    document.getElementById('proj-date').value=i.date||''; 
    const st=document.getElementById('proj-status'); st.value=i.status||'En curso'; st.dispatchEvent(new Event('change'));
    document.getElementById('proj-feedback').value=i.feedback||'';
    tempParticipants=i.participants||[]; const l=document.getElementById('proj-participants-list'); l.innerHTML='';
    tempParticipants.forEach(p=>{const s=document.createElement('span');s.style.cssText=`padding:5px 10px;border-radius:15px;font-size:0.85rem;display:flex;align-items:center;gap:5px;${p.type==='member'?'background:#e3f2fd;color:#0d47a1':'background:#eee;color:#444'}`;s.innerHTML=`${p.name} <small>(${p.role||''})</small> <span onclick="removeParticipant('${p.name}')" style="cursor:pointer;font-weight:bold">&times;</span>`;l.appendChild(s)});
    tempGallery=i.gallery||[]; renderAdminGalleryPreview();
    document.getElementById('add-proj').textContent='Actualizar Proyecto'; document.getElementById('cancel-proj').classList.remove('hidden');
    document.getElementById('sec-projects').scrollIntoView({behavior:'smooth'});
}

function renderAdminGalleryPreview(){
    const p=document.getElementById('proj-gallery-preview'); if(!p)return; p.innerHTML='';
    tempGallery.forEach((u,i)=>{
        const w=document.createElement('div'); w.style.cssText='position:relative;width:80px;height:80px;';
        w.innerHTML=`<img src="${u}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"><button style="position:absolute;top:-5px;right:-5px;background:red;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;">✕</button>`;
        w.querySelector('button').onclick=(e)=>{e.preventDefault();if(confirm('¿Borrar?')) {tempGallery.splice(i,1);renderAdminGalleryPreview()}};
        p.appendChild(w);
    });
}

function setupCrud(pf,tb,fds,fld){
    const add=document.getElementById(`add-${pf}`), can=document.getElementById(`cancel-${pf}`); if(!add)return;
    add.onclick=async()=>{
        const pl={}; add.disabled=true; add.textContent='...';
        for(let f of fds){
            const fi=document.getElementById(`${pf}-${f}-file`);
            if(fi?.files[0]) pl[f]=await uploadImageToStorage(fi.files[0],fld);
            else if(document.getElementById(`${pf}-${f}-url`)) pl[f]=document.getElementById(`${pf}-${f}-url`).value;
            else if(document.getElementById(`${pf}-${f}`)) pl[f]=document.getElementById(`${pf}-${f}`).value;
        }
        if((tb==='news'||tb==='members')&&(!pl.title&&!pl.name)){add.disabled=false;return alert('Datos faltantes')}
        const r=currentEditId?await supabase.from(tb).update(pl).eq('id',currentEditId):await supabase.from(tb).insert([{...pl,id:Date.now().toString()}]);
        if(r.error)alert('Error'); else {alert('Guardado'); resetForm(pf,fds); loadAdminLists();}
        add.disabled=false; add.textContent=currentEditId?'Actualizar':'Agregar';
    };
    can.onclick=()=>resetForm(pf,fds);
}

function resetForm(pf,fds){
    currentEditId=null; fds.forEach(f=>{if(document.getElementById(`${pf}-${f}`))document.getElementById(`${pf}-${f}`).value='';if(document.getElementById(`${pf}-${f}-url`))document.getElementById(`${pf}-${f}-url`).value='';if(document.getElementById(`${pf}-${f}-file`))document.getElementById(`${pf}-${f}-file`).value=''});
    const add=document.getElementById(`add-${pf}`), can=document.getElementById(`cancel-${pf}`);
    if(add)add.textContent='Agregar'; if(can)can.classList.add('hidden');
}

async function loadAdminLists() {
    const d = await readData(); 
    if (!d) return;

    const sm = document.getElementById('search-mem');
    
    // Configurar el buscador de miembros solo una vez
    if (sm && !sm.dataset.l) { 
        sm.dataset.l = "1"; 
        sm.addEventListener('input', (e) => { 
            const t = e.target.value.toLowerCase(); 
            const filtered = d.members.filter(m => m.name.toLowerCase().includes(t));
            renderList('member-admin-list', filtered, 'name', 'members', 'mem', ['name', 'role', 'email', 'phone', 'photo']); 
        }); 
    }

    const renderList = (cid, it, lbl, tb, pf, fds) => {
        const c = document.getElementById(cid); 
        if (!c) return; 
        
        c.innerHTML = it.length ? '' : '<p class="muted">Sin registros.</p>';
        
        it.forEach(x => {
            const div = document.createElement('div'); 
            div.className = 'card'; 
            div.style.cssText = 'padding:10px 15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';
            
            // CORRECCIÓN AQUÍ: Usamos 'tb' y 'x' en lugar de 'table' e 'item'
            let thumb = ''; 
            const imgPath = x.photo || x.image;
            if ((tb === 'members' || tb === 'news') && imgPath) {
                thumb = `<img src="${imgPath}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;margin-right:10px;">`;
            }

            div.innerHTML = `
                <div style="display:flex;align-items:center;">
                    ${thumb}
                    <b>${escapeHtml(x[lbl])}</b>
                </div>
                <div>
                    <button class="btn edit-btn" style="padding:4px 8px;font-size:0.8rem;margin-right:5px;">✏️</button>
                    <button class="btn del-btn" style="padding:4px 8px;font-size:0.8rem;background:#d32f2f;">🗑️</button>
                </div>`;

            // Acción Eliminar
            div.querySelector('.del-btn').onclick = async () => { 
                if (confirm('¿Estás seguro de borrar este registro?')) { 
                    const { error } = await supabase.from(tb).delete().eq('id', x.id); 
                    if (error) alert("Error al borrar");
                    else loadAdminLists(); // Recargar listas
                } 
            };

            // Acción Editar
            div.querySelector('.edit-btn').onclick = () => {
                if (tb === 'projects') {
                    loadProjectToEdit(x);
                } else { 
                    currentEditId = x.id; 
                    fds.forEach(f => { 
                        const elUrl = document.getElementById(`${pf}-${f}-url`);
                        const elNormal = document.getElementById(`${pf}-${f}`);
                        if (elUrl) elUrl.value = x[f] || ''; 
                        if (elNormal) elNormal.value = x[f] || ''; 
                    }); 
                    
                    const addBtn = document.getElementById(`add-${pf}`);
                    const canBtn = document.getElementById(`cancel-${pf}`);
                    if (addBtn) { 
                        addBtn.textContent = 'Actualizar'; 
                        addBtn.scrollIntoView({ behavior: 'smooth' }); 
                    } 
                    if (canBtn) canBtn.classList.remove('hidden'); 
                }
            };
            c.appendChild(div);
        });
    };

    // Renderizado inicial de todas las listas
    renderList('news-admin-list', d.news, 'title', 'news', 'news', ['title', 'body', 'date', 'image']);
    renderList('event-admin-list', d.events, 'title', 'events', 'evt', ['title', 'desc', 'date']);
    
    const searchVal = sm ? sm.value.toLowerCase() : '';
    const filteredMembers = searchVal ? d.members.filter(m => m.name.toLowerCase().includes(searchVal)) : d.members;
    renderList('member-admin-list', filteredMembers, 'name', 'members', 'mem', ['name', 'role', 'email', 'phone', 'photo']);
    
    // Lista de proyectos
    renderList('proj-admin-list', d.projects, 'title', 'projects', 'proj', []);
}

function escapeHtml(t) { return t ? t.toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : ''; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function bindSidebar() { const b=document.getElementById('sidebar-toggle'),s=document.getElementById('sidebar'),o=document.getElementById('sidebar-overlay'); if(b)b.onclick=()=>{s.classList.add('open');o.classList.add('open');};if(o)o.onclick=()=>{s.classList.remove('open');o.classList.remove('open');};}
function renderNav() { const n=document.getElementById('sidebar-nav'); if(!n)return; const l=[{t:'Inicio',h:'index.html'},{t:'Nosotros',h:'about.html'},{t:'Proyectos',h:'projects.html'},{t:'Eventos',h:'events.html'},{t:'Noticias',h:'news.html'},{t:'Galería',h:'gallery.html'},{t:'Integrantes',h:'members.html'},{t:'Contacto',h:'contact.html'}]; n.innerHTML=''; l.forEach(i=>{const a=document.createElement('a');a.href=i.h;a.textContent=i.t;if(location.pathname.includes(i.h))a.classList.add('active');n.appendChild(a)}); }
function bindContact() { const f=document.getElementById('contact-form');if(f)f.onsubmit=async e=>{e.preventDefault();await supabase.from('contacts').insert([{id:uid(),name:f['contact-name'].value,email:f['contact-email'].value,phone:f['contact-phone'].value,message:f['contact-message'].value}]);alert('Enviado');f.reset();};}
function bindNewsModal(){document.getElementById('news-modal')?.addEventListener('click',e=>{if(e.target===document.getElementById('news-modal'))document.getElementById('news-modal').classList.add('hidden')})}
function openNewsModal(t,d,b,i){const m=document.getElementById('news-modal'),mb=document.getElementById('news-modal-body');if(!m||!mb)return;mb.innerHTML=`<div style="display:flex;flex-direction:column;gap:16px;">${i?`<img src="${i}" style="width:100%;height:300px;object-fit:cover;border-radius:12px;">`:''}<div><h2 style="color:#013a63;margin:0 0 8px 0;">${escapeHtml(t)}</h2><small style="color:#ff6b6b;font-weight:600;">${d}</small></div><div style="color:#013a63;line-height:1.8;">${escapeHtml(b).replace(/\n/g,'<br>')}</div></div>`;m.classList.remove('hidden')}
function closeNewsModal(){document.getElementById('news-modal')?.classList.add('hidden')}
function initCarousel(n){const c=document.getElementById('news-carousel');if(!c)return;if(!n.length){c.innerHTML='<div class="card"><p class="muted">Sin noticias.</p></div>';return}c.innerHTML='';const ct=document.createElement('div');ct.className='carousel-slides';n.forEach((x,i)=>{const s=document.createElement('div');s.className=`carousel-slide ${i===0?'active':''}`;s.style.backgroundImage=x.image?`url('${x.image}')`:'linear-gradient(135deg,#04293a,#0d5d9e)';s.innerHTML=`<div class="carousel-caption"><div class="content"><h3>${escapeHtml(x.title)}</h3><small>${x.date}</small></div></div>`;ct.appendChild(s)});c.appendChild(ct);let idx=0;setInterval(()=>{ct.children[idx].classList.remove('active');idx=(idx+1)%ct.children.length;ct.children[idx].classList.add('active')},5000)}
function openPhotoViewer(s){const p=document.getElementById('photo-viewer'),i=document.getElementById('photo-viewer-img');if(p&&i){i.src=s;p.classList.add('open')}}
function renderMembersByRole(m){const c=document.getElementById('members-list');if(!c)return;c.innerHTML='';const q=[{title:'Presidente y Vicepresidenta',roles:['Presidente','Presidenta','Vicepresidente','Vicepresidenta','Vicepresedenta']},{title:'Logística',roles:['Logistica','Logística']},{title:'Publirelacionista',roles:['Publirelacionista','Relaciones Públicas','Relaciones Publicas']},{title:'Tesorería',roles:['Tesorero','Tesorería','Tesorera']},{title:'Secretaria',roles:['Secretaria','Secretario']},{title:'Vocales',roles:['Vocal','Vocales']},{title:'Colaboradores',roles:['Colaborador','Colaboradores']}];const cr=(x)=>{const d=document.createElement('div');d.className='member-card';const i=x.photo||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='220' height='220' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";d.innerHTML=`<img src="${i}" onclick="openPhotoViewer('${i}')"><div><h4>${escapeHtml(x.name)}</h4><p class="muted">${escapeHtml(x.role)}</p><p>${escapeHtml(x.email)}</p></div>`;return d};const norm=r=>(r||'').trim().toLowerCase();const u=new Set();q.forEach(g=>{const s=document.createElement('section');s.className='card quadrant';s.innerHTML=`<h3>${g.title}</h3>`;const d=document.createElement('div');d.className='quadrant-grid';const mat=m.filter(x=>g.roles.map(norm).includes(norm(x.role)));mat.forEach(x=>{d.appendChild(cr(x));u.add(x.id)});if(mat.length)s.appendChild(d);if(mat.length)c.appendChild(s)});const oth=m.filter(x=>!u.has(x.id));if(oth.length){const s=document.createElement('section');s.className='card quadrant';s.innerHTML=`<h3>Otros</h3>`;const d=document.createElement('div');d.className='quadrant-grid';oth.forEach(x=>d.appendChild(cr(x)));s.appendChild(d);c.appendChild(s)}}