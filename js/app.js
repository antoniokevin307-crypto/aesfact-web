// app.js - Gestión completa con Supabase
// ============================================================

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://yhikslflzazeodazxpyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWtzbGZsemF6ZW9kYXp4cHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDg1NTUsImV4cCI6MjA4NTk4NDU1NX0.H5T_YmsetExRyy5DjwbEFvMi4D6GzImEOFcOZL0Pwxk';

let supabase = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando AESFACT App...');
    await initSupabase();
    await renderPublic(); // Renderizado inicial
    
    // Funciones de UI
    bindSidebar();
    renderNav();
    renderSidebar();
    bindContact();
    
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
        console.error('❌ Librería Supabase no encontrada. Verifica tu conexión a internet.');
        showAlert('Error: No se pudo conectar a la base de datos', 'error');
    }
}

function setupRealtime() {
    if (!supabase) return;
    // Escuchar cambios en cualquier tabla pública
    const channels = supabase.channel('custom-all-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            (payload) => {
                console.log('Cambio detectado:', payload);
                renderPublic(); // Recargar vista pública
                // Si estamos en admin, recargar listas
                if (document.body.classList.contains('admin') && !document.getElementById('admin-panel').classList.contains('hidden')) {
                    loadAdminLists();
                }
            }
        )
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
        gallery: [] // Se llena dinámicamente de noticias/aesfact/miembros
    };

    try {
        // 1. Configuración
        const { data: config } = await supabase.from('config').select('*');
        if (config) {
            config.forEach(item => {
                try {
                    if (['valores', 'objetivos', 'objetivos_calidad'].includes(item.key)) {
                        dataStore[item.key] = JSON.parse(item.value);
                    } else {
                        dataStore[item.key] = item.value;
                    }
                } catch (e) {
                    console.warn(`Error parseando ${item.key}`, e);
                }
            });
        }

        // 2. Tablas individuales
        const [news, projects, events, members, services, aesfact] = await Promise.all([
            supabase.from('news').select('*').order('date', { ascending: false }),
            supabase.from('projects').select('*').order('date', { ascending: false }),
            supabase.from('events').select('*').order('date', { ascending: true }),
            supabase.from('members').select('*'),
            supabase.from('services').select('*'),
            supabase.from('aesfact').select('*').eq('id', 'aesfact').single()
        ]);

        dataStore.news = news.data || [];
        dataStore.projects = projects.data || [];
        dataStore.events = events.data || [];
        dataStore.members = members.data || [];
        dataStore.services = services.data || [];
        
        if (aesfact.data) {
            dataStore.aesfact = aesfact.data;
        }

        // 3. Construir Galería Virtual (extrae imágenes de noticias y aesfact)
        dataStore.gallery = [];
        if (dataStore.aesfact.image) dataStore.gallery.push(dataStore.aesfact.image);
        dataStore.news.forEach(n => { if (n.image) dataStore.gallery.push(n.image); });
        
        return dataStore;

    } catch (error) {
        console.error('Error leyendo datos:', error);
        showAlert('Error de conexión obteniendo datos', 'error');
        return null;
    }
}

// ============================================================
// RENDERIZADO PÚBLICO (UI)
// ============================================================

