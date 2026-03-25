// config.js - Configuración para GitHub Pages + Supabase

// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://eowjlgvigsdooflqepxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvd2psZ3ZpZ3Nkb29mbHFlcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDI3OTMsImV4cCI6MjA4OTg3ODc5M30.-4Oi4Kyec0U4aPtpM3TbKLqLK8qEJT_pNw5Z_jmuNJ8';

// Variables globales
let supabaseClient = null;
let configuracion = {};
let grupos = [];
let alumnos = [];
let usuarios = [];
let evaluaciones = [];

// Campos de evaluación
const camposAcademicos = [
    "Lenguaje y Comunicación",
    "Pensamiento Matemático",
    "Exploración y Comprensión del Mundo Social",
    "Socioemocional y Valores"
];

const areasDesarrollo = [
    "Educación Física",
    "Artes"
];

const autonomiaCurricular = [
    "Inglés",
    "Computación"
];

const camposEvaluacion = [...camposAcademicos, ...areasDesarrollo, ...autonomiaCurricular];

const periodos = [
    { clave: "noviembre", nombre: "NOVIEMBRE", momento: "I" },
    { clave: "marzo", nombre: "MARZO", momento: "II" },
    { clave: "julio", nombre: "JULIO", momento: "III" }
];

// ========== INICIALIZACIÓN ==========
async function iniciarSupabase() {
    try {
        console.log("🟡 Inicializando Supabase...");
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase inicializado correctamente");
        return true;
    } catch (error) {
        console.error("❌ Error al inicializar Supabase:", error);
        return false;
    }
}

async function cargarDatos() {
    console.log("🟡 Cargando datos desde Supabase...");
    
    try {
        if (!supabaseClient) {
            await iniciarSupabase();
        }
        
        // Cargar grupos
        const { data: gruposData, error: gruposError } = await supabaseClient.from('grupos').select('*');
        if (gruposError) {
            console.error("❌ Error cargando grupos:", gruposError);
        } else {
            grupos = gruposData || [];
            console.log("✅ Grupos cargados:", grupos.length);
        }
        
        // Cargar alumnos
        const { data: alumnosData, error: alumnosError } = await supabaseClient.from('alumnos').select('*');
        if (alumnosError) {
            console.error("❌ Error cargando alumnos:", alumnosError);
        } else {
            alumnos = alumnosData || [];
            console.log("✅ Alumnos cargados:", alumnos.length);
        }
        
        // Cargar usuarios
        const { data: usuariosData, error: usuariosError } = await supabaseClient.from('usuarios').select('*');
        if (usuariosError) {
            console.error("❌ Error cargando usuarios:", usuariosError);
        } else {
            usuarios = usuariosData || [];
            console.log("✅ Usuarios cargados:", usuarios.length);
        }
        
        // Cargar configuración
        const { data: configData, error: configError } = await supabaseClient.from('configuracion').select('*');
        if (configError) {
            console.error("❌ Error cargando configuración:", configError);
        } else {
            configuracion = configData && configData.length > 0 ? configData[0] : {};
            console.log("✅ Configuración cargada");
        }
        
        // Cargar evaluaciones
        const { data: evaluacionesData, error: evaluacionesError } = await supabaseClient.from('evaluaciones').select('*');
        if (evaluacionesError) {
            console.error("❌ Error cargando evaluaciones:", evaluacionesError);
        } else {
            evaluaciones = evaluacionesData || [];
            console.log("✅ Evaluaciones cargadas:", evaluaciones.length);
        }
        
        console.log("🎉 Todos los datos cargados correctamente");
        return true;
        
    } catch (error) {
        console.error("❌ Error fatal cargando datos:", error);
        return false;
    }
}

// Funciones auxiliares
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function obtenerGrupoPorId(grupoId) {
    return grupos.find(g => g.id === grupoId);
}

function obtenerAlumnosPorGrupo(grupoId) {
    return alumnos.filter(a => a.grupo_id === grupoId);
}

function obtenerEvaluacion(alumnoId) {
    return evaluaciones.find(e => e.alumno_id === alumnoId);
}

function obtenerEstadoBoleta(evaluacion) {
    if (!evaluacion) return { texto: "📝 Sin iniciar", clase: "estado-pendiente" };
    
    let firmados = 0;
    let conContenido = 0;
    
    for (let p of periodos) {
        const pd = evaluacion.periodos?.[p.clave];
        if (pd?.firmada) {
            firmados++;
        } else if (pd && (camposEvaluacion.some(c => pd.campos?.[c] && pd.campos[c].trim() !== "") || (pd.recomendaciones && pd.recomendaciones.trim() !== ""))) {
            conContenido++;
        }
    }
    
    if (firmados === 3) return { texto: "✅ Completa", clase: "estado-completa" };
    if (firmados > 0 || conContenido > 0) return { texto: "⏳ En proceso", clase: "estado-parcial" };
    return { texto: "📝 Sin iniciar", clase: "estado-pendiente" };
}

