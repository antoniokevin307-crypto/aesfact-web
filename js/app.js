// app.js - VERSIÓN FINAL CORREGIDA
// ============================================================

const SUPABASE_URL = 'https://yhikslflzazeodazxpyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWtzbGZsemF6ZW9kYXp4cHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDg1NTUsImV4cCI6MjA4NTk4NDU1NX0.H5T_YmsetExRyy5DjwbEFvMi4D6GzImEOFcOZL0Pwxk';

let supabase = null;
let currentEditId = null;

let tempParticipants = [];
let tempGallery = [];
let newGalleryFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando AESFACT App Pro...');
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
    } else {
        console.error('❌ Librería Supabase no encontrada.');
        showAlert('Error crítico: No hay conexión BD.', 'error');
    }
}

function setupRealtime() {
    if (!supabase) return;
    supabase.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            renderPublic();
            if (document.body.classList.contains('admin') && !document.getElementById('admin-panel').classList.contains('hidden')) {
                const searchInput = document.getElementById('search-mem');
                const projSearch = document.getElementById('proj-member-search');
                if ((!searchInput || document.activeElement !== searchInput) && (!projSearch || document.activeElement !== projSearch)) {
                    loadAdminLists();
                }
            }
        })
        .subscribe();
}

async function uploadImageToStorage(file, folderName) {
    try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
        const filePath = `${folderName}/${Date.now()}_${cleanName}`;
        const { data, error } = await supabase.storage.from('media').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
        return publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        showAlert('Error al subir imagen.', 'error');
        return null;
    }
}

// ============================================================
// LECTURA DE DATOS
// ============================================================
async function readData() {
    if (!supabase) return null;
    const dataStore = {
        mision: '', vision: '', valores: [], politica: '',
        objetivos: [], objetivos_calidad: [],
        news: [], projects: [], events: [], members: [], services: [],
        aesfact: { year: new Date().getFullYear().toString(), image: '' },
        gallery: []
    };

    try {
        const [config, news, projects, events, members, services, aesfact] = await Promise.all([
            supabase.from('config').select('*'),
            supabase.from('news').select('*').order('date', { ascending: false }),
            supabase.from('projects').select('*').order('date', { ascending: false }),
            supabase.from('events').select('*').order('date', { ascending: true }),
            supabase.from('members').select('*'),
            supabase.from('services').select('*'),
            supabase.from('aesfact').select('*').eq('id', 'aesfact').single()
        ]);

        if (config.data) config.data.forEach(item => {
            try {
                if (['valores', 'objetivos', 'objetivos_calidad'].includes(item.key)) dataStore[item.key] = JSON.parse(item.value);
                else dataStore[item.key] = item.value;
            } catch (e) {}
        });

        dataStore.news = news.data || [];
        dataStore.projects = projects.data || [];
        dataStore.events = events.data || [];
        dataStore.members = members.data || [];
        dataStore.services = services.data || [];
        if (aesfact.data) dataStore.aesfact = aesfact.data;

        if (dataStore.aesfact.image) dataStore.gallery.push(dataStore.aesfact.image);
        dataStore.news.forEach(n => { if (n.image) dataStore.gallery.push(n.image); });
        
        return dataStore;
    } catch (error) {
        console.error('Error leyendo datos:', error);
        return null;
    }
}

