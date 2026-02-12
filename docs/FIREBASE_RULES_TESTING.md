# 🛡️ Guía de Pentesting y Simulación de Reglas Firestore

Esta guía detalla cómo verificar la seguridad de su base de datos Firestore utilizando el **Simulador de Reglas** en la consola de Firebase. Siga estos pasos antes de cada despliegue a producción.

## 1. Acceso al Simulador

1.  Vaya a la [Consola de Firebase](https://console.firebase.google.com/).
2.  Seleccione su proyecto (`historia-clinica-2026`).
3.  En el menú lateral izquierdo, despliegue **Compilación** y seleccione **Firestore Database**.
4.  Haga clic en la pestaña **Reglas**.
5.  Haga clic en el botón **Editar reglas** (si no ve el editor).
6.  Localice el enlace o botón **Simulador de reglas** (generalmente a la derecha o abajo del editor).

---

## 2. Configuración del Entorno de Prueba

El simulador tiene tres secciones principales:
*   **Tipo de simulación**: `get` (lectura simple), `list` (consultas), `create` (crear), `update` (actualizar), `delete` (borrar).
*   **Ubicación (Path)**: La ruta del documento a probar (ej: `patients/123`).
*   **Autenticación**: Configuración del usuario simulado.

---

## 3. Escenarios de Prueba Críticos

Ejecute estas pruebas secuencialmente para validar su esquema de seguridad "Deny-by-default".

### A. Prueba de Acceso Público (Anonymous/Unauthenticated)
**Objetivo**: Confirmar que nadie sin iniciar sesión puede leer la base de datos.

1.  **Configuración**:
    *   **Autenticación**: Desactivada (seleccione "No autenticado" o deje el toggle en gris).
    *   **Ruta**: `patients/test-patient`
    *   **Tipo**: `get`
2.  **Acción**: Clic en **Ejecutar**.
3.  **Resultado Esperado**: ❌ **Denegado** (La línea base `allow read, write: if false;` debe bloquearlo).

### B. Prueba de Aislamiento de Pacientes
**Objetivo**: Un paciente `A` NO debe poder leer la data del paciente `B`.

1.  **Configuración**:
    *   **Autenticación**: Activada.
        *   **Provider**: `password`
        *   **UID**: `user_paciente_A`
        *   **Firebase User Token (Claims)**: (Déjelo vacío o con `{ "role": "patient" }` si usa claims para pacientes).
    *   **Ruta**: `patients/user_paciente_B` (Nótese que el ID es diferente al UID).
    *   **Tipo**: `get`
2.  **Acción**: Clic en **Ejecutar**.
3.  **Resultado Esperado**: ❌ **Denegado**.
    *   *Nota*: Si cambia la ruta a `patients/user_paciente_A`, debe dar ✅ **Permitido**.

### C. Prueba de Acceso Administrativo (Staff)
**Objetivo**: Un Doctor o Admin DEBE poder leer cualquier paciente.

1.  **Configuración**:
    *   **Autenticación**: Activada.
    *   **UID**: `user_doctor_1`
    *   **Construir token personalizado (Custom Claims)**:
        *   Añada clave: `role`
        *   Añada valor: `doctor` (el string exacto).
    *   **Ruta**: `patients/CUALQUIER_ID`
    *   **Tipo**: `get`
2.  **Acción**: Clic en **Ejecutar**.
3.  **Resultado Esperado**: ✅ **Permitido**.

---

## 4. Pruebas de Custom Claims (Roles)

Es vital probar que los roles funcionan como se espera. Copie y pegue estos JSON en el campo **"Construir token personalizado"** del simulador.

#### Rol: Doctor
```json
{
  "role": "doctor",
  "email": "dr@cenlae.com"
}
```

#### Rol: Admin
```json
{
  "role": "admin"
}
```

#### Rol: Asistente
```json
{
  "role": "assistant"
}
```

### Prueba de Escritura/Borrado por Rol (Privilegios)
1.  **Escenario**: Un Asistente intenta borrar un paciente (Acción prohibida, solo Admins/Doctores).
2.  **Configuración**:
    *   **Auth**: Usar claim de `assistant`.
    *   **Ruta**: `patients/test-patient`
    *   **Tipo**: `delete`
3.  **Resultado**: ❌ **Denegado**.
4.  **Cambio**: Cambie el claim a `admin` y reintente.
5.  **Resultado**: ✅ **Permitido**.

---

## 5. Pruebas de Chat y Subcolecciones

Las reglas anidadas a menudo se rompen. Verifíquelas así:

### A. Leer Mensajes de un Chat
1.  **Ruta**: `chats/chat_123/messages/msg_abc`
2.  **Caso 1: Staff**
    *   Auth: Claim `doctor`.
    *   Resultado: ✅ **Permitido**.
3.  **Caso 2: Dueño del Chat (Visitante/Paciente)**
    *   **Paso previo**: El simulador necesita saber que el documento `chats/chat_123` "existe" y tiene su UID.
    *   *Truco*: El simulador a veces falla con `get()` dependientes (como `isParentChatOwner`). Para probar esto fiablemnete, se recomienda una prueba unitaria local, pero en el simulador puede intentar simular la lectura del padre.
    *   **Alternativa en Simulador**: Pruebe `create` en `chats/new_chat`.
        *   **Auth UID**: `visitor_1`
        *   **Cuerpo del Documento (JSON)**:
            ```json
            {
              "metadata": {
                "authUid": "visitor_1"
              }
            }
            ```
        *   Resultado: ✅ **Permitido**.
        *   Intente cambiar `authUid` a `visitor_2`. Resultado: ❌ **Denegado**.

---

## 6. Pruebas de Auditoría (Audit Logs)

Verifique que nadie pueda alterar el historial de auditoría.

1.  **Ruta**: `auditLogs/log_123`
2.  **Tipo**: `write` (o `create`/`update`).
3.  **Usuario**: Admin (`role: admin`).
4.  **Resultado**: ❌ **Denegado**.
    *   **Por qué**: Las reglas dicen `allow write: if false;`. Solo el Admin SDK (Backend) puede escribir aquí. Esto es **CORRECTO**.

---

## 7. Errores Comunes y Detección

*   **Error**: "Null value error" en el simulador.
    *   **Causa**: Su regla intenta acceder a `request.auth.token.role` pero el usuario simulado no tiene ese claim definido.
    *   **Solución**: Asegúrese de definir siempre los Custom Claims en el panel de autenticación del simulador.
*   **Error**: Simulación permitida pero en la app falla.
    *   **Causa**: La regla usa `exists()` o `get()` para mirar otro documento, y en el simulador ese documento "mock" no existe o no concuerda.
    *   **Solución**: El simulador es limitado para bases de datos complejas. Confíe más en los tests unitarios (`npm run test`) para lógica relacional cruzada.

## ✅ Checklist Pre-Deploy

Antes de hacer `firebase deploy --only firestore:rules`:

1.  [ ] Verificar que `auditLogs` es **ReadOnly** (incluso para admins).
2.  [ ] Verificar que `patients` no es leíble sin autenticación.
3.  [ ] Verificar que un usuario con rol `patient` no puede leer `users/OTRO_ID`.
4.  [ ] Verificar que el rol `assistant` no puede hacer `delete` en `patients`.
