// Cargar librería de Supabase en el script
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.1/dist/module.js';
script.type = 'module';
script.onload = initSupabase;
document.head.appendChild(script);

const SUPABASE_URL = 'https://yhikslflzazeodazxpyz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u3ja3ooD5-UrZZbeiYCLJA_MTz3B9yf';
const ADMIN_PASS_KEY = 'aesfact_admin_pass_v1';
const ADMIN_EMAIL_KEY = 'aesfact_admin_email_v1';

let supabase = null;

async function initSupabase() {
  const { createClient } = window.supabase;
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Supabase initialized');
  
  // Reemplazar funciones de localStorage con Supabase
  window.readData = readDataSupabase;
  window.writeData = writeDataSupabase;
  
  // Inicializar la página
  document.dispatchEvent(new Event('supbaseReady'));
}

async function readDataSupabase(){
  if(!supabase) return {};
  try {
    const { data: config } = await supabase.from('config').select('*');
    const { data: news } = await supabase.from('news').select('*');
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: events } = await supabase.from('events').select('*');
    const { data: members } = await supabase.from('members').select('*');
    const { data: services } = await supabase.from('services').select('*');
    const { data: aesfactData } = await supabase.from('aesfact').select('*').eq('id', 'aesfact').single();
    
    const configObj = {};
    if(config) config.forEach(c=>configObj[c.key]=c.value);
    
    return {
      mision: configObj.mision || 'Somos la Asociación de Estudiantes de la Facultad de Ciencia y Tecnología...',
      vision: configObj.vision || 'Ser una asociación estudiantil referente...',
      valores: configObj.valores ? JSON.parse(configObj.valores) : [],
      politica: configObj.politica || '',
      objetivos: configObj.objetivos ? JSON.parse(configObj.objetivos) : [],
      objetivos_calidad: configObj.objetivos_calidad ? JSON.parse(configObj.objetivos_calidad) : [],
      news: news || [],
      projects: projects || [],
      events: events || [],
      members: members || [],
      services: services || [],
      gallery: [],
      aesfact: aesfactData || { id: 'aesfact', year: new Date().getFullYear().toString(), image: '' },
      contacts: []
    };
  } catch(e){
    console.error('Error leyendo datos de Supabase:', e);
    return {
      mision: '', vision: '', valores: [], politica: '', objetivos: [], 
      objetivos_calidad: [], services: [], news: [], projects: [], events: [],
      gallery: [], members: [], aesfact: {}, contacts: []
    };
  }
}

async function writeDataSupabase(d){
  if(!supabase) return;
  try {
    // Guardar config
    const configPairs = [
      { key: 'mision', value: d.mision },
      { key: 'vision', value: d.vision },
      { key: 'valores', value: JSON.stringify(d.valores||[]) },
      { key: 'politica', value: d.politica },
      { key: 'objetivos', value: JSON.stringify(d.objetivos||[]) },
      { key: 'objetivos_calidad', value: JSON.stringify(d.objetivos_calidad||[]) }
    ];
    
    for(let pair of configPairs){
      await supabase.from('config').upsert({ key: pair.key, value: pair.value }, { onConflict: 'key' });
    }
    
    // Guardar AESFACT
    if(d.aesfact){
      await supabase.from('aesfact').upsert({ 
        id: 'aesfact', 
        year: d.aesfact.year, 
        image: d.aesfact.image 
      }, { onConflict: 'id' });
    }
  } catch(e){
    console.error('Error guardando datos en Supabase:', e);
  }
}

// Escuchar cuando sea seguro hacer readData
document.addEventListener('supbaseReady', () => {
  console.log('Supabase ready, cargando datos...');
});