async function renderPublic() {
    const data = await readData();
    if (!data) return;

    // Helper para texto seguro
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

    // Configuración General
    txt('mision', data.mision);
    txt('vision', data.vision);
    txt('politica', data.politica);
    htmlList('valores', data.valores);
    htmlList('objetivos', data.objetivos);
    htmlList('objetivos-calidad', data.objetivos_calidad);

    // AESFACT
    txt('aesfact-year', data.aesfact.year);
    const aesImg = document.getElementById('aesfact-image');
    if (aesImg && data.aesfact.image) aesImg.src = data.aesfact.image;

    // Servicios
    const servList = document.getElementById('services-list');
    if (servList) {
        servList.innerHTML = '';
        data.services.forEach(s => {
            const li = document.createElement('div');
            li.className = 'card';
            li.innerHTML = `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.desc)}</p>`;
            servList.appendChild(li);
        });
    }

    // Proyectos
    const projList = document.getElementById('projects-list');
    if (projList) {
        projList.innerHTML = '';
        data.projects.forEach(p => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `<h4>${escapeHtml(p.title)} <small class="muted">${p.status} • ${p.date}</small></h4><p>${escapeHtml(p.desc)}</p>`;
            projList.appendChild(div);
        });
    }

    // Eventos
    const evtList = document.getElementById('events-list');
    if (evtList) {
        evtList.innerHTML = '';
        data.events.forEach(e => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `<h4>${escapeHtml(e.title)} <small class="muted">${e.date}</small></h4><p>${escapeHtml(e.desc)}</p>`;
            evtList.appendChild(div);
        });
    }

    // Integrantes
    const memList = document.getElementById('members-list');
    if (memList) {
        memList.innerHTML = '';
        data.members.forEach(m => {
            const div = document.createElement('div');
            div.className = 'member-card';
            const imgUrl = m.photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='220' height='220' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";
            
            div.innerHTML = `
                <img src="${imgUrl}" alt="${escapeHtml(m.name)}" onclick="openPhotoViewer('${imgUrl}')">
                <div>
                    <h4>${escapeHtml(m.name)}</h4>
                    <p class="muted">${escapeHtml(m.role)}</p>
                    <p>${escapeHtml(m.email)}</p>
                    <p class="muted">${escapeHtml(m.phone || '')}</p>
                </div>
            `;
            memList.appendChild(div);
        });
    }

    // Noticias (Lista y Carrusel)
    const newsList = document.getElementById('news-list');
    if (newsList) {
        newsList.innerHTML = '';
        data.news.forEach(n => {
            const article = document.createElement('article');
            article.className = 'card';
            article.innerHTML = `
                <h4>${escapeHtml(n.title)}</h4>
                <small>${n.date}</small>
                ${n.image ? `<img src="${n.image}" style="width:100%;border-radius:8px;margin:10px 0;max-height:300px;object-fit:cover">` : ''}
                <p>${escapeHtml(n.body)}</p>
            `;
            newsList.appendChild(article);
        });
    }

    // Carrusel (Solo las ultimas 5)
    initCarousel(data.news.slice(0, 5));

    // Galería
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
// ADMIN PANEL
// ============================================================

const ADMIN_PASS_KEY = 'aesfact_admin_pass_v1';
const ADMIN_EMAIL_KEY = 'aesfact_admin_email_v1';
let currentEditId = null;

function initAdmin() {
    // Configurar credenciales por defecto si no existen
    if (!localStorage.getItem(ADMIN_PASS_KEY)) localStorage.setItem(ADMIN_PASS_KEY, 'admin123');
    if (!localStorage.getItem(ADMIN_EMAIL_KEY)) localStorage.setItem(ADMIN_EMAIL_KEY, 'root@gmail.com');

    // Login
    document.getElementById('login-btn')?.addEventListener('click', () => {
        const pass = document.getElementById('admin-pass').value;
        const email = document.getElementById('admin-email').value;
        
        if (pass === localStorage.getItem(ADMIN_PASS_KEY) && email === localStorage.getItem(ADMIN_EMAIL_KEY)) {
            document.getElementById('login-panel').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            loadAdminData(); // Cargar datos en formularios
            loadAdminLists(); // Cargar listas CRUD
        } else {
            showAlert('Credenciales incorrectas', 'error');
        }
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        location.reload();
    });

    setupAdminListeners();
}

async function loadAdminData() {
    const data = await readData();
    if (!data) return;

    // Llenar forms de configuración
    document.getElementById('edit-mision').value = data.mision;
    document.getElementById('edit-vision').value = data.vision;
    document.getElementById('edit-valores').value = data.valores.join('\n');
    document.getElementById('edit-politica').value = data.politica;
    document.getElementById('edit-objetivos').value = data.objetivos.join('\n');
    document.getElementById('edit-objetivos-calidad').value = data.objetivos_calidad.join('\n');
    
    // AESFACT
    document.getElementById('aesfact-year').value = data.aesfact.year;
    document.getElementById('aesfact-image-url').value = data.aesfact.image || '';
}