// ============================================================
// RENDERIZADO PÚBLICO
// ============================================================
async function renderPublic() {
    const data = await readData();
    if (!data) return;

    const txt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
    const htmlList = (id, arr) => {
        const el = document.getElementById(id);
        if (el) { el.innerHTML = ''; (arr || []).forEach(item => { const li = document.createElement('li'); li.textContent = item; el.appendChild(li); }); }
    };

    txt('mision', data.mision);
    txt('vision', data.vision);
    txt('politica', data.politica);
    htmlList('valores', data.valores);
    htmlList('objetivos', data.objetivos);
    htmlList('objetivos-calidad', data.objetivos_calidad);
    txt('aesfact-year', data.aesfact.year);
    const aesImg = document.getElementById('aesfact-image');
    if (aesImg) aesImg.src = data.aesfact.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%2304293a' width='1280' height='720'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='white'%3EAESFACT%3C/text%3E%3C/svg%3E";

    const renderCard = (id, items, fn) => { const el = document.getElementById(id); if(el) { el.innerHTML = ''; items.forEach(i => el.appendChild(fn(i))); } };
    renderCard('services-list', data.services, s => { const d = document.createElement('div'); d.className = 'card'; d.innerHTML = `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.desc)}</p>`; return d; });
    renderCard('events-list', data.events, e => { const d = document.createElement('div'); d.className = 'card'; d.innerHTML = `<h4>${escapeHtml(e.title)} <small class="muted">${e.date}</small></h4><p>${escapeHtml(e.desc)}</p>`; return d; });
    renderMembersByRole(data.members);
    renderCard('news-list', data.news, n => {
        const a = document.createElement('article'); a.className = 'card';
        const img = n.image ? `<img src="${n.image}" alt="Noticia">` : `<div style="height:200px;background:#04293a;display:flex;align-items:center;justify-content:center;color:white;">Sin imagen</div>`;
        a.innerHTML = `${img}<div class="news-content"><h4>${escapeHtml(n.title)}</h4><small>${n.date}</small><p>${escapeHtml(n.body.substring(0, 120))}...</p><a class="read-more" onclick="openNewsModal('${escapeHtml(n.title)}','${n.date}','${escapeHtml(n.body)}','${n.image||''}')">Leer más →</a></div>`; return a;
    });
    initCarousel(data.news.slice(0, 5));
    const gList = document.getElementById('gallery-list');
    if(gList) { gList.innerHTML = ''; data.gallery.forEach(img => { if(!img) return; const d = document.createElement('div'); d.className = 'gallery-item'; d.innerHTML = `<img src="${img}" onclick="openPhotoViewer('${img}')">`; gList.appendChild(d); }); }

    // Proyectos
    const pList = document.getElementById('projects-list-container') || document.getElementById('projects-list');
    if(pList) {
        pList.innerHTML = '';
        if (data.projects.length === 0) pList.innerHTML = '<div class="card"><p class="muted">No hay proyectos registrados aún.</p></div>';

        data.projects.forEach((p, index) => {
            const card = document.createElement('div'); 
            card.className = 'project-card-wide';
            
            let statusClass = 'curso';
            if (p.status === 'Terminado') statusClass = 'terminado';
            if (p.status === 'Cancelado') statusClass = 'cancelado';

            let galleryHtml = '';
            const images = p.gallery || []; 
            if(images.length > 0) {
                const sliderId = `proj-slider-${index}`;
                let slides = '';
                images.forEach((img, i) => {
                    slides += `<div class="project-slide ${i===0?'active':''}" data-index="${i}"><img src="${img}" onclick="openPhotoViewer('${img}')"></div>`;
                });
                const controls = images.length > 1 ? `<button class="p-nav prev" onclick="moveProjectSlide('${sliderId}', -1)">&#10094;</button><button class="p-nav next" onclick="moveProjectSlide('${sliderId}', 1)">&#10095;</button><div class="p-counter"><span id="${sliderId}-current">1</span>/${images.length}</div>` : '';
                galleryHtml = `<div class="project-gallery-wrapper" id="${sliderId}" data-total="${images.length}">${slides}${controls}</div>`;
            }

            let feedbackHtml = '';
            if ((p.status === 'Terminado' || p.status === 'Cancelado') && p.feedback) {
                const title = p.status === 'Terminado' ? '🏁 Conclusiones' : '⚠️ Motivo';
                feedbackHtml = `<div class="project-extra"><strong style="color:var(--blue-accent)">${title}</strong><p style="margin:5px 0 0 0; color:var(--muted)">${escapeHtml(p.feedback)}</p></div>`;
            }

            let participantsHtml = '';
            const parts = p.participants || [];
            if (p.status === 'Terminado' && parts.length > 0) {
                // AQUÍ: Se muestran las etiquetas con el rol
                participantsHtml = `<div style="margin-top:20px;"><small style="text-transform:uppercase;font-weight:bold;color:var(--blue-light);">Equipo participante</small><div style="margin-top:8px;">
                ${parts.map(part => {
                    const icon = part.type === 'member' ? '🎓' : '🤝';
                    const role = part.role ? `<span class="participant-role">${escapeHtml(part.role)}</span>` : '';
                    return `<span class="participant-tag">${icon} ${escapeHtml(part.name)} ${role}</span>`;
                }).join('')}
                </div></div>`;
            }

            card.innerHTML = `
                <div class="project-header">
                    <div><h3>${escapeHtml(p.title)}</h3><span class="project-date">📅 ${p.date || 'Fecha pendiente'}</span></div>
                    <span class="status-badge ${statusClass}">${p.status}</span>
                </div>
                <div class="project-body">
                    ${galleryHtml}
                    <div class="project-description">${escapeHtml(p.desc).replace(/\n/g, '<br>')}</div>
                    ${feedbackHtml} ${participantsHtml}
                </div>
            `;
            pList.appendChild(card);
        });
    }
}

