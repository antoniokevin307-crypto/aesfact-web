// app.js - VERSIÓN FINAL: STORAGE CON CARPETAS + MULTI-ADMIN
// ============================================================

const SUPABASE_URL = 'https://yhikslflzazeodazxpyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWtzbGZsemF6ZW9kYXp4cHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDg1NTUsImV4cCI6MjA4NTk4NDU1NX0.H5T_YmsetExRyy5DjwbEFvMi4D6GzImEOFcOZL0Pwxk';

let supabase = null;
let currentEditId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando AESFACT App Pro...');
    await initSupabase();
    await renderPublic(); 
    
    // Funciones de UI
    bindSidebar();
    renderNav();
    bindContact();
    bindNewsModal();
    
    // Inicializar Admin si estamos en la página correcta
    if (document.body.classList.contains('admin')) {
        initAdmin();
    }
});

async function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase conectado');
        setupRealtime();
    } else {
        console.error('❌ Librería Supabase no encontrada.');
        showAlert('Error crítico: No hay conexión con la base de datos.', 'error');
    }
}

function setupRealtime() {
    if (!supabase) return;
    supabase.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            console.log('🔄 Cambio detectado:', payload);
            renderPublic();
            if (document.body.classList.contains('admin') && !document.getElementById('admin-panel').classList.contains('hidden')) {
                loadAdminLists();
            }
        })
        .subscribe();
}

// -------------------------------------------------------------
// FUNCIÓN DE SUBIDA CON CARPETAS (CORE)
// -------------------------------------------------------------
async function uploadImageToStorage(file, folderName) {
    try {
        // 1. Limpiar nombre del archivo
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
        const timestamp = Date.now();
        // 2. Ruta: carpeta/timestamp_nombre.jpg
        const filePath = `${folderName}/${timestamp}_${cleanName}`;

        console.log(`Subiendo a bucket media: ${filePath}`);

        // 3. Subir al bucket 'media'
        const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // 4. Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        showAlert('Error al subir imagen. Revisa tu conexión.', 'error');
        return null;
    }
}

// ============================================================
// LECTURA DE DATOS (READ)
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

        if (config.data) {
            config.data.forEach(item => {
                try {
                    if (['valores', 'objetivos', 'objetivos_calidad'].includes(item.key)) {
                        dataStore[item.key] = JSON.parse(item.value);
                    } else {
                        dataStore[item.key] = item.value;
                    }
                } catch (e) { console.warn(`Error parseando ${item.key}`, e); }
            });
        }

        dataStore.news = news.data || [];
        dataStore.projects = projects.data || [];
        dataStore.events = events.data || [];
        dataStore.members = members.data || [];
        dataStore.services = services.data || [];
        if (aesfact.data) dataStore.aesfact = aesfact.data;

        // Construir Galería automáticamente desde las URLs
        if (dataStore.aesfact.image) dataStore.gallery.push(dataStore.aesfact.image);
        dataStore.news.forEach(n => { if (n.image) dataStore.gallery.push(n.image); });
        
        return dataStore;

    } catch (error) {
        console.error('Error leyendo datos:', error);
        return null;
    }
}

// ============================================================
// RENDERIZADO PÚBLICO (UI)
// ============================================================