function setupAdminListeners() {
    // Guardar Configuración (Nosotros)
    document.getElementById('save-about')?.addEventListener('click', async () => {
        const updates = [
            { key: 'mision', value: document.getElementById('edit-mision').value },
            { key: 'vision', value: document.getElementById('edit-vision').value },
            { key: 'politica', value: document.getElementById('edit-politica').value },
            { key: 'valores', value: JSON.stringify(document.getElementById('edit-valores').value.split('\n').filter(Boolean)) },
            { key: 'objetivos', value: JSON.stringify(document.getElementById('edit-objetivos').value.split('\n').filter(Boolean)) },
            { key: 'objetivos_calidad', value: JSON.stringify(document.getElementById('edit-objetivos-calidad').value.split('\n').filter(Boolean)) }
        ];

        for (let up of updates) {
            await supabase.from('config').upsert({ key: up.key, value: up.value });
        }
        showAlert('Información actualizada', 'success');
    });

    // Guardar AESFACT
    document.getElementById('save-aesfact')?.addEventListener('click', async () => {
        const year = document.getElementById('aesfact-year').value;
        let image = document.getElementById('aesfact-image-url').value;
        const fileInput = document.getElementById('aesfact-image-file');

        if (fileInput.files[0]) {
            image = await readFileAsDataURL(fileInput.files[0]);
        }

        const { error } = await supabase.from('aesfact').upsert({ id: 'aesfact', year, image });
        if (error) showAlert('Error guardando', 'error');
        else {
            showAlert('Datos guardados', 'success');
            document.getElementById('aesfact-image-file').value = ''; // limpiar
        }
    });

    // CRUD Listeners Genéricos (Noticias, Proyectos, etc)
    setupCrud('news', 'news', ['title', 'body', 'date', 'image']);
    setupCrud('proj', 'projects', ['title', 'desc', 'date', 'status']);
    setupCrud('evt', 'events', ['title', 'desc', 'date']);
    setupCrud('mem', 'members', ['name', 'role', 'email', 'phone', 'photo']);
    setupCrud('service', 'services', ['title', 'desc']);
}

// Configuración genérica para botones Agregar/Editar
function setupCrud(prefix, table, fields) {
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);

    addBtn?.addEventListener('click', async () => {
        const payload = {};
        for (let f of fields) {
            // Manejo especial para imágenes (file input vs url input)
            if (f === 'image' || f === 'photo') {
                const fileIn = document.getElementById(`${prefix}-${f}-file`);
                const textIn = document.getElementById(`${prefix}-${f}-url`);
                if (fileIn && fileIn.files[0]) {
                    payload[f] = await readFileAsDataURL(fileIn.files[0]);
                } else {
                    payload[f] = textIn ? textIn.value : '';
                }
            } 
            // Manejo especial para textarea/input normales
            else {
                const el = document.getElementById(`${prefix}-${f}`);
                if (f === 'desc') {
                    // Mapear desc a "desc" (palabra reservada en sql a veces, pero aqui es columna)
                    payload['desc'] = document.getElementById(`${prefix}-desc`).value;
                } else if (f === 'body') {
                     payload['body'] = document.getElementById(`${prefix}-body`).value;
                } else {
                    payload[f] = el.value;
                }
            }
        }

        // Validación básica
        if (!payload.title && !payload.name) {
            return showAlert('Faltan datos obligatorios', 'error');
        }

        let error = null;
        if (currentEditId) {
            // Update
            const res = await supabase.from(table).update(payload).eq('id', currentEditId);
            error = res.error;
            showAlert('Actualizado correctamente', 'success');
        } else {
            // Insert
            payload.id = uid();
            const res = await supabase.from(table).insert([payload]);
            error = res.error;
            showAlert('Agregado correctamente', 'success');
        }

        if (error) {
            console.error(error);
            showAlert('Error en la operación', 'error');
        } else {
            clearForm(prefix, fields);
            loadAdminLists();
        }
    });

    cancelBtn?.addEventListener('click', () => {
        clearForm(prefix, fields);
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
    
    // Resetear botones
    const addBtn = document.getElementById(`add-${prefix}`);
    const cancelBtn = document.getElementById(`cancel-${prefix}`);
    if(addBtn) addBtn.textContent = 'Agregar';
    if(cancelBtn) cancelBtn.classList.add('hidden');
    
    // Limpiar previews
    const prev = document.getElementById(`${prefix}-preview`);
    if(prev) prev.innerHTML = '';
}

async function loadAdminLists() {
    const data = await readData();
    if(!data) return;

    // Helper para crear items de lista con botones editar/eliminar
    const renderList = (containerId, items, labelField, table, prefix, fields) => {
        const c = document.getElementById(containerId);
        if(!c) return;
        c.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.padding = '15px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.innerHTML = `
                <span>${escapeHtml(item[labelField])}</span>
                <div>
                    <button class="btn edit-btn" style="padding:5px 10px; font-size:0.8rem">Editar</button>
                    <button class="btn muted del-btn" style="padding:5px 10px; font-size:0.8rem">Borrar</button>
                </div>
            `;
            
            // Evento Borrar
            div.querySelector('.del-btn').addEventListener('click', async () => {
                if(confirm('¿Seguro que deseas eliminar esto?')) {
                    await supabase.from(table).delete().eq('id', item.id);
                    loadAdminLists();
                }
            });

            // Evento Editar
            div.querySelector('.edit-btn').addEventListener('click', () => {
                currentEditId = item.id;
                // Llenar formulario
                fields.forEach(f => {
                    if (f === 'image' || f === 'photo') {
                         const urlIn = document.getElementById(`${prefix}-${f}-url`);
                         if(urlIn) urlIn.value = item[f] || '';
                    } else {
                        const el = document.getElementById(`${prefix}-${f}`);
                        if(el) el.value = item[f] || '';
                    }
                });
                // Cambiar estado botones
                const addBtn = document.getElementById(`add-${prefix}`);
                const cancelBtn = document.getElementById(`cancel-${prefix}`);
                if(addBtn) addBtn.textContent = 'Actualizar';
                if(cancelBtn) cancelBtn.classList.remove('hidden');
                
                // Scroll al formulario
                document.getElementById(`sec-${table}`).scrollIntoView({behavior: 'smooth'});
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
// UTILIDADES
// ============================================================

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
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
    // Reutilizar el toast existente en CSS
    const t = document.createElement('div');
    t.className = `toast show ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 500);
    }, 3000);
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
            showAlert('Mensaje enviado. ¡Gracias!', 'success');
            form.reset();
        }
    });
}

