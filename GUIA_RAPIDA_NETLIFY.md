# 📚 TUTORIAL COMPLETO: SUBIR A NETLIFY EN 15 MINUTOS

**Tu sitio está 100% listo para producción. Solo sigue estos pasos.**

---

## ⚡ RESUMEN RÁPIDO

```
1. GitHub (Sign Up) ..................... 2 min
2. GitHub (Crear repo + subir archivos) . 5 min
3. Netlify (Sign Up) .................... 1 min
4. Netlify (Deploy automático) .......... 3 min
5. ¡Tu sitio online! .................... ✅
```

**Tiempo total: 15 minutos**

---

## 📋 PREPARACIÓN (YA ESTÁ HECHA)

✅ Carpeta `usuario/` eliminada  
✅ Archivo `netlify.toml` creado  
✅ Archivo `.gitignore` creado  
✅ Todo listo para GitHub  

**NO TOQUES NADA, SOLO SIGUE LOS PASOS**

---

---

# PASO 1️⃣: CREAR CUENTA EN GITHUB (2 MINUTOS)

## 1.1 Abre GitHub

👉 Ve a: **https://github.com**

## 1.2 Haz clic en "Sign up"

- Segunda opción en la esquina superior derecha
- Email cualquiera (puede ser gmail, hotmail, etc)
- Contraseña fuerte
- Username: `tu-nombre` (ej: `juan-perez`)

## 1.3 Verificación

- Verifica tu email
- Completa el pequeño quiz de GitHub
- ✅ **Cuenta creada**

---

---

# PASO 2️⃣: CREAR REPOSITORIO Y SUBIR ARCHIVOS (5 MINUTOS)

## 2.1 Crea un nuevo repositorio

1. En GitHub, haz clic en **"+"** (arriba a la derecha)
2. Selecciona **"New repository"**

## 2.2 Configura el repositorio

Llena así:

```
Repository name: aesfact-web
Description: Sitio web AESFACT - UGB
Visibility: PUBLIC (IMPORTANTE)
Initialize with README: NO (sin marcar)
```

3. Haz clic en **"Create repository"**

## 2.3 Sube tus archivos

**Verás una pantalla con opciones.**

Busca el botón que dice "uploading an existing file"

ALTERNATIVAmente:
- Haz clic en botón "Add file"
- Selecciona "Upload files"

## 2.4 Selecciona los archivos

**Abre tu carpeta: `e:\AESFACT - SITIO WEB\`**

Copia y pega TODOS estos archivos al navegador:

### Archivos HTML:
- `index.html`
- `about.html`
- `admin.html`
- `contact.html`
- `events.html`
- `gallery.html`
- `members.html`
- `news.html`
- `projects.html`
- `services.html`
- `initialize.html`
- `diagnostico.html`

### Carpetas (completitas):
- `css/` (con `styles.css`)
- `js/` (con `app.js`)
- `img/` (con `Logo.jpg`)

### Otros archivos:
- `netlify.toml`
- `.gitignore`
- `README.md`

**💡 TIP**: Si tu explorador de archivos y GitHub te permiten, simplemente **arrastra toda la carpeta**.

## 2.5 Confirma la subida

1. Haz clic en **"Commit changes"** (botón verde abajo)
2. Escribe un comentario: "Initial commit"
3. Haz clic en **"Commit changes"** de nuevo

✅ **Tu proyecto está en GitHub**

---

---

# PASO 3️⃣: CREAR CUENTA EN NETLIFY (1 MINUTO)

👉 Ve a: **https://netlify.com**

1. Haz clic en **"Sign up"**
2. Selecciona **"GitHub"**
3. Autoriza Netlify (permite conectar a GitHub)
4. ✅ **Cuenta creada**

---

---

# PASO 4️⃣: DESPLEGAR CON NETLIFY (3 MINUTOS)

## 4.1 Nuevo sitio desde Git

1. En Netlify, haz clic en **"New site from Git"** (botón azul grande)
2. Selecciona **"GitHub"**
3. Se abrirá una ventana para autorizar
4. Autoriza Netlify para acceder a GitHub

## 4.2 Busca tu repositorio

1. Busca y selecciona: **`aesfact-web`** (el que acabas de crear)

## 4.3 Configuración de deploy

**Déjalo TODO por defecto:**

```
Branch to deploy: main
Build command: (vacío)
Publish directory: . (un punto)
```

Simplemente haz clic en **"Deploy site"** (botón azul)

## 4.4 Espera...

Netlify empezará a desplegar:

- 🟡 Building... (esperando)
- 🟡 Deploying... (subiendo)
- 🟢 Published! (¡HECHO!)

En 1-2 minutos verás un **checkmark verde** ✅

---

---

# PASO 5️⃣: ACCEDE A TU SITIO (¡AHORA!)

Netlify te dará una URL como:

```
https://aesfact-abc123xyz.netlify.app
```

## 5.1 Abre tu sitio

Copia esa URL en el navegador.

**¡BOOM 💥 Tu sitio está online!**

---

---

# ✨ CAMBIAR EL NOMBRE DEL SITIO (OPCIONAL)

Por defecto es: `aesfact-abc123xyz.netlify.app`

Si quieres algo más bonito:

1. En Netlify, ve a **"Site settings"**
2. Haz clic en **"Change site name"**
3. Escribe: `aesfact-ugb` (o lo que quieras)
4. Tu nueva URL: `https://aesfact-ugb.netlify.app`