window.moveProjectSlide = (sliderId, direction) => {
    const wrapper = document.getElementById(sliderId);
    if (!wrapper) return;
    const slides = wrapper.querySelectorAll('.project-slide');
    const total = slides.length;
    let currentIdx = 0;
    slides.forEach((slide, index) => { if (slide.classList.contains('active')) currentIdx = index; slide.classList.remove('active'); });
    let newIdx = currentIdx + direction;
    if (newIdx < 0) newIdx = total - 1;
    if (newIdx >= total) newIdx = 0;
    slides[newIdx].classList.add('active');
    const counter = document.getElementById(`${sliderId}-current`);
    if (counter) counter.textContent = newIdx + 1;
};

// ============================================================
// ADMIN PANEL
// ============================================================
const AUTHORIZED_USERS = [{u:'root@gmail.com',p:'admin123'}, {u:'Ryzen8',p:'Radeon2025'}];

function initAdmin() {
    document.getElementById('login-btn')?.addEventListener('click', () => {
        const u = document.getElementById('admin-email').value.trim();
        const p = document.getElementById('admin-pass').value.trim();
        if(AUTHORIZED_USERS.some(usr => usr.u === u && usr.p === p)) {
            sessionStorage.setItem('aesfact_session', 'active');
            toggleAdminView(true);
            loadAdminData();
            loadAdminLists();
            showAlert('Bienvenido', 'success');
        } else showAlert('Credenciales inválidas', 'error');
    });
    
    document.getElementById('logout-btn')?.addEventListener('click', () => { 
        sessionStorage.removeItem('aesfact_session'); 
        location.reload(); 
    });

    if(sessionStorage.getItem('aesfact_session') === 'active'){
        toggleAdminView(true);
        loadAdminData();
        loadAdminLists();
    }
    setupAdminListeners();
}

function toggleAdminView(isLoggedIn) {
    if(isLoggedIn) {
        document.getElementById('login-panel').classList.add('hidden');
        document.getElementById('public-admin-title').classList.add('hidden'); // Ocultar título login
        document.getElementById('admin-panel').classList.remove('hidden');
    }
}

async function loadAdminData() {
    const data = await readData();
    if (!data) return;
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
    setVal('edit-mision', data.mision); setVal('edit-vision', data.vision);
    setVal('edit-valores', data.valores.join('\n')); setVal('edit-politica', data.politica);
    setVal('edit-objetivos', data.objetivos.join('\n')); setVal('edit-objetivos-calidad', data.objetivos_calidad.join('\n'));
    setVal('aesfact-year', data.aesfact.year); setVal('aesfact-image-url', data.aesfact.image);
    setupProjectManager(data.members);
}

