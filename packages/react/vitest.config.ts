import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
    },
    resolve: {
        alias: {
            '@mustrd/core': path.resolve(__dirname, '../core/src/index.ts'),
        },
    },
});
