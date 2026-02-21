/// <reference types="vite/client" />

declare module 'sonner' {
  type ToastMessage = unknown
  type ToastOptions = Record<string, unknown>
  type ToastFn = (message: ToastMessage, data?: ToastOptions) => string | number
  const toast: ToastFn & {
    success: ToastFn
    error: ToastFn
    info: ToastFn
    warning: ToastFn
    loading: ToastFn
    promise: <T>(promise: Promise<T>, data?: ToastOptions) => { unwrap: () => Promise<T> }
    dismiss: (id?: string | number) => void
  }
  export { toast }
  export const Toaster: import('react').ComponentType<Record<string, unknown>>
}

interface ImportMetaEnv {
  readonly VITE_AGNO_ENDPOINT?: string
  readonly VITE_AGNO_AUTH_TOKEN?: string
  readonly VITE_AGNO_MODE?: string
  readonly VITE_AGNO_AGENT_ID?: string
  readonly VITE_AGNO_TEAM_ID?: string
  readonly VITE_AGNO_DB_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