function setupAdminListeners() {
    document.getElementById('save-about')?.addEventListener('click', async () => {
        const getVal = id => document.getElementById(id)?.value || '';
        const getArr = id => getVal(id).split('\n').filter(Boolean);
        const updates = [{key:'mision',value:getVal('edit-mision')}, {key:'vision',value:getVal('edit-vision')}, {key:'politica',value:getVal('edit-politica')}, {key:'valores',value:JSON.stringify(getArr('edit-valores'))}, {key:'objetivos',value:JSON.stringify(getArr('edit-objetivos'))}, {key:'objetivos_calidad',value:JSON.stringify(getArr('edit-objetivos-calidad'))}];
        for(let u of updates) await supabase.from('config').upsert({key:u.key,value:u.value});
        showAlert('Guardado', 'success');
    });
    document.getElementById('save-aesfact')?.addEventListener('click', async () => {
        const y = document.getElementById('aesfact-year').value;
        let i = document.getElementById('aesfact-image-url').value;
        const f = document.getElementById('aesfact-image-file');
        if(f.files[0]) i = await uploadImageToStorage(f.files[0], 'aesfact') || i;
        await supabase.from('aesfact').upsert({id:'aesfact', year:y, image:i});
        showAlert('Guardado', 'success'); if(f) f.value = '';
    });
    setupCrud('news', 'news', ['title', 'body', 'date', 'image'], 'noticias');
    setupCrud('evt', 'events', ['title', 'desc', 'date'], 'eventos');
    setupCrud('mem', 'members', ['name', 'role', 'email', 'phone', 'photo'], 'integrantes');
    setupCrud('service', 'services', ['title', 'desc'], 'servicios');
}

