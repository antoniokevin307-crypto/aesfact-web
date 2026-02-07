// app.js - Gestión completa con Supabase (CORREGIDO Y ROBUSTO)
// ============================================================

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://yhikslflzazeodazxpyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWtzbGZsemF6ZW9kYXp4cHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDg1NTUsImV4cCI6MjA4NTk4NDU1NX0.H5T_YmsetExRyy5DjwbEFvMi4D6GzImEOFcOZL0Pwxk';

let supabase = null;
let currentEditId = null; // Variable global para controlar edición

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando AESFACT App...');
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
        showAlert('Error: No se pudo conectar a la base de datos', 'error');
    }
}

function setupRealtime() {
    if (!supabase) return;
    supabase.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            console.log('🔄 Cambio detectado en BD:', payload);
            renderPublic();
            if (document.body.classList.contains('admin') && !document.getElementById('admin-panel').classList.contains('hidden')) {
                loadAdminLists();
            }
        })
        .subscribe();
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
        // Carga paralela para mayor velocidad
        const [config, news, projects, events, members, services, aesfact] = await Promise.all([
            supabase.from('config').select('*'),
            supabase.from('news').select('*').order('date', { ascending: false }),
            supabase.from('projects').select('*').order('date', { ascending: false }),
            supabase.from('events').select('*').order('date', { ascending: true }),
            supabase.from('members').select('*'),
            supabase.from('services').select('*'),
            supabase.from('aesfact').select('*').eq('id', 'aesfact').single()
        ]);

        // Procesar Configuración
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

        // Construir Galería
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
    if (aesImg && data.aesfact.image) aesImg.src = data.aesfact.image;
    else if(aesImg) aesImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%2304293a' width='1280' height='720'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='white'%3EAESFACT%3C/text%3E%3C/svg%3E";

    // Renderizar Secciones (con validación de existencia)
    const renderCardList = (id, items, templateFn) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '';
            items.forEach(item => el.appendChild(templateFn(item)));
        }
    };

    renderCardList('services-list', data.services, (s) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.desc)}</p>`;
        return div;
    });

    renderCardList('projects-list', data.projects, (p) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h4>${escapeHtml(p.title)} <small class="muted">${p.status} • ${p.date}</small></h4><p>${escapeHtml(p.desc)}</p>`;
        return div;
    });

    renderCardList('events-list', data.events, (e) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h4>${escapeHtml(e.title)} <small class="muted">${e.date}</small></h4><p>${escapeHtml(e.desc)}</p>`;
        return div;
    });

    // Render members grouped by the requested quadrant hierarchy
    renderMembersByRole(data.members);

    renderCardList('news-list', data.news, (n) => {
        const article = document.createElement('article');
        article.className = 'card';
        const newsContent = document.createElement('div');
        newsContent.className = 'news-content';
        
        if (n.image) {
            const img = document.createElement('img');
            img.src = n.image;
            img.alt = 'Noticia';
            article.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'width:100%;height:200px;background:linear-gradient(135deg,#04293a,#0d5d9e);display:flex;align-items:center;justify-content:center;color:white;font-size:0.9rem;';
            placeholder.textContent = 'Sin imagen';
            article.appendChild(placeholder);
        }
        
        newsContent.innerHTML = `
            <h4>${escapeHtml(n.title)}</h4>
            <small>${n.date}</small>
            <p>${escapeHtml(n.body.substring(0, 120))}</p>
        `;
        
        const readMoreLink = document.createElement('a');
        readMoreLink.className = 'read-more';
        readMoreLink.textContent = 'Leer más →';
        readMoreLink.style.cursor = 'pointer';
        readMoreLink.addEventListener('click', () => {
            openNewsModal(n.title, n.date, n.body, n.image || '');
        });
        
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
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `<img src="${img}" onclick="openPhotoViewer('${img}')">`;
            galleryList.appendChild(div);
        });
    }
}

// ============================================================
// ADMIN PANEL (LOGICA CORREGIDA)
// ============================================================

const ADMIN_PASS_KEY = 'aesfact_admin_pass_v1';
const ADMIN_EMAIL_KEY = 'aesfact_admin_email_v1';

function initAdmin() {
    if (!localStorage.getItem(ADMIN_PASS_KEY)) localStorage.setItem(ADMIN_PASS_KEY, 'admin123');
    if (!localStorage.getItem(ADMIN_EMAIL_KEY)) localStorage.setItem(ADMIN_EMAIL_KEY, 'root@gmail.com');

    document.getElementById('login-btn')?.addEventListener('click', () => {
        const pass = document.getElementById('admin-pass').value;
        const email = document.getElementById('admin-email').value;
        if (pass === localStorage.getItem(ADMIN_PASS_KEY) && email === localStorage.getItem(ADMIN_EMAIL_KEY)) {
            document.getElementById('login-panel').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            loadAdminData();
            loadAdminLists();
        } else {
            showAlert('Credenciales incorrectas', 'error');
        }
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => location.reload());
    setupAdminListeners();
}

async function loadAdminData() {
    const data = await readData();
    if (!data) return;
    
    // Helpers seguros
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
    // Guardar Configuración General
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

    // Guardar AESFACT
    document.getElementById('save-aesfact')?.addEventListener('click', async () => {
        const year = document.getElementById('aesfact-year').value;
        let image = document.getElementById('aesfact-image-url').value;
        const fileInput = document.getElementById('aesfact-image-file');

        if (fileInput.files[0]) image = await readFileAsDataURL(fileInput.files[0]);
        
        const { error } = await supabase.from('aesfact').upsert({ id: 'aesfact', year, image });
        if (error) showAlert('Error guardando', 'error');
        else {
            showAlert('Guardado exitoso', 'success');
            if(fileInput) fileInput.value = '';
        }
    });

    // Inicializar CRUDs con verificación
    // prefix, table, fields
    setupCrud('news', 'news', ['title', 'body', 'date', 'image']);
    setupCrud('proj', 'projects', ['title', 'desc', 'date', 'status']);
    setupCrud('evt', 'events', ['title', 'desc', 'date']);
    setupCrud('mem', 'members', ['name', 'role', 'email', 'phone', 'photo']);
    setupCrud('service', 'services', ['title', 'desc']);
}

// FUNCIÓN CRUD CORREGIDA Y ROBUSTA
function setupCrud(prefix, table, fields) {
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);

    // Validación de existencia de botones en el HTML
    if (!addBtn) {
        console.warn(`⚠️ Advertencia: No se encontró el botón con ID "add-${prefix}". Revisa tu admin.html`);
        return;
    }

    addBtn.addEventListener('click', async () => {
        const payload = {};
        let missingField = false;

        for (let f of fields) {
            // Determinar IDs posibles
            let textId = `${prefix}-${f}`;
            let urlId = `${prefix}-${f}-url`;
            let fileId = `${prefix}-${f}-file`;

            const textEl = document.getElementById(textId);
            const urlEl = document.getElementById(urlId);
            const fileEl = document.getElementById(fileId);

            // Prioridad: Archivo > URL > Input Texto Normal
            if (fileEl && fileEl.files && fileEl.files[0]) {
                payload[f] = await readFileAsDataURL(fileEl.files[0]);
            } else if (urlEl) {
                payload[f] = urlEl.value;
            } else if (textEl) {
                payload[f] = textEl.value;
            } else {
                // Si no es un campo opcional (como imagen en noticias), podría ser error
                // Para simplificar, si no encuentra el input, no lo agrega al payload
                console.warn(`No se encontró input para el campo: ${f} (ID buscado: ${textId})`);
            }
        }

        // Validaciones básicas
        if ((table === 'news' && !payload.title) || (table === 'members' && !payload.name) || (table === 'projects' && !payload.title)) {
            return showAlert('Por favor completa el título o nombre', 'error');
        }

        let error = null;
        if (currentEditId) {
            // MODO EDICIÓN
            const res = await supabase.from(table).update(payload).eq('id', currentEditId);
            error = res.error;
            showAlert('Actualizado correctamente', 'success');
        } else {
            // MODO AGREGAR
            payload.id = uid();
            const res = await supabase.from(table).insert([payload]);
            error = res.error;
            showAlert('Agregado correctamente', 'success');
        }

        if (error) {
            console.error('Error Supabase:', error);
            showAlert('Hubo un error al guardar', 'error');
        } else {
            clearForm(prefix, fields);
            loadAdminLists(); // Recargar lista
        }
    });

    cancelBtn?.addEventListener('click', () => {
        clearForm(prefix, fields);
        showAlert('Edición cancelada', 'info');
    });
}

function clearForm(prefix, fields) {
    currentEditId = null;
    fields.forEach(f => {
        const el = document.getElementById(`${prefix}-${f}`);
        if(el) el.value = '';
        const elUrl = document.getElementById(`${prefix}-${f}-url`);
        if(elUrl) elUrl.value = '';
        const elFile = document.getElementById(`${prefix}-${f}-file`);
        if(elFile) elFile.value = '';
    });
    
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);
    if(addBtn) {
        addBtn.textContent = 'Agregar';
        addBtn.classList.remove('pulse-animation');
    }
    if(cancelBtn) cancelBtn.classList.add('hidden');
}

// FUNCIÓN DE LISTADO CORREGIDA
async function loadAdminLists() {
    const data = await readData();
    if(!data) return;

    const renderList = (containerId, items, labelField, table, prefix, fields) => {
        const c = document.getElementById(containerId);
        if(!c) return;
        c.innerHTML = '';
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.padding = '10px 15px';
            div.style.marginBottom = '10px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.innerHTML = `
                <span style="font-weight:600">${escapeHtml(item[labelField])}</span>
                <div style="display:flex; gap:8px;">
                    <button class="btn edit-btn" style="padding:4px 10px; font-size:0.8rem; background:var(--blue-light)">✏️ Editar</button>
                    <button class="btn muted del-btn" style="padding:4px 10px; font-size:0.8rem; background:#d32f2f">🗑️</button>
                </div>
            `;
            
            // BORRAR
            div.querySelector('.del-btn').addEventListener('click', async () => {
                if(confirm('¿Eliminar este registro permanentemente?')) {
                    await supabase.from(table).delete().eq('id', item.id);
                    showAlert('Registro eliminado', 'success');
                    // Realtime se encargará de recargar
                }
            });

            // EDITAR (Con Try/Catch para evitar crashes)
            div.querySelector('.edit-btn').addEventListener('click', () => {
                console.log(`Editando: ${table} ID: ${item.id}`);
                currentEditId = item.id;
                
                try {
                    // Llenar campos
                    fields.forEach(f => {
                        let el = document.getElementById(`${prefix}-${f}`); // input normal
                        let elUrl = document.getElementById(`${prefix}-${f}-url`); // input url imagen
                        
                        if(elUrl) {
                            elUrl.value = item[f] || '';
                        } else if(el) {
                            el.value = item[f] || '';
                        }
                    });

                    // Cambiar UI a modo edición
                    const addBtn = document.getElementById(`add-${prefix}`);
                    const cancelBtn = document.getElementById(`cancel-${prefix}`);
                    
                    if(addBtn) {
                        addBtn.textContent = 'Actualizar Registro';
                        addBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    if(cancelBtn) cancelBtn.classList.remove('hidden');

                } catch(e) {
                    console.error('Error al intentar editar:', e);
                    showAlert('Error cargando datos al formulario', 'error');
                }
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

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showAlert(msg, type) {
    const t = document.createElement('div');
    t.className = `toast show ${type || ''}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
}

