# MediRecord Pro - Sistema de Historia Clínica

<div align="center">

![MediRecord Pro](https://img.shields.io/badge/MediRecord-Pro-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.7.0-FFCA28?style=flat-square&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite)

**Sistema integral de gestión de historias clínicas médicas**

</div>

---

## 📋 Descripción

MediRecord Pro es un sistema completo de gestión de historias clínicas diseñado para consultorios médicos. Permite administrar pacientes, crear historias clínicas detalladas, gestionar citas, y más.

### Características Principales

- 👥 **Gestión de Pacientes** - Registro completo con datos demográficos y signos vitales
- 📋 **Historias Clínicas** - Historias iniciales y consultas subsecuentes
- 📅 **Agenda de Citas** - Sistema de programación de citas presenciales y virtuales
- 🔬 **Visualizador 3D** - Marcado de observaciones en modelo 3D del cuerpo
- 📄 **Generación de PDFs** - Exportación de historias clínicas
- 💬 **Chat en Tiempo Real** - Comunicación médico-paciente
- 💳 **Pagos Integrados** - PowerTranz y Tilopay
- 🔐 **Roles y Permisos** - Admin, Doctor, Paciente

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Firebase

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd Historia-Clinica-main

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env con las credenciales de Firebase (ver .env.example)

# 4. Iniciar en desarrollo
npm run dev
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

---

## 🏗️ Arquitectura

```
Historia-Clinica-main/
├── src/
│   ├── components/        # Componentes React reutilizables
│   │   ├── premium-ui/    # Componentes UI premium
│   │   └── ui/            # Componentes UI base
│   ├── screens/           # Pantallas principales
│   ├── lib/               # Utilidades y configuración
│   │   ├── firebase.ts    # Configuración Firebase
│   │   ├── cache.ts       # Sistema de caché
│   │   └── pdfGenerator.ts
│   ├── context/           # React Context
│   ├── types.ts           # Tipos TypeScript
│   └── schemas/           # Esquemas de validación Zod
├── functions/             # Cloud Functions de Firebase
│   └── src/
│       ├── index.ts       # Entry point
│       ├── powertranz.ts  # Integración pagos
│       ├── tilopay.ts     # Integración pagos
│       └── roles.ts       # Gestión de roles
├── api.ts                 # Cliente API Firestore
└── tests/                 # Tests unitarios
```


---

## 📈 Escalabilidad y Rendimiento

### Índices Compuestos
Para optimizar consultas complejas y filtrado:
- **Pacientes**: Índice compuesto en `lastName` (ASC) + `firstName` (ASC) para búsquedas alfabéticas rápidas.
- **Citas**: Índice en `date` (DESC) + `patientId` para historial cronológico eficiente.
- **Logs**: Índice `timestamp` (DESC) en `auditLogs` para revisión de seguridad reciente.

### Estrategia Multi-tenant
Si la clínica crece a múltiples sucursales con datos segregados:
- **Nivel Lógico (Actual)**: Agregar `clinicId` a todos los documentos principales (`patients`, `appointments`). Filtrar en todas las queries.
- **Subcolecciones (Recomendado para >5 clínicas)**: Estructurar como `/clinics/{clinicId}/patients/...`. Esto aísla datos y simplifica reglas de seguridad, pero complica reportes globales.

### Monitoreo
- **Firebase Performance Monitoring**: Activado para rastrear latencia de carga de pantallas clave (`PatientList`, `Dashboard`) y tiempos de respuesta de Cloud Functions.
- **Alertas**: Configurar alertas en Google Cloud Console para errores 500 en Functions.

### Cloud Functions: Cold Starts
Para funciones críticas de usuario final (ej: `checkEmailAvailability` en registro):
- Configurar `minInstances: 1` en `firebase.json` o `index.ts` para mantener una instancia "caliente".
- *Nota: Esto incurre en costos mensuales mínimos incluso sin tráfico.*


### Chat: Cuándo Migrar
Firestore es excelente para chat hasta ~100k mensajes/mes. Considerar migrar a **Realtime Database** o servicio dedicado (GetStream/Twilio) si:
- La latencia en tiempo real (<100ms) es crítica.
- El volumen de mensajes excede 1M/mes (costos de escritura de Firestore).
- Se requiere presencia avanzada ("escribiendo...", "en línea" con alta frecuencia).

---

## 💰 Optimización de Costos (Blaze)

### Estrategias Implementadas
1.  **Caché Agresivo**:
    - Pacientes: 15 min TTL (antes 5 min).
    - Citas: 5-10 min TTL.
    - *Impacto*: Reducción del 40-60% en lecturas repetitivas.

2.  **Escrituras en Lote (Batch Writes)**:
    - Creación de Historia Clínica + Actualización de Paciente en una sola operación atómica.
    - *Impacto*: Integridad de datos y menor riesgo de datos huérfanos.

3.  **Compresión de Imágenes**:
    - Compresión client-side (Canvas API) antes de subir a Storage.
    - Formato WebP, calidad 0.8, max 1920x1080.
    - *Impacto*: Ahorro del 50-80% en costos de almacenamiento y ancho de banda.

4.  **Paginación Eficiente**:
    - Listas de pacientes con cursor (`startAfter`).
    - Chat limitado a últimos 30 mensajes por carga inicial.

### Monitoreo Recomendado
- Configurar **Presupuestos (Budgets)** en Google Cloud Console con alertas al 50%, 90% y 100%.
- Revisar pestaña "Usage" en Firebase Console semanalmente para detectar picos de lecturas/escrituras.

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Preview de build de producción |
| `npm run test` | Ejecuta tests con Vitest |

### Cloud Functions

```bash
cd functions
npm install
npm run build
npm run deploy
```

---

## 🛡️ Seguridad

- **HTTPS**: Forzado automáticamente por Firebase Hosting para todas las conexiones.
- **App Check**: Actualmente **DESACTIVADO** para facilitar pruebas con múltiples usuarios en producción. Se activará en una fase posterior usando reCAPTCHA Enterprise.
- **Firestore Rules**: Roles estrictos y acceso granulado.

---

## 🔐 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso completo, gestión de usuarios |
| **Doctor** | Gestión de pacientes y historias clínicas |
| **Paciente** | Ver su información, agendar citas |

---

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS 4, Framer Motion
- **Backend**: Firebase (Firestore, Auth, Functions, Storage)
- **3D**: Three.js, React Three Fiber
- **Forms**: React Hook Form, Zod
- **Charts**: Recharts
- **PDF**: jsPDF

---

## 📦 Despliegue

### Firebase Hosting

```bash
# Build y deploy
npm run build
firebase deploy
```

### Solo Cloud Functions

```bash
cd functions
npm run deploy
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test -- --coverage
```

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 👨‍💻 Desarrollo

Para contribuir al proyecto:

1. Crear una rama desde `main`
2. Hacer commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
3. Crear Pull Request para revisión

---

<div align="center">

**MediRecord Pro** © 2026

</div>