function setupProjectManager(allMembers) {
    const statusSelect = document.getElementById('proj-status');
    const fbSection = document.getElementById('proj-feedback-section');
    const fbLabel = document.getElementById('proj-feedback-label');
    const partSection = document.getElementById('proj-participants-section');
    const memberSearch = document.getElementById('proj-member-search');
    const memberResults = document.getElementById('proj-member-results');
    const addExtBtn = document.getElementById('proj-add-external');
    const saveBtn = document.getElementById('add-proj');
    const cancelBtn = document.getElementById('cancel-proj');

    statusSelect.addEventListener('change', () => {
        const val = statusSelect.value;
        fbSection.classList.add('hidden'); partSection.classList.add('hidden');
        if (val === 'Terminado') { fbSection.classList.remove('hidden'); fbLabel.textContent = 'Conclusiones / Resultados:'; partSection.classList.remove('hidden'); }
        else if (val === 'Cancelado') { fbSection.classList.remove('hidden'); fbLabel.textContent = 'Motivo de cancelación:'; }
    });

    memberSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length < 2) { memberResults.style.display = 'none'; return; }
        const matches = allMembers.filter(m => m.name.toLowerCase().includes(term));
        memberResults.innerHTML = '';
        if (matches.length > 0) {
            matches.forEach(m => {
                const div = document.createElement('div');
                div.style.padding = '8px'; div.style.cursor = 'pointer'; div.style.borderBottom = '1px solid #eee'; div.textContent = `${m.name} (${m.role})`;
                div.onmouseover = () => div.style.background = '#f0f0f0'; div.onmouseout = () => div.style.background = 'white';
                div.onclick = () => { 
                    addParticipant({ id: m.id, name: m.name, role: m.role, type: 'member' }); 
                    memberSearch.value = ''; memberResults.style.display = 'none'; 
                };
                memberResults.appendChild(div);
            });
            memberResults.style.display = 'block';
        } else { memberResults.style.display = 'none'; }
    });

    addExtBtn.onclick = () => { const name = document.getElementById('proj-external-name').value.trim(); if (name) { addParticipant({ id: Date.now(), name: name, role: 'Externo', type: 'external' }); document.getElementById('proj-external-name').value = ''; } };

    window.addParticipant = (p) => { if (tempParticipants.some(x => x.name === p.name)) return; tempParticipants.push(p); renderParticipants(); };
    window.removeParticipant = (name) => { tempParticipants = tempParticipants.filter(p => p.name !== name); renderParticipants(); };

    function renderParticipants() {
        const list = document.getElementById('proj-participants-list'); list.innerHTML = '';
        tempParticipants.forEach(p => {
            const span = document.createElement('span');
            span.style.cssText = `padding: 5px 10px; border-radius: 15px; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; ${p.type === 'member' ? 'background: #e3f2fd; color: #0d47a1;' : 'background: #eeeeee; color: #444;'}`;
            // AQUÍ: Añadimos el rol al renderizado en el formulario
            span.innerHTML = `${p.name} <small style="opacity:0.7">(${p.role || ''})</small> <span onclick="removeParticipant('${p.name}')" style="cursor:pointer; font-weight:bold; margin-left:5px;">&times;</span>`;
            list.appendChild(span);
        });
    }

    saveBtn.onclick = async () => {
        saveBtn.disabled = true; saveBtn.textContent = 'Guardando...';
        const title = document.getElementById('proj-title').value;
        if (!title) { showAlert('Título requerido', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Guardar Proyecto'; return; }

        const fileInput = document.getElementById('proj-gallery-files');
        if (fileInput.files.length > 0) {
            showAlert('Subiendo imágenes nuevas...', 'info');
            for (let file of fileInput.files) {
                const url = await uploadImageToStorage(file, 'proyectos');
                if (url) tempGallery.push(url);
            }
        }

        const payload = {
            title: title, desc: document.getElementById('proj-desc').value,
            date: document.getElementById('proj-date').value, status: statusSelect.value,
            feedback: document.getElementById('proj-feedback').value,
            participants: tempParticipants, gallery: tempGallery
        };

        let error = null;
        if (currentEditId) { const res = await supabase.from('projects').update(payload).eq('id', currentEditId); error = res.error; }
        else { payload.id = uid(); const res = await supabase.from('projects').insert([payload]); error = res.error; }

        if (error) { console.error(error); showAlert('Error al guardar', 'error'); }
        else { showAlert('Guardado correctamente', 'success'); resetProjectForm(); loadAdminLists(); }
        saveBtn.disabled = false; saveBtn.textContent = 'Guardar Proyecto';
    };
    cancelBtn.onclick = resetProjectForm;
}

function resetProjectForm() {
    currentEditId = null;
    document.getElementById('proj-title').value = ''; document.getElementById('proj-desc').value = '';
    document.getElementById('proj-date').value = ''; document.getElementById('proj-status').value = 'En curso';
    document.getElementById('proj-feedback').value = ''; document.getElementById('proj-gallery-files').value = '';
    document.getElementById('proj-member-search').value = ''; document.getElementById('proj-external-name').value = '';
    document.getElementById('proj-feedback-section').classList.add('hidden');
    document.getElementById('proj-participants-section').classList.add('hidden');
    document.getElementById('add-proj').textContent = 'Guardar Proyecto';
    document.getElementById('cancel-proj').classList.add('hidden');
    document.getElementById('proj-gallery-preview').innerHTML = '';
    tempParticipants = []; tempGallery = [];
    const list = document.getElementById('proj-participants-list'); if(list) list.innerHTML = '';
}

function loadProjectToEdit(item) {
    currentEditId = item.id;
    document.getElementById('proj-title').value = item.title;
    document.getElementById('proj-desc').value = item.desc || '';
    document.getElementById('proj-date').value = item.date || '';
    const statusSelect = document.getElementById('proj-status');
    statusSelect.value = item.status || 'En curso';
    statusSelect.dispatchEvent(new Event('change'));
    document.getElementById('proj-feedback').value = item.feedback || '';
    
    tempParticipants = item.participants || [];
    const list = document.getElementById('proj-participants-list'); list.innerHTML = '';
    tempParticipants.forEach(p => {
        const span = document.createElement('span');
        span.style.cssText = `padding: 5px 10px; border-radius: 15px; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; ${p.type === 'member' ? 'background: #e3f2fd; color: #0d47a1;' : 'background: #eeeeee; color: #444;'}`;
        span.innerHTML = `${p.name} <small style="opacity:0.7">(${p.role || ''})</small> <span onclick="removeParticipant('${p.name}')" style="cursor:pointer; font-weight:bold; margin-left:5px;">&times;</span>`;
        list.appendChild(span);
    });

    tempGallery = item.gallery || [];
    renderAdminGalleryPreview();

    document.getElementById('add-proj').textContent = 'Actualizar Proyecto';
    document.getElementById('cancel-proj').classList.remove('hidden');
    document.getElementById('sec-projects').scrollIntoView({ behavior: 'smooth' });
}

function renderAdminGalleryPreview() {
    const preview = document.getElementById('proj-gallery-preview');
    if(!preview) return;
    preview.innerHTML = '';
    tempGallery.forEach((url, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; width: 80px; height: 80px;';
        const img = document.createElement('img'); img.src = url;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;';
        const btnDelete = document.createElement('button');
        btnDelete.innerHTML = '✕';
        btnDelete.style.cssText = 'position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
        btnDelete.onclick = (e) => {
            e.preventDefault();
            if(confirm('¿Quitar esta imagen?')) { tempGallery.splice(index, 1); renderAdminGalleryPreview(); }
        };
        wrapper.appendChild(img); wrapper.appendChild(btnDelete); preview.appendChild(wrapper);
    });
}

function setupCrud(prefix, table, fields, folderName) {
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);
    if (!addBtn) return;
    addBtn.addEventListener('click', async () => {
        const payload = {}; addBtn.disabled = true; addBtn.textContent = 'Procesando...';
        for (let f of fields) {
            const textEl = document.getElementById(`${prefix}-${f}`);
            const urlEl = document.getElementById(`${prefix}-${f}-url`);
            const fileEl = document.getElementById(`${prefix}-${f}-file`);
            if (fileEl?.files[0]) payload[f] = await uploadImageToStorage(fileEl.files[0], folderName);
            else if (urlEl) payload[f] = urlEl.value;
            else if (textEl) payload[f] = textEl.value;
        }
        if ((table === 'news' && !payload.title) || (table === 'members' && !payload.name)) { addBtn.disabled = false; addBtn.textContent = 'Guardar'; return showAlert('Faltan datos', 'error'); }
        const res = currentEditId ? await supabase.from(table).update(payload).eq('id', currentEditId) : await supabase.from(table).insert([{...payload, id: uid()}]);
        if (res.error) showAlert('Error', 'error'); else { showAlert('Guardado', 'success'); clearForm(prefix, fields); loadAdminLists(); }
        addBtn.disabled = false; addBtn.textContent = currentEditId ? 'Actualizar' : 'Agregar';
    });
    cancelBtn?.addEventListener('click', () => clearForm(prefix, fields));
}