function bindContact() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            id: uid(),
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value,
            message: document.getElementById('contact-message').value
        };
        const { error } = await supabase.from('contacts').insert([data]);
        if (error) showAlert('Error enviando mensaje', 'error');
        else {
            showAlert('Mensaje enviado', 'success');
            form.reset();
        }
    });
}

function bindSidebar() {
    const btn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (btn) btn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('open'); });
    if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); });
}

function renderNav() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    const links = [
        { t: 'Inicio', h: 'index.html' }, { t: 'Nosotros', h: 'about.html' },
        { t: 'Servicios', h: 'services.html' }, { t: 'Proyectos', h: 'projects.html' },
        { t: 'Eventos', h: 'events.html' }, { t: 'Noticias', h: 'news.html' },
        { t: 'Galería', h: 'gallery.html' }, { t: 'Integrantes', h: 'members.html' },
        { t: 'Contacto', h: 'contact.html' }
    ];
    nav.innerHTML = '';
    links.forEach(l => {
        const a = document.createElement('a'); a.href = l.h; a.textContent = l.t;
        if(location.pathname.includes(l.h)) a.classList.add('active');
        nav.appendChild(a);
    });
}

function renderSidebar() { renderNav(); }

function initCarousel(newsItems) {
    const c = document.getElementById('news-carousel');
    if (!c) return;
    if (newsItems.length === 0) { c.innerHTML = '<div class="card"><p class="muted">No hay noticias destacadas.</p></div>'; return; }
    c.innerHTML = '';
    const container = document.createElement('div'); container.className = 'carousel-slides';
    newsItems.forEach((n, i) => {
        const slide = document.createElement('div'); slide.className = `carousel-slide ${i === 0 ? 'active' : ''}`;
        if (n.image) slide.style.backgroundImage = `url('${n.image}')`;
        else slide.style.background = 'linear-gradient(135deg, #04293a, #0d5d9e)';
        slide.innerHTML = `<div class="carousel-caption"><div class="content"><h3>${escapeHtml(n.title)}</h3><small>${n.date}</small><p>${escapeHtml(n.body.substring(0, 100))}...</p></div></div>`;
        container.appendChild(slide);
    });
    c.appendChild(container);
    let idx = 0; const slides = container.children;
    setInterval(() => { slides[idx].classList.remove('active'); idx = (idx + 1) % slides.length; slides[idx].classList.add('active'); }, 5000);
}