async function renderPublic() {
    const data = await readData();
    if (!data) return;

    const txt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
    const htmlList = (id, arr) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '';
            (arr || []).forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                el.appendChild(li);
            });
        }
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

    // Helpers de renderizado
    const renderCardList = (id, items, templateFn) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '';
            items.forEach(item => el.appendChild(templateFn(item)));
        }
    };

    renderCardList('services-list', data.services, (s) => {
        const div = document.createElement('div'); div.className = 'card';
        div.innerHTML = `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.desc)}</p>`; return div;
    });

    renderCardList('projects-list', data.projects, (p) => {
        const div = document.createElement('div'); div.className = 'card';
        div.innerHTML = `<h4>${escapeHtml(p.title)} <small class="muted">${p.status} • ${p.date}</small></h4><p>${escapeHtml(p.desc)}</p>`; return div;
    });

    renderCardList('events-list', data.events, (e) => {
        const div = document.createElement('div'); div.className = 'card';
        div.innerHTML = `<h4>${escapeHtml(e.title)} <small class="muted">${e.date}</small></h4><p>${escapeHtml(e.desc)}</p>`; return div;
    });

    renderMembersByRole(data.members);

    renderCardList('news-list', data.news, (n) => {
        const article = document.createElement('article'); article.className = 'card';
        const newsContent = document.createElement('div'); newsContent.className = 'news-content';
        
        if (n.image) {
            const img = document.createElement('img'); img.src = n.image; img.alt = 'Noticia';
            article.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'width:100%;height:200px;background:linear-gradient(135deg,#04293a,#0d5d9e);display:flex;align-items:center;justify-content:center;color:white;font-size:0.9rem;';
            placeholder.textContent = 'Sin imagen';
            article.appendChild(placeholder);
        }
        
        newsContent.innerHTML = `<h4>${escapeHtml(n.title)}</h4><small>${n.date}</small><p>${escapeHtml(n.body.substring(0, 120))}</p>`;
        const readMoreLink = document.createElement('a'); readMoreLink.className = 'read-more'; readMoreLink.textContent = 'Leer más →';
        readMoreLink.style.cursor = 'pointer';
        readMoreLink.addEventListener('click', () => openNewsModal(n.title, n.date, n.body, n.image || ''));
        newsContent.appendChild(readMoreLink);
        article.appendChild(newsContent);
        return article;
    });

    initCarousel(data.news.slice(0, 5));

    const galleryList = document.getElementById('gallery-list');
    if (galleryList) {
        galleryList.innerHTML = '';
        data.gallery.forEach(img => {
            if (!img) return;
            const div = document.createElement('div'); div.className = 'gallery-item';
            div.innerHTML = `<img src="${img}" onclick="openPhotoViewer('${img}')">`;
            galleryList.appendChild(div);
        });
    }
}

// ============================================================
// ADMIN PANEL (MULTIUSUARIO + STORAGE)
// ============================================================

// Definición de usuarios autorizados
const AUTHORIZED_USERS = [
    { u: 'root@gmail.com', p: 'admin123' }, // Usuario por defecto
    { u: 'Ryzen8', p: 'Radeon2025' }        // Usuario secundario solicitado
];

function initAdmin() {
    document.getElementById('login-btn')?.addEventListener('click', () => {
        const inputUser = document.getElementById('admin-email').value.trim(); // Usamos el campo email para usuario/email
        const inputPass = document.getElementById('admin-pass').value.trim();
        
        // Verificar credenciales
        const isValid = AUTHORIZED_USERS.some(user => user.u === inputUser && user.p === inputPass);

        if (isValid) {
            // Guardar sesión simple
            sessionStorage.setItem('aesfact_session', 'active');
            document.getElementById('login-panel').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            loadAdminData();
            loadAdminLists();
            showAlert('Bienvenido Administrador', 'success');
        } else {
            showAlert('Credenciales incorrectas', 'error');
        }
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem('aesfact_session');
        location.reload();
    });

    // Check sesión previa (opcional, para no loguearse cada refresh)
    if(sessionStorage.getItem('aesfact_session') === 'active'){
        document.getElementById('login-panel').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadAdminData();
        loadAdminLists();
    }

    setupAdminListeners();
}

async function loadAdminData() {
    const data = await readData();
    if (!data) return;
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
    setVal('edit-mision', data.mision);
    setVal('edit-vision', data.vision);
    setVal('edit-valores', data.valores.join('\n'));
    setVal('edit-politica', data.politica);
    setVal('edit-objetivos', data.objetivos.join('\n'));
    setVal('edit-objetivos-calidad', data.objetivos_calidad.join('\n'));
    setVal('aesfact-year', data.aesfact.year);
    setVal('aesfact-image-url', data.aesfact.image);
}