function clearForm(prefix, fields) {
    currentEditId = null;
    fields.forEach(f => { if(document.getElementById(`${prefix}-${f}`)) document.getElementById(`${prefix}-${f}`).value = ''; if(document.getElementById(`${prefix}-${f}-url`)) document.getElementById(`${prefix}-${f}-url`).value = ''; if(document.getElementById(`${prefix}-${f}-file`)) document.getElementById(`${prefix}-${f}-file`).value = ''; });
    const add = document.getElementById(`add-${prefix}`); const can = document.getElementById(`cancel-${prefix}`);
    if(add) { add.textContent = 'Agregar'; add.classList.remove('pulse-animation'); }
    if(can) can.classList.add('hidden');
}

async function loadAdminLists() {
    const data = await readData(); if(!data) return;
    const searchInput = document.getElementById('search-mem');
    if (searchInput && !searchInput.dataset.listening) { searchInput.dataset.listening = "true"; searchInput.addEventListener('input', (e) => { const term = e.target.value.toLowerCase(); renderList('member-admin-list', data.members.filter(m => m.name.toLowerCase().includes(term)), 'name', 'members', 'mem', ['name', 'role', 'email', 'phone', 'photo']); }); }

    const renderList = (cid, items, label, table, pfx, flds) => {
        const c = document.getElementById(cid); if(!c) return; c.innerHTML = items.length ? '' : '<p class="muted" style="text-align:center;">Sin registros.</p>';
        items.forEach(item => {
            const div = document.createElement('div'); div.className = 'card'; div.style.cssText = 'padding:10px 15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';
            let thumb = ''; if((table==='members'||table==='news') && (item.photo||item.image)) thumb = `<img src="${item.photo||item.image}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;margin-right:10px;">`;
            div.innerHTML = `<div style="display:flex;align-items:center;">${thumb}<b>${escapeHtml(item[label])}</b></div><div><button class="btn edit-btn" style="padding:4px 8px;font-size:0.8rem;margin-right:5px;">✏️</button><button class="btn del-btn" style="padding:4px 8px;font-size:0.8rem;background:#d32f2f;">🗑️</button></div>`;
            div.querySelector('.del-btn').onclick = async () => { if(confirm('¿Borrar?')) await supabase.from(table).delete().eq('id', item.id); };
            div.querySelector('.edit-btn').onclick = () => {
                if (table === 'projects') loadProjectToEdit(item);
                else { currentEditId = item.id; flds.forEach(f => { if(document.getElementById(`${pfx}-${f}-url`)) document.getElementById(`${pfx}-${f}-url`).value = item[f]||''; else if(document.getElementById(`${pfx}-${f}`)) document.getElementById(`${pfx}-${f}`).value = item[f]||''; }); const add = document.getElementById(`add-${pfx}`); const can = document.getElementById(`cancel-${pfx}`); if(add) { add.textContent = 'Actualizar'; add.scrollIntoView({behavior:'smooth'}); add.classList.add('pulse-animation'); setTimeout(()=>add.classList.remove('pulse-animation'),1000); } if(can) can.classList.remove('hidden'); }
            };
            c.appendChild(div);
        });
    };
    renderList('news-admin-list', data.news, 'title', 'news', 'news', ['title', 'body', 'date', 'image']);
    renderList('event-admin-list', data.events, 'title', 'events', 'evt', ['title', 'desc', 'date']);
    renderList('service-admin-list', data.services, 'title', 'services', 'service', ['title', 'desc']);
    const st = searchInput ? searchInput.value.toLowerCase() : '';
    renderList('member-admin-list', st ? data.members.filter(m => m.name.toLowerCase().includes(st)) : data.members, 'name', 'members', 'mem', ['name', 'role', 'email', 'phone', 'photo']);
    renderList('proj-admin-list', data.projects, 'title', 'projects', 'proj', []);
}

