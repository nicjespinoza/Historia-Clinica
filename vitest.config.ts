import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './tests/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/', // Exclude test files themselves
                '*.config.ts', // Exclude configs
                '**/*.d.ts',
                'src/main.tsx', // Entry point
                'src/vite-env.d.ts',
            ]
        }
    },
});