function setupAdminListeners() {
    // Guardar Configuración
    document.getElementById('save-about')?.addEventListener('click', async () => {
        const getVal = (id) => document.getElementById(id)?.value || '';
        const getArr = (id) => getVal(id).split('\n').filter(Boolean);
        const updates = [
            { key: 'mision', value: getVal('edit-mision') },
            { key: 'vision', value: getVal('edit-vision') },
            { key: 'politica', value: getVal('edit-politica') },
            { key: 'valores', value: JSON.stringify(getArr('edit-valores')) },
            { key: 'objetivos', value: JSON.stringify(getArr('edit-objetivos')) },
            { key: 'objetivos_calidad', value: JSON.stringify(getArr('edit-objetivos-calidad')) }
        ];
        for (let up of updates) await supabase.from('config').upsert({ key: up.key, value: up.value });
        showAlert('Información guardada', 'success');
    });

    // Guardar AESFACT (Carpeta: aesfact)
    document.getElementById('save-aesfact')?.addEventListener('click', async () => {
        const year = document.getElementById('aesfact-year').value;
        let image = document.getElementById('aesfact-image-url').value;
        const fileInput = document.getElementById('aesfact-image-file');

        if (fileInput.files[0]) {
            showAlert('Subiendo imagen...', 'info');
            const url = await uploadImageToStorage(fileInput.files[0], 'aesfact');
            if(url) image = url;
        }
        
        const { error } = await supabase.from('aesfact').upsert({ id: 'aesfact', year, image });
        if (error) showAlert('Error guardando', 'error');
        else {
            showAlert('Guardado exitoso', 'success');
            if(fileInput) fileInput.value = '';
        }
    });

    // Inicializar CRUDs con su carpeta correspondiente
    setupCrud('news', 'news', ['title', 'body', 'date', 'image'], 'noticias');
    setupCrud('proj', 'projects', ['title', 'desc', 'date', 'status'], 'proyectos');
    setupCrud('evt', 'events', ['title', 'desc', 'date'], 'eventos');
    setupCrud('mem', 'members', ['name', 'role', 'email', 'phone', 'photo'], 'integrantes');
    setupCrud('service', 'services', ['title', 'desc'], 'servicios');
}

// FUNCIÓN CRUD CON SOPORTE DE FOLDERS
function setupCrud(prefix, table, fields, folderName) {
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);
    if (!addBtn) return;

    addBtn.addEventListener('click', async () => {
        const payload = {};
        let uploadSuccess = true;

        // Deshabilitar botón durante proceso
        addBtn.disabled = true;
        const originalText = addBtn.textContent;
        addBtn.textContent = 'Procesando...';

        for (let f of fields) {
            let textId = `${prefix}-${f}`;
            let urlId = `${prefix}-${f}-url`;
            let fileId = `${prefix}-${f}-file`;
            const textEl = document.getElementById(textId);
            const urlEl = document.getElementById(urlId);
            const fileEl = document.getElementById(fileId);

            if (fileEl && fileEl.files && fileEl.files[0]) {
                showAlert('Subiendo imagen a la nube...', 'info');
                // SUBIDA A STORAGE (BUCKET)
                const url = await uploadImageToStorage(fileEl.files[0], folderName);
                if (url) {
                    payload[f] = url;
                } else {
                    uploadSuccess = false;
                }
            } else if (urlEl) {
                payload[f] = urlEl.value;
            } else if (textEl) {
                payload[f] = textEl.value;
            }
        }

        if (!uploadSuccess) {
            addBtn.disabled = false;
            addBtn.textContent = originalText;
            return showAlert('Falló la subida de imagen', 'error');
        }

        if ((table === 'news' && !payload.title) || (table === 'members' && !payload.name) || (table === 'projects' && !payload.title)) {
            addBtn.disabled = false;
            addBtn.textContent = originalText;
            return showAlert('Faltan datos obligatorios', 'error');
        }

        let error = null;
        if (currentEditId) {
            const res = await supabase.from(table).update(payload).eq('id', currentEditId);
            error = res.error;
            showAlert('Actualizado correctamente', 'success');
        } else {
            payload.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            const res = await supabase.from(table).insert([payload]);
            error = res.error;
            showAlert('Agregado correctamente', 'success');
        }

        addBtn.disabled = false;
        addBtn.textContent = originalText;
        
        if (error) {
            console.error('Error Supabase:', error);
            showAlert('Hubo un error al guardar', 'error');
        } else {
            clearForm(prefix, fields);
            loadAdminLists();
        }
    });

    cancelBtn?.addEventListener('click', () => {
        clearForm(prefix, fields);
        showAlert('Cancelado', 'info');
    });
}

function clearForm(prefix, fields) {
    currentEditId = null;
    fields.forEach(f => {
        const el = document.getElementById(`${prefix}-${f}`); if(el) el.value = '';
        const elUrl = document.getElementById(`${prefix}-${f}-url`); if(elUrl) elUrl.value = '';
        const elFile = document.getElementById(`${prefix}-${f}-file`); if(elFile) elFile.value = '';
    });
    
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);
    if(addBtn) {
        addBtn.textContent = 'Agregar';
        addBtn.classList.remove('pulse-animation');
    }
    if(cancelBtn) cancelBtn.classList.add('hidden');
}

