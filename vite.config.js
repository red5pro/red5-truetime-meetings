import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'vite-plugin-javascript-obfuscator'

export default defineConfig(({command, mode}) => {
    const isProduction = mode === 'production'

    return {
        plugins: [react({
            babel: {
                plugins: [
                    ['babel-plugin-react-compiler', {
                        compilationMode: 'annotation', // or 'all'
                        panicThreshold: 'all_errors', // or 'critical_errors' or 'none'
                    }]
                ],
            },
        }),
            // Only obfuscate in production
            ...(isProduction ? [
                obfuscator({
                    options: {
                        rotateStringArray: true,
                        stringArray: true,
                        stringArrayEncoding: [],
                        stringArrayThreshold: 0.5,
                        deadCodeInjection: false,
                        deadCodeInjectionThreshold: 0.4,
                        unicodeEscapeSequence: false,
                        renameGlobals: false,
                        compact: true,
                        controlFlowFlattening: false,
                        controlFlowFlatteningThreshold: 0.75,
                        debugProtection: true,
                        debugProtectionInterval: 0,
                        disableConsoleOutput: true,
                        identifierNamesGenerator: 'mangled',
                        log: false,
                        numbersToExpressions: false,
                        selfDefending: true,
                        simplify: true,
                        splitStrings: false,
                        splitStringsChunkLength: 10,
                        transformObjectKeys: false,
                    },
                    // Exclude node_modules
                    exclude: [/node_modules/]
                })
            ] : [])],
        server: {
            port: 3000,
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom'],
                        'mui-vendor': ['@mui/material', '@mui/system'],
                        'mui-icons': ['@mui/icons-material'],
                        'router-vendor': ['react-router-dom'],
                        'i18n-vendor': ['react-i18next', 'i18next'],
                        'pubnub': ['pubnub'],
                        'red5pro-webrtc-sdk': ['red5pro-webrtc-sdk'],
                        'utils': ['loglevel'],
                    }
                }
            },
            chunkSizeWarningLimit: 1000,
            sourcemap: !isProduction,
        }
    }
})