function bindSidebar() {
    const btn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    function close() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    if (btn) btn.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    });

    if (overlay) overlay.addEventListener('click', close);
}

function renderNav() {
    // Generación dinámica del menú
    const links = [
        { t: 'Inicio', h: 'index.html' },
        { t: 'Nosotros', h: 'about.html' },
        { t: 'Servicios', h: 'services.html' },
        { t: 'Proyectos', h: 'projects.html' },
        { t: 'Eventos', h: 'events.html' },
        { t: 'Noticias', h: 'news.html' },
        { t: 'Galería', h: 'gallery.html' },
        { t: 'Integrantes', h: 'members.html' },
        { t: 'Contacto', h: 'contact.html' }
    ];
    
    const nav = document.getElementById('sidebar-nav');
    if (nav) {
        nav.innerHTML = '';
        links.forEach(l => {
            const a = document.createElement('a');
            a.href = l.h;
            a.textContent = l.t;
            if(location.pathname.includes(l.h)) a.classList.add('active');
            nav.appendChild(a);
        });
    }
}

function renderSidebar() {
    // Alias para renderNav por compatibilidad
    renderNav();
}

function initCarousel(newsItems) {
    const c = document.getElementById('news-carousel');
    if (!c) return;
    if (newsItems.length === 0) {
        c.innerHTML = '<div class="card"><p class="muted">No hay noticias destacadas.</p></div>';
        return;
    }

    // Limpiar anterior
    c.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'carousel-slides';
    
    newsItems.forEach((n, i) => {
        const slide = document.createElement('div');
        slide.className = `carousel-slide ${i === 0 ? 'active' : ''}`;
        if (n.image) {
            slide.style.backgroundImage = `url('${n.image}')`;
        } else {
             slide.style.background = 'linear-gradient(135deg, #04293a, #0d5d9e)';
        }
        
        slide.innerHTML = `
            <div class="carousel-caption">
                <div class="content">
                    <h3>${escapeHtml(n.title)}</h3>
                    <small>${n.date}</small>
                    <p>${escapeHtml(n.body.substring(0, 100))}...</p>
                </div>
            </div>
        `;
        container.appendChild(slide);
    });
    
    c.appendChild(container);

    // Controles
    let idx = 0;
    const slides = container.children;
    
    setInterval(() => {
        slides[idx].classList.remove('active');
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add('active');
    }, 5000);
}

function openPhotoViewer(src) {
    const pv = document.getElementById('photo-viewer');
    const img = document.getElementById('photo-viewer-img');
    if (pv && img) {
        img.src = src;
        pv.classList.add('open');
    }
}