function escapeHtml(t) { return t ? t.toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : ''; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function readFileAsDataURL(f) { return new Promise((r,j)=>{const d=new FileReader();d.onload=()=>r(d.result);d.onerror=j;d.readAsDataURL(f);}); }
function showAlert(m,t) { const d=document.createElement('div');d.className=`toast show ${t||''}`;d.textContent=m;document.body.appendChild(d);setTimeout(()=>{d.classList.remove('show');setTimeout(()=>d.remove(),500)},3000); }
function bindContact() { const f=document.getElementById('contact-form');if(f)f.onsubmit=async e=>{e.preventDefault();await supabase.from('contacts').insert([{id:uid(),name:f['contact-name'].value,email:f['contact-email'].value,phone:f['contact-phone'].value,message:f['contact-message'].value}]);showAlert('Enviado','success');f.reset();};}
function bindSidebar() { const b=document.getElementById('sidebar-toggle'),s=document.getElementById('sidebar'),o=document.getElementById('sidebar-overlay'); if(b)b.onclick=()=>{s.classList.add('open');o.classList.add('open');};if(o)o.onclick=()=>{s.classList.remove('open');o.classList.remove('open');};}
function renderNav() { const n=document.getElementById('sidebar-nav'); if(!n)return; const l=[{t:'Inicio',h:'index.html'},{t:'Nosotros',h:'about.html'},{t:'Servicios',h:'services.html'},{t:'Proyectos',h:'projects.html'},{t:'Eventos',h:'events.html'},{t:'Noticias',h:'news.html'},{t:'Galería',h:'gallery.html'},{t:'Integrantes',h:'members.html'},{t:'Contacto',h:'contact.html'}]; n.innerHTML=''; l.forEach(i=>{const a=document.createElement('a');a.href=i.h;a.textContent=i.t;if(location.pathname.includes(i.h))a.classList.add('active');n.appendChild(a)}); }
function renderSidebar(){renderNav()}
function initCarousel(n){const c=document.getElementById('news-carousel');if(!c)return;if(!n.length){c.innerHTML='<div class="card"><p class="muted">Sin noticias.</p></div>';return}c.innerHTML='';const ct=document.createElement('div');ct.className='carousel-slides';n.forEach((x,i)=>{const s=document.createElement('div');s.className=`carousel-slide ${i===0?'active':''}`;s.style.backgroundImage=x.image?`url('${x.image}')`:'linear-gradient(135deg,#04293a,#0d5d9e)';s.innerHTML=`<div class="carousel-caption"><div class="content"><h3>${escapeHtml(x.title)}</h3><small>${x.date}</small></div></div>`;ct.appendChild(s)});c.appendChild(ct);let idx=0;setInterval(()=>{ct.children[idx].classList.remove('active');idx=(idx+1)%ct.children.length;ct.children[idx].classList.add('active')},5000)}
function openPhotoViewer(s){const p=document.getElementById('photo-viewer'),i=document.getElementById('photo-viewer-img');if(p&&i){i.src=s;p.classList.add('open')}}
function openNewsModal(t,d,b,i){const m=document.getElementById('news-modal'),mb=document.getElementById('news-modal-body');if(!m||!mb)return;mb.innerHTML=`<div style="display:flex;flex-direction:column;gap:16px;">${i?`<img src="${i}" style="width:100%;height:300px;object-fit:cover;border-radius:12px;">`:''}<div><h2 style="color:var(--blue-accent);margin:0 0 8px 0;">${escapeHtml(t)}</h2><small style="color:var(--accent);font-weight:600;">${d}</small></div><div style="color:var(--blue-accent);line-height:1.8;">${escapeHtml(b).replace(/\n/g,'<br>')}</div></div>`;m.classList.remove('hidden')}
function closeNewsModal(){document.getElementById('news-modal')?.classList.add('hidden')}
function bindNewsModal(){document.getElementById('news-modal')?.addEventListener('click',e=>{if(e.target===document.getElementById('news-modal'))closeNewsModal()})}
function renderMembersByRole(m){const c=document.getElementById('members-list');if(!c)return;c.innerHTML='';const q=[{title:'Presidente y Vicepresidenta',roles:['Presidente','Presidenta','Vicepresidente','Vicepresidenta','Vicepresedenta']},{title:'Logística',roles:['Logistica','Logística']},{title:'Publirelacionista',roles:['Publirelacionista','Relaciones Públicas','Relaciones Publicas']},{title:'Tesorería',roles:['Tesorero','Tesorería','Tesorera']},{title:'Secretaria',roles:['Secretaria','Secretario']},{title:'Vocales',roles:['Vocal','Vocales']},{title:'Colaboradores',roles:['Colaborador','Colaboradores']}];const cr=(x)=>{const d=document.createElement('div');d.className='member-card';const i=x.photo||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='220' height='220' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";d.innerHTML=`<img src="${i}" onclick="openPhotoViewer('${i}')"><div><h4>${escapeHtml(x.name)}</h4><p class="muted">${escapeHtml(x.role)}</p><p>${escapeHtml(x.email)}</p></div>`;return d};const norm=r=>(r||'').trim().toLowerCase();const u=new Set();q.forEach(g=>{const s=document.createElement('section');s.className='card quadrant';s.innerHTML=`<h3>${g.title}</h3>`;const d=document.createElement('div');d.className='quadrant-grid';const mat=m.filter(x=>g.roles.map(norm).includes(norm(x.role)));mat.forEach(x=>{d.appendChild(cr(x));u.add(x.id)});if(mat.length)s.appendChild(d);if(mat.length)c.appendChild(s)});const oth=m.filter(x=>!u.has(x.id));if(oth.length){const s=document.createElement('section');s.className='card quadrant';s.innerHTML=`<h3>Otros</h3>`;const d=document.createElement('div');d.className='quadrant-grid';oth.forEach(x=>d.appendChild(cr(x)));s.appendChild(d);c.appendChild(s)}}