async function loadAdminLists() {
    const data = await readData();
    if(!data) return;

    const renderList = (cid, items, label, table, pfx, flds) => {
        const c = document.getElementById(cid); if(!c) return;
        c.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.padding = '10px 15px'; div.style.marginBottom = '10px'; div.style.display = 'flex'; div.style.justifyContent = 'space-between'; div.style.alignItems = 'center';
            div.innerHTML = `<span style="font-weight:600">${escapeHtml(item[label])}</span><div style="display:flex; gap:8px;"><button class="btn edit-btn" style="padding:4px 10px; font-size:0.8rem; background:var(--blue-light)">✏️</button><button class="btn muted del-btn" style="padding:4px 10px; font-size:0.8rem; background:#d32f2f">🗑️</button></div>`;
            
            div.querySelector('.del-btn').addEventListener('click', async () => { 
                if(confirm('¿Eliminar permanentemente?')) {
                    await supabase.from(table).delete().eq('id', item.id);
                    showAlert('Eliminado', 'success');
                }
            });
            
            div.querySelector('.edit-btn').addEventListener('click', () => {
                currentEditId = item.id;
                flds.forEach(f => {
                    const el = document.getElementById(`${pfx}-${f}`);
                    const elUrl = document.getElementById(`${pfx}-${f}-url`);
                    if(elUrl) elUrl.value = item[f] || '';
                    else if(el) el.value = item[f] || '';
                });
                const addBtn = document.getElementById(`add-${pfx}`);
                const cancelBtn = document.getElementById(`cancel-${pfx}`);
                if(addBtn) { addBtn.textContent = 'Actualizar'; addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                if(cancelBtn) cancelBtn.classList.remove('hidden');
            });
            c.appendChild(div);
        });
    };

    renderList('news-admin-list', data.news, 'title', 'news', 'news', ['title', 'body', 'date', 'image']);
    renderList('proj-admin-list', data.projects, 'title', 'projects', 'proj', ['title', 'desc', 'date', 'status']);
    renderList('event-admin-list', data.events, 'title', 'events', 'evt', ['title', 'desc', 'date']);
    renderList('member-admin-list', data.members, 'name', 'members', 'mem', ['name', 'role', 'email', 'phone', 'photo']);
    renderList('service-admin-list', data.services, 'title', 'services', 'service', ['title', 'desc']);
}

// ============================================================
// UTILIDADES (HELPERS)
// ============================================================

