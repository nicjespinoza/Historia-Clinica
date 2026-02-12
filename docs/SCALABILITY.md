# Escalabilidad y Rendimiento

Este documento detalla las estrategias de implementación para asegurar la escalabilidad de la aplicación Historia Clínica, así como los límites actuales y recomendaciones para futuro crecimiento.

## Estrategias Implementadas

### 1. Paginación e Infinite Scroll
Se ha migrado de una carga total de clientes (`subscribeToPatients` que traía toda la colección) a un modelo híbrido:
- **Carga Inicial**: Se utiliza `getPatientsPaginated` (cursor-based pagination de Firestore) para traer registros en bloques (default 12).
- **Infinite Scroll**: Se utiliza `IntersectionObserver` para detectar cuando el usuario llega al final de la lista y cargar automáticamente el siguiente bloque.
- **Búsqueda**: Actualmente se mantiene una búsqueda en cliente sobre una carga completa *solo cuando se escribe un término*. 
  - *Límite*: Esto es viable hasta ~1,000 - 2,000 pacientes.
  - *Futuro*: Para >2,000 pacientes, se debe implementar **Algolia** o **Typesense** para búsqueda full-text del lado del servidor.

### 2. Optimización de Listeners (Real-time)
- **Listeners Globales**: Se han eliminado suscripciones globales que traían colecciones enteras al iniciar la app.
- **Listeners Contextuales**: 
  - El chat (`ChatScreen`) solo se suscribe a los mensajes *cuando la pantalla está activa*.
  - La agenda (`AgendaScreen`) debería suscribirse solo al rango de fechas visible (semana/mes actual).

### 3. Visualización 3D (Lazy Loading)
- El componente `Patient3DViewer` y sus texturas pesadas (modelos 3D de anatomía) deben cargarse usando `React.lazy` y `Suspense`.
- En móviles (<768px), se recomienda renderizar una imagen estática 2D por defecto y solo cargar el 3D bajo demanda explícita del usuario para ahorrar batería y datos.

## Límites Actuales y Plan de Futuro

| Recurso | Límite Aprox. | Estrategia de Mitigación Futura |
| :--- | :--- | :--- |
| **Pacientes (Lista)** | ~2,000 docs (por búsqueda client-side) | Implementar Algolia/Typesense para búsqueda. |
| **Citas (Agenda)** | ~500/mes | La consulta ya filtra por fecha (`startAt`, `endAt`). Escala bien. |
| **Chat (Mensajes)** | Ilimitado (paginado) | Firestore escala bien. Archivar chats antiguos (>1 año) a colección fría (`chats_archive`). |
| **Firestore Reads** | Cuota Diaria (50k gratis) | Implementar caché local agresivo (IndexedDB) o aumentar TTL de caché en `api.ts`. |

## Recomendaciones de Arquitectura

1.  **Sharding**: No necesario hasta superar 1M de documentos por colección o 1 write/segundo en un solo documento (ej: contadores globales).
2.  **Multi-tenancy**: Si se vende a más clínicas:
    - **Nivel Lógico**: Agregar `clinicId` a todos los documentos y reglas de seguridad. (Más fácil, recomendado a corto plazo).
    - **Nivel Silo**: Un proyecto Firebase por cliente. (Más seguro, mayor mantenimiento).

## Archivos Clave Modificados
- `src/screens/doctor/PatientListScreen.tsx`: Implementación de paginación.
- `src/lib/api.ts`: Métodos `getPatientsPaginated`, `getAppointmentsByDateRange`.

