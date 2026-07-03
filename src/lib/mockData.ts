export interface Paciente {
  id: string;
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string;
  edad: number;
  obraSocial: string;
  diagnosticoPrincipal: string;
  mutaciones: {
    pole?: boolean;
    brca1?: boolean;
    brca2?: boolean;
    msi?: 'estable' | 'inestable';
  };
  estadoActual: 'consulta' | 'estudios' | 'quirófano' | 'internación' | 'seguimiento' | 'alta';
  habitacion?: string;
  diaPostoperatorio?: number;
  drenajeCc?: number;
  temperatura?: number;
  laboratorioPendiente?: boolean;
  procedimientoReciente?: string;
}

export interface Cirugia {
  id: string;
  pacienteNombre: string;
  fecha: string;
  diagnostico: string;
  procedimiento: string;
  duracionMinutos: number;
  perdidaSanguineaCc: number;
  complicaciones: string;
  ayudantes: string[];
}

export interface FinanzaRegistro {
  id: string;
  pacienteNombre?: string;
  concepto: string;
  monto: number;
  tipo: 'ingreso' | 'egreso';
  estadoPago: 'pendiente' | 'cobrado' | 'reclamado';
  fecha: string;
  obraSocial?: string;
}

export const PACIENTES_MOCK: Paciente[] = [
  {
    id: "p1",
    nombreCompleto: "Elena Rostova",
    dni: "12.345.678",
    fechaNacimiento: "1974-05-12",
    edad: 52,
    obraSocial: "OSDE 410",
    diagnosticoPrincipal: "Carcinoma seroso de alto grado de ovario, Estadio IIIC",
    mutaciones: { pole: false, brca1: true, brca2: false },
    estadoActual: "internación",
    habitacion: "301",
    diaPostoperatorio: 2,
    drenajeCc: 40,
    temperatura: 36.6,
    laboratorioPendiente: true,
    procedimientoReciente: "Laparotomía estadificadora + Citorreducción primaria"
  },
  {
    id: "p2",
    nombreCompleto: "Clara Benítez",
    dni: "20.145.890",
    fechaNacimiento: "1983-09-22",
    edad: 42,
    obraSocial: "Swiss Medical",
    diagnosticoPrincipal: "Cáncer de endometrio tipo endometrioide",
    mutaciones: { pole: true, msi: 'estable' },
    estadoActual: "internación",
    habitacion: "305",
    diaPostoperatorio: 1,
    drenajeCc: 15,
    temperatura: 37.8,
    laboratorioPendiente: false,
    procedimientoReciente: "Histerectomía total laparoscópica + Linfadenectomía selectiva"
  },
  {
    id: "p3",
    nombreCompleto: "María Inés López",
    dni: "15.789.012",
    fechaNacimiento: "1968-11-30",
    edad: 57,
    obraSocial: "Galeno Oro",
    diagnosticoPrincipal: "Carcinoma de cuello uterino, Estadio IB2",
    mutaciones: {},
    estadoActual: "consulta",
    procedimientoReciente: "Conización cervical previa"
  },
  {
    id: "p4",
    nombreCompleto: "Juana de Arteaga",
    dni: "08.456.123",
    fechaNacimiento: "1949-02-15",
    edad: 77,
    obraSocial: "PAMI",
    diagnosticoPrincipal: "Tumor de ovario limítrofe (Borderline)",
    mutaciones: {},
    estadoActual: "alta"
  },
  {
    id: "p5",
    nombreCompleto: "Sofía Martínez",
    dni: "33.987.654",
    fechaNacimiento: "1991-07-04",
    edad: 34,
    obraSocial: "Medicus",
    diagnosticoPrincipal: "Masa anexial compleja recurrente",
    mutaciones: { brca2: true },
    estadoActual: "estudios",
    laboratorioPendiente: true
  }
];

export const CIRUGIAS_MOCK: Cirugia[] = [
  {
    id: "c1",
    pacienteNombre: "Elena Rostova",
    fecha: "2026-07-02",
    diagnostico: "Carcinoma seroso de alto grado de ovario",
    procedimiento: "Laparotomía estadificadora + Citorreducción (peritonectomía parcial, omentectomía, histerectomía + anexectomía bilateral)",
    duracionMinutos: 210,
    perdidaSanguineaCc: 350,
    complicaciones: "Ninguna",
    ayudantes: ["Dr. Pérez (Fellow)", "Dra. Gomez (Residente)"]
  },
  {
    id: "c2",
    pacienteNombre: "Clara Benítez",
    fecha: "2026-07-01",
    diagnostico: "Cáncer de endometrio endometrioide",
    procedimiento: "Histerectomía total laparoscópica + Salpingooforectomía bilateral + Ganglio Centinela con Verde de Indocianina",
    duracionMinutos: 110,
    perdidaSanguineaCc: 50,
    complicaciones: "Ninguna",
    ayudantes: ["Dr. Pérez (Fellow)"]
  }
];

export const FINANZAS_MOCK: FinanzaRegistro[] = [
  {
    id: "f1",
    pacienteNombre: "Elena Rostova",
    concepto: "Honorarios de Cirugía Compleja Ovario - OSDE 410",
    monto: 450000,
    tipo: "ingreso",
    estadoPago: "pendiente",
    fecha: "2026-07-02",
    obraSocial: "OSDE 410"
  },
  {
    id: "f2",
    pacienteNombre: "Clara Benítez",
    concepto: "Honorarios Histerectomía Laparoscópica - Swiss Medical",
    monto: 320000,
    tipo: "ingreso",
    estadoPago: "cobrado",
    fecha: "2026-07-01",
    obraSocial: "Swiss Medical"
  },
  {
    id: "f3",
    concepto: "Insumos e Instrumental Quirúrgico Personalizado",
    monto: 75000,
    tipo: "egreso",
    estadoPago: "cobrado",
    fecha: "2026-06-28"
  },
  {
    id: "f4",
    pacienteNombre: "María Inés López",
    concepto: "Consulta Particular Oncológica",
    monto: 25000,
    tipo: "ingreso",
    estadoPago: "cobrado",
    fecha: "2026-07-02"
  }
];