function openPhotoViewer(src) {
    const pv = document.getElementById('photo-viewer');
    const img = document.getElementById('photo-viewer-img');
    if (pv && img) { img.src = src; pv.classList.add('open'); }
}

function renderMembersByRole(members) {
    const container = document.getElementById('members-list');
    if (!container) return;
    container.innerHTML = '';

    const quadrants = [
        { title: 'Presidente y Vicepresidenta', roles: ['Presidente', 'Presidenta', 'Vicepresidente', 'Vicepresidenta', 'Vicepresedenta'] },
        { title: 'Logística', roles: ['Logistica', 'Logística'] },
        { title: 'Publirelacionista', roles: ['Publirelacionista', 'Relaciones Públicas', 'Relaciones Publicas'] },
        { title: 'Tesorería', roles: ['Tesorero', 'Tesorería', 'Tesorera'] },
        { title: 'Secretaria', roles: ['Secretaria', 'Secretario'] },
        { title: 'Vocales', roles: ['Vocal', 'Vocales'] },
        { title: 'Colaboradores', roles: ['Colaborador', 'Colaboradores'] }
    ];

    // Helper to create member card (same structure used elsewhere)
    const createCard = (m) => {
        const div = document.createElement('div');
        div.className = 'member-card';
        const imgUrl = m.photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='220' height='220' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";
        div.innerHTML = `<img src="${imgUrl}" onclick="openPhotoViewer('${imgUrl}')">
                         <div><h4>${escapeHtml(m.name)}</h4><p class="muted">${escapeHtml(m.role)}</p><p>${escapeHtml(m.email)}</p><p class="muted">${escapeHtml(m.phone || '')}</p></div>`;
        return div;
    };

    // Normalize role lookup
    const normalize = r => (r || '').trim().toLowerCase();
    const usedIds = new Set();

    quadrants.forEach((q, idx) => {
        const qEl = document.createElement('section');
        qEl.className = 'card quadrant';
        qEl.innerHTML = `<h3>${q.title}</h3>`;
        const grid = document.createElement('div');
        grid.className = 'quadrant-grid';

        const matched = members.filter(m => q.roles.map(normalize).includes(normalize(m.role)));
        matched.forEach(m => { grid.appendChild(createCard(m)); usedIds.add(m.id); });

        if (matched.length === 0) {
            const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No hay registros.'; grid.appendChild(p);
        }

        qEl.appendChild(grid);
        container.appendChild(qEl);
    });

    // Append any members not matched into an "Otros" quadrant
    const others = members.filter(m => !usedIds.has(m.id));
    if (others.length) {
        const qEl = document.createElement('section');
        qEl.className = 'card quadrant';
        qEl.innerHTML = `<h3>Otros</h3>`;
        const grid = document.createElement('div'); grid.className = 'quadrant-grid';
        others.forEach(m => grid.appendChild(createCard(m)));
        qEl.appendChild(grid);
        container.appendChild(qEl);
    }
}

// ============================================================
// MODAL DE NOTICIAS (EXPANDIR CONTENIDO)
// ============================================================

function openNewsModal(title, date, body, image) {
    const modal = document.getElementById('news-modal');
    const modalBody = document.getElementById('news-modal-body');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;">
            ${image ? `<img src="${image}" style="width:100%;height:300px;object-fit:cover;border-radius:12px;box-shadow:0 8px 24px rgba(2,24,38,0.15);">` : '<div style="width:100%;height:300px;background:linear-gradient(135deg,#04293a,#0d5d9e);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;">Sin imagen</div>'}
            <div>
                <h2 style="color:var(--blue-accent);margin:0 0 8px 0;font-size:1.8rem;line-height:1.3;">${escapeHtml(title)}</h2>
                <small style="color:var(--accent);font-weight:600;font-size:0.95rem;">${date}</small>
            </div>
            <div style="color:var(--blue-accent);line-height:1.8;font-size:1rem;">
                ${escapeHtml(body).replace(/\n/g, '<br>')}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) modal.classList.add('hidden');
}

function bindNewsModal() {
    const modal = document.getElementById('news-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeNewsModal();
        });
    }
}