import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                performance: 'readonly',
                Event: 'readonly',
                location: 'readonly',
                event: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error'
        }
    },
    {
        files: ['src/**/*.js'],
        rules: {
            'no-console': 'off' // Allow console in development
        }
    }
];