import { describe, it, expect } from 'vitest';
import { patientSchema } from '../src/schemas/patientSchemas';

describe('Patient Schema', () => {
    it('should validate a correct patient object', () => {
        const validPatient = {
            firstName: 'Juan',
            lastName: 'Pérez',
            birthDate: '1990-01-01',
            sex: 'Masculino',
            profession: 'Ingeniero',
            email: 'juan@test.com',
            phone: '12345678',
            address: 'Calle 123',
            initialReason: 'Consulta general'
        };

        const result = patientSchema.safeParse(validPatient);
        expect(result.success).toBe(true);
    });

    it('should fail if required fields are missing', () => {
        const invalidPatient = {
            // firstName missing
            lastName: 'Pérez',
            birthDate: '1990-01-01',
            sex: 'Masculino'
        };

        const result = patientSchema.safeParse(invalidPatient);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('firstName');
        }
    });

    it('should validate email format', () => {
        const invalidEmail = {
            firstName: 'Juan',
            lastName: 'Pérez',
            birthDate: '1990-01-01',
            sex: 'Masculino',
            email: 'not-an-email'
        };

        const result = patientSchema.safeParse(invalidEmail);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Email inválido');
        }
    });

    it('should allow empty email if optional (default is empty string)', () => {
        const emptyEmail = {
            firstName: 'Juan',
            lastName: 'Pérez',
            birthDate: '1990-01-01',
            sex: 'Masculino',
            email: ''
        };

        const result = patientSchema.safeParse(emptyEmail);
        expect(result.success).toBe(true);
    });

    it('should validate enum values for sex', () => {
        const invalidSex = {
            firstName: 'Juan',
            lastName: 'Pérez',
            birthDate: '1990-01-01',
            sex: 'Alien' // Invalid enum
        };

        const result = patientSchema.safeParse(invalidSex);
        expect(result.success).toBe(false);
    });
});
