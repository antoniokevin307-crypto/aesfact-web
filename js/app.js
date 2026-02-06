// app.js - maneja renderizado, almacenamiento y admin
(function(){
  const STORAGE_KEY = 'aesfact_data_v1';
  const ADMIN_PASS_KEY = 'aesfact_admin_pass_v1';
  const ADMIN_EMAIL_KEY = 'aesfact_admin_email_v1';

  // Lectura / escritura de datos persistentes (localStorage)
  function readData(){
    try{const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): seedData();}
    catch(e){console.error(e); return seedData();}
  }
  function writeData(d){localStorage.setItem(STORAGE_KEY, JSON.stringify(d));}

  // Semilla inicial con ejemplos y contenido institucional proporcionado
  function seedData(){
    const seed = {
      mision: 'Somos la Asociación de Estudiantes de la Facultad de Ciencia y Tecnología de la Universidad Gerardo Barrios, comprometida con la representación, participación y formación integral del estudiantado, impulsando actividades académicas, sociales, culturales y solidarias que fortalezcan el sentido de pertenencia, el liderazgo y el compromiso con la comunidad universitaria y la sociedad.',
      vision: 'Ser una asociación estudiantil referente dentro de la Universidad Gerardo Barrios, reconocida por su trabajo responsable, su cercanía con los estudiantes y su aporte al desarrollo académico, social y humano de la Facultad de Ciencia y Tecnología, promoviendo una participación activa y organizada del estudiantado.',
      valores: ['Compromiso: Asumimos con responsabilidad cada actividad y proyecto, trabajando de manera constante por el bienestar del estudiantado y el fortalecimiento de la Facultad de Ciencia y Tecnología.','Responsabilidad: Cumplimos con las funciones y compromisos adquiridos como asociación estudiantil, actuando con seriedad, transparencia y respeto hacia la comunidad universitaria.','Inclusión: Promovemos la participación de todos los estudiantes, valorando la diversidad de ideas, opiniones y capacidades, y fomentando un ambiente de respeto y colaboración.','Solidaridad: Impulsamos acciones de apoyo social y comunitario, fortaleciendo el sentido humano y el compromiso con los sectores que más lo necesitan.','Trabajo en equipo: Creemos en la colaboración y la comunicación como base para lograr objetivos comunes y ejecutar proyectos de impacto positivo.'],
      politica: 'En AESFACT trabajamos por la satisfacción y representación efectiva del estudiantado de la Facultad de Ciencia y Tecnología, promoviendo una gestión organizada, transparente y participativa, orientada a la mejora continua de las actividades académicas, sociales y solidarias, en coherencia con los valores y principios de la Universidad Gerardo Barrios.',
      objetivos: [
        'Representar los intereses del estudiantado de la Facultad de Ciencia y Tecnología ante las autoridades universitarias.',
        'Fomentar la participación estudiantil en actividades académicas, culturales, sociales y ambientales.',
        'Promover el liderazgo, la responsabilidad y el compromiso social entre los estudiantes.',
        'Contribuir al fortalecimiento del vínculo entre la universidad y la comunidad.'
      ],
      objetivos_calidad: [
        'Desarrollar actividades estudiantiles que aporten a la formación integral del alumnado.',
        'Mantener una comunicación efectiva entre la asociación, los estudiantes y las autoridades universitarias.',
        'Ejecutar proyectos organizados y de impacto positivo para la comunidad universitaria y la sociedad.',
        'Fortalecer la imagen y el trabajo de la Asociación de Estudiantes de la Facultad de Ciencia y Tecnología.'
      ],
      services: [ {title:'Asesorías académicas',desc:'Apoyo en materias técnicas y científicas.'} ],
      news: [ {id:uid(),title:'Bienvenida 2026',body:'Iniciamos actividades... ',date:(new Date()).toISOString().slice(0,10)} ],
      projects: [ {id:uid(),title:'Proyecto Solar',desc:'Instalación de paneles demostrativos',date:'2025-10-10',status:'En curso'} ],
      events: [ {id:uid(),title:'Feria tecnológica',date:'2025-11-05',desc:'Exposición de proyectos estudiantiles'} ],
      gallery: [],
      members: [ {id:uid(),name:'Juan Perez',role:'Presidente',email:'juan@ejemplo.com',phone:'',photo:''} ],
      aesfact: { year: (new Date()).getFullYear().toString(), image: '' },
      contacts: []
    };
    writeData(seed); return seed;
  }

  // Leer un File y devolver Data URL (Promise)
  function readFileAsDataURL(file){
    return new Promise((resolve,reject)=>{
      const fr = new FileReader();
      fr.onload = ()=>resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function uid(){return 'id-'+Math.random().toString(36).slice(2,9)}

  // Renderizado de la página pública
  function renderPublic(){
    const d = readData();
    const mEl = document.getElementById('mision'); if(mEl) mEl.textContent = d.mision || '';
    const vEl = document.getElementById('vision'); if(vEl) vEl.textContent = d.vision || '';
    const vals = document.getElementById('valores'); if(vals){ vals.innerHTML=''; (d.valores||[]).forEach(v=>{const li=document.createElement('li');li.textContent=v;vals.appendChild(li)}); }
    const objs = document.getElementById('objetivos'); if(objs){ objs.innerHTML=''; (d.objetivos||[]).forEach(o=>{const li=document.createElement('li');li.textContent=o;objs.appendChild(li)}); }
    const objsCal = document.getElementById('objetivos-calidad'); if(objsCal){ objsCal.innerHTML=''; (d.objetivos_calidad||[]).forEach(o=>{const li=document.createElement('li');li.textContent=o;objsCal.appendChild(li)}); }
    const polEl = document.getElementById('politica'); if(polEl) polEl.textContent = d.politica || '';

    const servicesList = document.getElementById('services-list'); if(servicesList){ servicesList.innerHTML=''; (d.services||[]).forEach(s=>{const li=document.createElement('li');li.innerHTML=`<strong>${escapeHtml(s.title)}</strong><p>${escapeHtml(s.desc)}</p>`;servicesList.appendChild(li)}); }

    const projects = document.getElementById('projects-list'); if(projects){ projects.innerHTML=''; (d.projects||[]).forEach(p=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<h4>${escapeHtml(p.title)} <small class="muted">${p.status} • ${p.date}</small></h4><p>${escapeHtml(p.desc)}</p>`;projects.appendChild(el)}); }

    const events = document.getElementById('events-list'); if(events){ events.innerHTML=''; (d.events||[]).forEach(evt=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<h4>${escapeHtml(evt.title)} <small class="muted">${evt.date}</small></h4><p>${escapeHtml(evt.desc)}</p>`;events.appendChild(el)}); }

    const news = document.getElementById('news-list'); if(news){ news.innerHTML=''; const latest = (d.news||[]).slice(-5).reverse(); latest.forEach(n=>{const el=document.createElement('article');el.className='card';el.innerHTML=`<h4>${escapeHtml(n.title)}</h4><small>${n.date}</small>${n.image ? `<img src="${n.image}" alt="${escapeHtml(n.title)}" style="width:100%;border-radius:8px;margin:12px 0;display:block;">` : ''}<p>${escapeHtml(n.body)}</p>`;news.appendChild(el)}); }

    // Carrusel de noticias en index
    const carousel = document.getElementById('news-carousel');
    if(carousel){
      // simple estado en closure
      if(window.__aes_carousel_timer) { clearInterval(window.__aes_carousel_timer); window.__aes_carousel_timer = null; }
      carousel.innerHTML = '';
      const items = (d.news||[]).slice(-5).reverse();
      if(!items.length){ carousel.innerHTML = '<div class="card"><p class="muted">No hay noticias aún.</p></div>'; }
      else{
        const slides = document.createElement('div'); slides.className='carousel-slides';
        items.forEach((n,i)=>{
          const s = document.createElement('div'); s.className='carousel-slide';
          if(n.image) s.style.backgroundImage = `url(${n.image})`;
          s.innerHTML = `<div class="carousel-caption"><h3>${escapeHtml(n.title)}</h3><small>${n.date}</small><p>${escapeHtml(n.body)}</p></div>`;
          slides.appendChild(s);
        });
        carousel.appendChild(slides);

        const ctrls = document.createElement('div'); ctrls.className='carousel-controls';
        ctrls.innerHTML = '<button class="prev">◀</button><button class="next">▶</button>';
        carousel.appendChild(ctrls);

        const indicators = document.createElement('div'); indicators.className='carousel-indicators';
        items.forEach((_,i)=>{ const b=document.createElement('button'); b.className='dot'; if(i===0) b.classList.add('active'); b.setAttribute('data-idx',i); indicators.appendChild(b); });
        carousel.appendChild(indicators);

        let idx = 0;
        const slideElems = slides.children;
        function show(i){ if(i<0) i = slideElems.length-1; if(i>=slideElems.length) i=0; for(let k=0;k<slideElems.length;k++){ slideElems[k].classList.toggle('active',k===i); indicators.children[k].classList.toggle('active',k===i); } idx=i; }
        carousel.querySelector('.prev').addEventListener('click', ()=>{ show(idx-1); });
        carousel.querySelector('.next').addEventListener('click', ()=>{ show(idx+1); });
        Array.from(indicators.children).forEach(b=>b.addEventListener('click', e=>{ show(parseInt(b.getAttribute('data-idx'))); }));
        show(0);
        window.__aes_carousel_timer = setInterval(()=>{ show(idx+1); }, 4000);
      }
    }

    const gallery = document.getElementById('gallery-list'); if(gallery){ gallery.innerHTML=''; (d.gallery||[]).forEach(g=>{if(!g) return; let source='Galería'; let sourceLink='#'; (d.news||[]).forEach(n=>{if(n.image===g) source='Noticia: '+escapeHtml(n.title), sourceLink='news.html';}); if(d.aesfact && d.aesfact.image===g) source='AESFACT '+d.aesfact.year, sourceLink='aesfact.html'; const div=document.createElement('div'); div.className='gallery-item'; div.innerHTML=`<img src="${g}" alt=""><div class="gallery-source">${source}</div>`; div.onclick=()=>{const pv=document.getElementById('photo-viewer'); if(pv){pv.querySelector('#photo-viewer-img').src=g; pv.classList.add('open');}}; div.style.cursor='pointer'; gallery.appendChild(div)}); }

    const members = document.getElementById('members-list'); if(members){ members.innerHTML=''; (d.members||[]).forEach(m=>{const el=document.createElement('div');el.className='member-card';const img=document.createElement('img');img.src=m.photo||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Ccircle cx='110' cy='110' r='110' fill='%230D5D9E'/%3E%3Ctext x='110' y='110' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='white'%3EMiembro%3C/text%3E%3C/svg%3E";img.alt=escapeHtml(m.name);img.style.cursor='pointer';img.onclick=()=>{const pv=document.getElementById('photo-viewer');if(pv){pv.querySelector('#photo-viewer-img').src=img.src;pv.classList.add('open');}};const div=document.createElement('div');div.innerHTML=`<h4>${escapeHtml(m.name)}</h4><p class="muted">${escapeHtml(m.role)}</p><p>${escapeHtml(m.email)}</p><p class="muted">${escapeHtml(m.phone||'')}</p>`;el.appendChild(img);el.appendChild(div);members.appendChild(el)}); }

    // AESFACT (imagen y año)
    const aesYearEl = document.getElementById('aesfact-year'); if(aesYearEl){ if(aesYearEl.tagName==='INPUT' || aesYearEl.tagName==='TEXTAREA') aesYearEl.value = (d.aesfact && d.aesfact.year) || ''; else aesYearEl.textContent = (d.aesfact && d.aesfact.year) || ''; }
    const aesImg = document.getElementById('aesfact-image'); if(aesImg){ const imgSrc = (d.aesfact && d.aesfact.image) || ''; aesImg.src = imgSrc || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect fill='%2304293a' width='1280' height='720'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='white'%3EAESFACT%3C/text%3E%3C/svg%3E"; }
  }

  // --- Admin helpers: toasts and edit flows ---
  const adminEdit = {};
  function showAlert(msg, type='info'){ const t = document.getElementById('toast'); if(!t) return alert(msg); t.textContent = msg; t.className = 'toast show '+(type||''); setTimeout(()=>{ t.className = 'toast hidden'; }, 3500); }

  function startEdit(type,id){ const d = readData(); adminEdit[type]=id;
    // Open a focused modal for editing the single item
    openEditModal(type,id);
  }

  // Builds and opens a modal to edit a single item
  function openEditModal(type,id){
    const d = readData();
    const modal = document.getElementById('edit-modal'); const body = document.getElementById('modal-body'); const saveBtn = document.getElementById('modal-save'); const cancelBtn = document.getElementById('modal-cancel'); const closeBtn = document.getElementById('modal-close');
    if(!modal || !body) return;
    body.innerHTML = '';
    // helper to close
    function close(){ modal.classList.add('hidden'); body.innerHTML = ''; saveBtn.onclick = null; cancelBtn.onclick = null; closeBtn.onclick = null; }

    if(type==='news'){
      const item = d.news.find(x=>x.id===id); if(!item) return;
      body.innerHTML = `<label>Título</label><input id="modal-news-title" value="${escapeHtml(item.title)}"><label>Contenido</label><textarea id="modal-news-body">${escapeHtml(item.body)}</textarea><label>Fecha</label><input id="modal-news-date" type="date" value="${item.date||''}"><label>Imagen URL</label><input id="modal-news-image-url" value="${escapeHtml(item.image||'')}"><label>Subir imagen</label><input id="modal-news-image-file" type="file" accept="image/*"><div id="modal-news-preview" class="media-preview">${item.image?`<img src="${item.image}" alt="preview">`:''}</div>`;
      modal.classList.remove('hidden');
      // file preview
      const fileInput = document.getElementById('modal-news-image-file'); const prev = document.getElementById('modal-news-preview');
      if(fileInput) fileInput.addEventListener('change', async ()=>{ const f=fileInput.files[0]; if(f){ try{ const data = await readFileAsDataURL(f); if(prev){ prev.innerHTML = `<img src="${data}" alt="preview">`; const btn=document.createElement('button'); btn.className='btn muted remove-img'; btn.textContent='Quitar'; btn.style.marginTop='8px'; btn.addEventListener('click', ()=>{ fileInput.value=''; document.getElementById('modal-news-image-url').value=''; prev.innerHTML=''; }); prev.appendChild(btn); } }catch(e){console.error(e);} } else { if(prev) prev.innerHTML=''; } });
      saveBtn.onclick = async ()=>{
        const t = document.getElementById('modal-news-title').value, b = document.getElementById('modal-news-body').value, dt = document.getElementById('modal-news-date').value || (new Date()).toISOString().slice(0,10);
        let img = document.getElementById('modal-news-image-url').value || '';
        const f = document.getElementById('modal-news-image-file'); if(f && f.files && f.files[0]){ try{ img = await readFileAsDataURL(f.files[0]); }catch(e){console.error(e);} }
        if(!t||!b) return showAlert('Título y contenido requeridos','error');
        const it = d.news.find(x=>x.id===id); if(it){ it.title=t; it.body=b; it.date=dt; it.image=img; writeData(d); renderPublic(); loadAdminLists(); showAlert('Noticia actualizada','success'); }
        close();
      };
      cancelBtn.onclick = ()=>{ close(); };
      closeBtn.onclick = ()=>{ close(); };
    }
    else if(type==='project' || type==='projects'){
      const item = d.projects.find(x=>x.id===id); if(!item) return;
      body.innerHTML = `<label>Título</label><input id="modal-proj-title" value="${escapeHtml(item.title)}"><label>Descripción</label><textarea id="modal-proj-desc">${escapeHtml(item.desc)}</textarea><label>Fecha</label><input id="modal-proj-date" type="date" value="${item.date||''}"><label>Estado</label><select id="modal-proj-status"><option${item.status==='En curso'?' selected':''}>En curso</option><option${item.status==='Terminado'?' selected':''}>Terminado</option><option${item.status==='Cancelado'?' selected':''}>Cancelado</option></select>`;
      modal.classList.remove('hidden');
      saveBtn.onclick = ()=>{ const t=document.getElementById('modal-proj-title').value, desc=document.getElementById('modal-proj-desc').value, date=document.getElementById('modal-proj-date').value, status=document.getElementById('modal-proj-status').value; if(!t) return showAlert('Título requerido','error'); const it = d.projects.find(x=>x.id===id); if(it){ it.title=t; it.desc=desc; it.date=date; it.status=status; writeData(d); renderPublic(); loadAdminLists(); showAlert('Proyecto actualizado','success'); } close(); };
      cancelBtn.onclick = ()=>close(); closeBtn.onclick = ()=>close();
    }
    else if(type==='event' || type==='events'){
      const item = d.events.find(x=>x.id===id); if(!item) return;
      body.innerHTML = `<label>Título</label><input id="modal-evt-title" value="${escapeHtml(item.title)}"><label>Fecha</label><input id="modal-evt-date" type="date" value="${item.date||''}"><label>Descripción</label><textarea id="modal-evt-desc">${escapeHtml(item.desc)}</textarea>`;
      modal.classList.remove('hidden');
      saveBtn.onclick = ()=>{ const t=document.getElementById('modal-evt-title').value, dt=document.getElementById('modal-evt-date').value, desc=document.getElementById('modal-evt-desc').value; if(!t) return showAlert('Título requerido','error'); const it=d.events.find(x=>x.id===id); if(it){ it.title=t; it.date=dt; it.desc=desc; writeData(d); renderPublic(); loadAdminLists(); showAlert('Evento actualizado','success'); } close(); };
      cancelBtn.onclick = ()=>close(); closeBtn.onclick = ()=>close();
    }
    else if(type==='member' || type==='members'){
      const item = d.members.find(x=>x.id===id); if(!item) return;
      body.innerHTML = `<label>Nombre</label><input id="modal-mem-name" value="${escapeHtml(item.name)}"><label>Cargo</label><input id="modal-mem-role" value="${escapeHtml(item.role)}"><label>Email</label><input id="modal-mem-email" value="${escapeHtml(item.email)}"><label>Teléfono</label><input id="modal-mem-phone" value="${escapeHtml(item.phone)}"><label>Foto URL</label><input id="modal-mem-photo-url" value="${escapeHtml(item.photo||'')}"><label>Subir foto</label><input id="modal-mem-photo-file" type="file" accept="image/*"><div id="modal-mem-preview" class="media-preview">${item.photo?`<img src="${item.photo}" alt="preview">`:''}</div>`;
      modal.classList.remove('hidden');
      const fileInput = document.getElementById('modal-mem-photo-file'); const prev = document.getElementById('modal-mem-preview'); if(fileInput) fileInput.addEventListener('change', async ()=>{ const f=fileInput.files[0]; if(f){ try{ const data = await readFileAsDataURL(f); if(prev){ prev.innerHTML = `<img src="${data}" alt="preview">`; const btn=document.createElement('button'); btn.className='btn muted remove-img'; btn.textContent='Quitar'; btn.style.marginTop='8px'; btn.addEventListener('click', ()=>{ fileInput.value=''; document.getElementById('modal-mem-photo-url').value=''; prev.innerHTML=''; }); prev.appendChild(btn); } }catch(e){console.error(e);} } else { if(prev) prev.innerHTML=''; } });
      saveBtn.onclick = async ()=>{ const name=document.getElementById('modal-mem-name').value, role=document.getElementById('modal-mem-role').value, email=document.getElementById('modal-mem-email').value, phone=document.getElementById('modal-mem-phone').value; if(!name) return showAlert('Nombre requerido','error'); let photo = document.getElementById('modal-mem-photo-url').value || ''; const mf = document.getElementById('modal-mem-photo-file'); if(mf && mf.files && mf.files[0]){ try{ photo = await readFileAsDataURL(mf.files[0]); }catch(e){console.error(e);} } const it=d.members.find(x=>x.id===id); if(it){ it.name=name; it.role=role; it.email=email; it.phone=phone; it.photo=photo; writeData(d); renderPublic(); loadAdminLists(); showAlert('Integrante actualizado','success'); } close(); };
      cancelBtn.onclick = ()=>close(); closeBtn.onclick = ()=>close();
    }
    else if(type==='service' || type==='services'){
      const index = parseInt(id); const item = d.services[index]; if(!item) return; body.innerHTML = `<label>Título</label><input id="modal-svc-title" value="${escapeHtml(item.title)}"><label>Descripción</label><textarea id="modal-svc-desc">${escapeHtml(item.desc)}</textarea>`; modal.classList.remove('hidden'); saveBtn.onclick = ()=>{ const t=document.getElementById('modal-svc-title').value, desc=document.getElementById('modal-svc-desc').value; if(!t) return showAlert('Título requerido','error'); d.services[index]={title:t,desc}; writeData(d); renderPublic(); loadAdminLists(); showAlert('Servicio actualizado','success'); close(); }; cancelBtn.onclick = ()=>close(); closeBtn.onclick = ()=>close();
    }
    // gallery editing removed — managed from other sections
  }

  function cancelEdit(type){ delete adminEdit[type];
    if(type==='news'){ document.getElementById('news-title').value=''; document.getElementById('news-body').value=''; document.getElementById('news-date').value=''; document.getElementById('news-image-url').value=''; document.getElementById('add-news').textContent='Agregar noticia'; document.getElementById('cancel-news').classList.add('hidden'); const prev=document.getElementById('news-preview'); if(prev) prev.innerHTML=''; const nf=document.getElementById('news-image-file'); if(nf) nf.value=''; }
    if(type==='projects' || type==='project'){ document.getElementById('proj-title').value=''; document.getElementById('proj-desc').value=''; document.getElementById('proj-date').value=''; document.getElementById('proj-status').value='En curso'; document.getElementById('add-proj').textContent='Agregar proyecto'; document.getElementById('cancel-proj').classList.add('hidden'); }
    if(type==='events' || type==='event'){ document.getElementById('evt-title').value=''; document.getElementById('evt-date').value=''; document.getElementById('evt-desc').value=''; document.getElementById('add-event').textContent='Agregar evento'; document.getElementById('cancel-event').classList.add('hidden'); }
    if(type==='members' || type==='member'){ document.getElementById('mem-name').value=''; document.getElementById('mem-role').value=''; document.getElementById('mem-email').value=''; document.getElementById('mem-phone').value=''; document.getElementById('mem-photo-url').value=''; document.getElementById('add-member').textContent='Agregar integrante'; document.getElementById('cancel-member').classList.add('hidden'); const prev=document.getElementById('member-preview'); if(prev) prev.innerHTML=''; const mf=document.getElementById('mem-photo-file'); if(mf) mf.value=''; }
    if(type==='services' || type==='service'){ document.getElementById('service-title').value=''; document.getElementById('service-desc').value=''; document.getElementById('add-service').textContent='Agregar servicio'; document.getElementById('cancel-service').classList.add('hidden'); delete adminEdit.serviceIndex; }
    // gallery cancel/cleanup removed (no manual gallery controls)
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Contact form handling
  function bindContact(){
    const form = document.getElementById('contact-form');
    if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const d = readData();
      const msg = {id:uid(),name:form['contact-name'].value,email:form['contact-email'].value,phone:form['contact-phone'].value,message:form['contact-message'].value,date:new Date().toISOString()};
      d.contacts = d.contacts||[]; d.contacts.push(msg); writeData(d); document.getElementById('contact-sent').textContent='Mensaje enviado. Gracias.'; form.reset();
    });
  }

  // Admin utilities
  function getAdminPass(){return localStorage.getItem(ADMIN_PASS_KEY) || 'admin123'}
  function setAdminPass(p){localStorage.setItem(ADMIN_PASS_KEY,p)}

  // Ensure default admin password exists (do not overwrite if already set)
  if(!localStorage.getItem(ADMIN_PASS_KEY)) setAdminPass('admin123');
  if(!localStorage.getItem(ADMIN_EMAIL_KEY)) setAdminEmail('root@gmail.com');

  function getAdminEmail(){ return localStorage.getItem(ADMIN_EMAIL_KEY) || 'root@gmail.com' }
  function setAdminEmail(e){ localStorage.setItem(ADMIN_EMAIL_KEY, e) }

  function initAdmin(){
    const loginPanel = document.getElementById('login-panel');
    const adminPanel = document.getElementById('admin-panel');
    if(!loginPanel) return;
    document.getElementById('login-btn').addEventListener('click', ()=>{
      const valPass = document.getElementById('admin-pass').value;
      const valEmail = (document.getElementById('admin-email') && document.getElementById('admin-email').value || '').trim().toLowerCase();
      if(valPass===getAdminPass() && valEmail===getAdminEmail()){ loginPanel.classList.add('hidden'); adminPanel.classList.remove('hidden'); loadAdminData(); }
      else showAlert('Correo o contraseña incorrectos','error');
    });
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.addEventListener('click', ()=>{ adminPanel.classList.add('hidden'); loginPanel.classList.remove('hidden'); });
  }

  function loadAdminData(){
    const d = readData();
    document.getElementById('edit-mision').value = d.mision||'';
    document.getElementById('edit-vision').value = d.vision||'';
    document.getElementById('edit-valores').value = (d.valores||[]).join('\n');
    document.getElementById('edit-politica').value = d.politica||'';
    document.getElementById('edit-objetivos').value = (d.objetivos||[]).join('\n');
    document.getElementById('edit-objetivos-calidad').value = (d.objetivos_calidad||[]).join('\n');

    // bind saves
    document.getElementById('save-about').addEventListener('click', ()=>{
      d.mision = document.getElementById('edit-mision').value;
      d.vision = document.getElementById('edit-vision').value;
      d.valores = document.getElementById('edit-valores').value.split('\n').map(s=>s.trim()).filter(Boolean);
      d.politica = document.getElementById('edit-politica').value;
      d.objetivos = document.getElementById('edit-objetivos').value.split('\n').map(s=>s.trim()).filter(Boolean);
      d.objetivos_calidad = document.getElementById('edit-objetivos-calidad').value.split('\n').map(s=>s.trim()).filter(Boolean);
      writeData(d); renderPublic(); showAlert('Guardado','success');
    });

    // Noticias (soporta URL o subida de archivo) - añade y edita
    const addNewsBtn = document.getElementById('add-news');
    if(addNewsBtn) addNewsBtn.addEventListener('click', async ()=>{
      const t=document.getElementById('news-title').value, b=document.getElementById('news-body').value, dt=document.getElementById('news-date').value||(new Date()).toISOString().slice(0,10);
      if(!t||!b) return showAlert('Título y contenido requeridos','error');
      let img = document.getElementById('news-image-url').value || '';
      const f = document.getElementById('news-image-file');
      if(f && f.files && f.files[0]){ try{ img = await readFileAsDataURL(f.files[0]); }catch(e){console.error(e);} }
      d.news=d.news||[];
      if(adminEdit['news']){
        const id = adminEdit['news']; const item = d.news.find(x=>x.id===id);
        if(item){ item.title=t; item.body=b; item.date=dt; item.image=img; showAlert('Noticia actualizada','success'); }
        delete adminEdit['news']; document.getElementById('add-news').textContent='Agregar noticia'; document.getElementById('cancel-news').classList.add('hidden');
      } else {
        d.news.push({id:uid(),title:t,body:b,date:dt,image:img});
        // if image provided, also add to gallery
        if(img){ d.gallery = d.gallery || []; if(!d.gallery.includes(img)) d.gallery.push(img); }
        showAlert('Noticia agregada','success');
      }
      writeData(d); renderPublic(); loadAdminLists();
      // clear form for next entry
      document.getElementById('news-title').value=''; document.getElementById('news-body').value=''; document.getElementById('news-date').value=''; document.getElementById('news-image-url').value=''; const np=document.getElementById('news-preview'); if(np) np.innerHTML=''; const newsFile = document.getElementById('news-image-file'); if(newsFile) newsFile.value='';
    });
    const newsFileInput = document.getElementById('news-image-file'); if(newsFileInput) newsFileInput.addEventListener('change', async ()=>{ const f=newsFileInput.files[0]; const prev=document.getElementById('news-preview'); if(f){ try{ const data = await readFileAsDataURL(f); if(prev){ prev.innerHTML=`<img src="${data}" alt="preview">`; const btn=document.createElement('button'); btn.className='btn muted remove-img'; btn.textContent='Quitar'; btn.style.marginTop='8px'; btn.addEventListener('click', ()=>{ newsFileInput.value=''; document.getElementById('news-image-url').value=''; prev.innerHTML=''; }); prev.appendChild(btn); } }catch(e){console.error(e);} } else { if(prev) prev.innerHTML=''; } });

    const addProj = document.getElementById('add-proj'); if(addProj) addProj.addEventListener('click', ()=>{
      const t=document.getElementById('proj-title').value,desc=document.getElementById('proj-desc').value,date=document.getElementById('proj-date').value,status=document.getElementById('proj-status').value;
      if(!t) return showAlert('Título requerido','error'); d.projects=d.projects||[];
      if(adminEdit['project']){ const id=adminEdit['project']; const item=d.projects.find(x=>x.id===id); if(item){ item.title=t; item.desc=desc; item.date=date; item.status=status; showAlert('Proyecto actualizado','success'); } delete adminEdit['project']; document.getElementById('add-proj').textContent='Agregar proyecto'; document.getElementById('cancel-proj').classList.add('hidden'); }
      else { d.projects.push({id:uid(),title:t,desc:desc,date:date,status:status}); showAlert('Proyecto agregado','success'); }
      writeData(d); renderPublic(); loadAdminLists();
      // clear project form
      document.getElementById('proj-title').value=''; document.getElementById('proj-desc').value=''; document.getElementById('proj-date').value=''; document.getElementById('proj-status').value='En curso';
    });

    const addEventBtn = document.getElementById('add-event'); if(addEventBtn) addEventBtn.addEventListener('click', ()=>{
      const t=document.getElementById('evt-title').value,dt=document.getElementById('evt-date').value,desc=document.getElementById('evt-desc').value;
      if(!t) return showAlert('Título requerido','error'); d.events=d.events||[];
      if(adminEdit['event']){ const id=adminEdit['event']; const item=d.events.find(x=>x.id===id); if(item){ item.title=t; item.date=dt; item.desc=desc; showAlert('Evento actualizado','success'); } delete adminEdit['event']; document.getElementById('add-event').textContent='Agregar evento'; document.getElementById('cancel-event').classList.add('hidden'); }
      else { d.events.push({id:uid(),title:t,date:dt,desc:desc}); showAlert('Evento agregado','success'); }
      writeData(d); renderPublic(); loadAdminLists();
      // clear event form
      document.getElementById('evt-title').value=''; document.getElementById('evt-date').value=''; document.getElementById('evt-desc').value='';
    });

    const addMemberBtn = document.getElementById('add-member');
    if(addMemberBtn) addMemberBtn.addEventListener('click', async ()=>{
      const name=document.getElementById('mem-name').value,role=document.getElementById('mem-role').value,email=document.getElementById('mem-email').value,phone=document.getElementById('mem-phone').value;
      if(!name) return showAlert('Nombre requerido','error');
      let photo = document.getElementById('mem-photo-url').value || '';
      const mf = document.getElementById('mem-photo-file');
      if(mf && mf.files && mf.files[0]){ try{ photo = await readFileAsDataURL(mf.files[0]); }catch(e){console.error(e);} }
      d.members=d.members||[];
      if(adminEdit['member']){ const id=adminEdit['member']; const item=d.members.find(x=>x.id===id); if(item){ item.name=name; item.role=role; item.email=email; item.phone=phone; item.photo=photo; showAlert('Integrante actualizado','success'); } delete adminEdit['member']; document.getElementById('add-member').textContent='Agregar integrante'; document.getElementById('cancel-member').classList.add('hidden'); }
      else { d.members.push({id:uid(),name,role,email,phone,photo}); showAlert('Integrante agregado','success'); }
      writeData(d); renderPublic(); loadAdminLists();
      // clear member form
      document.getElementById('mem-name').value=''; document.getElementById('mem-role').value=''; document.getElementById('mem-email').value=''; document.getElementById('mem-phone').value=''; document.getElementById('mem-photo-url').value=''; const mfCle=document.getElementById('mem-photo-file'); if(mfCle) mfCle.value=''; const mprev=document.getElementById('member-preview'); if(mprev) mprev.innerHTML='';
    });
    const memFileInput = document.getElementById('mem-photo-file'); if(memFileInput) memFileInput.addEventListener('change', async ()=>{ const f=memFileInput.files[0]; const prev=document.getElementById('member-preview'); if(f){ try{ const data=await readFileAsDataURL(f); if(prev){ prev.innerHTML=`<img src="${data}" alt="preview">`; const btn=document.createElement('button'); btn.className='btn muted remove-img'; btn.textContent='Quitar'; btn.style.marginTop='8px'; btn.addEventListener('click', ()=>{ memFileInput.value=''; document.getElementById('mem-photo-url').value=''; prev.innerHTML=''; }); prev.appendChild(btn); } }catch(e){console.error(e);} } else { if(prev) prev.innerHTML=''; } });

    // Galería: ya no se edita manualmente desde el admin. Se alimenta desde imágenes subidas en Noticias/AESFACT/Proyectos.

    const addSvc = document.getElementById('add-service'); if(addSvc) addSvc.addEventListener('click', ()=>{
      const t=document.getElementById('service-title').value, desc=document.getElementById('service-desc').value; if(!t) return showAlert('Título requerido','error'); d.services=d.services||[];
      if(typeof adminEdit.serviceIndex==='number'){ d.services[adminEdit.serviceIndex]={title:t,desc}; delete adminEdit.serviceIndex; document.getElementById('add-service').textContent='Agregar servicio'; document.getElementById('cancel-service').classList.add('hidden'); showAlert('Servicio actualizado','success'); }
      else { d.services.push({title:t,desc}); showAlert('Servicio agregado','success'); }
      writeData(d); renderPublic(); loadAdminLists();
      // clear service form
      document.getElementById('service-title').value=''; document.getElementById('service-desc').value='';
    });

    // AESFACT save (imagen + año)
    const saveA = document.getElementById('save-aesfact');
    if(saveA){
      saveA.addEventListener('click', async ()=>{
        let img = document.getElementById('aesfact-image-url').value || '';
        const af = document.getElementById('aesfact-image-file');
        if(af && af.files && af.files[0]){ try{ img = await readFileAsDataURL(af.files[0]); }catch(e){console.error(e);} }
        d.aesfact = d.aesfact||{}; d.aesfact.image = img; d.aesfact.year = document.getElementById('aesfact-year').value || d.aesfact.year || '';
        // agregar imagen a galería si no está duplicada
        if(img){ d.gallery = d.gallery || []; if(!d.gallery.includes(img)) d.gallery.push(img); }
        writeData(d); renderPublic(); showAlert('Guardado AESFACT','success');
      });
      const aesFile = document.getElementById('aesfact-image-file'); if(aesFile) aesFile.addEventListener('change', async ()=>{ const f=aesFile.files[0]; const prev=document.getElementById('aesfact-preview'); if(f){ try{ const data=await readFileAsDataURL(f); if(prev){ prev.innerHTML=`<img src="${data}" alt="preview">`; const btn=document.createElement('button'); btn.className='btn muted remove-img'; btn.textContent='Quitar'; btn.style.marginTop='8px'; btn.addEventListener('click', ()=>{ aesFile.value=''; document.getElementById('aesfact-image-url').value=''; prev.innerHTML=''; }); prev.appendChild(btn); } }catch(e){console.error(e);} } else { if(prev) prev.innerHTML=''; } });
    }

    // populate aesfact fields (admin page)
    if(document.getElementById('aesfact-year')) document.getElementById('aesfact-year').value = (d.aesfact && d.aesfact.year) || '';

    // cancel buttons
    const cNews = document.getElementById('cancel-news'); if(cNews) cNews.addEventListener('click', ()=>cancelEdit('news'));
    const cProj = document.getElementById('cancel-proj'); if(cProj) cProj.addEventListener('click', ()=>cancelEdit('project'));
    const cEvt = document.getElementById('cancel-event'); if(cEvt) cEvt.addEventListener('click', ()=>cancelEdit('event'));
    const cMem = document.getElementById('cancel-member'); if(cMem) cMem.addEventListener('click', ()=>cancelEdit('member'));
    const cSvc = document.getElementById('cancel-service'); if(cSvc) cSvc.addEventListener('click', ()=>cancelEdit('service'));

    loadAdminLists();
  }

  function loadAdminLists(){
    const d=readData();
    const newsAdmin=document.getElementById('news-admin-list'); newsAdmin.innerHTML=''; (d.news||[]).forEach(n=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<strong>${escapeHtml(n.title)}</strong> <small class="muted">${n.date}</small><div><button data-id="${n.id}" class="edit-news btn">Editar</button> <button data-id="${n.id}" class="del-news btn muted">Eliminar</button></div>`;newsAdmin.appendChild(el)});
    newsAdmin.querySelectorAll('.del-news').forEach(b=>b.addEventListener('click', e=>{ const id=b.getAttribute('data-id'); const deletedNews=d.news.find(x=>x.id===id); if(deletedNews && deletedNews.image){ d.gallery=d.gallery.filter(img=>img!==deletedNews.image); } d.news=d.news.filter(x=>x.id!==id); writeData(d); renderPublic(); loadAdminLists(); showAlert('Noticia eliminada','success'); }));
    newsAdmin.querySelectorAll('.edit-news').forEach(b=>b.addEventListener('click', e=>{ const id=b.getAttribute('data-id'); startEdit('news',id); }));

    const projAdmin=document.getElementById('proj-admin-list'); projAdmin.innerHTML=''; (d.projects||[]).forEach(p=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<strong>${escapeHtml(p.title)}</strong> <small>${p.status}</small><div><button data-id="${p.id}" class="edit-proj btn">Editar</button> <button data-id="${p.id}" class="del-proj btn muted">Eliminar</button></div>`;projAdmin.appendChild(el)});
    projAdmin.querySelectorAll('.del-proj').forEach(b=>b.addEventListener('click', ()=>{ const id=b.getAttribute('data-id'); d.projects=d.projects.filter(x=>x.id!==id); writeData(d); renderPublic(); loadAdminLists(); showAlert('Proyecto eliminado','success'); }));
    projAdmin.querySelectorAll('.edit-proj').forEach(b=>b.addEventListener('click', ()=>{ const id=b.getAttribute('data-id'); startEdit('project',id); }));

    const evtAdmin=document.getElementById('event-admin-list'); evtAdmin.innerHTML=''; (d.events||[]).forEach(ev=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<strong>${escapeHtml(ev.title)}</strong> <small>${ev.date}</small><div><button data-id="${ev.id}" class="edit-ev btn">Editar</button> <button data-id="${ev.id}" class="del-ev btn muted">Eliminar</button></div>`;evtAdmin.appendChild(el)});
    evtAdmin.querySelectorAll('.del-ev').forEach(b=>b.addEventListener('click', ()=>{ const id=b.getAttribute('data-id'); d.events=d.events.filter(x=>x.id!==id); writeData(d); renderPublic(); loadAdminLists(); showAlert('Evento eliminado','success'); }));
    evtAdmin.querySelectorAll('.edit-ev').forEach(b=>b.addEventListener('click', ()=>{ const id=b.getAttribute('data-id'); startEdit('event',id); }));

    const memAdmin=document.getElementById('member-admin-list'); memAdmin.innerHTML=''; (d.members||[]).forEach(m=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<strong>${escapeHtml(m.name)}</strong> <small class="muted">${escapeHtml(m.role)}</small><div><button data-id="${m.id}" class="edit-mem btn">Editar</button> <button data-id="${m.id}" class="del-mem btn muted">Eliminar</button></div>`;memAdmin.appendChild(el)});
    memAdmin.querySelectorAll('.del-mem').forEach(b=>b.addEventListener('click', ()=>{ const id=b.getAttribute('data-id'); d.members=d.members.filter(x=>x.id!==id); writeData(d); renderPublic(); loadAdminLists(); showAlert('Integrante eliminado','success'); }));
    memAdmin.querySelectorAll('.edit-mem').forEach(b=>b.addEventListener('click', ()=>{ const id=b.getAttribute('data-id'); startEdit('member',id); }));

    // gallery list removed from admin — the public gallery is populated from images uploaded via other sections

    const svcAdmin=document.getElementById('service-admin-list'); svcAdmin.innerHTML=''; (d.services||[]).forEach((s,i)=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<strong>${escapeHtml(s.title)}</strong><div><button data-idx="${i}" class="edit-svc btn">Editar</button> <button data-idx="${i}" class="del-svc btn muted">Eliminar</button></div>`;svcAdmin.appendChild(el)});
    svcAdmin.querySelectorAll('.del-svc').forEach(b=>b.addEventListener('click', ()=>{ const i=parseInt(b.getAttribute('data-idx')); d.services.splice(i,1); writeData(d); renderPublic(); loadAdminLists(); showAlert('Servicio eliminado','success'); }));
    svcAdmin.querySelectorAll('.edit-svc').forEach(b=>b.addEventListener('click', e=>{ const i=parseInt(b.getAttribute('data-idx')); startEdit('service',i); }));
  }

  // Sincronización en tiempo real entre pestañas (evento storage)
  window.addEventListener('storage', e=>{ if(e.key===STORAGE_KEY) renderPublic(); });

  // Inicialización
  document.addEventListener('DOMContentLoaded', ()=>{
    renderSidebar(); renderPublic(); bindContact(); initAdmin(); bindSidebar();
  });

  function renderSidebar(){
    const nav = document.getElementById('sidebar-nav'); if(!nav) return;
    const items = [ ['Inicio','index.html'], ['Nosotros','about.html'], ['Servicios','services.html'], ['Proyectos','projects.html'], ['Eventos','events.html'], ['Noticias','news.html'], ['Galería','gallery.html'], ['Integrantes','members.html'], ['Contacto','contact.html'] ];
    nav.innerHTML=''; items.forEach(it=>{ const a=document.createElement('a'); a.href=it[1]; a.textContent=it[0]; nav.appendChild(a); });
  }

  function bindSidebar(){
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(!toggle || !sidebar) return;
    toggle.addEventListener('click', ()=>{ sidebar.classList.toggle('open'); overlay.classList.toggle('open'); });
    overlay.addEventListener('click', ()=>{ sidebar.classList.remove('open'); overlay.classList.remove('open'); });
    sidebar.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{ sidebar.classList.remove('open'); overlay.classList.remove('open'); }));
  }

  function renderNav(){
    const nav = document.getElementById('main-nav'); if(!nav) return;
    const items = [ ['Inicio','#hero'], ['Nosotros','#about'], ['Servicios','#services'], ['Proyectos','#projects'], ['Eventos','#events'], ['Noticias','#news'], ['Galería','#gallery'], ['Integrantes','#members'], ['Contacto','#contact'] ];
    nav.innerHTML=''; items.forEach(it=>{ const a=document.createElement('a'); a.href=it[1]; a.textContent=it[0]; nav.appendChild(a); });
  }

})();
