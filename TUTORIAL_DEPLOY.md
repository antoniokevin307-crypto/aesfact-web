# 📚 TUTORIAL COMPLETO: SUBIR AESFACT A LA WEB

## 🔍 ANÁLISIS DE TU PROYECTO

**¿Tienes base de datos?** ❌ NO
- Tu sitio usa **localStorage** (almacenamiento en el navegador del usuario)
- Los datos se guardan solo en ese dispositivo/navegador
- No hay servidor backend

**¿Necesitas base de datos?** Depende:
- ✅ **YA FUNCIONA AHORA**: El admin puede agregar noticias, proyectos, etc. desde un dispositivo
- ⚠️ **LIMITACIÓN**: Si abres desde otra computadora, no verá las mismas noticias
- 🎯 **RECOMENDACIÓN**: Por ahora sube a Netlify (es gratis y funcional). Luego agrega Firebase si necesitas compartir datos

---

## 🚀 PASO A PASO: SUBIR A NETLIFY (GRATIS)

### **PASO 1: Preparar tu proyecto**

1. Abre tu carpeta de proyecto: `e:\AESFACT - SITIO WEB\`
2. **ELIMINA estas carpetas** (no las necesitas):
   - `usuario/` (vacía)
3. **MANTÉN:**
   - Todos los .html
   - Carpeta `css/`
   - Carpeta `img/`
   - Carpeta `js/`

---

### **PASO 2: Crear cuenta en GitHub (Gratis)**

1. Ve a **https://github.com**
2. Haz clic en "Sign up"
3. Completa:
   - Email
   - Contraseña
   - Username (ej: `tu-usuario-aesfact`)
4. Verifica tu email
5. ✅ **Cuenta creada**

---

### **PASO 3: Subir tu proyecto a GitHub**

####  **Opción A (MÁS FÁCIL - con interfaz web):**

1. En GitHub, haz clic en **"+"** arriba a la derecha
2. Selecciona **"New repository"**
3. Llena:
   - **Repository name**: `aesfact-web`
   - **Description**: `Sitio web AESFACT - UGB`
   - **Public** (selecciona esto)
   - Haz clic en **"Create repository"**

4. Ahora verás un botón **"uploading an existing file"** (o similar)
5. Copia TODOS los archivos de `e:\AESFACT - SITIO WEB\` y **arrastra** a esa ventana:
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
   - Carpetas: `css/`, `img/`, `js/`

6. Haz clic en **"Commit changes"**
7. ✅ **Proyecto en GitHub**

---

### **PASO 4: Conectar Netlify (Hosting Gratuito)**

1. Ve a **https://netlify.com**
2. Haz clic en **"Sign up"**
3. Selecciona **"GitHub"**
4. Autoriza Netlify a acceder a GitHub
5. Haz clic en **"New site from Git"**
6. Selecciona **"GitHub"**
7. Busca y selecciona tu repositorio: **`aesfact-web`**
8. Déjalo con los valores por defecto:
   - **Branch to deploy**: `main`
   - **Build command**: (dejar vacío)
   - **Publish directory**: `.` (punto)
9. Haz clic en **"Deploy site"**
10. **¡LISTO!** En 1-2 minutos tu sitio estará online 🎉

---

### **PASO 5: Acceder a tu sitio**

1. Espera a que termine el deploy (verás un checkmark verde)
2. Netlify te dará una URL como: `https://aesfact-xyz.netlify.app`
3. ¡Abre la URL! Tu sitio está online 🌐

**Para cambiar el nombre del sitio:**
1. En Netlify, ve a **"Site settings"**
2. Click en **"Change site name"**
3. Escribe algo como: `aesfact-ugb`
4. ¡Listo! Tu URL será: `https://aesfact-ugb.netlify.app`

---

## 🎯 ¿CÓMO FUNCIONA AHORA?

### **En tu computadora (LOCAL):**
- Admin guarda datos en tu navegador
- Abres otra pestaña → ves tus datos
- Pero otro usuario en otra computadora NO ve tus datos

### **En Netlify (ONLINE):**
- Totalmente igual, pero accesible desde cualquier lugar
- El admin puede agregar noticias desde `https://tudominio.netlify.app/admin.html`
- Otros ven las noticias en `https://tudominio.netlify.app/news.html`
- ⚠️ **PERO**: Si otro usuario usa otra computadora, NO verá las noticias que tu agregaste

---

## 🔥 ¿NECESITAS QUE LAS NOTICIAS SE COMPARTAN ENTRE USUARIOS?

### **Opción 1: SIN Firebase (AHORA RECOMENDADO)**
✅ **Pros:**
- Funciona perfectamente
- Supeeerrápido
- Sin costos aún

❌ **Contras:**
- Datos locales por dispositivo

### **Opción 2: CON Firebase (DESPUÉS)**
✅ **Pros:**
- Noticias se ven en todas las computadoras
- Base de datos en la nube
- Datos permanentes

❌ **Contras:**
- Requiere cambios en el código
- Pequeñó aprendizaje

---

## ✅ RESUMEN DE PASOS

```
1. GitHub (Sign up) ← 2 minutos
2. GitHub (Crear repo + subir archivos) ← 5 minutos
3. Netlify (Sign up) ← 1 minuto
4. Netlify (Conectar GitHub) ← 2 minutos
5. Deploy automático ← 1-2 minutos
6. ¡Tu sitio online! 🚀 ← AHORA
```

**Tiempo total: 15 minutos máximo**

---

## 💡 PRÓXIMOS PASOS (OPCIONAL)

Si después quieres:
- **Dominio personalizado**: Cuesta ~$10-15/año (pero Netlify te da uno gratis)
- **Base de datos Firebase**: Te explico cómo agregar (30 minutos)
- **Email automático al contactar**: Formspree (5 minutos, gratis)

---

**¿Necesitas más claridad en algún paso? Avísame y te lo repito más detallado.**

**¿Empezamos? 🚀**
