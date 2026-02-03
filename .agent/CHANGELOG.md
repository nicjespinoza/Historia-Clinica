# Historia Clínica - Registro de Cambios (Changelog)

> Este archivo documenta todos los cambios realizados al proyecto para referencia de futuros agentes y desarrolladores.

---

## 2026-02-03 - Auditoría de Seguridad y Migración a CENLAE

### 🔒 Security Fixes Implementados

#### 1. Protección de Credenciales
| Archivo | Cambio |
|---------|--------|
| `.gitignore` | Agregado: `.env`, `.env.local`, `.env.*.local`, `.env.production` |
| `.env` | Actualizado con credenciales del proyecto CENLAE |
| `.firebaserc` | Cambiado proyecto de `medirecord-pro-c84d0` → `cenlae` |

#### 2. Eliminación de Bypasses de Autenticación
| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/context/AuthContext.tsx` | 62-67 | Eliminado fallback hardcodeado de emails (`dr@cenlae.com`, `asistente@cenlae.com`). Ahora usa `patient` por defecto si no hay custom claims. |
| `src/lib/offlineQueue.ts` | 11 | Cambiado de `ALLOWED_EMAILS` a `ALLOWED_ROLES` (`['doctor', 'admin', 'assistant']`) |

#### 3. Firestore Security Rules
| Archivo | Cambio |
|---------|--------|
| `firestore.rules` L37-41 | Eliminado backdoor UID (`oMuQtAmnixgOD9VyLPiX7mLJxsw1`) y email (`admin@webdesignje.com`) de `isPrivileged()` |
| `firestore.rules` L43-46 | Agregada función `isStaff()` que faltaba |

#### 4. Bug Fixes
| Archivo | Línea | Cambio |
|---------|-------|--------|
| `src/lib/api.ts` | 218-219 | Eliminada llamada duplicada `deleteDoc(patientRef)` |

#### 5. Audit Logging Seguro
| Archivo | Cambio |
|---------|--------|
| `functions/src/auditClient.ts` | **NUEVO** - Cloud Function `logAuditFromClient` para logging seguro |
| `functions/src/index.ts` | Agregado export de `logAuditFromClient` |
| `src/lib/audit.ts` | Reescrito para usar Cloud Function en lugar de escritura directa a Firestore |

### 🔄 Migración de Firebase

#### Proyecto Anterior → Nuevo
```
medirecord-pro-c84d0 → cenlae
```

#### Archivos Actualizados
- `.env` - Nuevas credenciales Firebase
- `.firebaserc` - Nuevo project ID
- `scripts/data/serviceAccountKey.json` - Nueva service account key

### 📦 Migración de Datos

**Ejecutado:** `node scripts/migrate.cjs`

| Métrica | Valor |
|---------|-------|
| Pacientes migrados | 197 |
| Consultas migradas | 64 |
| Notas procesadas | 24 |
| Documentos totales | 458 |

#### Mejora al Script
| Archivo | Cambio |
|---------|--------|
| `scripts/migrate.cjs` L40-47 | Agregado logging de verificación de proyecto objetivo |

---

## Estado Actual del Proyecto

### Builds Verificados ✅
- Frontend: `npm run build` - Éxito (13.67s)
- Cloud Functions: `npm run build` - Éxito

### Servidor de Desarrollo
- URL: http://localhost:4000/
- Estado: Corriendo

### Pendientes del Audit Report
- [ ] Deploy a producción (rules, functions, hosting)
- [ ] Tests de integración
- [ ] Refactorizar componentes grandes
- [ ] Rate limiting en Cloud Functions
- [ ] Validación con Zod
- [ ] Caché para getHistories/getConsults
- [ ] Auditoría WCAG
- [ ] App Check (pospuesto por usuario)

---

## Configuración Firebase Actual

```javascript
// Proyecto: cenlae
const firebaseConfig = {
  apiKey: "AIzaSyCE16J5Lgg7KC46Ut9uxbRpap5AJjnwbjc",
  authDomain: "cenlae.firebaseapp.com",
  projectId: "cenlae",
  storageBucket: "cenlae.firebasestorage.app",
  messagingSenderId: "843268367458",
  appId: "1:843268367458:web:cae4cb343dd326544d1d3b",
  measurementId: "G-67QWDTCRP2"
};
```

---

*Última actualización: 2026-02-03 11:59 CST*