function escapeHtml(text) { if (!text) return ''; return text.toString().replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function readFileAsDataURL(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
function showAlert(msg, type) { const t = document.createElement('div'); t.className = `toast show ${type || ''}`; t.textContent = msg; document.body.appendChild(t); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000); }
function bindContact() { const f = document.getElementById('contact-form'); if(!f) return; f.addEventListener('submit', async e => { e.preventDefault(); const d = { id: uid(), name: document.getElementById('contact-name').value, email: document.getElementById('contact-email').value, phone: document.getElementById('contact-phone').value, message: document.getElementById('contact-message').value }; await supabase.from('contacts').insert([d]); showAlert('Enviado', 'success'); f.reset(); }); }
function bindSidebar() { const b = document.getElementById('sidebar-toggle'), s = document.getElementById('sidebar'), o = document.getElementById('sidebar-overlay'); if (b) b.addEventListener('click', () => { s.classList.add('open'); o.classList.add('open'); }); if (o) o.addEventListener('click', () => { s.classList.remove('open'); o.classList.remove('open'); }); }
function renderNav() { const n = document.getElementById('sidebar-nav'); if (!n) return; const l = [{ t: 'Inicio', h: 'index.html' }, { t: 'Nosotros', h: 'about.html' }, { t: 'Servicios', h: 'services.html' }, { t: 'Proyectos', h: 'projects.html' }, { t: 'Eventos', h: 'events.html' }, { t: 'Noticias', h: 'news.html' }, { t: 'Galería', h: 'gallery.html' }, { t: 'Integrantes', h: 'members.html' }, { t: 'Contacto', h: 'contact.html' }]; n.innerHTML = ''; l.forEach(i => { const a = document.createElement('a'); a.href = i.h; a.textContent = i.t; if(location.pathname.includes(i.h)) a.classList.add('active'); n.appendChild(a); }); }
function renderSidebar() { renderNav(); }
function initCarousel(news) { const c = document.getElementById('news-carousel'); if (!c) return; if (news.length === 0) { c.innerHTML = '<div class="card"><p class="muted">No hay noticias destacadas.</p></div>'; return; } c.innerHTML = ''; const ct = document.createElement('div'); ct.className = 'carousel-slides'; news.forEach((n, i) => { const s = document.createElement('div'); s.className = `carousel-slide ${i === 0 ? 'active' : ''}`; s.style.backgroundImage = n.image ? `url('${n.image}')` : 'linear-gradient(135deg, #04293a, #0d5d9e)'; s.innerHTML = `<div class="carousel-caption"><div class="content"><h3>${escapeHtml(n.title)}</h3><small>${n.date}</small><p>${escapeHtml(n.body.substring(0, 100))}...</p></div></div>`; ct.appendChild(s); }); c.appendChild(ct); let x = 0; const sl = ct.children; setInterval(() => { sl[x].classList.remove('active'); x = (x + 1) % sl.length; sl[x].classList.add('active'); }, 5000); }
function openPhotoViewer(s) { const p = document.getElementById('photo-viewer'), i = document.getElementById('photo-viewer-img'); if (p && i) { i.src = s; p.classList.add('open'); } }
function openNewsModal(t, d, b, i) { const m = document.getElementById('news-modal'), mb = document.getElementById('news-modal-body'); if (!m || !mb) return; mb.innerHTML = `<div style="display:flex;flex-direction:column;gap:16px;">${i ? `<img src="${i}" style="width:100%;height:300px;object-fit:cover;border-radius:12px;">` : ''}<div><h2 style="color:var(--blue-accent);margin:0 0 8px 0;">${escapeHtml(t)}</h2><small style="color:var(--accent);font-weight:600;">${d}</small></div><div style="color:var(--blue-accent);line-height:1.8;">${escapeHtml(b).replace(/\n/g, '<br>')}</div></div>`; m.classList.remove('hidden'); }
function closeNewsModal() { document.getElementById('news-modal')?.classList.add('hidden'); }
function bindNewsModal() { document.getElementById('news-modal')?.addEventListener('click', e => { if (e.target === document.getElementById('news-modal')) closeNewsModal(); }); }
function renderMembersByRole(m){const c=document.getElementById('members-list');if(!c)return;c.innerHTML='';const q=[{title:'Presidente y Vicepresidenta',roles:['Presidente','Presidenta','Vicepresidente','Vicepresidenta','Vicepresedenta']},{title:'Logística',roles:['Logistica','Logística']},{title:'Publirelacionista',roles:['Publirelacionista','Relaciones Públicas','Relaciones Publicas']},{title:'Tesorería',roles:['Tesorero','Tesorería','Tesorera']},{title:'Secretaria',roles:['Secretaria','Secretario']},{title:'Vocales',roles:['Vocal','Vocales']},{title:'Colaboradores',roles:['Colaborador','Colaboradores']}];const createCard=x=>{const d=document.createElement('div');d.className='member-card';const i=x.photo||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='220' height='220' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";d.innerHTML=`<img src="${i}" onclick="openPhotoViewer('${i}')"><div><h4>${escapeHtml(x.name)}</h4><p class="muted">${escapeHtml(x.role)}</p><p>${escapeHtml(x.email)}</p><p class="muted">${escapeHtml(x.phone||'')}</p></div>`;return d};const norm=r=>(r||'').trim().toLowerCase();const u=new Set();q.forEach(grp=>{const sec=document.createElement('section');sec.className='card quadrant';sec.innerHTML=`<h3>${grp.title}</h3>`;const g=document.createElement('div');g.className='quadrant-grid';const match=m.filter(x=>grp.roles.map(norm).includes(norm(x.role)));match.forEach(x=>{g.appendChild(createCard(x));u.add(x.id)});if(match.length===0){const p=document.createElement('p');p.className='muted';p.textContent='No hay registros.';g.appendChild(p)}sec.appendChild(g);c.appendChild(sec)});const oth=m.filter(x=>!u.has(x.id));if(oth.length){const sec=document.createElement('section');sec.className='card quadrant';sec.innerHTML=`<h3>Otros</h3>`;const g=document.createElement('div');g.className='quadrant-grid';oth.forEach(x=>g.appendChild(createCard(x)));sec.appendChild(g);c.appendChild(sec)}}