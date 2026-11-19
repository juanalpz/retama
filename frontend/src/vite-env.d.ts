/// <reference types="vite/client" />

// variables de entorno que usa el front (se definen en el archivo .env)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
