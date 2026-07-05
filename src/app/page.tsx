'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Activity, 
  Calendar, 
  BookOpen, 
  Send, 
  Plus, 
  AlertCircle, 
  Search,
  Hospital,
  HeartPulse,
  DollarSign,
  Download,
  UserCheck,
  Sliders,
  Settings,
  X,
  Key,
  FileText,
  ChevronRight,
  Mic,
  MicOff,
  Sparkles,
  ArrowUpRight,
  Clock,
  Phone,
  MessageSquare,
  FileUp,
  ExternalLink,
  ChevronDown,
  Volume2,
  VolumeX,
  Bell,
  Trash2,
  Menu
} from 'lucide-react';

const PROVIDERS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (Google)' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Google)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (DeepSeek)' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Free (Meta)' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Meta)' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B Free (Google)' },
  { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B Free (Meta)' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B (Meta)' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'patients' | 'hospital' | 'or' | 'finances' | 'research'>('assistant');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('oncogyn_selected_model') || 'google/gemini-2.5-pro';
    }
    return 'google/gemini-2.5-pro';
  });

  // Datos del consultorio / Supabase
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [internaciones, setInternaciones] = useState<any[]>([]);
  const [cirugias, setCirugias] = useState<any[]>([]);
  const [finanzas, setFinanzas] = useState<any[]>([]);
  const [estudios, setEstudios] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [alertasActivas, setAlertasActivas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales de Acciones
  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false);
  const [modalNuevaConsulta, setModalNuevaConsulta] = useState(false);
  const [modalNuevoEstudio, setModalNuevoEstudio] = useState(false);
  const [modalNuevaCirugia, setModalNuevaCirugia] = useState(false);
  const [modalVerFichaCompleta, setModalVerFichaCompleta] = useState(false);
  const [modalConfigAlertas, setModalConfigAlertas] = useState(false);

  // Estados de carga de formularios
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<string | null>(null);

  // Formularios
  const [formPaciente, setFormPaciente] = useState({
    nombre_completo: '',
    dni: '',
    fecha_nacimiento: '',
    obra_social: '',
    telefono: '',
    telefono_familiar: '',
    nacionalidad: '',
    email: '',
    diagnostico_principal: '',
    hospital_atencion: '',
    fecha_inicio_consulta: '',
    pole: false,
    brca1: false,
    brca2: false,
    estado: 'consulta',
    habitacion: '',
    cama: ''
  });

  const [formConsulta, setFormConsulta] = useState({
    motivo: '',
    anamnesis: '',
    examen_fisico: '',
    plan_conducta: ''
  });

  const [formEstudio, setFormEstudio] = useState({
    tipo: 'laboratorio',
    fecha_estudio: '',
    informe_crudo: '',
    archivo_url: '',
    nombre_archivo: ''
  });

  const [formCirugia, setFormCirugia] = useState({
    paciente_id: '',
    fecha: '',
    hora: '08:00',
    diagnostico_preop: '',
    diagnostico_postop: '',
    procedimiento: '',
    duracion_minutos: '',
    perdida_sanguinea_cc: '',
    complicaciones: ''
  });

  const [citas, setCitas] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<{ id: string; titulo: string; cuerpo: string; fecha: string; leida: boolean }[]>([]);
  const [mostrarPanelNotificaciones, setMostrarPanelNotificaciones] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');
  const [modalNuevaCita, setModalNuevaCita] = useState(false);
  const [formCita, setFormCita] = useState({
    paciente_id: '',
    fecha: '',
    hora: '10:00',
    motivo: ''
  });

  const [modalSignos, setModalSignos] = useState(false);
  const [internacionSeleccionada, setInternacionSeleccionada] = useState<any>(null);
  const [formSignos, setFormSignos] = useState({ temperatura: '', drenaje_cc: '', evolucion_diaria: '' });
  const [toasts, setToasts] = useState<{ id: string; titulo: string; cuerpo: string }[]>([]);

  // Alarma persistente de emergencia
  const [alarmaActiva, setAlarmaActiva] = useState(false);
  const [alarmaDetalle, setAlarmaDetalle] = useState('');
  const intervalAlarmaRef = useRef<any>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Conectando...');

  // Configuración de Alertas Personalizables
  const [configAlertas, setConfigAlertas] = useState({
    alarma_temperatura: true,
    umbral_temperatura: 37.8,
    alarma_drenaje: true,
    umbral_drenaje: 150,
    sonido_activo: true,
    audio_tono: 'clinical_alert',
    notificar_whatsapp: false,
    telefono_notificacion: ''
  });

  // Búsqueda Global Gigante
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [dictadoActivoGlobal, setDictadoActivoGlobal] = useState(false);
  const [resultadosBusquedaGlobal, setResultadosBusquedaGlobal] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Configuración de API Key local
  const [apiKey, setApiKey] = useState('');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Modales de Acciones Híbridas
  const [modalEvolucion, setModalEvolucion] = useState(false);
  const [pacienteEvolucionId, setPacienteEvolucionId] = useState('');
  const [evolucionGenerada, setEvolucionGenerada] = useState('');
  const [dictadoActivoEvolucion, setDictadoActivoEvolucion] = useState(false);

  const [modalResumen, setModalResumen] = useState(false);
  const [pacienteResumenId, setPacienteResumenId] = useState('');
  const [resumenGenerado, setResumenGenerado] = useState('');

  // Modal para agregar nota rápida a paciente
  const [modalNotaRapida, setModalNotaRapida] = useState(false);
  const [pacienteNotaId, setPacienteNotaId] = useState('');
  const [notaRapidaTexto, setNotaRapidaTexto] = useState('');
  const [dictadoActivoNotaRapida, setDictadoActivoNotaRapida] = useState(false);

  // Chat/Copiloto Clínico
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant' | 'system-data'; text: string; isIA?: boolean }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const [dictadoActivoChat, setDictadoActivoChat] = useState(false);
  const [filtroInvestigacion, setFiltroInvestigacion] = useState<'todos' | 'pole' | 'brca1' | 'brca2'>('todos');

  // Reconocimiento de voz y Audio
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Estado para el Modo Oscuro y persistencia
  const [darkMode, setDarkMode] = useState(false);

  // Paleta de Colores Dinámica
  const basePalette = darkMode ? {
    sidebarBg: '#090f1a', // Azul petróleo muy oscuro
    bgMain: '#0b1329', // Fondo oscuro azulado
    bgCard: '#111b30', // Tarjetas oscuras
    primario: '#14b8a6', // Verde quirúrgico brillante
    secundario: '#0d9488',
    borders: '#1e2d4a', // Bordes oscuros azulados
    textMain: '#f8fafc', // Gris muy claro
    textMuted: '#94a3b8',
    textSecondary: '#cbd5e1',
    exito: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    informacion: '#3b82f6'
  } : {
    sidebarBg: '#0B1320',
    bgMain: '#F8FAFC',
    bgCard: '#FFFFFF',
    primario: '#0F766E',
    secundario: '#14B8A6',
    borders: '#E5E7EB',
    textMain: '#1F2937',
    textMuted: '#6b7280',
    textSecondary: '#4b5563',
    exito: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    informacion: '#2563EB'
  };

  // Identidad Cromática por Módulo
  const getModuleColor = (tab: typeof activeTab) => {
    switch (tab) {
      case 'assistant':
        return darkMode ? '#14b8a6' : '#0F766E';
      case 'patients':
        return '#0EA5E9';
      case 'hospital':
        return '#2563EB';
      case 'or':
        return '#06B6D4';
      case 'finances':
        return '#16A34A';
      case 'research':
        return '#8B5CF6';
      default:
        return darkMode ? '#14b8a6' : '#0F766E';
    }
  };

  const getModuleLightBg = (tab: typeof activeTab) => {
    if (darkMode) {
      switch (tab) {
        case 'assistant': return '#0b1f1e';
        case 'patients': return '#072030';
        case 'hospital': return '#081730';
        case 'or': return '#062029';
        case 'finances': return '#092415';
        case 'research': return '#1a1033';
        default: return '#0b1f1e';
      }
    }
    switch (tab) {
      case 'assistant':
        return '#F0FDFA';
      case 'patients':
        return '#F0F9FF';
      case 'hospital':
        return '#EFF6FF';
      case 'or':
        return '#ECFEFF';
      case 'finances':
        return '#F0FDF4';
      case 'research':
        return '#F5F3FF';
      default:
        return '#F0FDFA';
    }
  };

  const getModuleBorder = (tab: typeof activeTab) => {
    if (darkMode) {
      switch (tab) {
        case 'assistant': return '#115e59';
        case 'patients': return '#0369a1';
        case 'hospital': return '#1e3a8a';
        case 'or': return '#0e7490';
        case 'finances': return '#15803d';
        case 'research': return '#5b21b6';
        default: return '#115e59';
      }
    }
    switch (tab) {
      case 'assistant':
        return '#99F6E4';
      case 'patients':
        return '#BAE6FD';
      case 'hospital':
        return '#BFDBFE';
      case 'or':
        return '#A5F3FC';
      case 'finances':
        return '#BBF7D0';
      case 'research':
        return '#DDD6FE';
      default:
        return '#99F6E4';
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('oncogyn_openrouter_key') || '';
    setApiKey(savedKey);
    setTempApiKey(savedKey);
    const savedDarkMode = localStorage.getItem('oncogyn_dark_mode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Cargar historial de notificaciones desde localStorage
    const savedNotifs = localStorage.getItem('oncogyn_notifications_history');
    if (savedNotifs) {
      setNotificaciones(JSON.parse(savedNotifs));
    }
    
    // Cargar permisos de notificación del navegador
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
    
    fetchData();

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = 'es-AR';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        recognitionRef.current = rec;
      }
    }

    const channel = supabase
      .channel('realtime-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internaciones' }, (payload) => {
        evaluarAlertasClinicas(payload.new);
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pacientes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cirugias' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finanzas' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estudios' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas_activas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          triggerNotification('⚠️ Alerta Clínica Crítica', payload.new.descripcion);
        }
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config_alertas' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => fetchData())
      .subscribe((status, err) => {
        if (err) {
          setRealtimeStatus(`Error: ${err.message}`);
          console.error('Error de suscripción Realtime:', err);
        } else {
          setRealtimeStatus(status);
          console.log('Realtime status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, iRes, cRes, fRes, eRes, conRes, configRes, aRes, citasRes] = await Promise.all([
        supabase.from('pacientes').select('*'),
        supabase.from('internaciones').select('*, pacientes(nombre_completo, diagnostico_principal)'),
        supabase.from('cirugias').select('*, pacientes(nombre_completo)'),
        supabase.from('finanzas').select('*, pacientes(nombre_completo)'),
        supabase.from('estudios').select('*'),
        supabase.from('consultas').select('*'),
        supabase.from('config_alertas').select('*').single(),
        supabase.from('alertas_activas').select('*, pacientes(nombre_completo)'),
        supabase.from('citas').select('*, pacientes(nombre_completo)')
      ]);

      const fetchedPacientes = pRes.data || [];
      const fetchedInternaciones = iRes.data || [];
      const fetchedCirugias = cRes.data || [];
      const fetchedFinanzas = fRes.data || [];
      const fetchedEstudios = eRes.data || [];
      const fetchedConsultas = conRes.data || [];
      const fetchedAlertas = aRes.data || [];
      const fetchedCitas = citasRes ? (citasRes.data || []) : [];

      setPacientes(fetchedPacientes);
      setInternaciones(fetchedInternaciones);
      setCirugias(fetchedCirugias);
      setFinanzas(fetchedFinanzas);
      setEstudios(fetchedEstudios);
      setConsultas(fetchedConsultas);
      setAlertasActivas(fetchedAlertas);
      setCitas(fetchedCitas);

      if (configRes.data) {
        setConfigAlertas({
          alarma_temperatura: configRes.data.alarma_temperatura,
          umbral_temperatura: Number(configRes.data.umbral_temperatura),
          alarma_drenaje: configRes.data.alarma_drenaje,
          umbral_drenaje: Number(configRes.data.umbral_drenaje),
          sonido_activo: configRes.data.sonido_activo,
          audio_tono: configRes.data.audio_tono,
          notificar_whatsapp: configRes.data.notificar_whatsapp,
          telefono_notificacion: configRes.data.telefono_notificacion || ''
        });

        // Sincronizar API Key y Modo Oscuro desde Supabase
        if (configRes.data.openrouter_api_key) {
          setApiKey(configRes.data.openrouter_api_key);
          setTempApiKey(configRes.data.openrouter_api_key);
          localStorage.setItem('oncogyn_openrouter_key', configRes.data.openrouter_api_key);
        }
        if (configRes.data.dark_mode !== undefined && configRes.data.dark_mode !== null) {
          setDarkMode(configRes.data.dark_mode);
          localStorage.setItem('oncogyn_dark_mode', configRes.data.dark_mode ? 'true' : 'false');
        }
        if (configRes.data.modelo_ia) {
          setSelectedModel(configRes.data.modelo_ia);
          localStorage.setItem('oncogyn_selected_model', configRes.data.modelo_ia);
        }
      }

      generarMensajeInicialDinamico(fetchedInternaciones, fetchedCirugias);

    } catch (err) {
      console.error('Error al cargar datos de Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sonar Tono Clínico utilizando Web Audio API nativo
  const playClinicalAlertSound = () => {
    if (!configAlertas.sonido_activo) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generar secuencia clínica de aviso audible (Dos tonos sucesivos)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Tono alto
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime); // Tono clínico secundario
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 250);

    } catch (error) {
      console.error('Error al emitir sonido clínico:', error);
    }
  };

  const iniciarAlarmaPersistente = (mensaje: string) => {
    setAlarmaActiva(true);
    setAlarmaDetalle(mensaje);

    if (intervalAlarmaRef.current) {
      clearInterval(intervalAlarmaRef.current);
    }

    const reproducirTono = () => {
      if (!configAlertas.sonido_activo) return;
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {
        console.error('Error al sonar alarma persistente:', e);
      }
    };

    reproducirTono();
    intervalAlarmaRef.current = setInterval(reproducirTono, 1200);
  };

  const silenciarAlarma = () => {
    setAlarmaActiva(false);
    setAlarmaDetalle('');
    if (intervalAlarmaRef.current) {
      clearInterval(intervalAlarmaRef.current);
      intervalAlarmaRef.current = null;
    }
  };

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock activo');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const triggerNotification = async (titulo: string, cuerpo: string) => {
    if (titulo.includes('⚠️') || titulo.includes('Alerta')) {
      iniciarAlarmaPersistente(cuerpo);
    } else {
      playClinicalAlertSound();
    }

    const toastId = Math.random().toString();
    setToasts(prev => [...prev, { id: toastId, titulo, cuerpo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 6000);

    const nuevaNotif = {
      id: Math.random().toString(),
      titulo,
      cuerpo,
      fecha: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      leida: false
    };

    setNotificaciones(prev => {
      const updated = [nuevaNotif, ...prev].slice(0, 50);
      localStorage.setItem('oncogyn_notifications_history', JSON.stringify(updated));
      return updated;
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification(titulo, {
              body: cuerpo,
              icon: '/favicon.ico',
              vibrate: [200, 100, 200],
              tag: 'oncogyn-alert'
            } as any);
          } else {
            new Notification(titulo, { body: cuerpo });
          }
        } catch (e) {
          console.warn('Error mostrando notificación nativa:', e);
          new Notification(titulo, { body: cuerpo });
        }
      }
    }
  };

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotifPermission(permission);
      });
    }
  };

  // Planificador en segundo plano (Background Checker) para Citas, Cirugías y Recorridas
  useEffect(() => {
    const checkScheduledEvents = () => {
      if (loading || pacientes.length === 0) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const triggered = JSON.parse(localStorage.getItem('oncogyn_triggered_alerts') || '{}');
      let triggeredUpdated = false;

      const checkAndTrigger = (id: string, eventTime: Date, eventName: string, detail: string) => {
        const diffMs = eventTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        const key1d = `${id}_1d`;
        if (diffMins >= 1420 && diffMins <= 1445 && !triggered[key1d]) {
          triggerNotification(`📅 Mañana: ${eventName}`, `${detail} (en 24 horas)`);
          triggered[key1d] = true;
          triggeredUpdated = true;
        }

        const key20m = `${id}_20m`;
        if (diffMins >= 15 && diffMins <= 22 && !triggered[key20m]) {
          triggerNotification(`⚠️ En 20 minutos: ${eventName}`, `${detail} (a las ${eventTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs)`);
          triggered[key20m] = true;
          triggeredUpdated = true;
        }
      };

      cirugias.forEach(c => {
        if (!c.fecha) return;
        const horaStr = c.hora || '08:00';
        const eventTime = new Date(`${c.fecha}T${horaStr}:00`);
        if (!isNaN(eventTime.getTime())) {
          const pacName = c.pacientes?.nombre_completo || 'Paciente';
          checkAndTrigger(`cirugia_${c.id}`, eventTime, 'Cirugía Programada', `${pacName} - ${c.procedimiento}`);
        }
      });

      citas.forEach(cita => {
        if (!cita.fecha || !cita.hora) return;
        const eventTime = new Date(`${cita.fecha}T${cita.hora}:00`);
        if (!isNaN(eventTime.getTime())) {
          const pac = pacientes.find(p => p.id === cita.paciente_id);
          const pacName = pac ? pac.nombre_completo : 'Paciente';
          checkAndTrigger(`cita_${cita.id}`, eventTime, 'Cita Médica', `${pacName} - ${cita.motivo || 'Consulta'}`);
        }
      });

      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDay = String(now.getDate()).padStart(2, '0');
      const datePrefix = `${currentYear}-${currentMonth}-${currentDay}`;

      const recorridaMañana = new Date(`${datePrefix}T07:45:00`);
      checkAndTrigger(`recorrida_morning_${datePrefix}`, recorridaMañana, 'Recorrida de Hospital', 'Pase de sala de internación (Hab. 301, 305)');

      const recorridaTarde = new Date(`${datePrefix}T18:00:00`);
      checkAndTrigger(`recorrida_evening_${datePrefix}`, recorridaTarde, 'Seguimientos Quirúrgicos', 'Control de postoperatorios en piso');

      if (triggeredUpdated) {
        localStorage.setItem('oncogyn_triggered_alerts', JSON.stringify(triggered));
      }
    };

    checkScheduledEvents();
    const interval = setInterval(checkScheduledEvents, 30000);

    return () => clearInterval(interval);
  }, [cirugias, citas, pacientes, loading]);

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('citas')
        .insert({
          paciente_id: formCita.paciente_id,
          fecha: formCita.fecha,
          hora: formCita.hora || '10:00',
          motivo: formCita.motivo
        });

      if (error) throw error;

      alert('¡Cita agendada con éxito!');
      setModalNuevaCita(false);
      setFormCita({
        paciente_id: '',
        fecha: '',
        hora: '10:00',
        motivo: ''
      });
      fetchData();
    } catch (err: any) {
      alert(`Error al agendar cita: ${err.message}`);
    }
  };

  const handleGuardarSignos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internacionSeleccionada) return;

    try {
      const tempVal = formSignos.temperatura ? Number(formSignos.temperatura) : null;
      const drenVal = formSignos.drenaje_cc ? Number(formSignos.drenaje_cc) : null;

      // Evaluar localmente al instante para lanzar sonido e in-app notifications
      if (configAlertas.alarma_temperatura && tempVal !== null && tempVal >= configAlertas.umbral_temperatura) {
        const desc = `Temperatura febril en Hab. ${internacionSeleccionada.habitacion}: ${tempVal}°C registrado.`;
        triggerNotification('⚠️ Alerta Clínica Crítica', desc);
        
        // Registrar en alertas_activas
        await supabase.from('alertas_activas').insert({
          paciente_id: internacionSeleccionada.paciente_id,
          tipo: 'temperatura_alta',
          descripcion: desc
        });
      }

      if (configAlertas.alarma_drenaje && drenVal !== null && drenVal >= configAlertas.umbral_drenaje) {
        const desc = `Débito excesivo de drenaje en Hab. ${internacionSeleccionada.habitacion}: ${drenVal} cc acumulado.`;
        triggerNotification('⚠️ Alerta Clínica Crítica', desc);

        await supabase.from('alertas_activas').insert({
          paciente_id: internacionSeleccionada.paciente_id,
          tipo: 'drenaje_excesivo',
          descripcion: desc
        });
      }

      const { error } = await supabase
        .from('internaciones')
        .update({
          temperatura: tempVal,
          drenaje_cc: drenVal,
          evolucion_diaria: formSignos.evolucion_diaria
        })
        .eq('id', internacionSeleccionada.id);

      if (error) throw error;

      alert('¡Signos y evolución actualizados con éxito!');
      setModalSignos(false);
      fetchData();
    } catch (err: any) {
      alert(`Error al guardar signos: ${err.message}`);
    }
  };

  // Evalúa en caliente si los signos vitales actualizados superan los umbrales personalizados
  const evaluarAlertasClinicas = async (internacion: any) => {
    if (!internacion) return;

    const pac = pacientes.find(p => p.id === internacion.paciente_id);
    const nombre = pac ? pac.nombre_completo : 'Paciente';

    // 1. Alerta de Temperatura
    if (configAlertas.alarma_temperatura && internacion.temperatura >= configAlertas.umbral_temperatura) {
      const descripcion = `Temperatura febril en Hab. ${internacion.habitacion}: ${internacion.temperatura}°C registrado.`;
      
      await supabase.from('alertas_activas').insert({
        paciente_id: internacion.paciente_id,
        tipo: 'temperatura_alta',
        descripcion
      });
      playClinicalAlertSound();
    }

    // 2. Alerta de Drenaje Excesivo
    if (configAlertas.alarma_drenaje && internacion.drenaje_cc >= configAlertas.umbral_drenaje) {
      const descripcion = `Débito excesivo de drenaje en Hab. ${internacion.habitacion}: ${internacion.drenaje_cc} cc acumulado.`;
      
      await supabase.from('alertas_activas').insert({
        paciente_id: internacion.paciente_id,
        tipo: 'drenaje_excesivo',
        descripcion
      });
      playClinicalAlertSound();
    }
  };

  const handleGuardarConfigAlertas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('config_alertas')
        .insert({
          alarma_temperatura: configAlertas.alarma_temperatura,
          umbral_temperatura: configAlertas.umbral_temperatura,
          alarma_drenaje: configAlertas.alarma_drenaje,
          umbral_drenaje: configAlertas.umbral_drenaje,
          sonido_activo: configAlertas.sonido_activo,
          audio_tono: configAlertas.audio_tono,
          notificar_whatsapp: configAlertas.notificar_whatsapp,
          telefono_notificacion: configAlertas.telefono_notificacion
        });

      if (error) throw error;
      alert('¡Configuración de Alertas Médicas guardada y activada!');
      setModalConfigAlertas(false);
      fetchData();
    } catch (err: any) {
      alert(`Error al guardar configuración: ${err.message}`);
    }
  };

  const generarMensajeInicialDinamico = (currInternaciones: any[], currCirugias: any[]) => {
    const cantCirugias = currCirugias.length;
    const labsPendientes = currInternaciones.filter(i => i.laboratorio_pendiente).length;

    let saludo = `Buenos días, Dr. Johnson. \n\n`;

    if (cantCirugias > 0) {
      saludo += `• Hoy comienza la jornada con ${cantCirugias} cirugía${cantCirugias > 1 ? 's' : ''}. La primera de ellas inicia en aproximadamente 38 minutos.\n`;
    } else {
      saludo += `• No tiene cirugías programadas para hoy en quirófano.\n`;
    }

    saludo += `• ⚠️ **Atención**: Hay una anatomía patológica nueva disponible en el sistema. ¿Desea verla?\n`;

    if (labsPendientes > 0) {
      saludo += `• Detecté ${labsPendientes} laboratorio${labsPendientes > 1 ? 's' : ''} pendiente${labsPendientes > 1 ? 's' : ''} en internación. ¿Desea que preparemos la evolución clínica?\n`;
    } else {
      saludo += `• Todos los laboratorios clínicos en internación están completos.\n`;
    }

    setChatMessages([
      { role: 'assistant', text: saludo }
    ]);
  };

  useEffect(() => {
    if (!globalSearchInput.trim()) {
      setResultadosBusquedaGlobal([]);
      return;
    }

    const term = globalSearchInput.toLowerCase();
    const matches = pacientes.filter(p => 
      p.nombre_completo.toLowerCase().includes(term) || 
      p.dni.includes(term) ||
      (p.diagnostico_principal && p.diagnostico_principal.toLowerCase().includes(term))
    );
    setResultadosBusquedaGlobal(matches);
  }, [globalSearchInput, pacientes]);

  const toggleDictadoGlobal = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz no está soportado en este navegador.');
      return;
    }

    if (dictadoActivoGlobal) {
      recognitionRef.current.stop();
      setDictadoActivoGlobal(false);
    } else {
      setGlobalSearchInput('');
      setDictadoActivoGlobal(true);
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        const cleanText = text.replace(/buscar a/i, '').replace(/buscar/i, '').trim();
        setGlobalSearchInput(cleanText);
        setDictadoActivoGlobal(false);
      };
      recognitionRef.current.onerror = () => setDictadoActivoGlobal(false);
      recognitionRef.current.onend = () => setDictadoActivoGlobal(false);
      recognitionRef.current.start();
    }
  };

  const toggleDictadoChat = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz no está soportado en este navegador.');
      return;
    }

    if (dictadoActivoChat) {
      recognitionRef.current.stop();
      setDictadoActivoChat(false);
    } else {
      setChatInput('');
      setDictadoActivoChat(true);
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setChatInput('');
        setDictadoActivoChat(false);
        if (text.trim()) {
          handleSendMessage(text.trim());
        }
      };
      recognitionRef.current.onerror = () => setDictadoActivoChat(false);
      recognitionRef.current.onend = () => setDictadoActivoChat(false);
      recognitionRef.current.start();
    }
  };

  const toggleDictadoEvolucion = () => {
    if (!recognitionRef.current) return;
    if (dictadoActivoEvolucion) {
      recognitionRef.current.stop();
      setDictadoActivoEvolucion(false);
    } else {
      setDictadoActivoEvolucion(true);
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setEvolucionGenerada(prev => prev + (prev ? '\n' : '') + `• [Evolución dictada]: ${text}`);
        setDictadoActivoEvolucion(false);
      };
      recognitionRef.current.onerror = () => setDictadoActivoEvolucion(false);
      recognitionRef.current.onend = () => setDictadoActivoEvolucion(false);
      recognitionRef.current.start();
    }
  };

  const toggleDictadoNotaRapida = () => {
    if (!recognitionRef.current) return;
    if (dictadoActivoNotaRapida) {
      recognitionRef.current.stop();
      setDictadoActivoNotaRapida(false);
    } else {
      setDictadoActivoNotaRapida(true);
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setNotaRapidaTexto(prev => prev + (prev ? ' ' : '') + text);
        setDictadoActivoNotaRapida(false);
      };
      recognitionRef.current.onerror = () => setDictadoActivoNotaRapida(false);
      recognitionRef.current.onend = () => setDictadoActivoNotaRapida(false);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const messageText = textOverride || chatInput;
    if (!messageText.trim() || cargandoIA) return;

    const userQuery = messageText.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    if (!textOverride) setChatInput('');
    setCargandoIA(true);

    const lowerQuery = userQuery.toLowerCase();

    // INTERCEPTOR HÍBRIDO AVANZADO (SQL LOCAL SIN IA)
    if (
      lowerQuery.includes('internadas') || 
      lowerQuery.includes('internadas de hoy') || 
      lowerQuery.includes('camas') || 
      lowerQuery.includes('quienes estan') || 
      lowerQuery.includes('quiénes están') || 
      lowerQuery.includes('recorrida') || 
      lowerQuery.includes('postoperatorios')
    ) {
      setTimeout(() => {
        const lineas = internaciones.map(i => 
          `• Habitación ${i.habitacion}: ${i.pacientes?.nombre_completo || 'Paciente'} | Temp: ${i.temperatura}°C | Drenaje: ${i.drenaje_cc}cc | Lab: ${i.laboratorio_pendiente ? 'Pendiente' : 'Completo'}`
        );
        setChatMessages(prev => [...prev, {
          role: 'system-data',
          text: `📊 Pacientes actualmente internadas (Supabase):\n\n${lineas.length > 0 ? lineas.join('\n') : 'No hay pacientes registradas en internación en este momento.'}`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (lowerQuery.includes('paciente ') || lowerQuery.includes('buscar ') || lowerQuery.includes('expediente ') || lowerQuery.includes('ver paciente ')) {
      setTimeout(() => {
        const term = lowerQuery
          .replace('paciente', '')
          .replace('buscar a', '')
          .replace('buscar', '')
          .replace('expediente de', '')
          .replace('expediente', '')
          .replace('ver paciente', '')
          .trim();
          
        const encontrados = pacientes.filter(p => p.nombre_completo.toLowerCase().includes(term));
        const lineas = encontrados.map(p => `• DNI ${p.dni}: ${p.nombre_completo} | OS: ${p.obra_social} | Diagnóstico: ${p.diagnostico_principal}`);
        
        setChatMessages(prev => [...prev, {
          role: 'system-data',
          text: encontrados.length > 0
            ? `🔍 Coincidencias encontradas en expedientes:\n\n${lineas.join('\n')}`
            : `❌ No encontré ningún expediente bajo el nombre: "${term}"`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (
      lowerQuery.includes('cirugía') || 
      lowerQuery.includes('cirugia') || 
      lowerQuery.includes('quirofano') || 
      lowerQuery.includes('quirófano') || 
      lowerQuery.includes('operacion') || 
      lowerQuery.includes('operación') || 
      lowerQuery.includes('agenda de mañana')
    ) {
      setTimeout(() => {
        const lineas = cirugias.map(c => `• 08:00 hs - ${c.pacientes?.nombre_completo}: ${c.procedimiento} (${c.duracion_minutos} min)`);
        setChatMessages(prev => [...prev, {
          role: 'system-data',
          text: lineas.length > 0 
            ? `📅 Cronograma Quirúrgico del Día:\n\n${lineas.join('\n')}`
            : `🟢 No hay cirugías programadas para el día de hoy.`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (
      lowerQuery.includes('facturacion') || 
      lowerQuery.includes('facturación') || 
      lowerQuery.includes('ganancia') || 
      lowerQuery.includes('honorarios') || 
      lowerQuery.includes('facturé') || 
      lowerQuery.includes('facture') || 
      lowerQuery.includes('plata') || 
      lowerQuery.includes('finanzas')
    ) {
      setTimeout(() => {
        const totalIngresos = finanzas.filter(f => f.tipo === 'ingreso').reduce((sum, f) => sum + Number(f.monto), 0);
        const pendiente = finanzas.filter(f => f.estado_pago === 'pendiente').reduce((sum, f) => sum + Number(f.monto), 0);
        setChatMessages(prev => [...prev, {
          role: 'system-data',
          text: `💰 Estado de Cuentas Quirúrgicas (Supabase):\n\n• Facturación total realizada: $${totalIngresos.toLocaleString('es-AR')} ARS\n• Honorarios pendientes de liquidación: $${pendiente.toLocaleString('es-AR')} ARS`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (lowerQuery.includes('laboratorio') || lowerQuery.includes('labs') || lowerQuery.includes('analiticas') || lowerQuery.includes('estudios')) {
      setTimeout(() => {
        const pendientes = internaciones.filter(i => i.laboratorio_pendiente);
        const lineas = pendientes.map(i => `• Habitación ${i.habitacion}: ${i.pacientes?.nombre_completo}`);
        setChatMessages(prev => [...prev, {
          role: 'system-data',
          text: pendientes.length > 0 
            ? `🧪 Laboratorios Pendientes de Recepción:\n\n${lineas.join('\n')}`
            : `🟢 Excelente: Todos los laboratorios clínicos en internación están completos.`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (lowerQuery.includes('patología') || lowerQuery.includes('patologia') || lowerQuery.includes('anatomia') || lowerQuery.includes('anatomía')) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'system-data',
          text: `📄 Anatomía Patológica Nueva:\n\n• Paciente: Clara Benítez\n• ID de Muestra: AP-9082\n• Diagnóstico: Adenocarcinoma endometrioide G2. Invasión miometrial menor al 50%. Márgenes quirúrgicos libres.`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (lowerQuery.includes('evolución') || lowerQuery.includes('evolucionar') || lowerQuery.includes('preparar la evolucion') || lowerQuery.includes('preparar la evolución')) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          text: `Evolución diaria disponible. Seleccione la paciente en el panel de acciones rápidas a la derecha para generar y guardar el registro.`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    const palabrasDePregunta = ['que', 'qué', 'como', 'cómo', 'cual', 'cuál', 'recomienda', 'evidencia', 'tratamiento', 'guia', 'guía', 'nccn', 'asco', 'esgo', 'dosis', 'indicacion', 'indicación'];
    const esPreguntaClinicaIA = palabrasDePregunta.some(p => lowerQuery.includes(p));

    if (!esPreguntaClinicaIA) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          text: `Anotación registrada: "${userQuery}".\n\n💡 *Tip: Si desea asociar esto directamente a la evolución clínica de una paciente internada en Supabase, use el botón "Nota por Voz" en la tarjeta de la paciente en la solapa Hospital.*`
        }]);
        setCargandoIA(false);
      }, 300);
      return;
    }

    if (!apiKey) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          text: `La consulta requiere un análisis clínico avanzado de IA.\n\n⚠️ **Función Premium Desactivada**: Ingrese su API Key de OpenRouter haciendo click en el icono de engranaje (Configuración) para habilitar consultas avanzadas de guías clínicas NCCN/ESGO.`
        }]);
        setCargandoIA(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          model: selectedModel,
          userApiKey: apiKey,
          contextData: { pacientes, internaciones, cirugias }
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.text, isIA: true }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con la API de IA.' }]);
    } finally {
      setCargandoIA(false);
    }
  };

  const handleGuardarEvolucionEnBase = async () => {
    const paciente = internaciones.find(i => i.id === pacienteEvolucionId);
    if (!paciente) return;

    const { error } = await supabase
      .from('internaciones')
      .update({ evolucion_diaria: evolucionGenerada })
      .eq('id', paciente.id);

    if (error) {
      alert('Error al guardar evolución.');
    } else {
      alert('¡Evolución guardada y sincronizada!');
      setModalEvolucion(false);
      fetchData();
    }
  };

  const handleGuardarNotaRapidaEnBase = async () => {
    const internacion = internaciones.find(i => i.id === pacienteNotaId);
    if (!internacion) return;

    const nuevaEvolucion = internacion.evolucion_diaria 
      ? `${internacion.evolucion_diaria}\n• [Anotación por voz - ${new Date().toLocaleDateString('es-AR')}]: ${notaRapidaTexto}`
      : `• [Anotación por voz - ${new Date().toLocaleDateString('es-AR')}]: ${notaRapidaTexto}`;

    const { error } = await supabase
      .from('internaciones')
      .update({ evolucion_diaria: nuevaEvolucion })
      .eq('id', internacion.id);

    if (error) {
      alert('Error al guardar la nota en Supabase.');
    } else {
      alert('¡Nota agregada y guardada con éxito en la evolución de la paciente!');
      setModalNotaRapida(false);
      setNotaRapidaTexto('');
      fetchData();
    }
  };

  const handleGenerarEvolucion = () => {
    const paciente = internaciones.find(i => i.id === pacienteEvolucionId);
    if (!paciente) return;

    const texto = `EVOLUCIÓN MÉDICA DIARIA - HABITACIÓN ${paciente.habitacion}
Fecha: ${new Date().toLocaleDateString('es-AR')}
Paciente: ${paciente.pacientes?.nombre_completo}
Diagnóstico: ${paciente.pacientes?.diagnostico_principal}
Estado Postoperatorio: Clínicamente estable. Afebril con registro de ${paciente.temperatura}°C.
Drenajes: Débito activo de ${paciente.drenaje_cc} cc serohemático en las últimas 24 hs.
Laboratorio: ${paciente.laboratorio_pendiente ? 'PENDIENTE (se solicitan resultados urgente)' : 'Completo en rango aceptable'}.
Plan: Monitorear curva térmica, control de débitos por drenaje, deambulación asistida en pasillo.

OBSERVACIONES ADICIONALES:`;
    
    setEvolucionGenerada(texto);
  };

  const handleGenerarResumen = () => {
    const p = pacientes.find(item => item.id === pacienteResumenId);
    if (!p) return;

    const cirugiasPaciente = cirugias.filter(c => c.paciente_id === p.id);
    const internacionPaciente = internaciones.find(i => i.paciente_id === p.id);

    const texto = `RESUMEN DE HISTORIA CLÍNICA - ONCOGYN
--------------------------------------------------
Paciente: ${p.nombre_completo} | DNI: ${p.dni} | OS: ${p.obra_social}
Diagnóstico Principal: ${p.diagnostico_principal}
Marcadores/Mutaciones: ${p.mutaciones ? JSON.stringify(p.mutaciones) : 'No reportadas'}

HISTORIAL QUIRÚRGICO:
${cirugiasPaciente.map(c => `- ${c.fecha}: ${c.procedimiento} (${c.duracion_minutos} min, Sangrado: ${c.perdida_sanguinea_cc} cc). Complicaciones: ${c.complicaciones}`).join('\n') || 'Sin cirugías registradas.'}

ESTADO DE HOSPITALIZACIÓN ACTUAL:
${internacionPaciente ? `- Internada en Habitación ${internacionPaciente.habitacion} (Ingreso: ${internacionPaciente.fecha_ingreso}). Temp: ${internacionPaciente.temperatura}°C. Drenaje: ${internacionPaciente.drenaje_cc} cc.` : 'Actualmente ambulatoria o de alta.'}`;

    setResumenGenerado(texto);
  };

  const handleSaveApiKey = async () => {
    localStorage.setItem('oncogyn_openrouter_key', tempApiKey);
    setApiKey(tempApiKey);
    localStorage.setItem('oncogyn_dark_mode', darkMode ? 'true' : 'false');
    localStorage.setItem('oncogyn_selected_model', selectedModel);

    try {
      // Intentar sincronizar en la base de datos única de config_alertas
      const { data: config } = await supabase.from('config_alertas').select('id').single();
      if (config) {
        await supabase
          .from('config_alertas')
          .update({ 
            openrouter_api_key: tempApiKey,
            dark_mode: darkMode,
            modelo_ia: selectedModel
          })
          .eq('id', config.id);
      }
    } catch (err) {
      console.warn('Sincronización en Supabase no disponible:', err);
    }

    setMostrarConfig(false);
    alert('Ajustes guardados y sincronizados con éxito.');
  };

  // CREACIÓN DE PACIENTE REAL EN SUPABASE
  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mutacionesJSON = {
        pole: formPaciente.pole,
        brca1: formPaciente.brca1,
        brca2: formPaciente.brca2
      };

      const { data, error } = await supabase
        .from('pacientes')
        .insert({
          nombre_completo: formPaciente.nombre_completo,
          dni: formPaciente.dni,
          fecha_nacimiento: formPaciente.fecha_nacimiento || null,
          obra_social: formPaciente.obra_social || '',
          telefono: formPaciente.telefono || '',
          telefono_familiar: formPaciente.telefono_familiar || '',
          nacionalidad: formPaciente.nacionalidad || '',
          email: formPaciente.email || '',
          diagnostico_principal: formPaciente.diagnostico_principal || '',
          hospital_atencion: formPaciente.hospital_atencion || '',
          fecha_inicio_consulta: formPaciente.fecha_inicio_consulta || null,
          mutaciones: mutacionesJSON,
          estado: formPaciente.estado
        })
        .select()
        .single();

      if (error) throw error;

      if (data && formPaciente.estado === 'internacion') {
        const { error: internError } = await supabase
          .from('internaciones')
          .insert({
            paciente_id: data.id,
            habitacion: formPaciente.habitacion,
            cama: formPaciente.cama || '',
            fecha_ingreso: new Date().toISOString().split('T')[0],
            temperatura: 36.5,
            drenaje_cc: 0,
            laboratorio_pendiente: false
          });
        if (internError) throw internError;
      }

      alert('¡Paciente creado con éxito en Supabase!');
      setModalNuevoPaciente(false);
      setFormPaciente({
        nombre_completo: '',
        dni: '',
        fecha_nacimiento: '',
        obra_social: '',
        telefono: '',
        telefono_familiar: '',
        nacionalidad: '',
        email: '',
        diagnostico_principal: '',
        hospital_atencion: '',
        fecha_inicio_consulta: '',
        pole: false,
        brca1: false,
        brca2: false,
        estado: 'consulta',
        habitacion: '',
        cama: ''
      });
      fetchData();
    } catch (err: any) {
      alert(`Error al crear paciente: ${err.message}`);
    }
  };

  // CREACIÓN DE CIRUGÍA REAL EN SUPABASE
  const handleCrearCirugia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('cirugias')
        .insert({
          paciente_id: formCirugia.paciente_id,
          fecha: formCirugia.fecha || new Date().toISOString().split('T')[0],
          hora: formCirugia.hora || '08:00',
          diagnostico_preop: formCirugia.diagnostico_preop,
          diagnostico_postop: formCirugia.diagnostico_postop,
          procedimiento: formCirugia.procedimiento,
          duracion_minutos: formCirugia.duracion_minutos ? Number(formCirugia.duracion_minutos) : null,
          perdida_sanguinea_cc: formCirugia.perdida_sanguinea_cc ? Number(formCirugia.perdida_sanguinea_cc) : null,
          complicaciones: formCirugia.complicaciones
        });

      if (error) throw error;

      alert('¡Bitácora Quirúrgica registrada con éxito!');
      setModalNuevaCirugia(false);
      setFormCirugia({
        paciente_id: '',
        fecha: '',
        hora: '08:00',
        diagnostico_preop: '',
        diagnostico_postop: '',
        procedimiento: '',
        duracion_minutos: '',
        perdida_sanguinea_cc: '',
        complicaciones: ''
      });
      fetchData();
    } catch (err: any) {
      alert(`Error al registrar cirugía: ${err.message}`);
    }
  };

  // CARGAR CONSULTA NUEVA (EVOLUCIÓN/ANOTACIÓN) EN SUPABASE
  const handleCrearConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoId) return;

    try {
      const { error } = await supabase
        .from('consultas')
        .insert({
          paciente_id: pacienteSeleccionadoId,
          motivo: formConsulta.motivo,
          anamnesis: formConsulta.anamnesis,
          examen_physico: formConsulta.examen_fisico, // adaptado al sql de Supabase
          plan_conducta: formConsulta.plan_conducta
        });

      if (error) throw error;

      alert('¡Consulta/Nota registrada con éxito!');
      setModalNuevaConsulta(false);
      setFormConsulta({ motivo: '', anamnesis: '', examen_fisico: '', plan_conducta: '' });
      fetchData();
    } catch (err: any) {
      alert(`Error al registrar consulta: ${err.message}`);
    }
  };

  // SUBIR ESTUDIOS / ARCHIVOS
  const handleCrearEstudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoId) return;

    try {
      const { error } = await supabase
        .from('estudios')
        .insert({
          paciente_id: pacienteSeleccionadoId,
          tipo: formEstudio.tipo,
          fecha_estudio: formEstudio.fecha_estudio || new Date().toISOString().split('T')[0],
          informe_crudo: formEstudio.informe_crudo,
          archivo_url: formEstudio.archivo_url || ''
        });

      if (error) throw error;

      alert('¡Estudio cargado con éxito!');
      setModalNuevoEstudio(false);
      setFormEstudio({ tipo: 'laboratorio', fecha_estudio: '', informe_crudo: '', archivo_url: '', nombre_archivo: '' });
      fetchData();
    } catch (err: any) {
      alert(`Error al registrar estudio: ${err.message}`);
    }
  };

  const filteredPatients = pacientes.filter(p => 
    p.nombre_completo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.dni?.includes(searchQuery) ||
    (p.diagnostico_principal && p.diagnostico_principal.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const researchFiltered = pacientes.filter(p => {
    if (filtroInvestigacion === 'todos') return true;
    if (filtroInvestigacion === 'pole') return p.mutaciones?.pole === true;
    if (filtroInvestigacion === 'brca1') return p.mutaciones?.brca1 === true;
    if (filtroInvestigacion === 'brca2') return p.mutaciones?.brca2 === true;
    return true;
  });

  const totalIngresos = finanzas.filter(f => f.tipo === 'ingreso').reduce((sum, f) => sum + Number(f.monto), 0);

  const getTimelineData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const items = [
      { hora: '07:45', titulo: '🏥 Recorrida Hospital', desc: 'Recorrida de sala de internación', tipo: 'rutina' },
      { hora: '15:00', titulo: '👥 Ateneo Ginecología', desc: 'Discusión de casos complejos multidisciplinarios', tipo: 'rutina' },
      { hora: '18:00', titulo: '📋 Seguimientos Quirúrgicos', desc: 'Control de postoperatorios y firmas de evolución', tipo: 'rutina' }
    ];
    
    cirugias.forEach(c => {
      if (c.fecha === todayStr) {
        items.push({
          hora: c.hora || '08:00',
          titulo: `🔪 Cirugía: ${c.pacientes?.nombre_completo || 'Paciente'}`,
          desc: `${c.procedimiento} (${c.diagnostico_preop || 'Preop'})`,
          tipo: 'cirugia'
        });
      }
    });
    
    citas.forEach(cita => {
      if (cita.fecha === todayStr) {
        const pac = pacientes.find(p => p.id === cita.paciente_id);
        items.push({
          hora: cita.hora || '10:00',
          titulo: `📅 Cita: ${pac ? pac.nombre_completo : 'Paciente'}`,
          desc: cita.motivo || 'Consulta programada',
          tipo: 'cita'
        });
      }
    });

    return items.sort((a, b) => a.hora.localeCompare(b.hora));
  };

  const TIMELINE_DATA = getTimelineData();

  const proximaCirugiaHora = cirugias.length > 0 ? (cirugias[0].hora ? cirugias[0].hora + ' hs' : '08:00 hs') : 'Sin programar';
  const habitacionesInternadas = internaciones.map(i => i.habitacion).sort().join(', ') || 'Ninguna';

  // Paciente detallado para ver ficha
  const pacienteFicha = pacientes.find(p => p.id === pacienteSeleccionadoId);
  const estudiosPaciente = estudios.filter(e => e.paciente_id === pacienteSeleccionadoId);
  const consultasPaciente = consultas.filter(c => c.paciente_id === pacienteSeleccionadoId);
  const cirugiasPaciente = cirugias.filter(c => c.paciente_id === pacienteSeleccionadoId);

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`} style={{ display: 'flex', minHeight: '100vh', background: basePalette.bgMain, color: basePalette.textMain }}>
      
      {/* SIDEBAR */}
      <aside className="sidebar-container" style={{
        width: '260px',
        background: basePalette.sidebarBg,
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        borderRight: `1px solid ${basePalette.borders}`,
        flexShrink: 0
      }}>
        <div>
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <HeartPulse size={28} style={{ color: basePalette.secundario }} />
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>OncoGyn</h1>
                <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Portal Cirujano</p>
              </div>
            </div>
            {/* Botón Hamburger solo visible en móviles/tabletas */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="mobile-hamburger-btn"
            >
              <Menu size={24} />
            </button>
            <style jsx global>{`
              @media (max-width: 1024px) {
                .mobile-hamburger-btn {
                  display: flex !important;
                }
              }
            `}</style>
          </div>

          <nav className={`sidebar-nav-container ${mobileMenuOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => { setActiveTab('assistant'); setMobileMenuOpen(false); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: activeTab === 'assistant' ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                border: activeTab === 'assistant' ? `1px solid ${getModuleColor('assistant')}` : 'none', 
                color: activeTab === 'assistant' ? '#ffffff' : '#94a3b8', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: 500 
              }}
            >
              <Activity size={18} style={{ color: activeTab === 'assistant' ? getModuleColor('assistant') : '#94a3b8' }} />
              <span>Mi Asistente</span>
            </button>

            <button 
              onClick={() => { setActiveTab('patients'); setMobileMenuOpen(false); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: activeTab === 'patients' ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                border: activeTab === 'patients' ? `1px solid ${getModuleColor('patients')}` : 'none', 
                color: activeTab === 'patients' ? '#ffffff' : '#94a3b8', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: 500 
              }}
            >
              <UserCheck size={18} style={{ color: activeTab === 'patients' ? getModuleColor('patients') : '#94a3b8' }} />
              <span>Pacientes</span>
            </button>

            <button 
              onClick={() => { setActiveTab('hospital'); setMobileMenuOpen(false); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: activeTab === 'hospital' ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                border: activeTab === 'hospital' ? `1px solid ${getModuleColor('hospital')}` : 'none', 
                color: activeTab === 'hospital' ? '#ffffff' : '#94a3b8', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: 500 
              }}
            >
              <Hospital size={18} style={{ color: activeTab === 'hospital' ? getModuleColor('hospital') : '#94a3b8' }} />
              <span>Hospital (Internadas)</span>
            </button>

            <button 
              onClick={() => { setActiveTab('or'); setMobileMenuOpen(false); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: activeTab === 'or' ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                border: activeTab === 'or' ? `1px solid ${getModuleColor('or')}` : 'none', 
                color: activeTab === 'or' ? '#ffffff' : '#94a3b8', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: 500 
              }}
            >
              <Calendar size={18} style={{ color: activeTab === 'or' ? getModuleColor('or') : '#94a3b8' }} />
              <span>Quirófano</span>
            </button>

            <button 
              onClick={() => { setActiveTab('finances'); setMobileMenuOpen(false); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: activeTab === 'finances' ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                border: activeTab === 'finances' ? `1px solid ${getModuleColor('finances')}` : 'none', 
                color: activeTab === 'finances' ? '#ffffff' : '#94a3b8', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: 500 
              }}
            >
              <DollarSign size={18} style={{ color: activeTab === 'finances' ? getModuleColor('finances') : '#94a3b8' }} />
              <span>Finanzas</span>
            </button>

            <button 
              onClick={() => { setActiveTab('research'); setMobileMenuOpen(false); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: activeTab === 'research' ? 'rgba(255, 255, 255, 0.08)' : 'transparent', 
                border: activeTab === 'research' ? `1px solid ${getModuleColor('research')}` : 'none', 
                color: activeTab === 'research' ? '#ffffff' : '#94a3b8', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontSize: '14px', 
                fontWeight: 500 
              }}
            >
              <BookOpen size={18} style={{ color: activeTab === 'research' ? getModuleColor('research') : '#94a3b8' }} />
              <span>Investigación</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '8px', paddingRight: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: basePalette.secundario, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>DJ</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Dr. Johnson</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Cirujano Oncólogo</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setTempApiKey(apiKey);
                setMostrarConfig(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '50%',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
              title="Ajustes del Portal"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <header className="header-container" style={{
          height: '70px',
          background: basePalette.bgCard,
          borderBottom: `2.5px solid ${getModuleColor(activeTab)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          flexShrink: 0,
          transition: 'border-color 0.3s ease'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: basePalette.textMain }}>
            {activeTab === 'assistant' && 'Mi Asistente Clínico'}
            {activeTab === 'patients' && 'Base de Datos de Pacientes'}
            {activeTab === 'hospital' && 'Monitoreo de Pacientes Internadas'}
            {activeTab === 'or' && 'Bitácora Quirúrgica'}
            {activeTab === 'finances' && 'Dashboard Financiero y Honorarios'}
            {activeTab === 'research' && 'Filtros Retrospectivos de Investigación'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: basePalette.textMuted, display: 'inline-block' }} className="header-date">Hoy: 2 de Julio, 2026</span>
            
            {/* CAMPANA DE NOTIFICACIONES */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMostrarPanelNotificaciones(!mostrarPanelNotificaciones)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: basePalette.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '50%',
                  transition: 'background 0.2s, color 0.2s',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: basePalette.borders
                }}
                title="Centro de Notificaciones"
              >
                <Bell size={18} />
                {notificaciones.filter(n => !n.leida).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#EF4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${basePalette.bgCard}`
                  }}>
                    {notificaciones.filter(n => !n.leida).length}
                  </span>
                )}
              </button>

              {mostrarPanelNotificaciones && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '360px',
                  background: basePalette.bgCard,
                  borderRadius: '12px',
                  border: `1px solid ${basePalette.borders}`,
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '400px'
                }}>
                  <div style={{ padding: '16px', borderBottom: `1px solid ${basePalette.borders}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: basePalette.textMain }}>Notificaciones</span>
                    <button 
                      onClick={() => {
                        setNotificaciones(prev => {
                          const updated = prev.map(n => ({ ...n, leida: true }));
                          localStorage.setItem('oncogyn_notifications_history', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#0EA5E9', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Marcar todo leído
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notificaciones.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: basePalette.textMuted, fontSize: '12px', fontStyle: 'italic' }}>
                        Sin notificaciones recientes.
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div key={n.id} style={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${basePalette.borders}`,
                          background: n.leida ? 'transparent' : (darkMode ? '#1e293b' : '#f0fdfa'),
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setNotificaciones(prev => {
                            const updated = prev.map(item => item.id === n.id ? { ...item, leida: true } : item);
                            localStorage.setItem('oncogyn_notifications_history', JSON.stringify(updated));
                            return updated;
                          });
                        }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 600, fontSize: '12.5px', color: basePalette.textMain }}>{n.titulo}</span>
                            <span style={{ fontSize: '10px', color: basePalette.textMuted }}>{n.fecha}</span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: basePalette.textSecondary }}>{n.cuerpo}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setTempApiKey(apiKey);
                setMostrarConfig(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: basePalette.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                borderRadius: '50%',
                transition: 'background 0.2s, color 0.2s',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: basePalette.borders
              }}
              title="Ajustes del Portal"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        <main className="main-padding" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: basePalette.textMuted }}>
              Sincronizando base de datos clínica Supabase...
            </div>
          ) : (
            <>
              {/* TAB 1: MI ASISTENTE */}
              {activeTab === 'assistant' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* ALERTA CLÍNICA VISUAL (SI HAY ALERTAS ACTIVAS) */}
                  {alertasActivas.filter(a => !a.leida).length > 0 && (
                    <div style={{
                      background: '#FEE2E2',
                      border: '1.5px solid #EF4444',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      animation: 'pulse 2s infinite'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Bell size={24} style={{ color: basePalette.error }} />
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: basePalette.error }}>🚨 ALARMA CLÍNICA EN TIEMPO REAL</h4>
                          <p style={{ fontSize: '13px', color: '#991B1B', marginTop: '2px' }}>
                            {alertasActivas.filter(a => !a.leida)[0].descripcion} ({alertasActivas.filter(a => !a.leida)[0].pacientes?.nombre_completo})
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          const alerta = alertasActivas.filter(a => !a.leida)[0];
                          await supabase.from('alertas_activas').update({ leida: true }).eq('id', alerta.id);
                          fetchData();
                        }}
                        style={{ background: basePalette.error, color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Silenciar / Confirmar
                      </button>
                    </div>
                  )}

                  {/* BARRA DE BÚSQUEDA GIGANTE CON MICRÓFONO */}
                  <div style={{
                    background: basePalette.bgCard,
                    borderRadius: '16px',
                    border: `1.5px solid ${basePalette.primario}`,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '16px 24px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <Search size={22} style={{ color: basePalette.primario }} />
                      <input 
                        type="text" 
                        value={globalSearchInput}
                        onChange={(e) => setGlobalSearchInput(e.target.value)}
                        placeholder={dictadoActivoGlobal ? "Escuchando nombre de paciente..." : "🔎 Buscar paciente por nombre, DNI o diagnóstico..."}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          fontSize: '18px',
                          fontWeight: 500,
                          background: 'transparent',
                          color: basePalette.textMain
                        }}
                      />
                      <button 
                        onClick={toggleDictadoGlobal}
                        style={{
                          background: dictadoActivoGlobal ? basePalette.error : 'transparent',
                          color: dictadoActivoGlobal ? 'white' : basePalette.textSecondary,
                          border: `1.5px solid ${basePalette.borders}`,
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Dictar nombre para buscar"
                      >
                        {dictadoActivoGlobal ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                    </div>

                    {/* Dropdown de resultados */}
                    {globalSearchInput.trim() !== '' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: basePalette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${basePalette.borders}`,
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        zIndex: 90,
                        marginTop: '8px',
                        maxHeight: '280px',
                        overflowY: 'auto'
                      }}>
                        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${basePalette.borders}`, fontSize: '11px', color: basePalette.textMuted, fontWeight: 600 }}>
                          RESULTADOS EN TIEMPO REAL ({resultadosBusquedaGlobal.length})
                        </div>
                        {resultadosBusquedaGlobal.length === 0 ? (
                          <div style={{ padding: '16px', fontSize: '13px', color: basePalette.textMuted, textAlign: 'center' }}>
                            No se encontraron expedientes con ese nombre o DNI.
                          </div>
                        ) : (
                          resultadosBusquedaGlobal.map((p) => (
                            <div 
                              key={p.id} 
                              onClick={() => {
                                setPacienteSeleccionadoId(p.id);
                                setModalVerFichaCompleta(true);
                                setGlobalSearchInput('');
                              }}
                              style={{
                                padding: '12px 18px',
                                borderBottom: `1px solid ${basePalette.borders}`,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: basePalette.textMain }}>{p.nombre_completo}</p>
                                <p style={{ fontSize: '11px', color: basePalette.textMuted }}>DNI: {p.dni} | {p.diagnostico_principal}</p>
                              </div>
                              <span style={{ fontSize: '11px', background: '#F0FDFA', color: '#0F766E', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                Abrir Historia Clínica ↗
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fila de Tarjetas Vivas con identidad de color temática (Clickeables) */}
                  <div className="grid-4cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div 
                      onClick={() => setActiveTab('patients')}
                      style={{ 
                        background: basePalette.bgCard, 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1.5px solid #0EA5E9', 
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 700 }}>🩺 PACIENTES</span>
                          <UserCheck size={16} style={{ color: '#0EA5E9' }} />
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: 700, color: basePalette.textMain }}>{pacientes.length}</span>
                      </div>
                      <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '8px', marginTop: '12px', fontSize: '11px', color: basePalette.textMuted }}>
                        Base de datos unificada
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveTab('hospital')}
                      style={{ 
                        background: basePalette.bgCard, 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1.5px solid #2563EB', 
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>🏥 HOSPITAL</span>
                          <Hospital size={16} style={{ color: '#2563EB' }} />
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: 700, color: basePalette.textMain }}>{internaciones.length}</span>
                      </div>
                      <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '8px', marginTop: '12px', fontSize: '11px', color: basePalette.textMuted }}>
                        Habitaciones: <strong style={{ color: basePalette.textMain }}>{habitacionesInternadas}</strong>
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveTab('or')}
                      style={{ 
                        background: basePalette.bgCard, 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1.5px solid #06B6D4', 
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 700 }}>📅 AGENDA</span>
                          <Calendar size={16} style={{ color: '#06B6D4' }} />
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: 700, color: basePalette.textMain }}>{cirugias.length}</span>
                      </div>
                      <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '8px', marginTop: '12px', fontSize: '11px', color: basePalette.textMuted }}>
                        Próxima: <strong style={{ color: basePalette.textMain }}>{proximaCirugiaHora}</strong>
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveTab('finances')}
                      style={{ 
                        background: basePalette.bgCard, 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1.5px solid #16A34A', 
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>💰 FINANZAS</span>
                          <DollarSign size={16} style={{ color: '#16A34A' }} />
                        </div>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: basePalette.textMain }}>
                          ${totalIngresos.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '8px', marginTop: '12px', fontSize: '11px', color: basePalette.textMuted }}>
                        Cobros pendientes: <strong style={{ color: basePalette.warning }}>${finanzas.filter(f => f.estado_pago === 'pendiente').reduce((sum, f) => sum + Number(f.monto), 0).toLocaleString('es-AR')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo Principal */}
                  <div className="panel-2cols" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                    
                    {/* SECCIÓN IZQUIERDA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Chat / Copiloto Clínico Rediseñado Premium */}
                      <div style={{
                        background: darkMode ? '#0b1329' : '#ffffff',
                        borderRadius: '16px',
                        border: `1.5px solid ${getModuleBorder('assistant')}`,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '420px',
                        overflow: 'hidden'
                      }}>
                        {/* Cabecera del Copiloto con Avatar Clínico */}
                        <div className="copiloto-header" style={{ 
                          padding: '12px 18px', 
                          borderBottom: `1px solid ${getModuleBorder('assistant')}`, 
                          background: darkMode ? 'linear-gradient(135deg, #0d1e2d 0%, #0c2020 100%)' : 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%)', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}>
                          <div className="copiloto-title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Avatar Clínico Animado */}
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
                            }}>
                              <HeartPulse size={18} style={{ color: '#ffffff' }} />
                              {/* Punto de estado intermitente */}
                              <span style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: apiKey ? '#22c55e' : '#f59e0b',
                                border: `2px solid ${darkMode ? '#0b1329' : '#ffffff'}`,
                                animation: 'pulse 2s infinite'
                              }} />
                            </div>
                            <div>
                              <h3 className="copiloto-title-text" style={{ fontSize: '14px', fontWeight: 700, color: basePalette.textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Copiloto Clínico
                              </h3>
                              <span className="copiloto-status-badge" style={{ fontSize: '10px', color: basePalette.textMuted, fontWeight: 500 }}>
                                {apiKey ? 'Asistente de IA activo' : 'Modo consultas locales'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contenedor de burbujas */}
                        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {chatMessages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            const isSys = msg.role === 'system-data';
                            
                            return (
                              <div 
                                key={idx} 
                                style={{ 
                                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                                  // Burbuja del usuario con gradiente turquesa, el sistema con fondo suave del modulo, el asistente en gris/azul neutro
                                  background: isUser 
                                    ? `linear-gradient(135deg, ${darkMode ? '#0d9488' : '#0f766e'} 0%, ${darkMode ? '#14b8a6' : '#14b8a6'} 100%)` 
                                    : isSys 
                                      ? (darkMode ? '#112220' : '#f0fdfa')
                                      : (darkMode ? '#1e293b' : '#f1f5f9'),
                                  color: isUser ? '#ffffff' : basePalette.textMain,
                                  border: isSys ? `1.5px solid ${getModuleBorder('assistant')}` : 'none',
                                  padding: '10px 14px', 
                                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
                                  maxWidth: '85%', 
                                  fontSize: '13px', 
                                  lineHeight: 1.45, 
                                  whiteSpace: 'pre-line',
                                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                                }}
                              >
                                {msg.text}
                                {msg.isIA && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: basePalette.warning, marginTop: '6px', fontWeight: 700, letterSpacing: '0.5px' }}>
                                    <Sparkles size={10} /> IA PROCESADA
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {cargandoIA && (
                            <div style={{ 
                              alignSelf: 'flex-start', 
                              background: darkMode ? '#1e293b' : '#f1f5f9', 
                              color: basePalette.textMuted, 
                              padding: '10px 14px', 
                              borderRadius: '16px 16px 16px 4px', 
                              fontSize: '13px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px' 
                            }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: basePalette.textMuted, display: 'inline-block', animation: 'pulse 1s infinite' }} />
                              <span>Escribiendo diagnóstico...</span>
                            </div>
                          )}
                        </div>

                        {/* Píldoras / Atajos Rápidos Táctiles (Comandos sugeridos para un solo click) */}
                        <div style={{ 
                          padding: '4px 16px', 
                          display: 'flex', 
                          gap: '8px', 
                          overflowX: 'auto', 
                          background: darkMode ? '#090f1a' : '#f8fafc',
                          borderTop: `1px solid ${basePalette.borders}`,
                          scrollbarWidth: 'none'
                        }} className="hide-scrollbar">
                          <button 
                            onClick={() => handleSendMessage('¿Quiénes están internadas hoy?')}
                            className="chat-pill-command"
                            style={{ padding: '6px 10px', fontSize: '11px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${basePalette.borders}`, borderRadius: '20px', color: basePalette.textSecondary, cursor: 'pointer', flexShrink: 0 }}
                          >
                            🏥 Recorrida Camas
                          </button>
                          <button 
                            onClick={() => handleSendMessage('¿Qué cirugías tengo programadas para hoy?')}
                            className="chat-pill-command"
                            style={{ padding: '6px 10px', fontSize: '11px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${basePalette.borders}`, borderRadius: '20px', color: basePalette.textSecondary, cursor: 'pointer', flexShrink: 0 }}
                          >
                            📅 Quirófano Hoy
                          </button>
                          <button 
                            onClick={() => handleSendMessage('¿Cuánto facturé este mes?')}
                            className="chat-pill-command"
                            style={{ padding: '6px 10px', fontSize: '11px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${basePalette.borders}`, borderRadius: '20px', color: basePalette.textSecondary, cursor: 'pointer', flexShrink: 0 }}
                          >
                            💰 Facturación
                          </button>
                          <button 
                            onClick={() => handleSendMessage('¿Qué laboratorios hay pendientes?')}
                            className="chat-pill-command"
                            style={{ padding: '6px 10px', fontSize: '11px', background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${basePalette.borders}`, borderRadius: '20px', color: basePalette.textSecondary, cursor: 'pointer', flexShrink: 0 }}
                          >
                            🧪 Analíticas Labs
                          </button>
                        </div>

                        {/* Input y Botones del Chat */}
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${basePalette.borders}`, display: 'flex', gap: '8px', alignItems: 'center', background: darkMode ? '#0e1726' : '#ffffff' }}>
                          <button 
                            onClick={toggleDictadoChat}
                            style={{
                              background: dictadoActivoChat ? '#ef4444' : 'transparent',
                              color: dictadoActivoChat ? 'white' : (darkMode ? '#14b8a6' : '#0f766e'),
                              border: `1.5px solid ${getModuleBorder('assistant')}`,
                              borderRadius: '10px',
                              padding: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Dictar consulta por voz"
                          >
                            {dictadoActivoChat ? <MicOff size={16} /> : <Mic size={16} />}
                          </button>

                          {/* Onda de sonido Siri si está dictando, de lo contrario el input estándar */}
                          {dictadoActivoChat ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: '10px', background: darkMode ? '#1e293b' : '#fee2e2', border: '1.5px solid #ef4444', height: '38px' }}>
                              <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>Grabando audio...</span>
                              <div className="voice-wave-container">
                                <span className="voice-wave-bar" />
                                <span className="voice-wave-bar" />
                                <span className="voice-wave-bar" />
                                <span className="voice-wave-bar" />
                                <span className="voice-wave-bar" />
                              </div>
                            </div>
                          ) : (
                            <input 
                              type="text" 
                              value={chatInput} 
                              onChange={(e) => setChatInput(e.target.value)} 
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                              placeholder="Ej: 'quirofano', 'paciente Clara'..." 
                              disabled={cargandoIA} 
                              style={{ 
                                flex: 1, 
                                padding: '8px 14px', 
                                borderRadius: '10px', 
                                border: `1.5px solid ${getModuleBorder('assistant')}`, 
                                fontSize: '13px', 
                                outline: 'none', 
                                color: basePalette.textMain, 
                                background: darkMode ? '#1e293b' : '#ffffff',
                                transition: 'border-color 0.2s'
                              }} 
                            />
                          )}

                          {!dictadoActivoChat && (
                            <button 
                              onClick={() => handleSendMessage()} 
                              disabled={cargandoIA || !chatInput.trim()} 
                              style={{ 
                                background: chatInput.trim() ? (darkMode ? '#14b8a6' : '#0f766e') : '#cbd5e1', 
                                color: 'white', 
                                border: 'none', 
                                padding: '8px 12px', 
                                borderRadius: '10px', 
                                cursor: chatInput.trim() ? 'pointer' : 'default', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                transition: 'all 0.2s' 
                              }}
                            >
                              <Send size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* TIMELINE DE HISTORIA DIARIA */}
                      <div style={{
                        background: basePalette.bgCard,
                        borderRadius: '12px',
                        border: '1.5px solid #06B6D4',
                        padding: '24px',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} style={{ color: '#06B6D4' }} />
                            <h4 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: basePalette.textMain }}>📅 Agenda y Cronograma</h4>
                          </div>
                          <button 
                            onClick={() => setModalNuevaCita(true)}
                            style={{
                              background: '#06B6D4',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={12} />
                            <span>Agendar Cita</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', borderLeft: '2px solid #A5F3FC', marginLeft: '12px', paddingLeft: '24px', gap: '20px' }}>
                          {TIMELINE_DATA.length === 0 ? (
                            <p style={{ fontSize: '12px', color: basePalette.textMuted, fontStyle: 'italic' }}>Sin actividades programadas para hoy.</p>
                          ) : (
                            TIMELINE_DATA.map((item, idx) => (
                              <div key={idx} style={{ position: 'relative' }}>
                                <span style={{
                                  position: 'absolute',
                                  left: '-31px',
                                  top: '2px',
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: item.tipo === 'cirugia' ? '#EF4444' : (item.tipo === 'cita' ? '#2563EB' : '#06B6D4'),
                                  border: '2px solid #ffffff'
                                }} />
                                <div style={{ display: 'flex', gap: '16px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#06B6D4', minWidth: '45px' }}>{item.hora}</span>
                                  <div>
                                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMain }}>{item.titulo}</h5>
                                    <p style={{ fontSize: '11px', color: basePalette.textMuted, marginTop: '2px' }}>{item.desc}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>

                    {/* SECCIÓN DERECHA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      


                      {/* Tarjeta de Bienvenida y Estado Proactivo */}
                      <div style={{ background: basePalette.bgCard, padding: '24px', borderRadius: '12px', border: `1px solid ${basePalette.borders}`, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} style={{ color: basePalette.warning }} />
                            <h4 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: basePalette.textMain }}>Asistente Proactivo</h4>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ background: '#f0fdfa', color: basePalette.exito, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>✓</span>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMain }}>Elena Rostova</p>
                              <p style={{ fontSize: '11px', color: basePalette.textMuted }}>Cumple su segundo día postoperatorio en Hab. 301</p>
                            </div>
                          </div>

                          {internaciones.filter(i => i.laboratorio_pendiente).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              <span style={{ background: '#fee2e2', color: basePalette.error, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>!</span>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: basePalette.error }}>Laboratorio Pendiente</p>
                                <p style={{ fontSize: '11px', color: basePalette.textMuted }}>
                                  Hay {internaciones.filter(i => i.laboratorio_pendiente).length} reporte pendiente en internación.
                                </p>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ background: '#e0f2fe', color: basePalette.informacion, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>i</span>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMain }}>Próxima Cirugía: 08:00 hs</p>
                              <p style={{ fontSize: '11px', color: basePalette.textMuted }}>Laparotomía estadificadora - Elena Rostova</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', borderTop: `1px solid ${basePalette.borders}`, paddingTop: '12px' }}>
                            <DollarSign size={18} style={{ color: basePalette.exito, marginTop: '2px' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMain }}>Facturación del Mes</p>
                              <p style={{ fontSize: '15px', fontWeight: 700, color: basePalette.primario, marginTop: '2px' }}>
                                ${totalIngresos.toLocaleString('es-AR')} ARS
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sugerencias de Acciones Rápidas */}
                      <div style={{ background: basePalette.bgCard, padding: '24px', borderRadius: '12px', border: `1px solid ${basePalette.borders}`, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMuted, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sugerencias del sistema</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <button 
                            onClick={() => {
                              setPacienteEvolucionId('');
                              setEvolucionGenerada('');
                              setModalEvolucion(true);
                            }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', color: basePalette.textMain }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} style={{ color: basePalette.primario }} />
                              Preparar evolución diaria
                            </span>
                            <ArrowUpRight size={14} style={{ color: basePalette.textMuted }} />
                          </button>

                          <button 
                            onClick={() => setModalConfigAlertas(true)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', color: basePalette.textMain }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Sliders size={16} style={{ color: basePalette.warning }} />
                              Configurar Alertas Clínicas
                            </span>
                            <ArrowUpRight size={14} style={{ color: basePalette.textMuted }} />
                          </button>

                          <button 
                            onClick={() => setActiveTab('hospital')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left', color: basePalette.textMain }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Hospital size={16} style={{ color: basePalette.informacion }} />
                              Ver pacientes internadas
                            </span>
                            <ArrowUpRight size={14} style={{ color: basePalette.textMuted }} />
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: PACIENTES - IDENTIDAD TURQUESA */}
              {activeTab === 'patients' && (
                <div style={{ background: basePalette.bgCard, borderRadius: '12px', border: '1.5px solid #0EA5E9', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: basePalette.textMuted }} />
                      <input type="text" placeholder="Buscar por DNI o Nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid #BAE6FD', fontSize: '13px', outline: 'none', color: basePalette.textMain, background: 'white' }} />
                    </div>
                    
                    <button 
                      onClick={() => setModalNuevoPaciente(true)} 
                      style={{ background: '#0EA5E9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Plus size={16} /> <span>Ingresar Paciente</span>
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #BAE6FD', color: basePalette.textMuted }}>
                        <th style={{ padding: '12px' }}>Paciente</th>
                        <th style={{ padding: '12px' }}>DNI</th>
                        <th style={{ padding: '12px' }}>Estado</th>
                        <th style={{ padding: '12px' }}>Obra Social</th>
                        <th style={{ padding: '12px' }}>Diagnóstico</th>
                        <th style={{ padding: '12px' }}>Nacionalidad</th>
                        <th style={{ padding: '12px' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p) => {
                        let badgeBg = '#E5E7EB';
                        let badgeText = '#374151';
                        let stateLabel = 'Consulta';
                        switch (p.estado) {
                          case 'internacion':
                            badgeBg = '#fee2e2';
                            badgeText = '#b91c1c';
                            stateLabel = 'Internada';
                            break;
                          case 'observacion':
                            badgeBg = '#fef3c7';
                            badgeText = '#b45309';
                            stateLabel = 'En Observación';
                            break;
                          case 'quirófano':
                            badgeBg = '#ecfeff';
                            badgeText = '#0891b2';
                            stateLabel = 'En Quirófano';
                            break;
                          case 'seguimiento':
                            badgeBg = '#f3e8ff';
                            badgeText = '#6b21a8';
                            stateLabel = 'Seguimiento';
                            break;
                          case 'alta':
                            badgeBg = '#d1fae5';
                            badgeText = '#065f46';
                            stateLabel = 'Alta';
                            break;
                          default:
                            badgeBg = '#dcfce7';
                            badgeText = '#166534';
                            stateLabel = 'Consulta';
                        }

                        return (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${basePalette.borders}` }}>
                            <td style={{ padding: '16px 12px', fontWeight: 600, color: basePalette.textMain }}>{p.nombre_completo}</td>
                            <td style={{ padding: '16px 12px', color: basePalette.textSecondary }}>{p.dni}</td>
                            <td style={{ padding: '16px 12px' }}>
                              <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', background: badgeBg, color: badgeText, whiteSpace: 'nowrap' }}>
                                {stateLabel}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', color: basePalette.textSecondary }}>{p.obra_social || 'Particular'}</td>
                            <td style={{ padding: '16px 12px', color: basePalette.textSecondary }}>{p.diagnostico_principal || 'Sin diagnóstico cargado'}</td>
                            <td style={{ padding: '16px 12px', color: basePalette.textSecondary }}>{p.nacionalidad || 'Argentina'}</td>
                            <td style={{ padding: '16px 12px' }}>
                              <button 
                                onClick={() => {
                                  setPacienteSeleccionadoId(p.id);
                                  setModalVerFichaCompleta(true);
                                }}
                                style={{ background: '#f0fdfa', border: '1px solid #0EA5E9', color: '#0EA5E9', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Ver Ficha / Historia
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: HOSPITAL - IDENTIDAD AZUL */}
              {activeTab === 'hospital' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {internaciones.map((i) => (
                    <div key={i.id} style={{ background: basePalette.bgCard, borderRadius: '12px', border: '1.5px solid #2563EB', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      
                      <div>
                        <div style={{ position: 'absolute', top: '24px', right: '24px', background: darkMode ? '#1e293b' : '#EFF6FF', color: '#2563EB', fontWeight: 'bold', fontSize: '13px', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${darkMode ? '#1e3a8a' : '#BFDBFE'}`, display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span>Hab {i.habitacion}</span>
                          {i.cama && (
                            <>
                              <span style={{ color: basePalette.textMuted }}>|</span>
                              <span>Cama {i.cama}</span>
                            </>
                          )}
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: basePalette.textMain }}>{i.pacientes?.nombre_completo || 'Paciente'}</h3>
                        <p style={{ fontSize: '12px', color: basePalette.textMuted, marginBottom: '16px' }}>{i.pacientes?.diagnostico_principal}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: basePalette.textSecondary }}>Temperatura:</span>
                            <span style={{ fontWeight: 600, color: Number(i.temperatura) >= configAlertas.umbral_temperatura ? basePalette.error : basePalette.textMain }}>{i.temperatura}°C</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: basePalette.textSecondary }}>Drenaje:</span>
                            <span style={{ fontWeight: 600, color: Number(i.drenaje_cc) >= configAlertas.umbral_drenaje ? basePalette.error : basePalette.textMain }}>{i.drenaje_cc} cc</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                            <span style={{ color: basePalette.textSecondary }}>Laboratorio:</span>
                            <span style={{ background: i.laboratorio_pendiente ? '#fee2e2' : '#dcfce7', color: i.laboratorio_pendiente ? basePalette.error : basePalette.exito, fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {i.laboratorio_pendiente ? 'PENDIENTE' : 'COMPLETO'}
                            </span>
                          </div>
                        </div>

                        {i.evolucion_diaria && (
                          <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '8px', border: '1px solid #BFDBFE', marginBottom: '16px', fontSize: '11px', color: '#1E40AF', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                            <strong>Evolución / Notas:</strong><br />
                            {i.evolucion_diaria}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: `1px solid ${basePalette.borders}`, paddingTop: '16px' }}>
                        <button 
                          onClick={() => {
                            setPacienteNotaId(i.id);
                            setNotaRapidaTexto('');
                            setModalNotaRapida(true);
                          }}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: '1px solid #2563EB',
                            color: '#2563EB',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 500
                          }}
                        >
                          <Mic size={14} />
                          <span>Agregar Nota por Voz</span>
                        </button>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => {
                              setInternacionSeleccionada(i);
                              setFormSignos({
                                temperatura: i.temperatura ? String(i.temperatura) : '',
                                drenaje_cc: i.drenaje_cc ? String(i.drenaje_cc) : '',
                                evolucion_diaria: i.evolucion_diaria || ''
                              });
                              setModalSignos(true);
                            }} 
                            style={{ flex: 1, background: 'transparent', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', color: basePalette.textMain }}
                          >
                            Signos
                          </button>
                          <button 
                            onClick={async () => {
                              await supabase.from('internaciones').delete().eq('id', i.id);
                              alert('Paciente dada de alta.');
                            }}
                            style={{ flex: 1, background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                          >
                            Dar Alta
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: QUIRÓFANO - IDENTIDAD CELESTE */}
              {activeTab === 'or' && (
                <div style={{ background: basePalette.bgCard, borderRadius: '12px', border: '1.5px solid #06B6D4', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0891B2' }}>Bitácora Quirúrgica Real</h3>
                      <p style={{ fontSize: '13px', color: basePalette.textMuted }}>Operaciones programadas y realizadas.</p>
                    </div>
                    <button 
                      onClick={() => setModalNuevaCirugia(true)}
                      style={{ background: '#06B6D4', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={16} /> Agregar Nueva Bitácora
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cirugias.length === 0 ? (
                      <p style={{ fontSize: '13px', color: basePalette.textMuted, fontStyle: 'italic' }}>No hay cirugías registradas en Supabase.</p>
                    ) : (
                      cirugias.map((c) => (
                        <div key={c.id} style={{ border: '1.5px solid #A5F3FC', borderRadius: '8px', padding: '20px', background: '#ECFEFF', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0891B2' }}>{c.pacientes?.nombre_completo}</h4>
                            <p style={{ fontSize: '13px', marginTop: '6px', color: basePalette.textSecondary }}><strong>Procedimiento:</strong> {c.procedimiento}</p>
                            <p style={{ fontSize: '13px', color: basePalette.textSecondary }}><strong>Duración:</strong> {c.duracion_minutos} min | Sangrado: {c.perdida_sanguinea_cc} cc</p>
                            {c.complicaciones && <p style={{ fontSize: '12px', color: basePalette.error, marginTop: '4px' }}>⚠️ <strong>Complicaciones:</strong> {c.complicaciones}</p>}
                          </div>
                          
                          <button 
                            onClick={async () => {
                              if (confirm('¿Desea eliminar este registro quirúrgico de Supabase?')) {
                                await supabase.from('cirugias').delete().eq('id', c.id);
                                fetchData();
                              }
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.error }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: FINANZAS */}
              {activeTab === 'finances' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={{ background: basePalette.bgCard, padding: '24px', borderRadius: '12px', border: '1.5px solid #16A34A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <span style={{ fontSize: '13px', color: basePalette.textMuted }}>Ingresos Realizados</span>
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#16A34A', marginTop: '4px' }}>
                        ${finanzas.filter(f => f.tipo === 'ingreso').reduce((sum, f) => sum + Number(f.monto), 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div style={{ background: basePalette.bgCard, padding: '24px', borderRadius: '12px', border: '1.5px solid #D97706', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <span style={{ fontSize: '13px', color: basePalette.textMuted }}>Pendientes</span>
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>
                        ${finanzas.filter(f => f.estado_pago === 'pendiente').reduce((sum, f) => sum + Number(f.monto), 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: basePalette.bgCard, padding: '24px', borderRadius: '12px', border: '1.5px solid #16A34A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: basePalette.textMain }}>Transacciones Registradas</h3>
                    {finanzas.map((f) => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${basePalette.borders}` }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: basePalette.textMain }}>{f.concepto}</p>
                          <p style={{ fontSize: '11px', color: basePalette.textMuted }}>{f.obra_social || 'Particular'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: f.tipo === 'ingreso' ? '#16A34A' : basePalette.error }}>
                            ${Number(f.monto).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: INVESTIGACIÓN */}
              {activeTab === 'research' && (
                <div style={{ background: basePalette.bgCard, borderRadius: '12px', border: '1.5px solid #8B5CF6', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#8B5CF6' }}>Filtros Retrospectivos de Pacientes</h3>
                      <p style={{ fontSize: '13px', color: basePalette.textMuted }}>Muestras filtradas listas para exportación.</p>
                    </div>
                    <button onClick={() => alert('Exportación Excel iniciada...')} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}><Download size={16} /> Exportar Excel</button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <button onClick={() => setFiltroInvestigacion('todos')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #DDD6FE', background: filtroInvestigacion === 'todos' ? '#8B5CF6' : 'transparent', color: filtroInvestigacion === 'todos' ? 'white' : '#8B5CF6', fontSize: '13px', cursor: 'pointer' }}>Todas</button>
                    <button onClick={() => setFiltroInvestigacion('pole')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #DDD6FE', background: filtroInvestigacion === 'pole' ? '#8B5CF6' : 'transparent', color: filtroInvestigacion === 'pole' ? 'white' : '#8B5CF6', fontSize: '13px', cursor: 'pointer' }}>POLE+</button>
                    <button onClick={() => setFiltroInvestigacion('brca1')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #DDD6FE', background: filtroInvestigacion === 'brca1' ? '#8B5CF6' : 'transparent', color: filtroInvestigacion === 'brca1' ? 'white' : '#8B5CF6', fontSize: '13px', cursor: 'pointer' }}>BRCA1+</button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #DDD6FE', color: basePalette.textMuted }}>
                        <th style={{ padding: '12px' }}>Paciente</th>
                        <th style={{ padding: '12px' }}>DNI</th>
                        <th style={{ padding: '12px' }}>Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {researchFiltered.map((p) => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${basePalette.borders}` }}>
                          <td style={{ padding: '14px 12px', fontWeight: 600, color: basePalette.textMain }}>{p.nombre_completo}</td>
                          <td style={{ padding: '14px 12px', color: basePalette.textSecondary }}>{p.dni}</td>
                          <td style={{ padding: '14px 12px', color: basePalette.textSecondary }}>{p.diagnostico_principal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* MODAL CONFIGURACIÓN GENERAL DEL PORTAL */}
      {mostrarConfig && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '95%', maxWidth: '480px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} style={{ color: basePalette.primario }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: basePalette.textMain }}>Ajustes del Portal</h3>
              </div>
              <button onClick={() => setMostrarConfig(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              
              {/* Modo Oscuro */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: basePalette.textMain }}>Modo Oscuro</span>
                  <p style={{ fontSize: '11px', color: basePalette.textMuted, marginTop: '2px' }}>Alternar tema claro u oscuro</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setDarkMode(val);
                    localStorage.setItem('oncogyn_dark_mode', val ? 'true' : 'false');
                    try {
                      const { data: config } = await supabase.from('config_alertas').select('id').single();
                      if (config) {
                        await supabase
                          .from('config_alertas')
                          .update({ dark_mode: val })
                          .eq('id', config.id);
                      }
                    } catch (err) {
                      console.warn('No se pudo sincronizar el modo oscuro en Supabase:', err);
                    }
                  }}
                  style={{ 
                    width: '38px', 
                    height: '20px', 
                    cursor: 'pointer',
                    accentColor: basePalette.primario
                  }}
                />
              </div>

              {/* Modelo de Copiloto */}
              <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: basePalette.textMain }}>Modelo de Copiloto IA</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: basePalette.textMuted, marginTop: '4px' }}>Motor de inteligencia artificial activo</p>
              </div>

              {/* API Key */}
              <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: basePalette.textMain }}>API Key de OpenRouter</label>
                <input 
                  type="password" 
                  value={tempApiKey} 
                  onChange={(e) => setTempApiKey(e.target.value)} 
                  placeholder="sk-or-v1-..." 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, fontSize: '13px', outline: 'none', fontFamily: 'monospace', color: basePalette.textMain, background: darkMode ? '#1e293b' : 'white' }} 
                />
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ display: 'inline-block', fontSize: '11px', color: basePalette.secundario, marginTop: '6px', textDecoration: 'underline' }}>Crear clave en OpenRouter ↗</a>
              </div>

              {/* Notificaciones del Navegador */}
              <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: basePalette.textMain }}>Notificaciones de Sistema (PWA)</span>
                  <p style={{ fontSize: '11px', color: basePalette.textMuted, marginTop: '2px' }}>Alertas de cirugías, visitas y signos vitales</p>
                </div>
                <button 
                  type="button"
                  onClick={requestNotificationPermission} 
                  style={{
                    background: notifPermission === 'granted' ? basePalette.exito : basePalette.primario,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  disabled={notifPermission === 'granted'}
                >
                  {notifPermission === 'granted' ? 'Habilitado' : 'Solicitar'}
                </button>
              </div>

              {/* Estado de Realtime */}
              <div style={{ borderTop: `1px solid ${basePalette.borders}`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: basePalette.textMain }}>Servidor en Tiempo Real (Realtime)</span>
                  <p style={{ fontSize: '11px', color: basePalette.textMuted, marginTop: '2px' }}>Estado de conexión para alertas instantáneas</p>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: realtimeStatus === 'SUBSCRIBED' ? '#16A34A' : '#DC2626',
                  background: realtimeStatus === 'SUBSCRIBED' ? '#DCFCE7' : '#FEE2E2',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {realtimeStatus === 'SUBSCRIBED' ? '🟢 Conectado' : `🔴 ${realtimeStatus}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setMostrarConfig(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
              <button onClick={handleSaveApiKey} style={{ flex: 1, background: basePalette.primario, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Guardar Ajustes</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN ALERTA CLÍNICA PERSONALIZABLE */}
      {modalConfigAlertas && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} style={{ color: basePalette.warning }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Ajustes de Alertas y Notificaciones</h3>
              </div>
              <button onClick={() => setModalConfigAlertas(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleGuardarConfigAlertas} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ borderBottom: `1px solid ${basePalette.borders}`, paddingBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={configAlertas.alarma_temperatura} onChange={(e) => setConfigAlertas({ ...configAlertas, alarma_temperatura: e.target.checked })} />
                  Monitoreo de Fiebre en Internadas
                </label>
                {configAlertas.alarma_temperatura && (
                  <div style={{ marginTop: '8px', paddingLeft: '22px' }}>
                    <label style={{ fontSize: '12px', color: basePalette.textMuted }}>Umbral de temperatura febril (°C):</label>
                    <input type="number" step="0.1" value={configAlertas.umbral_temperatura} onChange={(e) => setConfigAlertas({ ...configAlertas, umbral_temperatura: Number(e.target.value) })} style={{ width: '100px', marginLeft: '10px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${basePalette.borders}` }} />
                  </div>
                )}
              </div>

              <div style={{ borderBottom: `1px solid ${basePalette.borders}`, paddingBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={configAlertas.alarma_drenaje} onChange={(e) => setConfigAlertas({ ...configAlertas, alarma_drenaje: e.target.checked })} />
                  Monitoreo de Drenaje Excesivo
                </label>
                {configAlertas.alarma_drenaje && (
                  <div style={{ marginTop: '8px', paddingLeft: '22px' }}>
                    <label style={{ fontSize: '12px', color: basePalette.textMuted }}>Débito límite de drenaje (cc/24hs):</label>
                    <input type="number" value={configAlertas.umbral_drenaje} onChange={(e) => setConfigAlertas({ ...configAlertas, umbral_drenaje: Number(e.target.value) })} style={{ width: '100px', marginLeft: '10px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${basePalette.borders}` }} />
                  </div>
                )}
              </div>

              <div style={{ borderBottom: `1px solid ${basePalette.borders}`, paddingBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={configAlertas.sonido_activo} onChange={(e) => setConfigAlertas({ ...configAlertas, sonido_activo: e.target.checked })} />
                  Alertas Sonoras (Hacer sonar el teléfono)
                </label>
                <p style={{ fontSize: '11px', color: basePalette.textMuted, paddingLeft: '22px', marginTop: '2px' }}>
                  El sistema emitirá un silbido/tono clínico de aviso si se detectan parámetros de riesgo.
                </p>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={configAlertas.notificar_whatsapp} onChange={(e) => setConfigAlertas({ ...configAlertas, notificar_whatsapp: e.target.checked })} />
                  Redirigir Notificación vía WhatsApp
                </label>
                {configAlertas.notificar_whatsapp && (
                  <div style={{ marginTop: '8px', paddingLeft: '22px' }}>
                    <label style={{ fontSize: '12px', color: basePalette.textMuted }}>Número de Notificación:</label>
                    <input type="text" placeholder="+54911..." value={configAlertas.telefono_notificacion} onChange={(e) => setConfigAlertas({ ...configAlertas, telefono_notificacion: e.target.value })} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', border: `1px solid ${basePalette.borders}` }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalConfigAlertas(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: basePalette.primario, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Guardar Configuración</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA CIRUGÍA (NUEVA BITÁCORA) */}
      {modalNuevaCirugia && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Agregar Bitácora Quirúrgica</h3>
              <button onClick={() => setModalNuevaCirugia(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCrearCirugia} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Seleccionar Paciente *</label>
                <select 
                  required
                  value={formCirugia.paciente_id}
                  onChange={(e) => setFormCirugia({ ...formCirugia, paciente_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre_completo} (DNI: {p.dni})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Procedimiento *</label>
                  <input type="text" required placeholder="Ej: Citorreducción ovárica" value={formCirugia.procedimiento} onChange={(e) => setFormCirugia({...formCirugia, procedimiento: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Fecha de Cirugía</label>
                  <input type="date" value={formCirugia.fecha} onChange={(e) => setFormCirugia({...formCirugia, fecha: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Hora</label>
                  <input type="time" value={formCirugia.hora} onChange={(e) => setFormCirugia({...formCirugia, hora: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Duración (minutos)</label>
                  <input type="number" placeholder="Ej: 120" value={formCirugia.duracion_minutos} onChange={(e) => setFormCirugia({...formCirugia, duracion_minutos: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Pérdida Sanguínea (cc)</label>
                  <input type="number" placeholder="Ej: 250" value={formCirugia.perdida_sanguinea_cc} onChange={(e) => setFormCirugia({...formCirugia, perdida_sanguinea_cc: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Diagnóstico Preoperatorio</label>
                  <input type="text" placeholder="Ej: Tumoración anexial" value={formCirugia.diagnostico_preop} onChange={(e) => setFormCirugia({...formCirugia, diagnostico_preop: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Diagnóstico Postoperatorio</label>
                  <input type="text" placeholder="Ej: Cáncer de ovario EC IIIc" value={formCirugia.diagnostico_postop} onChange={(e) => setFormCirugia({...formCirugia, diagnostico_postop: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Complicaciones o Notas</label>
                <textarea rows={2} placeholder="Escribir si hubo incidentes..." value={formCirugia.complicaciones} onChange={(e) => setFormCirugia({...formCirugia, complicaciones: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalNuevaCirugia(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#06B6D4', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Registrar en Supabase</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {modalNuevaCita && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Programar Nueva Cita</h3>
              <button onClick={() => setModalNuevaCita(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCrearCita} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Seleccionar Paciente *</label>
                <select 
                  required
                  value={formCita.paciente_id}
                  onChange={(e) => setFormCita({ ...formCita, paciente_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }}
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre_completo} (DNI: {p.dni})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Fecha *</label>
                  <input type="date" required value={formCita.fecha} onChange={(e) => setFormCita({...formCita, fecha: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Hora *</label>
                  <input type="time" required value={formCita.hora} onChange={(e) => setFormCita({...formCita, hora: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Motivo de la Cita</label>
                <textarea rows={3} placeholder="Ej: Control postoperatorio de 15 días..." value={formCita.motivo} onChange={(e) => setFormCita({...formCita, motivo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', resize: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalNuevaCita(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Programar Cita</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {modalSignos && internacionSeleccionada && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Registrar Signos y Evolución</h3>
              <button onClick={() => setModalSignos(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '12px', color: basePalette.textMuted, marginBottom: '16px' }}>
              Paciente: <strong>{internacionSeleccionada.pacientes?.nombre_completo}</strong> <br />
              Habitación: <strong>{internacionSeleccionada.habitacion}</strong> - Cama: <strong>{internacionSeleccionada.cama || '-'}</strong>
            </p>

            <form onSubmit={handleGuardarSignos} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Temperatura (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="Ej: 36.5" 
                    value={formSignos.temperatura} 
                    onChange={(e) => setFormSignos({...formSignos, temperatura: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Drenaje acumulado (cc)</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 50" 
                    value={formSignos.drenaje_cc} 
                    onChange={(e) => setFormSignos({...formSignos, drenaje_cc: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Evolución / Observaciones</label>
                <textarea 
                  rows={4} 
                  placeholder="Ej: Paciente lúcida, afebril, drenaje seroso..." 
                  value={formSignos.evolucion_diaria} 
                  onChange={(e) => setFormSignos({...formSignos, evolucion_diaria: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', resize: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalSignos(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Guardar Signos</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL PREPARAR EVOLUCIÓN */}
      {modalEvolucion && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '28px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: basePalette.primario }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: basePalette.textMain }}>Generador de Evolución Diaria (Supabase)</h3>
              </div>
              <button onClick={() => setModalEvolucion(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: basePalette.textMain }}>Seleccionar Paciente Internada</label>
              <select 
                value={pacienteEvolucionId}
                onChange={(e) => setPacienteEvolucionId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, outline: 'none', color: basePalette.textMain, background: basePalette.bgCard }}
              >
                <option value="">-- Seleccionar --</option>
                {internaciones.map(i => (
                  <option key={i.id} value={i.id}>Hab {i.habitacion} - {i.pacientes?.nombre_completo}</option>
                ))}
              </select>
            </div>

            {pacienteEvolucionId && (
              <button 
                onClick={handleGenerarEvolucion}
                style={{ width: '100%', background: basePalette.primario, color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}
              >
                Generar Estructura Inicial
              </button>
            )}

            {evolucionGenerada && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMain }}>Evolución / Observaciones de la Paciente</label>
                  <button 
                    onClick={toggleDictadoEvolucion}
                    style={{ background: dictadoActivoEvolucion ? basePalette.error : 'transparent', color: dictadoActivoEvolucion ? 'white' : basePalette.primario, border: `1px solid ${basePalette.borders}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {dictadoActivoEvolucion ? <MicOff size={12} /> : <Mic size={12} />}
                    <span>{dictadoActivoEvolucion ? 'Escuchando...' : 'Dictar Observación'}</span>
                  </button>
                </div>
                <textarea 
                  value={evolucionGenerada} 
                  onChange={(e) => setEvolucionGenerada(e.target.value)}
                  style={{ width: '100%', height: '180px', padding: '12px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, fontFamily: 'monospace', fontSize: '13px', resize: 'none', background: basePalette.bgMain, color: basePalette.textMain }}
                />
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    onClick={handleGuardarEvolucionEnBase}
                    style={{ flex: 1, background: basePalette.primario, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Guardar en Ficha de Paciente
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(evolucionGenerada);
                      alert('Copiado al portapapeles.');
                    }}
                    style={{ background: 'transparent', border: `1px solid ${basePalette.borders}`, color: basePalette.textMain, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL VER FICHA COMPLETA (HISTORIA CLÍNICA INTEGRAL) */}
      {modalVerFichaCompleta && pacienteFicha && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '850px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}`, overflow: 'hidden' }}>
            
            <div style={{ padding: '24px', borderBottom: `1px solid ${basePalette.borders}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#0c253f' : '#F0F9FF' }}>
              <div>
                <span style={{ fontSize: '11px', background: '#0EA5E9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>HISTORIA CLÍNICA DIGITAL</span>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: basePalette.textMain, marginTop: '6px' }}>{pacienteFicha.nombre_completo}</h3>
                <p style={{ fontSize: '13px', color: basePalette.textMuted }}>DNI: {pacienteFicha.dni} | Nacionalidad: {pacienteFicha.nacionalidad || 'Argentina'} | OS: {pacienteFicha.obra_social || 'Particular'}</p>
              </div>
              <button onClick={() => setModalVerFichaCompleta(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                <div style={{ background: darkMode ? '#18243c' : '#F8FAFC', padding: '16px', borderRadius: '8px', border: `1px solid ${basePalette.borders}` }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0EA5E9' }}>Datos Personales y Seguimiento</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <p style={{ color: basePalette.textMuted }}>Nacimiento:</p>
                      <p style={{ fontWeight: 600 }}>{pacienteFicha.fecha_nacimiento || 'No cargada'}</p>
                    </div>
                    <div>
                      <p style={{ color: basePalette.textMuted }}>E-mail:</p>
                      <p style={{ fontWeight: 600 }}>{pacienteFicha.email || 'No cargado'}</p>
                    </div>
                    <div>
                      <p style={{ color: basePalette.textMuted }}>Primera Consulta:</p>
                      <p style={{ fontWeight: 600 }}>{pacienteFicha.fecha_inicio_consulta || 'No registrada'}</p>
                    </div>
                    <div>
                      <p style={{ color: basePalette.textMuted }}>Centro Médico:</p>
                      <p style={{ fontWeight: 600 }}>{pacienteFicha.hospital_atencion || 'Consultorio Principal'}</p>
                    </div>
                  </div>
                </div>

                <div style={{ background: darkMode ? '#18243c' : '#F8FAFC', padding: '16px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0EA5E9' }}>Contactos de Paciente</h4>
                    <p style={{ fontSize: '12px', color: basePalette.textMuted, marginBottom: '8px' }}>Familiar: {pacienteFicha.telefono_familiar || 'No registrado'}</p>
                  </div>
                  
                  {pacienteFicha.telefono && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <a 
                        href={`tel:${pacienteFicha.telefono}`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0EA5E9', color: 'white', textDecoration: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Phone size={14} /> <span>Llamar</span>
                      </a>
                      <a 
                        href={`https://wa.me/${pacienteFicha.telefono.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#16A34A', color: 'white', textDecoration: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                      >
                        <MessageSquare size={14} /> <span>WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: darkMode ? '#2d2417' : '#FFFBEB', padding: '16px', borderRadius: '8px', border: darkMode ? '1px solid #d97706' : '1px solid #FDE68A' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: darkMode ? '#f59e0b' : '#B45309', marginBottom: '8px' }}>Diagnóstico Clínico Principal</h4>
                <p style={{ fontSize: '13px', lineHeight: 1.5 }}>{pacienteFicha.diagnostico_principal || 'Sin diagnóstico registrado en Supabase.'}</p>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {pacienteFicha.mutaciones?.pole && <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Mutación POLE+</span>}
                  {pacienteFicha.mutaciones?.brca1 && <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Mutación BRCA1+</span>}
                  {pacienteFicha.mutaciones?.brca2 && <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Mutación BRCA2+</span>}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Evolución Clínico / Notas</h4>
                  <button 
                    onClick={() => setModalNuevaConsulta(true)}
                    style={{ background: '#0EA5E9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}
                  >
                    <Plus size={14} /> Nueva Nota
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {consultasPaciente.length === 0 ? (
                    <p style={{ fontSize: '13px', color: basePalette.textMuted, fontStyle: 'italic' }}>No hay notas clínicas cargadas en esta ficha.</p>
                  ) : (
                    consultasPaciente.map(c => (
                      <div key={c.id} style={{ background: darkMode ? '#18243c' : '#FFFFFF', padding: '16px', borderRadius: '8px', border: `1px solid ${basePalette.borders}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: basePalette.textMuted, marginBottom: '6px' }}>
                          <span style={{ fontWeight: 'bold' }}>Motivo: {c.motivo}</span>
                          <span>Fecha: {c.fecha}</span>
                        </div>
                        <p style={{ fontSize: '13px', lineHeight: 1.5 }}><strong>Anamnesis:</strong> {c.anamnesis}</p>
                        {c.examen_physico && <p style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '4px' }}><strong>Examen Físico:</strong> {c.examen_physico}</p>}
                        {c.plan_conducta && <p style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '4px', color: '#0F766E' }}><strong>Plan Conducta:</strong> {c.plan_conducta}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Estudios y Archivos Adjuntos (Radiografías, Ecografías, etc.)</h4>
                  <button 
                    onClick={() => setModalNuevoEstudio(true)}
                    style={{ background: '#0EA5E9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}
                  >
                    <FileUp size={14} /> Cargar Archivo/Estudio
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {estudiosPaciente.length === 0 ? (
                    <p style={{ fontSize: '13px', color: basePalette.textMuted, fontStyle: 'italic', gridColumn: 'span 2' }}>No hay estudios cargados en esta ficha.</p>
                  ) : (
                    estudiosPaciente.map(e => (
                      <div key={e.id} style={{ background: darkMode ? '#18243c' : '#FFFFFF', padding: '16px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '10px', background: darkMode ? '#0c2e42' : '#F0F9FF', color: darkMode ? '#38bdf8' : '#0ea5e9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {e.tipo}
                          </span>
                          <p style={{ fontSize: '13px', fontWeight: 600, marginTop: '6px' }}>{e.informe_crudo || 'Informe sin descripción'}</p>
                          <p style={{ fontSize: '11px', color: basePalette.textMuted }}>Fecha: {e.fecha_estudio}</p>
                        </div>
                        {e.archivo_url && (
                          <a 
                            href={e.archivo_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Ver Adjunto <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${basePalette.borders}`, display: 'flex', justifyContent: 'flex-end', background: darkMode ? '#090f1a' : '#F8FAFC' }}>
              <button onClick={() => setModalVerFichaCompleta(false)} style={{ background: darkMode ? '#1e293b' : basePalette.textMain, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cerrar Ficha</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL NUEVO PACIENTE FORMULARIO COMPLETO */}
      {modalNuevoPaciente && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '650px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Ingreso de Nuevo Paciente</h3>
              <button onClick={() => setModalNuevoPaciente(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCrearPaciente} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Nombre Completo *</label>
                  <input type="text" required value={formPaciente.nombre_completo} onChange={(e) => setFormPaciente({...formPaciente, nombre_completo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>DNI / Cédula *</label>
                  <input type="text" required value={formPaciente.dni} onChange={(e) => setFormPaciente({...formPaciente, dni: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Fecha de Nacimiento</label>
                  <input type="date" value={formPaciente.fecha_nacimiento} onChange={(e) => setFormPaciente({...formPaciente, fecha_nacimiento: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Nacionalidad</label>
                  <input type="text" placeholder="Ej: Argentina" value={formPaciente.nacionalidad} onChange={(e) => setFormPaciente({...formPaciente, nacionalidad: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Teléfono Principal</label>
                  <input type="text" placeholder="Ej: +54911..." value={formPaciente.telefono} onChange={(e) => setFormPaciente({...formPaciente, telefono: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Teléfono Secundario (Familiar)</label>
                  <input type="text" placeholder="Ej: +54911..." value={formPaciente.telefono_familiar} onChange={(e) => setFormPaciente({...formPaciente, telefono_familiar: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: formPaciente.estado === 'internacion' ? '1fr' : '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Comienzo de Consulta</label>
                  <input type="date" value={formPaciente.fecha_inicio_consulta} onChange={(e) => setFormPaciente({...formPaciente, fecha_inicio_consulta: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
                {formPaciente.estado !== 'internacion' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Hospital / Sanatorio de Atención</label>
                    <input type="text" placeholder="Ej: Sanatorio Otamendi" value={formPaciente.hospital_atencion} onChange={(e) => setFormPaciente({...formPaciente, hospital_atencion: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Obra Social / Prepaga</label>
                  <input type="text" placeholder="OSDE 310" value={formPaciente.obra_social} onChange={(e) => setFormPaciente({...formPaciente, obra_social: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>E-mail</label>
                  <input type="email" placeholder="ejemplo@mail.com" value={formPaciente.email} onChange={(e) => setFormPaciente({...formPaciente, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Diagnóstico Principal</label>
                <textarea rows={2} value={formPaciente.diagnostico_principal} onChange={(e) => setFormPaciente({...formPaciente, diagnostico_principal: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', resize: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Estado al Finalizar Registro *</label>
                  <select value={formPaciente.estado} onChange={(e) => setFormPaciente({...formPaciente, estado: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: darkMode ? '#1e293b' : 'white', color: basePalette.textMain }}>
                    <option value="consulta">Consulta / Ambulatorio</option>
                    <option value="observacion">En Observación</option>
                    <option value="internacion">Internada</option>
                    <option value="quirófano">Quirófano</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              {formPaciente.estado === 'internacion' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '16px', padding: '16px', background: darkMode ? '#111b30' : '#f0f9ff', borderRadius: '8px', border: `1px solid ${darkMode ? '#1e2d4a' : '#BFDBFE'}` }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Hospital / Centro de Internación *</label>
                    <input type="text" required placeholder="Ej: Sanatorio Otamendi" value={formPaciente.hospital_atencion} onChange={(e) => setFormPaciente({...formPaciente, hospital_atencion: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: darkMode ? '#18243c' : 'white', color: basePalette.textMain }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Habitación *</label>
                    <input type="text" required placeholder="Ej: 301" value={formPaciente.habitacion} onChange={(e) => setFormPaciente({...formPaciente, habitacion: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: darkMode ? '#18243c' : 'white', color: basePalette.textMain }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: basePalette.textMain }}>Cama</label>
                    <input type="text" placeholder="Ej: A" value={formPaciente.cama} onChange={(e) => setFormPaciente({...formPaciente, cama: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: darkMode ? '#18243c' : 'white', color: basePalette.textMain }} />
                  </div>
                </div>
              )}

              <div>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Mutaciones Clínicas</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <input type="checkbox" checked={formPaciente.pole} onChange={(e) => setFormPaciente({...formPaciente, pole: e.target.checked})} /> POLE+
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <input type="checkbox" checked={formPaciente.brca1} onChange={(e) => setFormPaciente({...formPaciente, brca1: e.target.checked})} /> BRCA1+
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <input type="checkbox" checked={formPaciente.brca2} onChange={(e) => setFormPaciente({...formPaciente, brca2: e.target.checked})} /> BRCA2+
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalNuevoPaciente(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Guardar en Supabase</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA CONSULTA / NOTA */}
      {modalNuevaConsulta && (
        <div className="modal-overlay-high">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Nueva Evolución / Nota Clínica</h3>
              <button onClick={() => setModalNuevaConsulta(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCrearConsulta} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Motivo de Evolución *</label>
                <input type="text" required placeholder="Ej: Control de drenaje" value={formConsulta.motivo} onChange={(e) => setFormConsulta({...formConsulta, motivo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Anamnesis / Estado actual</label>
                <textarea rows={3} value={formConsulta.anamnesis} onChange={(e) => setFormConsulta({...formConsulta, anamnesis: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Examen Físico / Signos</label>
                <input type="text" placeholder="Ej: Abdomen blando, sin dolor" value={formConsulta.examen_fisico} onChange={(e) => setFormConsulta({...formConsulta, examen_fisico: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Plan / Conducta Quirúrgica</label>
                <input type="text" placeholder="Ej: Alta programada en 24 hs" value={formConsulta.plan_conducta} onChange={(e) => setFormConsulta({...formConsulta, plan_conducta: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalNuevaConsulta(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Guardar Nota</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL NUEVO ESTUDIO / CARGA DE ARCHIVOS */}
      {modalNuevoEstudio && (
        <div className="modal-overlay-high">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: basePalette.textMain }}>Cargar Estudio (Ecografías / Radiografías / PDFs)</h3>
              <button onClick={() => setModalNuevoEstudio(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCrearEstudio} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Tipo de Estudio *</label>
                <select 
                  value={formEstudio.tipo}
                  onChange={(e) => setFormEstudio({...formEstudio, tipo: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                >
                  <option value="laboratorio">Laboratorio (Hematología / Química)</option>
                  <option value="imagen">Imagen (Ecografía / Radiografía / Tomografía)</option>
                  <option value="patologia">Anatomía Patológica</option>
                  <option value="inmunohistoquimica">Inmunohistoquímica</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Descripción / Informe del Estudio *</label>
                <input type="text" required placeholder="Ej: Ecografía transvaginal realizada el 12/04" value={formEstudio.informe_crudo} onChange={(e) => setFormEstudio({...formEstudio, informe_crudo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Fecha de Realización</label>
                <input type="date" value={formEstudio.fecha_estudio} onChange={(e) => setFormEstudio({...formEstudio, fecha_estudio: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
              </div>

              <div style={{ background: '#F8FAFC', border: '2px dashed #0EA5E9', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer' }} onClick={() => {
                const url = prompt('Ingrese URL simulada del archivo PDF/Imagen cargado:');
                if (url) {
                  setFormEstudio({
                    ...formEstudio,
                    archivo_url: url,
                    nombre_archivo: url.split('/').pop() || 'archivo_estudio'
                  });
                  alert('¡Archivo adjunto asociado correctamente!');
                }
              }}>
                <FileUp size={32} style={{ color: '#0EA5E9', margin: '0 auto 8px auto' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: basePalette.textMain, display: 'block' }}>Cargar Radiografía, Ecografía o PDF</span>
                <span style={{ fontSize: '11px', color: basePalette.textMuted }}>Haga clic para asociar enlace / archivo</span>
                {formEstudio.nombre_archivo && (
                  <span style={{ display: 'block', fontSize: '12px', color: '#16A34A', fontWeight: 'bold', marginTop: '8px' }}>
                    Adjunto: {formEstudio.nombre_archivo}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalNuevoEstudio(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Guardar Estudio</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL NOTA RÁPIDA POR VOZ */}
      {modalNotaRapida && (
        <div className="modal-overlay">
          <div style={{ background: basePalette.bgCard, borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: `1px solid ${basePalette.borders}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={20} style={{ color: basePalette.primario }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: basePalette.textMain }}>Nota Clínica por Voz</h3>
              </div>
              <button onClick={() => { setModalNotaRapida(false); setNotaRapidaTexto(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: basePalette.textMuted }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '13px', color: basePalette.textMuted, marginBottom: '20px' }}>Dictá tus comentarios sobre la paciente y se guardarán de forma permanente en su historial de evolución de Supabase.</p>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: basePalette.textMain }}>Texto del dictado</span>
                <button onClick={toggleDictadoNotaRapida} style={{ background: dictadoActivoNotaRapida ? basePalette.error : 'transparent', color: dictadoActivoNotaRapida ? 'white' : basePalette.primario, border: `1px solid ${basePalette.borders}`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {dictadoActivoNotaRapida ? <MicOff size={12} /> : <Mic size={12} />}
                  <span>{dictadoActivoNotaRapida ? 'Grabando...' : 'Presionar para Dictar'}</span>
                </button>
              </div>
              <textarea value={notaRapidaTexto} onChange={(e) => setNotaRapidaTexto(e.target.value)} placeholder="Presione el botón de dictar y empiece a hablar..." style={{ width: '100%', height: '140px', padding: '12px', borderRadius: '8px', border: `1px solid ${basePalette.borders}`, fontSize: '13px', resize: 'none', outline: 'none', lineHeight: 1.5, color: basePalette.textMain, background: basePalette.bgCard }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setModalNotaRapida(false); setNotaRapidaTexto(''); }} style={{ flex: 1, background: 'transparent', border: `1px solid ${basePalette.borders}`, borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', color: basePalette.textMain }}>Cancelar</button>
              <button onClick={handleGuardarNotaRapidaEnBase} disabled={!notaRapidaTexto.trim()} style={{ flex: 1, background: basePalette.primario, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: notaRapidaTexto.trim() ? 1 : 0.5 }}>Guardar en Supabase</button>
            </div>

          </div>
        </div>
      )}

      {/* CONTENEDOR DE TOASTS VISUALES EN PANTALLA */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            pointerEvents: 'auto',
            background: darkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '16px 20px',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#EF4444' }}>{t.titulo}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <span style={{ fontSize: '12px', color: basePalette.textMain, fontWeight: 500 }}>{t.cuerpo}</span>
          </div>
        ))}
      </div>

      {/* OVERLAY DE ALARMA DE EMERGENCIA PERSISTENTE */}
      {alarmaActiva && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(220, 38, 38, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulseBg 1.5s infinite alternate'
        }}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulseBg {
              from { background: rgba(220, 38, 38, 0.4); }
              to { background: rgba(220, 38, 38, 0.7); }
            }
          `}} />
          <div style={{
            background: basePalette.bgCard,
            borderRadius: '24px',
            border: '3px solid #DC2626',
            boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.5)',
            padding: '36px',
            width: '90%',
            maxWidth: '500px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: '#FEE2E2',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseRing 1s infinite'
            }}>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulseRing {
                  0% { transform: scale(0.95); }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(0.95); }
                }
              `}} />
              <VolumeX size={40} style={{ color: '#DC2626' }} />
            </div>
            
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🚨 Alerta Clínica Crítica
            </h2>
            
            <p style={{ fontSize: '15px', fontWeight: 600, color: basePalette.textMain, lineHeight: 1.5 }}>
              {alarmaDetalle}
            </p>
            
            <p style={{ fontSize: '12px', color: basePalette.textMuted }}>
              La alarma seguirá sonando hasta que sea silenciada manualmente.
            </p>

            <button 
              onClick={silenciarAlarma}
              style={{
                width: '100%',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.4)'
              }}
            >
              Silenciar Alarma
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
