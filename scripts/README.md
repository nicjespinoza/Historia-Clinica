# Scripts de Administración

Esta carpeta contiene scripts de utilidad para administración y migración de datos.

## Estructura

```
scripts/
├── data/                    # Datos de migración (NO subir a git)
│   ├── serviceAccountKey.json
│   ├── wix_pacientes.json
│   └── wix_evolucion.json
├── migrate.cjs              # Script de migración desde Wix
├── fix-roles.cjs            # Asignar rol doctor a usuarios
├── create-admin.mjs         # Crear usuario admin
└── README.md                # Este archivo
```

## Scripts Disponibles

### 1. migrate.cjs
Migra datos de pacientes y evoluciones desde archivos JSON exportados de Wix.

```bash
cd scripts
node migrate.cjs
```

### 2. fix-roles.cjs
Asigna el rol de `doctor` a un usuario existente.

```bash
cd scripts
node fix-roles.cjs <email>
```

### 3. create-admin.mjs
Crea un usuario administrador en Firebase Auth.

```bash
cd scripts
node --experimental-modules create-admin.mjs
```

## Requisitos

- Node.js 18+
- Las credenciales de Firebase en `data/serviceAccountKey.json`
- Firebase Admin SDK (instalado en `/functions`)

## ⚠️ Importante

- **NUNCA** subir `serviceAccountKey.json` a Git
- Los archivos en `/data` contienen información sensible
- Ejecutar desde la carpeta `/scripts`