function mostrarNotificacion(mensaje, tipo) {
    const n = document.createElement("div");
    n.className = `alert alert-${tipo}`;
    n.textContent = mensaje;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// Funciones para guardar
async function guardarEvaluacion(evaluacion) {
    const { data, error } = await supabaseClient
        .from('evaluaciones')
        .upsert([evaluacion])
        .select();
    if (!error && data) {
        const index = evaluaciones.findIndex(e => e.id === evaluacion.id);
        if (index !== -1) evaluaciones[index] = data[0];
        else evaluaciones.push(data[0]);
        return data[0];
    }
    return evaluacion;
}

async function guardarAlumno(alumno) {
    const { data, error } = await supabaseClient
        .from('alumnos')
        .upsert([alumno])
        .select();
    if (!error && data) {
        const index = alumnos.findIndex(a => a.id === alumno.id);
        if (index !== -1) alumnos[index] = data[0];
        else alumnos.push(data[0]);
        return data[0];
    }
    return alumno;
}

async function eliminarAlumno(id) {
    const { error } = await supabaseClient
        .from('alumnos')
        .delete()
        .eq('id', id);
    if (!error) {
        alumnos = alumnos.filter(a => a.id !== id);
        evaluaciones = evaluaciones.filter(e => e.alumno_id !== id);
        return true;
    }
    return false;
}

async function guardarGrupo(grupo) {
    const { data, error } = await supabaseClient
        .from('grupos')
        .upsert([grupo])
        .select();
    if (!error && data) {
        const index = grupos.findIndex(g => g.id === grupo.id);
        if (index !== -1) grupos[index] = data[0];
        else grupos.push(data[0]);
        return data[0];
    }
    return grupo;
}

async function eliminarGrupo(id) {
    const { error } = await supabaseClient
        .from('grupos')
        .delete()
        .eq('id', id);
    if (!error) {
        grupos = grupos.filter(g => g.id !== id);
        return true;
    }
    return false;
}

async function guardarUsuario(usuario) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .upsert([usuario])
        .select();
    if (!error && data) {
        const index = usuarios.findIndex(u => u.id === usuario.id);
        if (index !== -1) usuarios[index] = data[0];
        else usuarios.push(data[0]);
        return data[0];
    }
    return usuario;
}

async function eliminarUsuario(id) {
    const { error } = await supabaseClient
        .from('usuarios')
        .delete()
        .eq('id', id);
    if (!error) {
        usuarios = usuarios.filter(u => u.id !== id);
        return true;
    }
    return false;
}

async function actualizarConfiguracion(config) {
    const { data, error } = await supabaseClient
        .from('configuracion')
        .update(config)
        .eq('id', 1)
        .select();
    if (!error && data && data.length > 0) {
        configuracion = data[0];
        return data[0];
    }
    return config;
}

// Exportar al objeto window
window.supabaseClient = supabaseClient;
window.configuracion = configuracion;
window.grupos = grupos;
window.alumnos = alumnos;
window.usuarios = usuarios;
window.evaluaciones = evaluaciones;
window.camposAcademicos = camposAcademicos;
window.areasDesarrollo = areasDesarrollo;
window.autonomiaCurricular = autonomiaCurricular;
window.camposEvaluacion = camposEvaluacion;
window.periodos = periodos;
window.obtenerEvaluacion = obtenerEvaluacion;
window.guardarEvaluacion = guardarEvaluacion;
window.guardarAlumno = guardarAlumno;
window.eliminarAlumno = eliminarAlumno;
window.guardarGrupo = guardarGrupo;
window.eliminarGrupo = eliminarGrupo;
window.guardarUsuario = guardarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.actualizarConfiguracion = actualizarConfiguracion;
window.obtenerGrupoPorId = obtenerGrupoPorId;
window.obtenerAlumnosPorGrupo = obtenerAlumnosPorGrupo;
window.obtenerEstadoBoleta = obtenerEstadoBoleta;
window.mostrarNotificacion = mostrarNotificacion;
window.generarId = generarId;
window.cargarDatos = cargarDatos;

// Inicializar automáticamente
(async function() {
    console.log("🚀 Iniciando config.js...");
    await iniciarSupabase();
    await cargarDatos();
    
    // Actualizar las referencias en window después de cargar
    window.configuracion = configuracion;
    window.grupos = grupos;
    window.alumnos = alumnos;
    window.usuarios = usuarios;
    window.evaluaciones = evaluaciones;
    window.supabaseClient = supabaseClient;
    
    console.log("✅ Config.js listo. Grupos:", grupos.length, "Alumnos:", alumnos.length, "Usuarios:", usuarios.length);
})();
