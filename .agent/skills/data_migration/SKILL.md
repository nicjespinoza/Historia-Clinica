---
name: Data Migration (Wix to Firestore)
description: Instructions for migrating patient and consultation data from legacy Wix JSON exports to the Firestore database using the v4 migration script.
---

# Data Migration Skill

This skill guides you through the process of resetting and repopulating the Firestore database with legacy data exported from Wix Velo.

## Prerequisites

- **Node.js**: Ensure Node.js is installed.
- **Firebase Admin SDK**: The project must have `firebase-admin` installed.
- **Service Account**: A valid `serviceAccountKey.json` must be present in `scripts/data/`.
- **Source Data**: `wix_pacientes.json` and `wix_evolucion.json` and `wix_notas.json` must be present in `scripts/data/`.

## Critical Warnings

> [!CAUTION]
> **Data Loss Warning**: The migration script performs a **clean wipe** of the target collections (`patients`, `initialHistories`, `subsequentConsults`). extensive data loss will occur if run against a production database without backup. Always verify the target project ID in `serviceAccountKey.json`.

## Usage Instructions

### 1. Verify Environment
Ensure you are in the project root directory.
Check that the data files exist:
```powershell
ls scripts/data
```

### 2. Run the Migration Script
Execute the V4 migration script using Node.js:

```powershell
node scripts/migrate.cjs
```

### 3. Verification
The script provides real-time feedback. Upon completion, it will verify the total count of:
- Migrated Patients
- Migrated Sub-collections (Histories/Consults)

### Troubleshooting

- **Error: "No se encontró el archivo de credenciales"**:
  - Verify that `scripts/data/serviceAccountKey.json` exists.
  - If missing, ask the user to provide the Firebase Admin SDK private key file.

- **Error: "firebase-admin not found"**:
  - Run `npm install firebase-admin` in the project root or `scripts` directory.

- **Data Mismatch**:
  - If field mappings seem wrong, check the `migrate.cjs` `cleanString` and `buildAntecedent` functions. The Wix JSON format is often inconsistent (strings vs arrays), so the script explicitly handles both.