---

---

# 🎯 AHORA PRUEBA TODO

## Panel Admin

Ve a: `https://tu-sitio.netlify.app/admin.html`

Ingresa:
```
Email: root@gmail.com
Contraseña: admin123
```

✅ Agrega una noticia de prueba  
✅ Verifica que aparezca en `/news.html`  
✅ Verifica que aparezca en el carrusel del inicio  
✅ Verifica que aparezca en la galería  

**¡Si funciona todo = ÉXITO! 🎉**

---

---

# ⚠️ SI ALGO NO FUNCIONA

## El sitio se ve cortado/roto

**Solución:**
1. En tu computadora, borra cache del navegador (Ctrl + Shift + Delete)
2. Recarga la página (Ctrl + F5)
3. Abre en incógnita (Ctrl + Shift + N)

## Las noticias no se guardan

**Expected**: Los datos se guardan localmente por dispositivo/navegador

Si agregas una noticia desde una computadora, otra computadora NO la verá. (Esto es normal con localStorage)

## Script no funciona

1. Abre "Inspeccionar" (F12)
2. Ve a pestaña "Console"
3. Busca errores en rojo
4. Copia el error y contacta soporte

---

---

# 🔄 ACTUALIZAR EL SITIO (DESPUES)

Si haces cambios y quieres actualizar:

1. Edita los archivos en tu computadora
2. Sube a GitHub (arrastra archivos o usa Git)
3. Netlify **automáticamente** despliega los cambios

**No necesitas hacer nada más. Es totalmente automático.**

---

---

# 🔐 SEGURIDAD

### Cambiar contraseña del admin

1. Panel admin → Sección "Nosotros"
2. Edita email y contraseña
3. Guarda

**Ahora necesitarás la NUEVA contraseña para entrar**

---

---

# 📞 RESUMEN DE URLs

| Página | URL |
|--------|-----|
| Inicio | `https://aesfact-ugb.netlify.app/` |
| Nosotros | `/about.html` |
| Noticias | `/news.html` |
| Galería | `/gallery.html` |
| Contacto | `/contact.html` |
| **Admin** | `/admin.html` |

---

---

# ✅ CHECKLIST FINAL

- [ ] GitHub cuenta creada
- [ ] Repositorio creado
- [ ] Archivos subidos a GitHub
- [ ] Netlify cuenta creada
- [ ] Deploy completado
- [ ] Sitio online
- [ ] Panel admin accesible
- [ ] Admin funciona
- [ ] Noticias se guardan
- [ ] Todo funciona ✨

---

---

# 🎉 ¡LISTO!

**Tu sitio está online y funcional. Todo el código está en GitHub y desplegado en Netlify.**

- Cambios en GitHub = Actualización automática en Netlify
- Datos guardados en navegador = Persistentes por dispositivo
- Admin seguro = Email + contraseña

**¿Necesitas ayuda en algún paso? Contacta soporte.**

---

**AESFACT 2026 - Sitio Oficial ✨**
