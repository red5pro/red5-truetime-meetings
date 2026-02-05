/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_HOST: string
    readonly VITE_NODE_GROUP: string
    readonly VITE_TURN_SERVER_URL: string
    readonly VITE_TURN_SERVER_USERNAME: string
    readonly VITE_TURN_SERVER_CREDENTIAL: string
    readonly VITE_ENABLE_CLOSED_CAPTION: string
    readonly VITE_ENABLE_RECORDING: string
    readonly VITE_VIRTUAL_BACKGROUND_IMAGES: string
    readonly VITE_CONFIG_SERVICE_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}